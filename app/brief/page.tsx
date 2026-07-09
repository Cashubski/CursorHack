"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
        onChange(
          e.target.value.split("\n").map((l) => l.replace(/^[-•]\s*/, ""))
        )
      }
      rows={Math.max(3, value.length)}
      placeholder={placeholder}
      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
    />
  );
}

export default function BriefPage() {
  const router = useRouter();
  const { issue, brief, updateBrief, setBrief } = usePatchPilot();
  const [regenerating, setRegenerating] = useState(false);

  // Guard: if someone lands here without a brief, send them back to intake.
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

  function dispatch() {
    router.push("/run");
  }

  return (
    <div className="space-y-4">
      <div className="flex animate-slideUp items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Engineering brief
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            AI-structured from the raw report. Edit anything before dispatch.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge tone={RISK_TONE[brief.risk]}>{brief.risk} risk</Badge>
          <Badge tone={brief.source === "openai" ? "brand" : "slate"}>
            {brief.source === "openai" ? "AI" : "auto"}
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
            className="rounded-lg bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700 transition active:scale-95 disabled:opacity-50"
          >
            {regenerating ? "Regenerating..." : "Regenerate"}
          </button>
        }
      >
        <input
          type="text"
          value={brief.title}
          onChange={(e) => updateBrief({ title: e.target.value })}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </Card>

      <Card title="Summary">
        <textarea
          value={brief.summary}
          onChange={(e) => updateBrief({ summary: e.target.value })}
          rows={4}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </Card>

      <Card title="Reproduction steps">
        <ListEditor
          value={brief.reproSteps}
          onChange={(reproSteps) => updateBrief({ reproSteps })}
          placeholder="One step per line"
        />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card title="Affected area">
          <input
            type="text"
            value={brief.affectedArea}
            onChange={(e) => updateBrief({ affectedArea: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
        </Card>
        <Card title="Reporter">
          <p className="rounded-xl bg-slate-50 p-2.5 text-sm text-slate-700">
            {issue.reporter || "unknown"}
          </p>
        </Card>
      </div>

      <Card title="Proposed approach">
        <textarea
          value={brief.proposedApproach}
          onChange={(e) => updateBrief({ proposedApproach: e.target.value })}
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
        />
      </Card>

      <Card title="Acceptance criteria">
        <ListEditor
          value={brief.acceptanceCriteria}
          onChange={(acceptanceCriteria) => updateBrief({ acceptanceCriteria })}
          placeholder="One criterion per line"
        />
      </Card>

      <Card title="Likely files">
        <ul className="space-y-1.5">
          {brief.likelyFiles.map((file) => (
            <li
              key={file}
              className="rounded-lg bg-slate-900/90 px-3 py-2 font-mono text-[12px] text-emerald-300"
            >
              {file}
            </li>
          ))}
        </ul>
      </Card>

      <BottomBar
        primaryLabel="Dispatch to agent"
        onPrimary={dispatch}
        secondaryLabel="Back"
        onSecondary={() => router.push("/intake")}
        helper="Sends this brief to the Cursor agent workflow"
      />
    </div>
  );
}
