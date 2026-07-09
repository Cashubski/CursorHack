import { NextResponse } from "next/server";
import { synthesizeBrief } from "@/lib/synthesizeBrief";
import type { EngineeringBrief, Issue } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Abuse controls. This endpoint spends real money (OpenAI), so it is wrapped in
// layered, cheap defenses. Crucially, when any limit trips we DO NOT call
// OpenAI - we return the free deterministic template brief instead. Abuse
// therefore degrades to a zero-cost response rather than an error or a bill.
// ---------------------------------------------------------------------------

const INPUT_CHAR_CAP = 2000; // truncate the report we send to the model
const MAX_OUTPUT_TOKENS = 700; // bound completion cost
const PER_IP_PER_MIN = 5; // burst per IP
const PER_IP_PER_10MIN = 20; // sustained per IP
const GLOBAL_PER_HOUR = 120; // per-instance backstop across all callers

type Hit = number[]; // timestamps (ms)
const ipHits = new Map<string, Hit>();
const globalHits: Hit = [];

function prune(hits: Hit, windowMs: number, now: number): Hit {
  const cutoff = now - windowMs;
  let i = 0;
  while (i < hits.length && hits[i] < cutoff) i++;
  return i > 0 ? hits.slice(i) : hits;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** True when the caller is over any rate limit (best-effort on serverless). */
function isRateLimited(req: Request): boolean {
  const now = Date.now();

  const prunedGlobal = prune(globalHits, 3_600_000, now);
  globalHits.length = 0;
  globalHits.push(...prunedGlobal);
  if (globalHits.length >= GLOBAL_PER_HOUR) return true;

  const ip = clientIp(req);
  const hits = prune(ipHits.get(ip) ?? [], 600_000, now);
  const lastMin = hits.filter((t) => t > now - 60_000).length;
  if (lastMin >= PER_IP_PER_MIN) {
    ipHits.set(ip, hits);
    return true;
  }
  if (hits.length >= PER_IP_PER_10MIN) {
    ipHits.set(ip, hits);
    return true;
  }

  hits.push(now);
  ipHits.set(ip, hits);
  globalHits.push(now);
  return false;
}

/** Block cross-site callers. Same-origin browser requests always pass. */
function isSameOrigin(req: Request): boolean {
  const host = req.headers.get("host");
  const source = req.headers.get("origin") ?? req.headers.get("referer");
  if (!source) return true; // no browser origin (e.g. server-side); rely on rate limit
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let issue: Issue;
  try {
    issue = (await request.json()) as Issue;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fallback = synthesizeBrief(issue);
  const apiKey = process.env.OPENAI_API_KEY;

  // Any of these conditions means we serve the free template, never OpenAI.
  if (!apiKey || !isSameOrigin(request) || isRateLimited(request)) {
    return NextResponse.json({ brief: fallback });
  }

  try {
    const brief = await generateWithOpenAI(issue, apiKey, fallback);
    return NextResponse.json({ brief });
  } catch {
    return NextResponse.json({ brief: fallback });
  }
}

async function generateWithOpenAI(
  issue: Issue,
  apiKey: string,
  fallback: EngineeringBrief
): Promise<EngineeringBrief> {
  const report = (issue.rawReport ?? "").slice(0, INPUT_CHAR_CAP);

  const system =
    "You are PatchPilot, an assistant that turns messy bug reports into a " +
    "concise engineering brief for a coding agent. Respond with strict JSON " +
    "matching the requested schema. Keep the fix scoped and low risk.";

  const user = `Bug report:\n"""\n${report}\n"""\n\nReporter: ${issue.reporter || "unknown"}\nSeverity: ${issue.severity}\nArea: ${issue.area}\n\nReturn JSON with keys: title (string), summary (string), reproSteps (string[]), affectedArea (string), proposedApproach (string), acceptanceCriteria (string[]), likelyFiles (string[]), risk ("low"|"medium"|"high").`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: MAX_OUTPUT_TOKENS,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    }),
    signal: AbortSignal.timeout(12000)
  });

  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as Partial<EngineeringBrief>;

  return {
    title: parsed.title || fallback.title,
    summary: parsed.summary || fallback.summary,
    reproSteps:
      Array.isArray(parsed.reproSteps) && parsed.reproSteps.length
        ? parsed.reproSteps
        : fallback.reproSteps,
    affectedArea: parsed.affectedArea || fallback.affectedArea,
    proposedApproach: parsed.proposedApproach || fallback.proposedApproach,
    acceptanceCriteria:
      Array.isArray(parsed.acceptanceCriteria) && parsed.acceptanceCriteria.length
        ? parsed.acceptanceCriteria
        : fallback.acceptanceCriteria,
    likelyFiles:
      Array.isArray(parsed.likelyFiles) && parsed.likelyFiles.length
        ? parsed.likelyFiles
        : fallback.likelyFiles,
    risk:
      parsed.risk === "low" || parsed.risk === "medium" || parsed.risk === "high"
        ? parsed.risk
        : fallback.risk,
    source: "openai"
  };
}
