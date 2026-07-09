"use client";

import { Lock, LockOpen, ShieldCheck, ShieldAlert } from "lucide-react";
import type { ReviewDecision, RiskLevel, SafetyCheckItem } from "@/lib/types";

const RISK_PENALTY: Record<RiskLevel, number> = { low: 0, medium: 6, high: 14 };

export interface SafetyGateProps {
  checklist: SafetyCheckItem[];
  decision: ReviewDecision;
  risk: RiskLevel;
  merged?: boolean;
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export default function SafetyGate({
  checklist,
  decision,
  risk,
  merged = false
}: SafetyGateProps) {
  const required = checklist.filter((c) => c.required);
  const requiredDone = required.filter((c) => c.checked).length;
  const requiredRemaining = required.length - requiredDone;
  const totalChecked = checklist.filter((c) => c.checked).length;

  const requiredFraction = required.length ? requiredDone / required.length : 1;
  const overallFraction = checklist.length ? totalChecked / checklist.length : 1;
  const approved = decision === "approved";

  // Gate clears on exactly the real merge rule: all required checks + approval.
  const cleared = merged || (requiredRemaining === 0 && approved);

  const rawScore =
    requiredFraction * 50 +
    overallFraction * 20 +
    (approved ? 25 : 0) -
    RISK_PENALTY[risk];
  const score = merged ? 100 : clamp(Math.round(rawScore));

  const reason = cleared
    ? merged
      ? "Patch merged"
      : "Cleared to merge"
    : decision === "changes-requested"
      ? "Changes requested"
      : requiredRemaining > 0
        ? `${requiredRemaining} required check${requiredRemaining > 1 ? "s" : ""} remaining`
        : "Awaiting approval";

  // Ring geometry (full circle, starts at top).
  const size = 132;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);

  const ring = cleared
    ? "stroke-emerald-500"
    : decision === "changes-requested"
      ? "stroke-rose-400"
      : score >= 60
        ? "stroke-iris-500"
        : "stroke-amber-400";

  return (
    <section
      className={[
        "animate-slideUp relative overflow-hidden rounded-2xl border p-5 shadow-card transition-colors",
        cleared
          ? "border-emerald-200 bg-gradient-to-b from-emerald-50/70 to-white"
          : "border-ink-200/80 bg-white"
      ].join(" ")}
    >
      {cleared && (
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-300/25 blur-3xl" />
      )}
      <div className="relative flex items-center gap-5">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              className="stroke-ink-100"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              className={`${ring} transition-[stroke-dashoffset,stroke] duration-700 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold tabular-nums tracking-tight text-ink-900">
              {score}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              safety score
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="eyebrow">Safety Gate</p>
          <div
            className={[
              "mt-1.5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset transition",
              cleared
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200 motion-safe:animate-gatePop"
                : decision === "changes-requested"
                  ? "bg-rose-50 text-rose-700 ring-rose-200"
                  : "bg-ink-100 text-ink-600 ring-ink-200"
            ].join(" ")}
          >
            {cleared ? (
              <LockOpen size={15} />
            ) : decision === "changes-requested" ? (
              <ShieldAlert size={15} />
            ) : (
              <Lock size={15} />
            )}
            {cleared ? "Cleared" : "Locked"}
          </div>
          <p className="mt-2 text-sm text-ink-500">{reason}</p>

          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-ink-200/70 bg-ink-50 px-2 py-1.5">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-400">
                Required
              </dt>
              <dd className="mt-0.5 font-mono text-xs font-semibold text-ink-800">
                {requiredDone}/{required.length}
              </dd>
            </div>
            <div className="rounded-lg border border-ink-200/70 bg-ink-50 px-2 py-1.5">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-400">
                Decision
              </dt>
              <dd
                className={`mt-0.5 text-xs font-semibold ${
                  approved
                    ? "text-emerald-600"
                    : decision === "changes-requested"
                      ? "text-rose-600"
                      : "text-ink-500"
                }`}
              >
                {approved
                  ? "Approved"
                  : decision === "changes-requested"
                    ? "Changes"
                    : "Pending"}
              </dd>
            </div>
            <div className="rounded-lg border border-ink-200/70 bg-ink-50 px-2 py-1.5">
              <dt className="text-[10px] font-medium uppercase tracking-wide text-ink-400">
                Risk
              </dt>
              <dd
                className={`mt-0.5 text-xs font-semibold capitalize ${
                  risk === "high"
                    ? "text-rose-600"
                    : risk === "medium"
                      ? "text-amber-600"
                      : "text-emerald-600"
                }`}
              >
                {risk}
              </dd>
            </div>
          </dl>
        </div>

        <span
          className={`hidden shrink-0 self-start rounded-xl p-2 sm:block ${
            cleared ? "bg-emerald-100 text-emerald-600" : "bg-ink-100 text-ink-400"
          }`}
        >
          {cleared ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
        </span>
      </div>
    </section>
  );
}
