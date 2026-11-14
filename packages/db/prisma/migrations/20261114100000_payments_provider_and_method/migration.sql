-- WP-07: payments go through the payment-provider port.
--
-- * `provider` records the server-chosen adapter; the only adapter today is the
--   sandbox adapter, so the default and the existing 'MOCK' rows become 'SANDBOX'.
-- * `method` is the checkout method (BKASH, NAGAD, CARD); nullable because rows
--   written before this migration, and requests without a method, have none.
-- * `PaymentStatus` gains FAILED for declined charges.
-- * Stored references move from the 'MOCK-' prefix to 'SBX-' ('MOCK-REFUND-'
--   becomes 'SBX-REFUND-' through the same rule).
--
-- `ALTER TYPE ... ADD VALUE` may run inside the migration transaction, but the
-- new value cannot be used until that transaction commits. Nothing below uses
-- 'FAILED', so this file is safe as a single transaction.
--
-- Rollback / mitigation (forward-only; apply as a new migration if needed):
--   UPDATE "payments" SET "provider" = 'MOCK' WHERE "provider" = 'SANDBOX';
--   UPDATE "payments" SET "external_ref" = 'MOCK-' || substr("external_ref", 5)
--     WHERE left("external_ref", 4) = 'SBX-';
--   ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'MOCK';
--   ALTER TABLE "payments" DROP COLUMN "method"; DROP TYPE "PaymentMethod";
--   The FAILED enum value cannot be dropped in place; it is harmless if unused.

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BKASH', 'NAGAD', 'CARD');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'FAILED';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "method" "PaymentMethod";
ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'SANDBOX';

-- Data: provider name and reference prefix.
UPDATE "payments" SET "provider" = 'SANDBOX' WHERE "provider" = 'MOCK';
UPDATE "payments"
   SET "external_ref" = 'SBX-' || substr("external_ref", 6)
 WHERE left("external_ref", 5) = 'MOCK-';
