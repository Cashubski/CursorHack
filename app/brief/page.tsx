"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Rocket, FileCode2, Play, Loader2, ArrowLeft } from "lucide-react";
import { usePatchPilot } from "@/lib/store";
import { toast } from "@/lib/toast";
import type { EngineeringBrief, RiskLevel } from "@/lib/types";
import Card from "@/components/Card";
import Badge from "@/components/Badge";

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
  const [dispatching, setDispatching] = useState<"none" | "demo" | "real">("none");
  const [realAvailable, setRealAvailable] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  useEffect(() => {
    if (!brief) router.replace("/intake");
  }, [brief, router]);

  // Ask the server whether a real Cursor agent can be dispatched.
  useEffect(() => {
    let active = true;
    fetch("/api/agent/launch")
      .then((r) => r.json())
      .then((d) => {
        if (active) setRealAvailable(Boolean(d?.configured));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

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

  async function dispatchDemo() {
    setDispatching("demo");
    await usePatchPilot.getState().persist("running");
    toast.info("Simulated run started", "Watching the agent pipeline.");
    router.push("/run");
  }

  async function dispatchReal() {
    if (!brief) return;
    setDispatching("real");
    setDispatchError(null);
    try {
      const res = await fetch("/api/agent/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, issue })
      });
      const data = await res.json();
      if (!res.ok || !data.agentId) {
        const msg =
          data?.error || "Could not reach the Cursor agent. Try the simulated run.";
        setDispatchError(msg);
        toast.error("Dispatch failed", msg);
        setDispatching("none");
        return;
      }
      usePatchPilot.getState().startRealRun({
        agentId: data.agentId,
        agentRunId: data.runId,
        agentUrl: data.url,
        branch: data.branch
      });
      await usePatchPilot.getState().persist("running");
      toast.success("Dispatched to Cursor", "A real cloud agent is on the case.");
      router.push("/run");
    } catch {
      setDispatchError("Network error contacting the agent. Try the simulated run.");
      setDispatching("none");
    }
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

      <div className="mt-6 space-y-3 border-t border-ink-200/70 pt-4">
        {dispatchError && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">
            {dispatchError}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="order-2 text-xs text-ink-400 sm:order-1">
            {realAvailable
              ? "Dispatch a live Cursor agent, or run a fast simulation for demos."
              : "Runs a simulated agent pipeline against this brief."}
          </p>
          <div className="order-1 flex flex-col gap-2 sm:order-2 sm:ml-auto sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/intake")}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-600 transition hover:bg-ink-50"
            >
              <ArrowLeft size={15} />
              Back
            </button>
            <button
              type="button"
              onClick={dispatchDemo}
              disabled={dispatching !== "none"}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50 disabled:opacity-50"
            >
              {dispatching === "demo" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Play size={15} />
              )}
              Simulated run
            </button>
            {realAvailable && (
              <button
                type="button"
                onClick={dispatchReal}
                disabled={dispatching !== "none"}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-iris-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(108,94,245,0.6)] transition hover:bg-iris-600 disabled:opacity-60"
              >
                {dispatching === "real" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Rocket size={16} />
                )}
                Dispatch real agent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
