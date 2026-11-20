-- "Not today" responses for flexible build commitments.
ALTER TYPE "CheckInOutcome" ADD VALUE 'SKIPPED';

-- Inactivity rule: 3 consecutive eligible days with no check-in break a
-- commitment. Existing running commitments start being watched today, so the
-- rule never breaks anything retroactively.
ALTER TABLE "commitments" ADD COLUMN "inactivity_start" DATE;
UPDATE "commitments"
SET "inactivity_start" = CURRENT_DATE
WHERE "status" IN ('ACTIVE', 'PAUSED');
