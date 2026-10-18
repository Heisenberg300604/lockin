CREATE TYPE "CommitmentKind" AS ENUM ('BUILD', 'QUIT');
CREATE TYPE "CommitmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'BROKEN');
CREATE TYPE "RuleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'WINDOW');
CREATE TYPE "CheckInOutcome" AS ENUM ('KEPT', 'BROKEN');

CREATE TABLE "user_profiles" (
  "id" UUID NOT NULL,
  "clerk_id" TEXT NOT NULL,
  "display_name" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commitments" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "kind" "CommitmentKind" NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "time_zone" TEXT NOT NULL,
  "rule_frequency" "RuleFrequency" NOT NULL,
  "target_count" INTEGER NOT NULL,
  "window_days" INTEGER,
  "scheduled_days" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "reward" TEXT NOT NULL,
  "status" "CommitmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "paused_at" TIMESTAMPTZ(3),
  "completed_at" TIMESTAMPTZ(3),
  "broken_at" TIMESTAMPTZ(3),
  "break_reason" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "commitments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "check_ins" (
  "id" UUID NOT NULL,
  "commitment_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "date" DATE NOT NULL,
  "outcome" "CheckInOutcome" NOT NULL,
  "note" TEXT,
  "reason" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_profiles_clerk_id_key" ON "user_profiles"("clerk_id");
CREATE INDEX "commitments_user_id_status_created_at_idx" ON "commitments"("user_id", "status", "created_at");
CREATE INDEX "commitments_user_id_end_date_idx" ON "commitments"("user_id", "end_date");
CREATE UNIQUE INDEX "check_ins_commitment_id_date_key" ON "check_ins"("commitment_id", "date");
CREATE INDEX "check_ins_user_id_date_idx" ON "check_ins"("user_id", "date");

ALTER TABLE "commitments" ADD CONSTRAINT "commitments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_commitment_id_fkey" FOREIGN KEY ("commitment_id") REFERENCES "commitments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
