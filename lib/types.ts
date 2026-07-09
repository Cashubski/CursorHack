export type Severity = "low" | "medium" | "high" | "critical";

export type AppArea =
  | "Auth"
  | "Payments"
  | "Notifications"
  | "Sync"
  | "UI"
  | "API"
  | "Search"
  | "Other";

export interface Issue {
  rawReport: string;
  reporter: string;
  severity: Severity;
  area: AppArea;
}

export type RiskLevel = "low" | "medium" | "high";

export interface EngineeringBrief {
  title: string;
  summary: string;
  reproSteps: string[];
  affectedArea: string;
  proposedApproach: string;
  acceptanceCriteria: string[];
  likelyFiles: string[];
  risk: RiskLevel;
  /** Where the brief came from, for demo transparency. */
  source: "template" | "openai";
}

export type AgentStepStatus = "pending" | "active" | "done";

export interface AgentStep {
  key: string;
  label: string;
  detail: string;
  status: AgentStepStatus;
  /** Approximate seconds the step takes in the mocked run. */
  durationMs: number;
}

export type AgentRunStatus =
  | "idle"
  | "running"
  | "awaiting-review"
  | "merged";

export interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
}

export interface AgentRun {
  status: AgentRunStatus;
  steps: AgentStep[];
  logs: string[];
  diffFiles: DiffFile[];
  branch: string;
  prUrl: string;
  startedAt: number | null;
}

export interface SafetyCheckItem {
  key: string;
  label: string;
  hint: string;
  /** Required checks block the merge action until confirmed. */
  required: boolean;
  checked: boolean;
}

export type ReviewDecision = "pending" | "approved" | "changes-requested";

export interface ReviewState {
  checklist: SafetyCheckItem[];
  decision: ReviewDecision;
  note: string;
}

export type TaskStatus =
  | "triage"
  | "briefed"
  | "running"
  | "review"
  | "changes-requested"
  | "merged";

/** A full bug-report task persisted to the database (one row). */
export interface Task {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: TaskStatus;
  issue: Issue;
  brief: EngineeringBrief | null;
  run: AgentRun | null;
  review: ReviewState | null;
}
