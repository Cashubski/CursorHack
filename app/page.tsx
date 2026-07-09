"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Cpu,
  GitMerge,
  Inbox,
  Layers,
  Plus,
  ShieldCheck
} from "lucide-react";
import { listTasks, storageMode } from "@/lib/db";
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

function Stat({
  label,
  value,
  icon,
  accent
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200/80 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink-900 tabular-nums">
        {value}
      </p>
      <p className="text-xs font-medium text-ink-400">{label}</p>
    </div>
  );
}

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
  }, [load]);

  function openTask(task: Task) {
    loadTask(task);
    router.push(STATUS_META[task.status].route);
  }

  const stats = {
    total: tasks?.length ?? 0,
    running: tasks?.filter((t) => t.status === "running").length ?? 0,
    review:
      tasks?.filter(
        (t) => t.status === "review" || t.status === "changes-requested"
      ).length ?? 0,
    merged: tasks?.filter((t) => t.status === "merged").length ?? 0
  };

  return (
    <div className="space-y-8">
      {/* Mission-control hero */}
      <section className="relative overflow-hidden rounded-3xl border border-ink-800 bg-ink-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-grid [background-size:36px_36px]" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-iris-500/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-iris-700/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 p-7 sm:p-10">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.25)]" />
            Autonomous bug triage, with a human in the loop
          </span>
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight sm:text-[2.6rem]">
              Turn messy bug reports into{" "}
              <span className="bg-gradient-to-r from-iris-300 to-iris-500 bg-clip-text text-transparent">
                reviewed patches
              </span>
              .
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              PatchPilot structures raw reports into engineering briefs,
              dispatches them to a Cursor agent, and gates every merge behind a
              human safety review.
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
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Stat
          label="Total tasks"
          value={stats.total}
          icon={<Layers size={16} className="text-ink-600" />}
          accent="bg-ink-100"
        />
        <Stat
          label="Agent running"
          value={stats.running}
          icon={<Cpu size={16} className="text-amber-600" />}
          accent="bg-amber-50"
        />
        <Stat
          label="Awaiting review"
          value={stats.review}
          icon={<ShieldCheck size={16} className="text-iris-600" />}
          accent="bg-iris-50"
        />
        <Stat
          label="Merged"
          value={stats.merged}
          icon={<GitMerge size={16} className="text-emerald-600" />}
          accent="bg-emerald-50"
        />
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
          {storageMode === "local" && (
            <span className="hidden text-xs text-ink-400 sm:block">
              Local storage — add Supabase env vars to sync
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
