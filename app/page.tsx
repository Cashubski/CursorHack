"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listTasks, storageMode } from "@/lib/db";
import { usePatchPilot } from "@/lib/store";
import type { Task, TaskStatus } from "@/lib/types";
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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="text-xs font-medium text-slate-500">{label}</p>
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
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white sm:flex-row sm:items-center sm:p-8">
        <div className="max-w-xl">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            From bug report to reviewed patch
          </h1>
          <p className="mt-2 text-sm text-brand-100 sm:text-base">
            PatchPilot structures messy reports into engineering briefs,
            dispatches them to a Cursor agent, and gates every merge behind a
            human safety review.
          </p>
        </div>
        <Link
          href="/intake"
          className="shrink-0 rounded-xl bg-white px-5 py-3 text-center text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50 active:scale-[0.98]"
        >
          + New bug report
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total tasks" value={stats.total} />
        <Stat label="Agent running" value={stats.running} />
        <Stat label="Awaiting review" value={stats.review} />
        <Stat label="Merged" value={stats.merged} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Recent tasks
          </h2>
          {storageMode === "local" && (
            <span className="text-xs text-slate-400">
              Local storage - add Supabase env vars to sync across devices
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
                className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <span className="text-3xl">📥</span>
            <p className="text-sm font-medium text-slate-600">
              No bug reports yet.
            </p>
            <Link
              href="/intake"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Create your first report
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
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => openTask(task)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand-300 hover:shadow-sm active:scale-[0.995]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <span className="text-xs text-slate-400">
                          {timeAgo(task.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 truncate text-sm font-semibold text-slate-900">
                        {task.brief?.title || "Untitled report"}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                        <span className="font-medium capitalize">
                          {task.issue.severity}
                        </span>
                        <span>·</span>
                        <span>{task.issue.area}</span>
                        {task.issue.reporter && (
                          <>
                            <span>·</span>
                            <span>{task.issue.reporter}</span>
                          </>
                        )}
                        {task.run && task.run.diffFiles.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="font-mono">
                              <span className="text-emerald-600">
                                +{additions}
                              </span>{" "}
                              <span className="text-rose-600">-{deletions}</span>
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <span className="shrink-0 text-slate-300">→</span>
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
