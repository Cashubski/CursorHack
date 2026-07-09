"use client";

import { create } from "zustand";
import type {
  AgentRun,
  EngineeringBrief,
  Issue,
  ReviewDecision,
  ReviewState,
  SafetyCheckItem
} from "./types";
import { buildAgentSteps, buildBranchName, buildDiffFiles } from "./mockAgent";

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
    startedAt: null
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
  issue: Issue;
  brief: EngineeringBrief | null;
  run: AgentRun;
  review: ReviewState;

  setIssue: (patch: Partial<Issue>) => void;
  setBrief: (brief: EngineeringBrief) => void;
  updateBrief: (patch: Partial<EngineeringBrief>) => void;

  startRun: () => void;
  appendLogs: (lines: string[]) => void;
  setStepStatus: (index: number, status: AgentRun["steps"][number]["status"]) => void;
  completeRun: () => void;

  toggleCheck: (key: string) => void;
  setDecision: (decision: ReviewDecision) => void;
  setReviewNote: (note: string) => void;
  mergeRun: () => void;

  reset: () => void;
}

export const usePatchPilot = create<PatchPilotState>((set, get) => ({
  issue: { ...DEFAULT_ISSUE },
  brief: null,
  run: freshRun(),
  review: freshReview(),

  setIssue: (patch) => set((s) => ({ issue: { ...s.issue, ...patch } })),

  setBrief: (brief) =>
    set(() => ({
      brief,
      run: freshRun(),
      review: freshReview()
    })),

  updateBrief: (patch) =>
    set((s) => (s.brief ? { brief: { ...s.brief, ...patch } } : {})),

  startRun: () => {
    const { brief } = get();
    if (!brief) return;
    set(() => ({
      run: {
        ...freshRun(),
        status: "running",
        branch: buildBranchName(brief),
        diffFiles: buildDiffFiles(brief),
        prUrl: `https://github.com/acme/app/pull/${1400 + Math.floor(Math.random() * 90)}`,
        startedAt: Date.now()
      }
    }));
  },

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
    set((s) => ({ run: { ...s.run, status: "awaiting-review" } })),

  toggleCheck: (key) =>
    set((s) => ({
      review: {
        ...s.review,
        checklist: s.review.checklist.map((c) =>
          c.key === key ? { ...c, checked: !c.checked } : c
        )
      }
    })),

  setDecision: (decision) =>
    set((s) => ({ review: { ...s.review, decision } })),

  setReviewNote: (note) =>
    set((s) => ({ review: { ...s.review, note } })),

  mergeRun: () => set((s) => ({ run: { ...s.run, status: "merged" } })),

  reset: () =>
    set(() => ({
      issue: { ...DEFAULT_ISSUE },
      brief: null,
      run: freshRun(),
      review: freshReview()
    }))
}));
