import {
  CheckInOutcome,
  CommitmentKind,
  CommitmentStatus,
  RuleFrequency,
} from '../generated/prisma/client.js';

const DAY_MS = 86_400_000;
export const DAILY_BACKFILL_DAYS = 2;

export type LifecycleCheckIn = {
  date: Date;
  outcome: CheckInOutcome;
};

export type LifecycleCommitment = {
  kind: CommitmentKind;
  status: CommitmentStatus;
  startDate: Date;
  endDate: Date;
  ruleFrequency: RuleFrequency;
  targetCount: number;
  windowDays: number | null;
  scheduledDays: number[];
  checkIns: LifecycleCheckIn[];
};

export type RulePeriod = { start: string; end: string };
export type LifecycleTransition =
  | { status: typeof CommitmentStatus.BROKEN; reason: string }
  | { status: typeof CommitmentStatus.COMPLETED }
  | null;

export const dateKey = (date: Date) => date.toISOString().slice(0, 10);
export const dateFromKey = (value: string) => new Date(`${value}T00:00:00.000Z`);
export const addDays = (value: string, days: number) => {
  const date = dateFromKey(value);
  date.setUTCDate(date.getUTCDate() + days);
  return dateKey(date);
};
export const daysBetween = (from: string, to: string) =>
  Math.round((dateFromKey(to).getTime() - dateFromKey(from).getTime()) / DAY_MS);

const minDate = (first: string, second: string) => (first < second ? first : second);

function mondayOf(value: string) {
  const date = dateFromKey(value);
  const weekday = date.getUTCDay() || 7;
  return addDays(value, -(weekday - 1));
}

function monthEnd(value: string) {
  const date = dateFromKey(`${value.slice(0, 7)}-01`);
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return dateKey(date);
}

/** Returns every rule period intersecting a commitment, including partial edges. */
export function rulePeriods(input: Pick<LifecycleCommitment, 'startDate' | 'endDate' | 'ruleFrequency' | 'windowDays'>): RulePeriod[] {
  const start = dateKey(input.startDate);
  const end = dateKey(input.endDate);
  const periods: RulePeriod[] = [];
  let cursor = start;

  while (cursor <= end) {
    let naturalEnd: string;
    if (input.ruleFrequency === RuleFrequency.DAILY) naturalEnd = cursor;
    else if (input.ruleFrequency === RuleFrequency.WEEKLY) naturalEnd = addDays(mondayOf(cursor), 6);
    else if (input.ruleFrequency === RuleFrequency.MONTHLY) naturalEnd = monthEnd(cursor);
    else naturalEnd = addDays(cursor, (input.windowDays ?? 1) - 1);

    const periodEnd = minDate(naturalEnd, end);
    periods.push({ start: cursor, end: periodEnd });
    cursor = addDays(periodEnd, 1);
  }
  return periods;
}

export function isoWeekday(value: string) {
  const weekday = dateFromKey(value).getUTCDay();
  return weekday === 0 ? 7 : weekday;
}

export function eligibleDays(period: RulePeriod, scheduledDays: number[]) {
  const days: string[] = [];
  for (let day = period.start; day <= period.end; day = addDays(day, 1)) {
    if (!scheduledDays.length || scheduledDays.includes(isoWeekday(day))) days.push(day);
  }
  return days;
}

export function validatePeriodFeasibility(input: Pick<LifecycleCommitment, 'startDate' | 'endDate' | 'ruleFrequency' | 'windowDays' | 'targetCount' | 'scheduledDays'>) {
  const impossible = rulePeriods(input).find(
    (period) => eligibleDays(period, input.scheduledDays).length < input.targetCount,
  );
  return impossible
    ? `The target cannot be met during ${impossible.start} to ${impossible.end}. Choose a lower target, longer timeline, or different schedule.`
    : null;
}

function periodIsClosed(input: LifecycleCommitment, period: RulePeriod, today: string) {
  if (input.ruleFrequency === RuleFrequency.DAILY) {
    return today > addDays(period.end, DAILY_BACKFILL_DAYS);
  }
  return today > period.end;
}

function completionIsDue(input: LifecycleCommitment, today: string) {
  const lastPeriod = rulePeriods(input).at(-1);
  if (!lastPeriod) return false;
  return input.ruleFrequency === RuleFrequency.DAILY
    ? today > addDays(lastPeriod.end, DAILY_BACKFILL_DAYS)
    : today > lastPeriod.end;
}

export function evaluateLifecycle(input: LifecycleCommitment, today: string): LifecycleTransition {
  if (input.status !== CommitmentStatus.ACTIVE) return null;

  if (input.kind === CommitmentKind.QUIT) {
    return today > dateKey(input.endDate) ? { status: CommitmentStatus.COMPLETED } : null;
  }

  const keptDates = new Set(
    input.checkIns
      .filter((entry) => entry.outcome === CheckInOutcome.KEPT)
      .map((entry) => dateKey(entry.date)),
  );

  for (const period of rulePeriods(input)) {
    if (!periodIsClosed(input, period, today)) continue;
    const successfulDays = eligibleDays(period, input.scheduledDays).filter((day) => keptDates.has(day));
    if (successfulDays.length < input.targetCount) {
      return {
        status: CommitmentStatus.BROKEN,
        reason: `Period ${period.start} to ${period.end} finished ${successfulDays.length} of ${input.targetCount}.`,
      };
    }
  }

  return completionIsDue(input, today) ? { status: CommitmentStatus.COMPLETED } : null;
}
