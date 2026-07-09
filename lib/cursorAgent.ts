// Server-only helpers for the Cursor Cloud Agents API (https://api.cursor.com).
// The API key lives exclusively in server env (CURSOR_API_KEY) and never ships
// to the browser. Docs: https://cursor.com/docs/en/background-agent/api

import type { EngineeringBrief, Issue } from "./types";

const API_BASE = "https://api.cursor.com/v1";

export const DEFAULT_TARGET_REPO = "https://github.com/Cashubski/CursorHack";
export const DEFAULT_TARGET_REF = "main";

export function getTargetRepo(): string {
  return process.env.CURSOR_TARGET_REPO || DEFAULT_TARGET_REPO;
}

export function getTargetRef(): string {
  return process.env.CURSOR_TARGET_REF || DEFAULT_TARGET_REF;
}

/** Whether the server is configured to dispatch real agents. */
export function isCursorConfigured(): boolean {
  return Boolean(process.env.CURSOR_API_KEY);
}

/** Cursor run lifecycle states surfaced by the API. */
export type CursorRunStatus =
  | "CREATING"
  | "RUNNING"
  | "FINISHED"
  | "ERROR"
  | "CANCELLED"
  | "EXPIRED"
  | string;

export type PipelinePhase = "running" | "awaiting-review" | "failed";

/** Map a raw Cursor run status onto our review pipeline. */
export function mapRunStatus(status: CursorRunStatus): {
  phase: PipelinePhase;
  label: string;
} {
  switch (status) {
    case "CREATING":
      return { phase: "running", label: "Provisioning sandbox" };
    case "RUNNING":
      return { phase: "running", label: "Agent working" };
    case "FINISHED":
      return { phase: "awaiting-review", label: "Finished" };
    case "ERROR":
      return { phase: "failed", label: "Agent errored" };
    case "CANCELLED":
      return { phase: "failed", label: "Run cancelled" };
    case "EXPIRED":
      return { phase: "failed", label: "Run expired" };
    default:
      return { phase: "running", label: status || "Working" };
  }
}

/** Compose a focused, scoped prompt for the coding agent from the brief. */
export function buildAgentPrompt(brief: EngineeringBrief, issue: Issue): string {
  const repro = brief.reproSteps.filter(Boolean).map((s) => `- ${s}`).join("\n");
  const criteria = brief.acceptanceCriteria
    .filter(Boolean)
    .map((s) => `- ${s}`)
    .join("\n");
  const files = brief.likelyFiles.filter(Boolean).map((s) => `- ${s}`).join("\n");

  return [
    `You are handling a bug fix dispatched by PatchPilot. Implement a minimal, well-scoped fix and open a pull request.`,
    ``,
    `# ${brief.title}`,
    ``,
    `## Summary`,
    brief.summary,
    ``,
    `## Affected area`,
    `${brief.affectedArea} (severity: ${issue.severity})`,
    ``,
    repro ? `## Reproduction steps\n${repro}` : "",
    ``,
    `## Proposed approach`,
    brief.proposedApproach,
    ``,
    criteria ? `## Acceptance criteria\n${criteria}` : "",
    ``,
    files ? `## Likely files\n${files}` : "",
    ``,
    `## Rules`,
    `- Keep the change tightly scoped to the affected area; do not refactor unrelated code.`,
    `- Add or update a regression test that proves the fix.`,
    `- Do not touch secrets, credentials, or CI configuration.`,
    `- Write a concise PR description summarizing the change and how it was verified.`
  ]
    .filter((line) => line !== undefined)
    .join("\n")
    .trim();
}

function authHeader(): string {
  const key = process.env.CURSOR_API_KEY ?? "";
  // Basic auth with the key as username and an empty password (`-u KEY:`).
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

export interface LaunchResult {
  agentId: string;
  runId: string;
  url: string;
  branch: string;
}

/** Create a Cloud Agent and enqueue its initial run. */
export async function createAgent(
  brief: EngineeringBrief,
  issue: Issue
): Promise<LaunchResult> {
  const res = await fetch(`${API_BASE}/agents`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: { text: buildAgentPrompt(brief, issue) },
      name: brief.title.slice(0, 100),
      repos: [{ url: getTargetRepo(), startingRef: getTargetRef() }],
      autoCreatePR: true,
      skipReviewerRequest: true
    }),
    signal: AbortSignal.timeout(20000)
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Cursor create failed ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const agentId: string = data?.agent?.id ?? "";
  const runId: string = data?.run?.id ?? data?.agent?.latestRunId ?? "";
  const url: string =
    data?.agent?.url ?? (agentId ? `https://cursor.com/agents/${agentId}` : "");

  if (!agentId || !runId) {
    throw new Error("Cursor create returned no agent/run id");
  }

  return { agentId, runId, url, branch: "" };
}

export interface RunSnapshot {
  status: CursorRunStatus;
  branch: string;
  prUrl: string;
  text: string;
}

/** Read a specific run's status, pushed branch, and PR (when available). */
export async function getRun(
  agentId: string,
  runId: string
): Promise<RunSnapshot> {
  const res = await fetch(
    `${API_BASE}/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}`,
    {
      headers: { Authorization: authHeader() },
      signal: AbortSignal.timeout(15000)
    }
  );

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Cursor get run failed ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const status: CursorRunStatus = data?.status ?? "RUNNING";

  const target = getTargetRepo().replace(/^https?:\/\//, "");
  const branches: Array<{ repoUrl?: string; branch?: string; prUrl?: string }> =
    data?.git?.branches ?? [];
  const match =
    branches.find((b) => (b.repoUrl ?? "").includes(target)) ?? branches[0];

  // The API returns `result` either as a plain string (final assistant reply)
  // or, per the docs, as an object with a `text` field. Handle both.
  const rawResult = data?.result;
  const text =
    typeof rawResult === "string"
      ? rawResult
      : typeof rawResult?.text === "string"
        ? rawResult.text
        : "";

  return {
    status,
    branch: match?.branch ?? "",
    prUrl: match?.prUrl ?? "",
    text
  };
}
