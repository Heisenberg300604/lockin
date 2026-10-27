import {
  CheckInOutcome,
  CommitmentKind,
  CommitmentStatus,
  RuleFrequency,
} from '../generated/prisma/client.js';
import {
  evaluateLifecycle,
  validatePeriodFeasibility,
  type LifecycleCommitment,
} from './commitment-lifecycle.js';

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

function commitment(overrides: Partial<LifecycleCommitment> = {}): LifecycleCommitment {
  return {
    kind: CommitmentKind.BUILD,
    status: CommitmentStatus.ACTIVE,
    startDate: date('2026-10-05'),
    endDate: date('2026-10-11'),
    ruleFrequency: RuleFrequency.WEEKLY,
    targetCount: 3,
    windowDays: null,
    scheduledDays: [],
    checkIns: [],
    ...overrides,
  };
}

const kept = (value: string) => ({ date: date(value), outcome: CheckInOutcome.KEPT });

describe('commitment lifecycle', () => {
  it('keeps a flexible weekly commitment successful when its target was reached before Sunday', () => {
    const item = commitment({ checkIns: [kept('2026-10-05'), kept('2026-10-07'), kept('2026-10-09')] });

    expect(evaluateLifecycle(item, '2026-10-11')).toBeNull();
    expect(evaluateLifecycle(item, '2026-10-12')).toEqual({ status: CommitmentStatus.COMPLETED });
  });

  it('breaks a flexible weekly commitment immediately after a failed week closes', () => {
    const item = commitment({ checkIns: [kept('2026-10-05'), kept('2026-10-07')] });

    expect(evaluateLifecycle(item, '2026-10-12')).toEqual({
      status: CommitmentStatus.BROKEN,
      reason: 'Period 2026-10-05 to 2026-10-11 finished 2 of 3.',
    });
  });

  it('applies the same no-grace rule to a monthly minimum', () => {
    const item = commitment({
      startDate: date('2026-10-01'),
      endDate: date('2026-10-31'),
      ruleFrequency: RuleFrequency.MONTHLY,
      targetCount: 15,
      checkIns: Array.from({ length: 14 }, (_, index) => kept(`2026-10-${String(index + 1).padStart(2, '0')}`)),
    });

    expect(evaluateLifecycle(item, '2026-11-01')).toEqual({
      status: CommitmentStatus.BROKEN,
      reason: 'Period 2026-10-01 to 2026-10-31 finished 14 of 15.',
    });
  });

  it('retains the two-day late-log window only for daily build habits', () => {
    const item = commitment({
      startDate: date('2026-10-01'),
      endDate: date('2026-10-03'),
      ruleFrequency: RuleFrequency.DAILY,
      targetCount: 1,
    });

    expect(evaluateLifecycle(item, '2026-10-03')).toBeNull();
    expect(evaluateLifecycle(item, '2026-10-04')).toEqual({
      status: CommitmentStatus.BROKEN,
      reason: 'Period 2026-10-01 to 2026-10-01 finished 0 of 1.',
    });
  });

  it('treats selected weekdays as a fixed schedule, not a flexible weekly target', () => {
    const item = commitment({
      scheduledDays: [1, 3, 5],
      checkIns: [kept('2026-10-05'), kept('2026-10-07')],
    });

    expect(evaluateLifecycle(item, '2026-10-12')).toEqual({
      status: CommitmentStatus.BROKEN,
      reason: 'Period 2026-10-05 to 2026-10-11 finished 2 of 3.',
    });
  });

  it('completes an unbroken quit commitment after its end date', () => {
    const item = commitment({
      kind: CommitmentKind.QUIT,
      ruleFrequency: RuleFrequency.DAILY,
      targetCount: 1,
      startDate: date('2026-10-01'),
      endDate: date('2026-10-03'),
    });

    expect(evaluateLifecycle(item, '2026-10-04')).toEqual({ status: CommitmentStatus.COMPLETED });
  });

  it('rejects a target that cannot fit in every active period', () => {
    expect(validatePeriodFeasibility({
      startDate: date('2026-10-11'),
      endDate: date('2026-10-17'),
      ruleFrequency: RuleFrequency.WEEKLY,
      windowDays: null,
      targetCount: 3,
      scheduledDays: [],
    })).toContain('2026-10-11 to 2026-10-11');
  });
});
