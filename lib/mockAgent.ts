import type { AgentStep, DiffFile, EngineeringBrief } from "./types";

/** The mocked Cursor agent pipeline. Kept short so the demo stays snappy. */
export function buildAgentSteps(): AgentStep[] {
  return [
    {
      key: "queued",
      label: "Queued",
      detail: "Task accepted and placed in the Cursor agent queue.",
      status: "pending",
      durationMs: 1200
    },
    {
      key: "planning",
      label: "Planning",
      detail: "Reading the brief and mapping the affected code paths.",
      status: "pending",
      durationMs: 2600
    },
    {
      key: "editing",
      label: "Editing",
      detail: "Applying a scoped fix across the likely files.",
      status: "pending",
      durationMs: 3200
    },
    {
      key: "testing",
      label: "Running tests",
      detail: "Executing the suite and the new regression test.",
      status: "pending",
      durationMs: 3000
    },
    {
      key: "diff",
      label: "Generating diff",
      detail: "Packaging changes into a branch and pull request.",
      status: "pending",
      durationMs: 2000
    }
  ];
}

/** Deterministic mock diff derived from the brief's likely files. */
export function buildDiffFiles(brief: EngineeringBrief): DiffFile[] {
  const base = brief.likelyFiles.slice(0, 3);
  const files: DiffFile[] = base.map((path, i) => ({
    path,
    additions: 12 + i * 9,
    deletions: 3 + i * 2
  }));
  files.push({
    path: base[0]
      ? base[0].replace(/\.(t|j)sx?$/, ".test.$1s")
      : "src/__tests__/regression.test.ts",
    additions: 28,
    deletions: 0
  });
  return files;
}

/** Human-readable log lines emitted as each step runs. */
export function stepLogLines(step: AgentStep, brief: EngineeringBrief): string[] {
  switch (step.key) {
    case "queued":
      return [`> task accepted: ${brief.title}`, "> allocating sandbox..."];
    case "planning":
      return [
        `> analyzing ${brief.affectedArea}`,
        `> candidate files: ${brief.likelyFiles.slice(0, 2).join(", ")}`
      ];
    case "editing":
      return brief.likelyFiles.slice(0, 2).map((f) => `> editing ${f}`);
    case "testing":
      return ["> npm test", "> 42 passing", "> 1 new regression test added"];
    case "diff":
      return ["> git checkout -b patchpilot/fix", "> opening pull request..."];
    default:
      return [];
  }
}

export function buildBranchName(brief: EngineeringBrief): string {
  const slug = brief.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return `patchpilot/${slug || "fix"}`;
}
