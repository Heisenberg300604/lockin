ALTER TABLE "commitments" ADD COLUMN "legacy_id" TEXT;

CREATE UNIQUE INDEX "commitments_user_id_legacy_id_key"
ON "commitments"("user_id", "legacy_id");
