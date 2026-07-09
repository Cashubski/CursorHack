import { getSupabase, isSupabaseConfigured, TASKS_TABLE } from "./supabase";
import type { Task } from "./types";

const LS_KEY = "patchpilot.tasks.v1";

/** Where the data layer is currently reading/writing from. */
export const storageMode: "supabase" | "local" = isSupabaseConfigured
  ? "supabase"
  : "local";

interface TaskRow {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  reporter: string | null;
  severity: string;
  area: string;
  status: string;
  issue: Task["issue"];
  brief: Task["brief"];
  run: Task["run"];
  review: Task["review"];
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status as Task["status"],
    issue: row.issue,
    brief: row.brief,
    run: row.run,
    review: row.review
  };
}

function taskToRow(task: Task): TaskRow {
  return {
    id: task.id,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    title: task.brief?.title || "Untitled report",
    reporter: task.issue.reporter || null,
    severity: task.issue.severity,
    area: task.issue.area,
    status: task.status,
    issue: task.issue,
    brief: task.brief,
    run: task.run,
    review: task.review
  };
}

/* ------------------------------ local store ------------------------------ */

function readLocal(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(tasks: Task[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(tasks));
}

/* ------------------------------ public API ------------------------------- */

export async function listTasks(): Promise<Task[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from(TASKS_TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as TaskRow[]).map(rowToTask);
  }
  return readLocal().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getTask(id: string): Promise<Task | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from(TASKS_TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToTask(data as TaskRow) : null;
  }
  return readLocal().find((t) => t.id === id) ?? null;
}

export async function upsertTask(task: Task): Promise<Task> {
  const next: Task = { ...task, updatedAt: new Date().toISOString() };

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from(TASKS_TABLE)
      .upsert(taskToRow(next))
      .select("*")
      .single();
    if (error) throw error;
    return rowToTask(data as TaskRow);
  }

  const tasks = readLocal();
  const idx = tasks.findIndex((t) => t.id === next.id);
  if (idx >= 0) tasks[idx] = next;
  else tasks.unshift(next);
  writeLocal(tasks);
  return next;
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from(TASKS_TABLE).delete().eq("id", id);
    if (error) throw error;
    return;
  }
  writeLocal(readLocal().filter((t) => t.id !== id));
}

export function newTaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Subscribe to task changes for a live board. With Supabase this uses Postgres
 * change streams (Realtime); without it, it listens for cross-tab localStorage
 * writes. Returns an unsubscribe function. `onChange` fires on any change.
 */
export function subscribeTasks(onChange: () => void): () => void {
  const supabase = getSupabase();
  if (supabase) {
    const channel = supabase
      .channel("public:tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TASKS_TABLE },
        () => onChange()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }

  if (typeof window !== "undefined") {
    const handler = (e: StorageEvent) => {
      if (e.key === LS_KEY) onChange();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }

  return () => {};
}
