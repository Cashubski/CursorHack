"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Rocket, FileCode2 } from "lucide-react";
import { usePatchPilot } from "@/lib/store";
import type { EngineeringBrief, RiskLevel } from "@/lib/types";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import BottomBar from "@/components/BottomBar";

const RISK_TONE: Record<RiskLevel, "green" | "amber" | "red"> = {
  low: "green",
  medium: "amber",
  high: "red"
};

function ListEditor({
  value,
  onChange,
  placeholder
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value.join("\n")}
      onChange={(e) =>
        onChange(e.target.value.split("\n").map((l) => l.replace(/^[-•]\s*/, "")))
      }
      rows={Math.max(3, value.length)}
      placeholder={placeholder}
      className="field resize-none leading-relaxed"
    />
  );
}

export default function BriefPage() {
  const router = useRouter();
  const { issue, brief, updateBrief, setBrief } = usePatchPilot();
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!brief) router.replace("/intake");
  }, [brief, router]);

  if (!brief) return null;

  async function regenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(issue)
      });
      const data = (await res.json()) as { brief: EngineeringBrief };
      if (data.brief) setBrief(data.brief);
    } catch {
      // keep existing brief on failure
    } finally {
      setRegenerating(false);
    }
  }

  async function dispatch() {
    await usePatchPilot.getState().persist("running");
    router.push("/run");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex animate-slideUp items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Step 2 · Brief</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">
            Engineering brief
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Structured from the raw report. Edit anything before dispatch.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge tone={RISK_TONE[brief.risk]}>{brief.risk} risk</Badge>
          <Badge tone={brief.source === "openai" ? "brand" : "slate"} dot={false}>
            {brief.source === "openai" ? "AI generated" : "auto-structured"}
          </Badge>
        </div>
      </div>

      <Card
        title="Title"
        action={
          <button
            type="button"
            onClick={regenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-iris-50 px-2.5 py-1 text-[11px] font-semibold text-iris-700 transition hover:bg-iris-100 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
            {regenerating ? "Regenerating" : "Regenerate"}
          </button>
        }
      >
        <input
          type="text"
          value={brief.title}
          onChange={(e) => updateBrief({ title: e.target.value })}
          className="field !text-[15px] font-semibold !text-ink-900"
        />
      </Card>

      <Card title="Summary">
        <textarea
          value={brief.summary}
          onChange={(e) => updateBrief({ summary: e.target.value })}
          rows={4}
          className="field resize-none leading-relaxed"
        />
      </Card>

      <Card title="Reproduction steps">
        <ListEditor
          value={brief.reproSteps}
          onChange={(reproSteps) => updateBrief({ reproSteps })}
          placeholder="One step per line"
        />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Affected area">
          <input
            type="text"
            value={brief.affectedArea}
            onChange={(e) => updateBrief({ affectedArea: e.target.value })}
            className="field"
          />
        </Card>
        <Card title="Reporter">
          <p className="rounded-xl bg-ink-50 px-3 py-3 text-sm text-ink-600">
            {issue.reporter || "unknown"}
          </p>
        </Card>
      </div>

      <Card title="Proposed approach">
        <textarea
          value={brief.proposedApproach}
          onChange={(e) => updateBrief({ proposedApproach: e.target.value })}
          rows={3}
          className="field resize-none leading-relaxed"
        />
      </Card>

      <Card title="Acceptance criteria">
        <ListEditor
          value={brief.acceptanceCriteria}
          onChange={(acceptanceCriteria) => updateBrief({ acceptanceCriteria })}
          placeholder="One criterion per line"
        />
      </Card>

      <Card title="Likely files" icon={<FileCode2 size={13} />}>
        <div className="overflow-hidden rounded-xl border border-ink-800 bg-ink-950">
          <div className="flex items-center gap-1.5 border-b border-white/5 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <ul className="divide-y divide-white/5">
            {brief.likelyFiles.map((file) => (
              <li
                key={file}
                className="px-3 py-2 font-mono text-[12px] text-emerald-300"
              >
                <span className="text-white/30">$</span> {file}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <BottomBar
        primaryLabel="Dispatch to agent"
        primaryIcon={<Rocket size={16} />}
        onPrimary={dispatch}
        secondaryLabel="Back"
        onSecondary={() => router.push("/intake")}
        helper="Sends this brief to the Cursor agent workflow"
      />
    </div>
  );
}
