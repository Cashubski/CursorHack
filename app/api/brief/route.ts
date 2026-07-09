import { NextResponse } from "next/server";
import { synthesizeBrief } from "@/lib/synthesizeBrief";
import type { EngineeringBrief, Issue } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Optional LLM-backed brief generation. If OPENAI_API_KEY is configured we ask
 * the model to structure the report; otherwise (and on any error) we fall back
 * to the deterministic template synthesizer so the demo never blocks.
 */
export async function POST(request: Request) {
  let issue: Issue;
  try {
    issue = (await request.json()) as Issue;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fallback = synthesizeBrief(issue);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ brief: fallback });
  }

  try {
    const brief = await generateWithOpenAI(issue, apiKey, fallback);
    return NextResponse.json({ brief });
  } catch {
    // Resilient by design: return the template brief instead of erroring.
    return NextResponse.json({ brief: fallback });
  }
}

async function generateWithOpenAI(
  issue: Issue,
  apiKey: string,
  fallback: EngineeringBrief
): Promise<EngineeringBrief> {
  const system =
    "You are PatchPilot, an assistant that turns messy bug reports into a " +
    "concise engineering brief for a coding agent. Respond with strict JSON " +
    "matching the requested schema. Keep the fix scoped and low risk.";

  const user = `Bug report:\n"""\n${issue.rawReport}\n"""\n\nReporter: ${issue.reporter || "unknown"}\nSeverity: ${issue.severity}\nArea: ${issue.area}\n\nReturn JSON with keys: title (string), summary (string), reproSteps (string[]), affectedArea (string), proposedApproach (string), acceptanceCriteria (string[]), likelyFiles (string[]), risk ("low"|"medium"|"high").`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    }),
    // Keep the demo snappy; fall back if the model is slow.
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
    risk: parsed.risk === "low" || parsed.risk === "medium" || parsed.risk === "high"
      ? parsed.risk
      : fallback.risk,
    source: "openai"
  };
}
