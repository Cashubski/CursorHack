"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sparkles, Wand2 } from "lucide-react";
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
  const { issue, setIssue, setBrief, reset } = usePatchPilot();

  // Starting a new report clears any previously loaded task.
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit = issue.rawReport.trim().length > 12;

  function loadSample() {
    setIssue({
      rawReport: SAMPLE_REPORT,
      reporter: "beta-user-1042",
      severity: "high",
      area: "Sync"
    });
  }

  async function generateBrief() {
    if (!canSubmit) return;
    setBrief(synthesizeBrief(issue));
    await usePatchPilot.getState().persist("briefed");
    router.push("/brief");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="animate-slideUp">
        <p className="eyebrow">Step 1 · Intake</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">
          Report a bug
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Paste the raw report exactly as it came in — PatchPilot will structure
          it for the agent.
        </p>
      </div>

      <Card
        title="Raw bug report"
        action={
          <button
            type="button"
            onClick={loadSample}
            className="inline-flex items-center gap-1.5 rounded-lg bg-iris-50 px-2.5 py-1 text-[11px] font-semibold text-iris-700 transition hover:bg-iris-100 active:scale-95"
          >
            <Sparkles size={12} />
            Load sample
          </button>
        }
      >
        <textarea
          value={issue.rawReport}
          onChange={(e) => setIssue({ rawReport: e.target.value })}
          rows={8}
          placeholder="e.g. the app crashes when I tap save after being offline..."
          className="field resize-none leading-relaxed"
        />
      </Card>

      <Card title="Reporter">
        <input
          type="text"
          value={issue.reporter}
          onChange={(e) => setIssue({ reporter: e.target.value })}
          placeholder="username or email (optional)"
          className="field"
        />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Severity">
          <div className="grid grid-cols-2 gap-2">
            {SEVERITIES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setIssue({ severity: s.value })}
                className={[
                  "rounded-xl border px-2 py-2 text-xs font-semibold transition active:scale-95",
                  issue.severity === s.value
                    ? "border-transparent bg-ink-900 text-white"
                    : "border-ink-200 bg-white text-ink-500 hover:border-ink-300"
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
                    ? "border-iris-200 bg-iris-50 text-iris-700"
                    : "border-ink-200 bg-white text-ink-500 hover:border-ink-300"
                ].join(" ")}
              >
                {area}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <BottomBar
        primaryLabel="Generate brief"
        primaryIcon={<Wand2 size={16} />}
        onPrimary={generateBrief}
        primaryDisabled={!canSubmit}
        helper={
          canSubmit ? undefined : "Add a few more details to generate a brief"
        }
      />
    </div>
  );
}
