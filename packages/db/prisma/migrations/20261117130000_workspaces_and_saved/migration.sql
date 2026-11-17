-- WP-04 (minimal) and WP-25 (saved items).
--
-- * Roles PROVIDER and DESK. `ALTER TYPE ... ADD VALUE` may run inside the
--   migration transaction; nothing below uses the new values.
-- * `providers` (minimal: the full onboarding fields arrive with WP-16) and
--   `provider_members`: a PROVIDER user's scope is the providers they belong to.
-- * `hotels.provider_id`, `dining_venues.provider_id`: which provider runs it.
--   Null means the platform runs it (only ADMIN can manage it).
-- * `desk_assignments`: a DESK user's scope is their destinations.
-- * `saved_items`: keyed by the engine's public key until listings exist (WP-06).
--
-- No backfill: existing hotels and venues stay platform-run.
--
-- Rollback / mitigation (forward-only; apply as a new migration if needed):
--   DROP TABLE "saved_items", "desk_assignments", "provider_members";
--   ALTER TABLE "hotels" DROP COLUMN "provider_id"; ALTER TABLE "dining_venues" DROP COLUMN "provider_id";
--   DROP TABLE "providers"; DROP TYPE "SavedItemType", "ProviderMemberRole", "ProviderStatus";
--   The PROVIDER and DESK role values cannot be dropped in place; first move such users to TOURIST.

ALTER TYPE "UserRole" ADD VALUE 'PROVIDER';
ALTER TYPE "UserRole" ADD VALUE 'DESK';

CREATE TYPE "ProviderStatus" AS ENUM ('APPLIED', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "ProviderMemberRole" AS ENUM ('OWNER', 'STAFF');
CREATE TYPE "SavedItemType" AS ENUM ('HOTEL', 'VENUE', 'SPOT');

CREATE TABLE "providers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "name_bn" TEXT,
    "destination_id" UUID NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "status" "ProviderStatus" NOT NULL DEFAULT 'APPROVED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_members" (
    "id" UUID NOT NULL,
    "provider_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "ProviderMemberRole" NOT NULL DEFAULT 'STAFF',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "provider_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "desk_assignments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "desk_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saved_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "item_type" "SavedItemType" NOT NULL,
    "item_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "saved_items_key_check" CHECK (length("item_key") BETWEEN 1 AND 160)
);

CREATE INDEX "providers_destination_id_status_idx" ON "providers"("destination_id", "status");
CREATE UNIQUE INDEX "provider_members_provider_id_user_id_key" ON "provider_members"("provider_id", "user_id");
CREATE INDEX "provider_members_user_id_idx" ON "provider_members"("user_id");
CREATE UNIQUE INDEX "desk_assignments_user_id_destination_id_key" ON "desk_assignments"("user_id", "destination_id");
CREATE UNIQUE INDEX "saved_items_user_id_item_type_item_key_key" ON "saved_items"("user_id", "item_type", "item_key");
CREATE INDEX "saved_items_user_id_created_at_idx" ON "saved_items"("user_id", "created_at");

ALTER TABLE "providers" ADD CONSTRAINT "providers_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "provider_members" ADD CONSTRAINT "provider_members_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_members" ADD CONSTRAINT "provider_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "desk_assignments" ADD CONSTRAINT "desk_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "desk_assignments" ADD CONSTRAINT "desk_assignments_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hotels" ADD COLUMN "provider_id" UUID;
CREATE INDEX "hotels_provider_id_idx" ON "hotels"("provider_id");
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "dining_venues" ADD COLUMN "provider_id" UUID;
CREATE INDEX "dining_venues_provider_id_idx" ON "dining_venues"("provider_id");
ALTER TABLE "dining_venues" ADD CONSTRAINT "dining_venues_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
