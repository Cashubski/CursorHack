"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  Timer,
  Terminal,
  FileDiff,
  ArrowRight,
  GitPullRequest,
  ExternalLink,
  AlertTriangle,
  Cpu
} from "lucide-react";
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

// Coarse, honest phases for a real agent run (we don't fake sub-progress).
const REAL_STEPS = [
  {
    key: "provision",
    label: "Provisioning",
    detail: "Cloud sandbox spun up and repository checked out."
  },
  {
    key: "working",
    label: "Agent working",
    detail: "Reading the brief, editing code, and running tests."
  },
  {
    key: "pr",
    label: "Pull request",
    detail: "Pushing a branch and opening a PR for review."
  }
];

type StepStatus = "pending" | "active" | "done";

function realStepStatus(
  index: number,
  agentStatus: string | undefined,
  isDone: boolean
): StepStatus {
  if (isDone) return "done";
  if (agentStatus === "CREATING") return index === 0 ? "active" : "pending";
  if (agentStatus === "RUNNING")
    return index === 0 ? "done" : index === 1 ? "active" : "pending";
  return index < 2 ? "done" : "active";
}

export default function RunPage() {
  const router = useRouter();
  const brief = usePatchPilot((s) => s.brief);
  const run = usePatchPilot((s) => s.run);
  const [elapsed, setElapsed] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const isReal = run.mode === "real";

  useEffect(() => {
    if (!brief) {
      router.replace("/intake");
    }
  }, [brief, router]);

  // Drive the mocked agent pipeline once per visit (simulated runs only).
  useEffect(() => {
    if (started.current) return;
    const store = usePatchPilot.getState();
    if (!store.brief) return;
    if (store.run.mode === "real") return;
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

  // Poll the real Cursor agent run and stream its status into the console.
  useEffect(() => {
    if (run.mode !== "real" || run.status !== "running") return;
    const agentId = run.agentId;
    const runId = run.agentRunId;
    if (!agentId || !runId) return;

    let cancelled = false;
    let lastStatus = usePatchPilot.getState().run.agentStatus ?? "";

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/agent/status?agentId=${encodeURIComponent(
            agentId
          )}&runId=${encodeURIComponent(runId)}`
        );
        if (cancelled) return;
        const data = await res.json();
        if (!res.ok) return; // transient; keep polling

        const store = usePatchPilot.getState();
        if (data.status && data.status !== lastStatus) {
          lastStatus = data.status;
          store.appendLogs([`> status: ${data.status}`]);
        }
        if (data.branch && data.branch !== store.run.branch) {
          store.appendLogs([`> branch: ${data.branch}`]);
        }
        if (data.prUrl && !store.run.prUrl) {
          store.appendLogs(["> pull request opened"]);
        }
        store.applyRealStatus({
          agentStatus: data.status,
          branch: data.branch,
          prUrl: data.prUrl
        });

        if (data.phase === "awaiting-review") {
          if (data.text) store.appendLogs([`> ${String(data.text).slice(0, 240)}`]);
          store.appendLogs(["> done - awaiting human review"]);
          store.completeRun();
          await store.persist("review");
          cancelled = true;
        } else if (data.phase === "failed") {
          store.failRun(data.label || "Agent run failed");
          await store.persist();
          cancelled = true;
        }
      } catch {
        // network blip — keep polling
      }
    };

    poll();
    const id = setInterval(() => {
      if (!cancelled) poll();
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [run.mode, run.status, run.agentId, run.agentRunId]);

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

  const failed = run.status === "failed";
  const isDone = run.status === "awaiting-review" || run.status === "merged";
  const totalAdditions = run.diffFiles.reduce((a, f) => a + f.additions, 0);
  const totalDeletions = run.diffFiles.reduce((a, f) => a + f.deletions, 0);

  const displaySteps: { key: string; label: string; detail: string; status: StepStatus }[] =
    isReal
      ? REAL_STEPS.map((st, i) => ({
          ...st,
          status: realStepStatus(i, run.agentStatus, isDone)
        }))
      : run.steps.map((st) => ({
          key: st.key,
          label: st.label,
          detail: st.detail,
          status: st.status
        }));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex animate-slideUp items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Step 3 · Run</p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-ink-900">
            Agent run
            {isReal && (
              <span className="inline-flex items-center gap-1 rounded-full bg-iris-50 px-2 py-0.5 text-[11px] font-semibold text-iris-700 ring-1 ring-inset ring-iris-100">
                <Cpu size={11} /> live
              </span>
            )}
          </h2>
          <p className="mt-1 truncate text-sm text-ink-500">{brief.title}</p>
        </div>
        <Badge tone={failed ? "red" : isDone ? "green" : "amber"}>
          {failed ? "failed" : isDone ? "complete" : "running"}
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
            {run.branch || (isReal ? "pending…" : "…")}
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

      <Card
        title="Pipeline"
        action={
          isReal && run.agentUrl ? (
            <a
              href={run.agentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-iris-600 hover:text-iris-700"
            >
              Open in Cursor <ExternalLink size={12} />
            </a>
          ) : undefined
        }
      >
        <ol className="relative space-y-4 pl-1">
          {displaySteps.map((step, i) => (
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
                {i < displaySteps.length - 1 && (
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
                    className={`animate-fadeIn whitespace-pre-wrap ${
                      failed && last ? "text-rose-300" : "text-emerald-300"
                    }`}
                  >
                    {line}
                    {last && !isDone && !failed && (
                      <span className="ml-0.5 inline-block h-3.5 w-1.5 -translate-y-px animate-caret bg-emerald-300 align-middle" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>

      {failed && (
        <Card title="Run failed" icon={<AlertTriangle size={13} />}>
          <p className="text-sm text-ink-600">
            {run.error || "The agent run did not complete."}
          </p>
          {run.agentUrl && (
            <a
              href={run.agentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-iris-600 hover:text-iris-700"
            >
              Inspect on Cursor <ExternalLink size={14} />
            </a>
          )}
        </Card>
      )}

      {isReal && !failed && (isDone || run.branch || run.prUrl) && (
        <Card title="Result" icon={<GitPullRequest size={13} />}>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-400">Branch</dt>
              <dd className="truncate font-mono text-ink-800">
                {run.branch || "pending…"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-400">Pull request</dt>
              <dd>
                {run.prUrl ? (
                  <a
                    href={run.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-iris-600 hover:text-iris-700"
                  >
                    View PR <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-ink-400">opening…</span>
                )}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-ink-400">
            Full file-level diff lives on the pull request — open it to review every
            change.
          </p>
        </Card>
      )}

      {isDone && !isReal && (
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
        primaryLabel={
          isDone ? "Review changes" : failed ? "Back to brief" : "Running…"
        }
        primaryIcon={isDone ? <ArrowRight size={16} /> : undefined}
        onPrimary={() =>
          failed ? router.push("/brief") : router.push("/review")
        }
        primaryDisabled={!isDone && !failed}
        helper={
          isDone
            ? undefined
            : failed
              ? "The run didn't finish — adjust the brief and try again."
              : isReal
                ? "Live agent is working. Review unlocks when the PR is ready."
                : "The agent is working. Review unlocks when it finishes."
        }
      />
    </div>
  );
}
