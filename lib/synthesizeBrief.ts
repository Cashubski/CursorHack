import type {
  AppArea,
  EngineeringBrief,
  Issue,
  RiskLevel,
  Severity
} from "./types";

const AREA_FILES: Record<AppArea, string[]> = {
  Auth: ["src/auth/session.ts", "src/auth/tokenRefresh.ts", "src/hooks/useUser.ts"],
  Payments: ["src/payments/checkout.ts", "src/payments/webhooks.ts", "src/lib/stripe.ts"],
  Notifications: ["src/notifications/push.ts", "src/notifications/queue.ts"],
  Sync: ["src/sync/engine.ts", "src/sync/conflictResolver.ts", "src/db/offlineCache.ts"],
  UI: ["src/components/Screen.tsx", "src/components/List.tsx", "src/styles/theme.ts"],
  API: ["src/api/client.ts", "src/api/routes.ts", "src/middleware/errors.ts"],
  Search: ["src/search/index.ts", "src/search/ranking.ts"],
  Other: ["src/app/main.ts", "src/lib/utils.ts"]
};

const SEVERITY_TO_RISK: Record<Severity, RiskLevel> = {
  low: "low",
  medium: "low",
  high: "medium",
  critical: "high"
};

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/[^.!?\n]+[.!?]?/);
  return (match ? match[0] : trimmed).trim();
}

function toTitle(text: string, area: AppArea): string {
  const sentence = firstSentence(text);
  if (!sentence) return `${area} issue reported by user`;
  const cleaned = sentence
    .replace(/^(hey|hi|hello|so|um|guys|team)[,!\s]+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const short = cleaned.length > 72 ? `${cleaned.slice(0, 69)}...` : cleaned;
  return short.charAt(0).toUpperCase() + short.slice(1);
}

/** Pull rough reproduction steps from a messy report. */
function extractReproSteps(text: string, area: AppArea): string[] {
  const numbered = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /^(\d+[.)]|[-*•])\s+/.test(line))
    .map((line) => line.replace(/^(\d+[.)]|[-*•])\s+/, "").trim())
    .filter(Boolean);

  if (numbered.length >= 2) return numbered.slice(0, 6);

  const keywords = ["open", "tap", "click", "when", "after", "then", "try", "go to"];
  const clauses = text
    .split(/[\n.;]+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 3 && keywords.some((k) => c.toLowerCase().includes(k)))
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
    .slice(0, 5);

  if (clauses.length) return clauses;

  return [
    `Open the ${area} area of the app`,
    "Reproduce the reported user action",
    "Observe the incorrect behaviour described in the report"
  ];
}

function inferExpectedActual(text: string): { expected: string; actual: string } {
  const lower = text.toLowerCase();
  const brokenSignals = ["crash", "error", "fail", "blank", "freeze", "wrong", "not work", "can't", "cannot", "hang", "stuck", "loop"];
  const hit = brokenSignals.find((s) => lower.includes(s));
  const actual = hit
    ? `Users hit "${hit}" during the flow, breaking the experience.`
    : "The behaviour does not match user expectations.";
  return {
    expected: "The flow completes successfully with no errors or data loss.",
    actual
  };
}

/**
 * Deterministic, offline brief generator. Turns a raw report into a structured
 * engineering brief. Used as the default and as the fallback when no LLM key is
 * configured, so the demo never blocks on network access.
 */
export function synthesizeBrief(issue: Issue): EngineeringBrief {
  const { rawReport, area, severity } = issue;
  const { expected, actual } = inferExpectedActual(rawReport);
  const risk = SEVERITY_TO_RISK[severity];

  return {
    title: toTitle(rawReport, area),
    summary:
      `${severity.toUpperCase()} severity ${area} issue. ${actual} ${expected} ` +
      "Scope the fix narrowly and add a regression test.",
    reproSteps: extractReproSteps(rawReport, area),
    affectedArea: `${area} module`,
    proposedApproach:
      `Trace the ${area.toLowerCase()} code path involved, reproduce the failure with a ` +
      "focused test, apply the minimal fix, and confirm no adjacent flows regress.",
    acceptanceCriteria: [
      "The reported failure no longer reproduces on the documented steps",
      "A regression test covers the fixed behaviour",
      "No new lint or type errors are introduced",
      `Change stays scoped to the ${area} module`
    ],
    likelyFiles: AREA_FILES[area],
    risk,
    source: "template"
  };
}
