"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Cpu,
  FileText,
  GitMerge,
  Inbox,
  Layers,
  Plus,
  ShieldCheck,
  Wand2,
  type LucideIcon
} from "lucide-react";
import { listTasks, storageMode, subscribeTasks } from "@/lib/db";
import { usePatchPilot } from "@/lib/store";
import type { Severity, Task, TaskStatus } from "@/lib/types";
import Badge from "@/components/Badge";

const STATUS_META: Record<
  TaskStatus,
  { label: string; tone: "slate" | "brand" | "amber" | "green" | "red"; route: string }
> = {
  triage: { label: "Triage", tone: "slate", route: "/brief" },
  briefed: { label: "Briefed", tone: "brand", route: "/brief" },
  running: { label: "Agent running", tone: "amber", route: "/run" },
  review: { label: "In review", tone: "amber", route: "/review" },
  "changes-requested": { label: "Changes requested", tone: "red", route: "/review" },
  merged: { label: "Merged", tone: "green", route: "/review" }
};

const SEVERITY_STYLE: Record<Severity, string> = {
  critical: "bg-rose-50 text-rose-600 ring-rose-100",
  high: "bg-orange-50 text-orange-600 ring-orange-100",
  medium: "bg-amber-50 text-amber-600 ring-amber-100",
  low: "bg-ink-100 text-ink-500 ring-ink-200"
};

const STAGES: { label: string; icon: LucideIcon }[] = [
  { label: "Report", icon: Inbox },
  { label: "Brief", icon: FileText },
  { label: "Agent", icon: Cpu },
  { label: "Gate", icon: ShieldCheck },
  { label: "Merge", icon: GitMerge }
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function DiffBar({ additions, deletions }: { additions: number; deletions: number }) {
  const total = Math.max(1, additions + deletions);
  const addPct = Math.round((additions / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[11px] text-emerald-600">+{additions}</span>
      <span className="flex h-1.5 w-16 overflow-hidden rounded-full bg-rose-200">
        <span className="h-full bg-emerald-500" style={{ width: `${addPct}%` }} />
      </span>
      <span className="font-mono text-[11px] text-rose-500">-{deletions}</span>
    </div>
  );
}

/** Eased count-up that respects reduced-motion (jumps straight to value). */
function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || value <= 0) {
      setN(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <>
      {n.toLocaleString()}
      {suffix}
    </>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  icon,
  accent
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200/80 bg-white p-4 shadow-card">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
        {icon}
      </span>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 tabular-nums">
        <CountUp value={value} suffix={suffix} />
      </p>
      <p className="text-xs font-medium text-ink-400">{label}</p>
    </div>
  );
}

const VALUE_PROPS: {
  icon: LucideIcon;
  title: string;
  body: string;
  live?: boolean;
}[] = [
  {
    icon: Wand2,
    title: "Structured from chaos",
    body: "Raw, messy reports become clean engineering briefs an agent can act on."
  },
  {
    icon: Cpu,
    title: "Real autonomous agents",
    body: "Dispatches a live Cursor Cloud Agent that writes the fix and opens a real PR.",
    live: true
  },
  {
    icon: ShieldCheck,
    title: "Human safety gate",
    body: "Every change clears a required safety checklist before it can ever merge."
  }
];

export default function Dashboard() {
  const router = useRouter();
  const loadTask = usePatchPilot((s) => s.loadTask);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setTasks(await listTasks());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
      setTasks([]);
    }
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeTasks(load);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [load]);

  function openTask(task: Task) {
    loadTask(task);
    router.push(STATUS_META[task.status].route);
  }

  const list = tasks ?? [];
  const merged = list.filter((t) => t.status === "merged").length;
  const reached = list.filter((t) =>
    ["review", "changes-requested", "merged"].includes(t.status)
  ).length;
  const passRate = reached ? Math.round((merged / reached) * 100) : 0;
  const linesPatched = list.reduce(
    (sum, t) =>
      sum + (t.run?.diffFiles.reduce((a, f) => a + f.additions, 0) ?? 0),
    0
  );

  return (
    <div className="space-y-10">
      {/* Mission-control hero */}
      <section className="relative overflow-hidden rounded-3xl border border-ink-800 bg-ink-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-grid [background-size:36px_36px]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-iris-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-iris-700/20 blur-3xl" />
        <div className="relative flex flex-col gap-7 p-7 sm:p-10">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.25)]" />
            The control plane for autonomous coding agents
          </span>
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight sm:text-[2.7rem]">
              Ship agent-written fixes—
              <span className="bg-gradient-to-r from-iris-300 to-iris-500 bg-clip-text text-transparent">
                without losing the safety net
              </span>
              .
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              PatchPilot turns a messy bug report into a structured brief, dispatches
              it to a real Cursor agent, and holds every change at a human safety gate
              before it merges.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink-900 shadow-pop transition hover:bg-white/90 active:scale-[0.98]"
            >
              <Plus size={16} />
              New bug report
            </Link>
            <a
              href="#board"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              View board
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Animated pipeline rail */}
          <div className="relative mt-1 pt-2">
            <div className="relative flex items-center justify-between">
              <div className="absolute inset-x-3 top-4 h-px bg-white/10" />
              <span className="absolute top-4 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-iris-300 shadow-[0_0_12px_3px_rgba(135,129,251,0.85)] motion-safe:animate-railTravel" />
              {STAGES.map((stage, i) => {
                const Icon = stage.icon;
                return (
                  <div
                    key={stage.label}
                    className="relative z-10 flex flex-1 flex-col items-center gap-1.5"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-ink-900 text-white/80">
                      <Icon size={15} />
                    </span>
                    <span className="text-[10px] font-medium tracking-wide text-white/45">
                      {stage.label}
                    </span>
                    {i < STAGES.length - 1 && (
                      <span className="sr-only">then</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Why it's different */}
      <section className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {VALUE_PROPS.map((v) => {
          const Icon = v.icon;
          return (
            <div
              key={v.title}
              className="rounded-2xl border border-ink-200/80 bg-white p-5 shadow-card"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-iris-50 text-iris-600">
                  <Icon size={17} />
                </span>
                {v.live && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 ring-1 ring-inset ring-emerald-100">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </span>
                    Live
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink-900">{v.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-500">{v.body}</p>
            </div>
          );
        })}
      </section>

      {/* Impact metrics */}
      <section>
        <p className="eyebrow mb-3">Impact</p>
        {tasks === null ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton h-[116px] rounded-2xl border border-ink-200/80 bg-white"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <MetricCard
              label="Reports triaged"
              value={list.length}
              icon={<Layers size={16} className="text-ink-600" />}
              accent="bg-ink-100"
            />
            <MetricCard
              label="Patches merged"
              value={merged}
              icon={<GitMerge size={16} className="text-emerald-600" />}
              accent="bg-emerald-50"
            />
            <MetricCard
              label="Safety pass rate"
              value={passRate}
              suffix="%"
              icon={<ShieldCheck size={16} className="text-iris-600" />}
              accent="bg-iris-50"
            />
            <MetricCard
              label="Lines patched"
              value={linesPatched}
              icon={<Wand2 size={16} className="text-amber-600" />}
              accent="bg-amber-50"
            />
          </div>
        )}
      </section>

      {/* Recent tasks */}
      <section id="board" className="scroll-mt-24">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="eyebrow">The board</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink-900">
              Recent tasks
            </h2>
          </div>
          {storageMode === "supabase" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          ) : (
            <span className="hidden text-xs text-ink-400 sm:block">
              Local — updates sync across tabs
            </span>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {tasks === null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="skeleton h-[76px] rounded-2xl border border-ink-200/80 bg-white"
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-ink-300 bg-white p-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink-100 text-ink-400">
              <Inbox size={22} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-800">No tasks yet</p>
              <p className="mt-0.5 text-sm text-ink-400">
                Create your first bug report to get started.
              </p>
            </div>
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 rounded-xl bg-iris-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(108,94,245,0.6)] transition hover:bg-iris-600"
            >
              <Plus size={16} />
              New bug report
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => {
              const meta = STATUS_META[task.status];
              const additions =
                task.run?.diffFiles.reduce((a, f) => a + f.additions, 0) ?? 0;
              const deletions =
                task.run?.diffFiles.reduce((a, f) => a + f.deletions, 0) ?? 0;
              const hasDiff = (task.run?.diffFiles.length ?? 0) > 0;
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => openTask(task)}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-ink-200/80 bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-card-hover"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${SEVERITY_STYLE[task.issue.severity]}`}
                        >
                          {task.issue.severity}
                        </span>
                        <span className="text-xs text-ink-400">
                          {task.issue.area}
                        </span>
                        <span className="text-ink-300">·</span>
                        <span className="text-xs text-ink-400">
                          {timeAgo(task.createdAt)}
                        </span>
                        {task.run?.mode === "real" && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-iris-50 px-1.5 py-0.5 text-[10px] font-semibold text-iris-700 ring-1 ring-inset ring-iris-100">
                            <Cpu size={10} /> real agent
                          </span>
                        )}
                      </div>
                      <p className="mt-2 truncate text-[15px] font-semibold text-ink-900">
                        {task.brief?.title || "Untitled report"}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3">
                        {task.issue.reporter && (
                          <span className="flex items-center gap-1.5 text-xs text-ink-400">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-ink-800 text-[8px] font-bold uppercase text-white">
                              {task.issue.reporter.replace(/^demo:/, "").charAt(0)}
                            </span>
                            {task.issue.reporter.replace(/^demo:/, "")}
                          </span>
                        )}
                        {hasDiff && (
                          <DiffBar additions={additions} deletions={deletions} />
                        )}
                      </div>
                    </div>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-300 transition group-hover:bg-ink-100 group-hover:text-ink-700">
                      <ArrowUpRight size={18} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
