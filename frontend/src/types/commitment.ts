export type CommitmentKind = "build" | "quit";
export type CommitmentStatus = "active" | "paused" | "completed" | "broken";

export type GoalRule =
  | { type: "daily" }
  | { type: "weekly"; target: number; scheduledDays?: number[] }
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
  /** "skipped" is an honest "not today" on a flexible build commitment. */
  outcome: "kept" | "broken" | "skipped";
  note?: string;
  reason?: string;
  createdAt: string;
  /** True while an optimistic check-in is still being saved. */
  pending?: boolean;
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
  /** First day watched by the inactivity rule (3 silent days break it). */
  inactivityStart?: string;
  checkIns: CheckIn[];
  /** Check-in history is fetched only for the currently opened commitment. */
  checkInsLoaded?: boolean;
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
  periodSecured: boolean;
  periodState: "secured" | "on-track" | "at-risk";
  eligibleToday: boolean;
  checkedToday: boolean;
}

export interface LockInStore {
  session: LocalProfile | null;
  commitments: Commitment[];
}
