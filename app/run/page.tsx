"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch, Timer, Terminal, FileDiff, ArrowRight } from "lucide-react";
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
          await sleep(
            steps[i].durationMs / (stepLogLines(steps[i], currentBrief).length + 1)
          );
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
      await usePatchPilot.getState().persist("review");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (run.status !== "running" || !run.startedAt) return;
    const id = setInterval(() => {
      setElapsed(Date.now() - (run.startedAt ?? Date.now()));
    }, 250);
    return () => clearInterval(id);
  }, [run.status, run.startedAt]);

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
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex animate-slideUp items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Step 3 · Run</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink-900">
            Agent run
          </h2>
          <p className="mt-1 truncate text-sm text-ink-500">{brief.title}</p>
        </div>
        <Badge tone={isDone ? "green" : "amber"}>
          {isDone ? "complete" : "running"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 text-ink-400">
            <GitBranch size={14} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
              Branch
            </span>
          </div>
          <p className="mt-1.5 truncate font-mono text-sm text-ink-800">
            {run.branch || "…"}
          </p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-ink-400">
            <Timer size={14} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
              Elapsed
            </span>
          </div>
          <p className="mt-1.5 font-mono text-sm tabular-nums text-ink-800">
            {formatElapsed(elapsed)}
          </p>
        </Card>
      </div>

      <Card title="Pipeline">
        <ol className="relative space-y-4 pl-1">
          {run.steps.map((step, i) => (
            <li key={step.key} className="flex gap-3">
              <div className="relative flex flex-col items-center">
                <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                  {step.status === "active" && (
                    <span className="absolute inline-flex h-6 w-6 animate-pulseRing rounded-full bg-iris-400" />
                  )}
                  <span
                    className={[
                      "relative flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition",
                      step.status === "done"
                        ? "bg-ink-900 text-white"
                        : step.status === "active"
                          ? "bg-iris-500 text-white"
                          : "border border-ink-200 bg-white text-ink-300"
                    ].join(" ")}
                  >
                    {step.status === "done" ? "✓" : i + 1}
                  </span>
                </div>
                {i < run.steps.length - 1 && (
                  <span
                    className={`mt-1 w-px flex-1 ${
                      step.status === "done" ? "bg-ink-900/70" : "bg-ink-200"
                    }`}
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <p
                  className={[
                    "text-sm font-semibold",
                    step.status === "pending" ? "text-ink-400" : "text-ink-900"
                  ].join(" ")}
                >
                  {step.label}
                </p>
                <p className="text-xs text-ink-400">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Console" icon={<Terminal size={13} />}>
        <div className="overflow-hidden rounded-xl border border-ink-800 bg-ink-950">
          <div className="flex items-center gap-1.5 border-b border-white/5 px-3 py-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-2 font-mono text-[11px] text-white/30">
              cursor-agent · {run.branch || "sandbox"}
            </span>
          </div>
          <div
            ref={logRef}
            className="no-scrollbar h-40 overflow-y-auto p-3 font-mono text-[12px] leading-relaxed"
          >
            {run.logs.length === 0 ? (
              <p className="text-white/30">waiting for agent…</p>
            ) : (
              run.logs.map((line, i) => {
                const last = i === run.logs.length - 1;
                return (
                  <div
                    key={i}
                    className="animate-fadeIn whitespace-pre-wrap text-emerald-300"
                  >
                    {line}
                    {last && !isDone && (
                      <span className="ml-0.5 inline-block h-3.5 w-1.5 -translate-y-px animate-caret bg-emerald-300 align-middle" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

      {isDone && (
        <Card title="Proposed diff" icon={<FileDiff size={13} />}>
          <div className="mb-3 flex items-center gap-3 text-xs font-semibold">
            <span className="font-mono text-emerald-600">+{totalAdditions}</span>
            <span className="font-mono text-rose-500">−{totalDeletions}</span>
            <span className="text-ink-400">{run.diffFiles.length} files changed</span>
          </div>
          <ul className="space-y-1.5">
            {run.diffFiles.map((f) => {
              const total = Math.max(1, f.additions + f.deletions);
              return (
                <li
                  key={f.path}
                  className="flex items-center justify-between gap-3 rounded-lg border border-ink-200/70 bg-ink-50 px-3 py-2"
                >
                  <span className="truncate font-mono text-[12px] text-ink-700">
                    {f.path}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-[11px] text-emerald-600">
                      +{f.additions}
                    </span>
                    <span className="flex h-1.5 w-12 overflow-hidden rounded-full bg-rose-200">
                      <span
                        className="h-full bg-emerald-500"
                        style={{ width: `${(f.additions / total) * 100}%` }}
                      />
                    </span>
                    <span className="font-mono text-[11px] text-rose-500">
                      −{f.deletions}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <BottomBar
        primaryLabel={isDone ? "Review changes" : "Running…"}
        primaryIcon={isDone ? <ArrowRight size={16} /> : undefined}
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
