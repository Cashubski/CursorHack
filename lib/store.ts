"use client";

import { create } from "zustand";
import type {
  AgentRun,
  EngineeringBrief,
  Issue,
  ReviewDecision,
  ReviewState,
  SafetyCheckItem,
  Task,
  TaskStatus
} from "./types";
import { buildAgentSteps, buildBranchName, buildDiffFiles } from "./mockAgent";
import { newTaskId, upsertTask } from "./db";
import { toast } from "./toast";

const DEFAULT_ISSUE: Issue = {
  rawReport: "",
  reporter: "",
  severity: "high",
  area: "Sync"
};

const DEFAULT_CHECKLIST: SafetyCheckItem[] = [
  {
    key: "tests",
    label: "Tests pass",
    hint: "Suite is green and includes a new regression test.",
    required: true,
    checked: false
  },
  {
    key: "secrets",
    label: "No secrets or keys touched",
    hint: "Diff contains no credentials, tokens, or .env changes.",
    required: true,
    checked: false
  },
  {
    key: "scope",
    label: "Scope limited to affected area",
    hint: "No unrelated files or modules were modified.",
    required: true,
    checked: false
  },
  {
    key: "migrations",
    label: "Migrations are safe",
    hint: "No destructive or irreversible schema changes.",
    required: false,
    checked: false
  },
  {
    key: "rollback",
    label: "Rollback plan exists",
    hint: "Change can be reverted with a single revert commit.",
    required: false,
    checked: false
  }
];

function freshRun(): AgentRun {
  return {
    status: "idle",
    steps: buildAgentSteps(),
    logs: [],
    diffFiles: [],
    branch: "",
    prUrl: "",
    startedAt: null,
    mode: "mock"
  };
}

function freshReview(): ReviewState {
  return {
    checklist: DEFAULT_CHECKLIST.map((c) => ({ ...c })),
    decision: "pending",
    note: ""
  };
}

interface PatchPilotState {
  taskId: string | null;
  createdAt: string | null;
  status: TaskStatus;
  issue: Issue;
  brief: EngineeringBrief | null;
  run: AgentRun;
  review: ReviewState;
  saving: boolean;

  setIssue: (patch: Partial<Issue>) => void;
  setBrief: (brief: EngineeringBrief) => void;
  updateBrief: (patch: Partial<EngineeringBrief>) => void;

  startRun: () => void;
  startRealRun: (info: {
    agentId: string;
    agentRunId: string;
    agentUrl: string;
    branch?: string;
  }) => void;
  applyRealStatus: (patch: {
    agentStatus: string;
    branch?: string;
    prUrl?: string;
  }) => void;
  failRun: (message: string) => void;
  appendLogs: (lines: string[]) => void;
  setStepStatus: (index: number, status: AgentRun["steps"][number]["status"]) => void;
  completeRun: () => void;

  toggleCheck: (key: string) => void;
  setDecision: (decision: ReviewDecision, by?: string | null) => void;
  setReviewNote: (note: string) => void;
  mergeRun: (by?: string | null) => void;

  snapshot: () => Task;
  persist: (status?: TaskStatus) => Promise<void>;
  loadTask: (task: Task) => void;
  reset: () => void;
}

export const usePatchPilot = create<PatchPilotState>((set, get) => ({
  taskId: null,
  createdAt: null,
  status: "triage",
  issue: { ...DEFAULT_ISSUE },
  brief: null,
  run: freshRun(),
  review: freshReview(),
  saving: false,

  setIssue: (patch) => set((s) => ({ issue: { ...s.issue, ...patch } })),

  setBrief: (brief) =>
    set((s) => ({
      brief,
      status: "briefed",
      // Preserve identity when regenerating; mint one on first brief.
      taskId: s.taskId ?? newTaskId(),
      createdAt: s.createdAt ?? new Date().toISOString(),
      run: freshRun(),
      review: freshReview()
    })),

  updateBrief: (patch) =>
    set((s) => (s.brief ? { brief: { ...s.brief, ...patch } } : {})),

  startRun: () => {
    const { brief } = get();
    if (!brief) return;
    set(() => ({
      status: "running",
      run: {
        ...freshRun(),
        status: "running",
        branch: buildBranchName(brief),
        diffFiles: buildDiffFiles(brief),
        prUrl: "https://github.com/Cashubski/CursorHack/pull/1",
        startedAt: Date.now()
      }
    }));
  },

  startRealRun: (info) => {
    const { brief } = get();
    if (!brief) return;
    set(() => ({
      status: "running",
      run: {
        ...freshRun(),
        status: "running",
        mode: "real",
        agentId: info.agentId,
        agentRunId: info.agentRunId,
        agentUrl: info.agentUrl,
        agentStatus: "CREATING",
        branch: info.branch ?? "",
        prUrl: "",
        startedAt: Date.now(),
        logs: [
          "> dispatched to Cursor Cloud Agent",
          `> agent ${info.agentId}`,
          "> status: CREATING"
        ]
      }
    }));
  },

  applyRealStatus: (patch) =>
    set((s) => ({
      run: {
        ...s.run,
        agentStatus: patch.agentStatus,
        branch: patch.branch || s.run.branch,
        prUrl: patch.prUrl || s.run.prUrl
      }
    })),

  failRun: (message) =>
    set((s) => ({
      run: {
        ...s.run,
        status: "failed",
        error: message,
        logs: [...s.run.logs, `> error: ${message}`]
      }
    })),

  appendLogs: (lines) =>
    set((s) => ({ run: { ...s.run, logs: [...s.run.logs, ...lines] } })),

  setStepStatus: (index, status) =>
    set((s) => ({
      run: {
        ...s.run,
        steps: s.run.steps.map((step, i) =>
          i === index ? { ...step, status } : step
        )
      }
    })),

  completeRun: () =>
    set((s) => ({ status: "review", run: { ...s.run, status: "awaiting-review" } })),

  toggleCheck: (key) =>
    set((s) => ({
      review: {
        ...s.review,
        checklist: s.review.checklist.map((c) =>
          c.key === key ? { ...c, checked: !c.checked } : c
        )
      }
    })),

  setDecision: (decision, by = null) =>
    set((s) => ({
      review: { ...s.review, decision, reviewedBy: by ?? s.review.reviewedBy ?? null },
      status:
        decision === "changes-requested"
          ? "changes-requested"
          : s.status === "changes-requested"
            ? "review"
            : s.status
    })),

  setReviewNote: (note) =>
    set((s) => ({ review: { ...s.review, note } })),

  mergeRun: (by = null) =>
    set((s) => ({
      status: "merged",
      run: { ...s.run, status: "merged" },
      review: { ...s.review, mergedBy: by ?? s.review.mergedBy ?? null }
    })),

  snapshot: () => {
    const s = get();
    return {
      id: s.taskId ?? newTaskId(),
      createdAt: s.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: s.status,
      issue: s.issue,
      brief: s.brief,
      run: s.brief ? s.run : null,
      review: s.review
    };
  },

  persist: async (status) => {
    if (status) set(() => ({ status }));
    const snap = get().snapshot();
    if (!get().taskId) set(() => ({ taskId: snap.id, createdAt: snap.createdAt }));
    set(() => ({ saving: true }));
    try {
      await upsertTask(snap);
    } catch (err) {
      // Non-fatal for the demo: the in-memory flow continues either way.
      console.error("Failed to persist task", err);
      toast.error(
        "Couldn’t save to the database",
        "Your progress is kept locally for this session."
      );
    } finally {
      set(() => ({ saving: false }));
    }
  },

  loadTask: (task) =>
    set(() => ({
      taskId: task.id,
      createdAt: task.createdAt,
      status: task.status,
      issue: task.issue,
      brief: task.brief,
      run: task.run ?? freshRun(),
      review: task.review ?? freshReview()
    })),

  reset: () =>
    set(() => ({
      taskId: null,
      createdAt: null,
      status: "triage",
      issue: { ...DEFAULT_ISSUE },
      brief: null,
      run: freshRun(),
      review: freshReview(),
      saving: false
    }))
}));
