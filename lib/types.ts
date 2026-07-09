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
  | "merged"
  | "failed";

export interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
}

/** How the run was executed: a fast local simulation, or a real Cursor agent. */
export type AgentRunMode = "mock" | "real";

export interface AgentRun {
  status: AgentRunStatus;
  steps: AgentStep[];
  logs: string[];
  diffFiles: DiffFile[];
  branch: string;
  prUrl: string;
  startedAt: number | null;
  /** Defaults to "mock". "real" runs are dispatched to the Cursor Agents API. */
  mode: AgentRunMode;
  /** Cursor Cloud Agent identifiers (real mode only). */
  agentId?: string;
  agentRunId?: string;
  /** Deep link to the agent on cursor.com (real mode only). */
  agentUrl?: string;
  /** Raw Cursor run status for display, e.g. "RUNNING" (real mode only). */
  agentStatus?: string;
  /** Populated when a real run ends in ERROR/CANCELLED/EXPIRED. */
  error?: string;
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
  /** GitHub handle of the reviewer who approved / requested changes. */
  reviewedBy?: string | null;
  /** GitHub handle of whoever merged the patch. */
  mergedBy?: string | null;
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
