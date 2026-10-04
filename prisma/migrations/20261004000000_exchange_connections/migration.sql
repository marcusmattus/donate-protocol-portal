-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "exchange_connections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sealed_api_key" TEXT NOT NULL,
    "sealed_api_secret" TEXT NOT NULL,
    "sealed_passphrase" TEXT,
    "fingerprint" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(3),
    "last_used_at" TIMESTAMPTZ(3),
    "validation_status" TEXT,
    "validation_reason" TEXT,
    "validation_checked_at" TIMESTAMPTZ(3),
    "last_validation_attempt_at" TIMESTAMPTZ(3),

    CONSTRAINT "exchange_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exchange_connections_user_id_revoked_at_created_at_idx" ON "exchange_connections"("user_id", "revoked_at", "created_at");

