"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePatchPilot } from "@/lib/store";
import { stepLogLines } from "@/lib/mockAgent";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import BottomBar from "@/components/BottomBar";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function RunPage() {
  const router = useRouter();
  const brief = usePatchPilot((s) => s.brief);
  const run = usePatchPilot((s) => s.run);
  const [elapsed, setElapsed] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!brief) {
      router.replace("/intake");
    }
  }, [brief, router]);

  // Drive the mocked agent pipeline once per visit.
  useEffect(() => {
    if (started.current) return;
    const store = usePatchPilot.getState();
    if (!store.brief) return;
    if (store.run.status !== "idle") return;
    started.current = true;

    let cancelled = false;

    (async () => {
      store.startRun();
      const steps = usePatchPilot.getState().run.steps;
      const currentBrief = usePatchPilot.getState().brief!;

      for (let i = 0; i < steps.length; i++) {
        if (cancelled) return;
        usePatchPilot.getState().setStepStatus(i, "active");
        for (const line of stepLogLines(steps[i], currentBrief)) {
          if (cancelled) return;
          await sleep(steps[i].durationMs / (stepLogLines(steps[i], currentBrief).length + 1));
          if (cancelled) return;
          usePatchPilot.getState().appendLogs([line]);
        }
        await sleep(steps[i].durationMs / 3);
        if (cancelled) return;
        usePatchPilot.getState().setStepStatus(i, "done");
      }

      if (cancelled) return;
      usePatchPilot.getState().appendLogs(["> done - awaiting human review"]);
      usePatchPilot.getState().completeRun();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Elapsed timer while running.
  useEffect(() => {
    if (run.status !== "running" || !run.startedAt) return;
    const id = setInterval(() => {
      setElapsed(Date.now() - (run.startedAt ?? Date.now()));
    }, 250);
    return () => clearInterval(id);
  }, [run.status, run.startedAt]);

  // Auto-scroll the log console.
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [run.logs.length]);

  if (!brief) return null;

  const isDone = run.status === "awaiting-review" || run.status === "merged";
  const totalAdditions = run.diffFiles.reduce((a, f) => a + f.additions, 0);
  const totalDeletions = run.diffFiles.reduce((a, f) => a + f.deletions, 0);

  return (
    <div className="space-y-4">
      <div className="flex animate-slideUp items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Agent run
          </h2>
          <p className="mt-0.5 truncate text-sm text-slate-500">{brief.title}</p>
        </div>
        <Badge tone={isDone ? "green" : "brand"}>
          {isDone ? "complete" : "running"}
        </Badge>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Branch
            </p>
            <p className="truncate font-mono text-sm text-slate-800">
              {run.branch || "..."}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Elapsed
            </p>
            <p className="font-mono text-sm tabular-nums text-slate-800">
              {formatElapsed(elapsed)}
            </p>
          </div>
        </div>
      </Card>

      <Card title="Pipeline">
        <ol className="space-y-3">
          {run.steps.map((step) => (
            <li key={step.key} className="flex gap-3">
              <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                {step.status === "active" && (
                  <span className="absolute inline-flex h-5 w-5 animate-pulseRing rounded-full bg-brand-400" />
                )}
                <span
                  className={[
                    "relative flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                    step.status === "done"
                      ? "bg-emerald-500 text-white"
                      : step.status === "active"
                        ? "bg-brand-600 text-white"
                        : "bg-slate-200 text-slate-400"
                  ].join(" ")}
                >
                  {step.status === "done" ? "✓" : ""}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={[
                    "text-sm font-semibold",
                    step.status === "pending" ? "text-slate-400" : "text-slate-800"
                  ].join(" ")}
                >
                  {step.label}
                </p>
                <p className="text-xs text-slate-500">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Console">
        <div
          ref={logRef}
          className="no-scrollbar h-36 overflow-y-auto rounded-xl bg-slate-900 p-3 font-mono text-[12px] leading-relaxed text-emerald-300"
        >
          {run.logs.length === 0 ? (
            <p className="text-slate-500">waiting for agent...</p>
          ) : (
            run.logs.map((line, i) => (
              <div key={i} className="animate-slideUp whitespace-pre-wrap">
                {line}
              </div>
            ))
          )}
        </div>
      </Card>

      {isDone && (
        <Card title="Proposed diff">
          <div className="mb-2 flex items-center gap-3 text-xs font-semibold">
            <span className="text-emerald-600">+{totalAdditions}</span>
            <span className="text-rose-600">-{totalDeletions}</span>
            <span className="text-slate-400">
              {run.diffFiles.length} files
            </span>
          </div>
          <ul className="space-y-1.5">
            {run.diffFiles.map((f) => (
              <li
                key={f.path}
                className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
              >
                <span className="truncate font-mono text-[12px] text-slate-700">
                  {f.path}
                </span>
                <span className="shrink-0 font-mono text-[11px]">
                  <span className="text-emerald-600">+{f.additions}</span>{" "}
                  <span className="text-rose-600">-{f.deletions}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <BottomBar
        primaryLabel={isDone ? "Review changes" : "Running..."}
        onPrimary={() => router.push("/review")}
        primaryDisabled={!isDone}
        helper={
          isDone
            ? undefined
            : "The agent is working. Review unlocks when it finishes."
        }
      />
    </div>
  );
}
