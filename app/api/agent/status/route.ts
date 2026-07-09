import { NextResponse } from "next/server";
import { isSameOrigin, makeRateLimiter } from "@/lib/apiGuards";
import { getRun, isCursorConfigured, mapRunStatus } from "@/lib/cursorAgent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Polling is cheap (a GET), but still same-origin and loosely rate limited so a
// runaway client can't hammer the upstream API.
const isRateLimited = makeRateLimiter({
  perIpPerMin: 60,
  perIpPer10Min: 400,
  globalPerHour: 4000
});

export async function GET(request: Request) {
  if (!isCursorConfigured()) {
    return NextResponse.json({ configured: false }, { status: 501 });
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isRateLimited(request)) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");
  const runId = searchParams.get("runId");

  if (!agentId || !runId) {
    return NextResponse.json(
      { error: "agentId and runId are required" },
      { status: 400 }
    );
  }

  try {
    const snap = await getRun(agentId, runId);
    const mapped = mapRunStatus(snap.status);
    return NextResponse.json({
      status: snap.status,
      phase: mapped.phase,
      label: mapped.label,
      branch: snap.branch,
      prUrl: snap.prUrl,
      text: snap.text
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
