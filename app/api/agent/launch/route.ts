import { NextResponse } from "next/server";
import { isSameOrigin, makeRateLimiter } from "@/lib/apiGuards";
import { createAgent, isCursorConfigured } from "@/lib/cursorAgent";
import type { EngineeringBrief, Issue } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Launching an agent consumes real Cursor credits, so it is guarded like the
// brief route: same-origin only, and a conservative per-instance rate limit.
const isRateLimited = makeRateLimiter({
  perIpPerMin: 3,
  perIpPer10Min: 10,
  globalPerHour: 40
});

export async function GET() {
  return NextResponse.json({ configured: isCursorConfigured() });
}

export async function POST(request: Request) {
  if (!isCursorConfigured()) {
    return NextResponse.json(
      { configured: false, error: "Cursor API key not configured on the server." },
      { status: 501 }
    );
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isRateLimited(request)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      { status: 429 }
    );
  }

  let body: { brief?: EngineeringBrief; issue?: Issue };
  try {
    body = (await request.json()) as { brief?: EngineeringBrief; issue?: Issue };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.brief || !body.issue) {
    return NextResponse.json(
      { error: "Missing brief or issue in request body." },
      { status: 400 }
    );
  }

  try {
    const result = await createAgent(body.brief, body.issue);
    return NextResponse.json({ configured: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
