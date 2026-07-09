"use client";

import { useRouter } from "next/navigation";
import { usePatchPilot } from "@/lib/store";
import { synthesizeBrief } from "@/lib/synthesizeBrief";
import type { AppArea, Severity } from "@/lib/types";
import Card from "@/components/Card";
import BottomBar from "@/components/BottomBar";

const SEVERITIES: { value: Severity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" }
];

const AREAS: AppArea[] = [
  "Auth",
  "Payments",
  "Notifications",
  "Sync",
  "UI",
  "API",
  "Search",
  "Other"
];

const SAMPLE_REPORT = `hey team, the app keeps losing my notes!! 😤

1. open the app on my phone with wifi off
2. add a couple of notes
3. turn wifi back on
4. after it syncs, one of the notes is just gone / blank

happens almost every time when I've been offline for a while. super annoying, I lost a whole grocery list. iPhone 15, latest build.`;

export default function IntakePage() {
  const router = useRouter();
  const { issue, setIssue, setBrief } = usePatchPilot();

  const canSubmit = issue.rawReport.trim().length > 12;

  function loadSample() {
    setIssue({
      rawReport: SAMPLE_REPORT,
      reporter: "beta-user-1042",
      severity: "high",
      area: "Sync"
    });
  }

  function generateBrief() {
    if (!canSubmit) return;
    setBrief(synthesizeBrief(issue));
    router.push("/brief");
  }

  return (
    <div className="space-y-4">
      <div className="animate-slideUp">
        <h2 className="text-lg font-bold tracking-tight text-slate-900">
          Report a bug
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Paste the raw report exactly as it came in. PatchPilot will structure
          it for the agent.
        </p>
      </div>

      <Card
        title="Raw bug report"
        action={
          <button
            type="button"
            onClick={loadSample}
            className="rounded-lg bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 transition active:scale-95"
          >
            Load sample
          </button>
        }
      >
        <textarea
          value={issue.rawReport}
          onChange={(e) => setIssue({ rawReport: e.target.value })}
          rows={8}
          placeholder="e.g. the app crashes when I tap save after being offline..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </Card>

      <Card title="Reporter">
        <input
          type="text"
          value={issue.reporter}
          onChange={(e) => setIssue({ reporter: e.target.value })}
          placeholder="username or email (optional)"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </Card>

      <Card title="Severity">
        <div className="grid grid-cols-4 gap-2">
          {SEVERITIES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setIssue({ severity: s.value })}
              className={[
                "rounded-xl border px-2 py-2 text-xs font-semibold transition active:scale-95",
                issue.severity === s.value
                  ? "border-brand-500 bg-brand-600 text-white"
                  : "border-slate-200 bg-white text-slate-600"
              ].join(" ")}
            >
              {s.label}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Affected area">
        <div className="flex flex-wrap gap-2">
          {AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => setIssue({ area })}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95",
                issue.area === area
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-600"
              ].join(" ")}
            >
              {area}
            </button>
          ))}
        </div>
      </Card>

      <BottomBar
        primaryLabel="Generate brief"
        onPrimary={generateBrief}
        primaryDisabled={!canSubmit}
        helper={
          canSubmit ? undefined : "Add a few more details to generate a brief"
        }
      />
    </div>
  );
}
