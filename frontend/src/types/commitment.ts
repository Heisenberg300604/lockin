export type CommitmentKind = "build" | "quit";
export type CommitmentStatus = "active" | "paused" | "completed" | "broken";

export type GoalRule =
  | { type: "daily" }
  | { type: "weekly"; target: number }
  | { type: "monthly"; target: number }
  | { type: "window"; target: number; windowDays: number };

export interface LocalProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckIn {
  id: string;
  commitmentId: string;
  userId: string;
  date: string;
  outcome: "kept" | "broken";
  note?: string;
  reason?: string;
  createdAt: string;
}

export interface Commitment {
  id: string;
  userId: string;
  title: string;
  description?: string;
  kind: CommitmentKind;
  startDate: string;
  endDate: string;
  timeZone: string;
  goalRule: GoalRule;
  reward: string;
  status: CommitmentStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  brokenAt?: string;
  breakReason?: string;
  checkIns: CheckIn[];
}

export interface CommitmentDraft {
  title: string;
  description?: string;
  kind: CommitmentKind;
  startDate: string;
  endDate: string;
  goalRule: GoalRule;
  reward: string;
}

export interface ProgressSummary {
  elapsedDays: number;
  durationDays: number;
  daysRemaining: number;
  elapsedPercent: number;
  successfulCheckIns: number;
  periodLabel: string;
  periodProgress: number;
  periodTarget: number;
  eligibleToday: boolean;
  checkedToday: boolean;
}

export interface LockInStore {
  session: LocalProfile | null;
  commitments: Commitment[];
}
