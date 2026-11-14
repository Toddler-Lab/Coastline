-- WP-08: `Idempotency-Key` records for booking-creating POST endpoints.
--
-- The unique (scope, key) index is the claim: a concurrent duplicate request
-- cannot insert a second row, so it cannot create a second booking. A row whose
-- response_status is NULL is still in progress. Rows expire (expires_at) and an
-- expired row may be replaced by a new request with the same key.
--
-- Rollback / mitigation: DROP TABLE "idempotency_keys"; the API then needs the
-- interceptor removed as well. No other table references this one.

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "scope" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "actor_user_id" UUID,
    "request_hash" TEXT NOT NULL,
    "response_status" INTEGER,
    "response_body" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "idempotency_keys_key_format_check" CHECK ("key" ~ '^[A-Za-z0-9_-]{8,128}$'),
    CONSTRAINT "idempotency_keys_response_status_check"
      CHECK ("response_status" IS NULL OR ("response_status" BETWEEN 200 AND 499))
);

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_scope_key_key" ON "idempotency_keys"("scope", "key");

-- CreateIndex
CREATE INDEX "idempotency_keys_expires_at_idx" ON "idempotency_keys"("expires_at");
