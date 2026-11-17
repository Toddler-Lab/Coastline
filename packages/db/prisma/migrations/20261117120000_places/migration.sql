-- WP-05: destinations and spots, emergency contacts and spot alerts.
--
-- Existing engines attach to places instead of being replaced:
-- * every beach point becomes the sunbed configuration of one BEACH spot
--   (`beach_points.spot_id`, unique and required);
-- * hotels and dining venues belong to a destination and, when they sit at a
--   spot, to that spot. Hotels gain a free-text `area` for new destinations;
--   the Cox's Bazar-only `zone` stays until the listings work (WP-06) retires it.
--
-- Backfill: Cox's Bazar is created with a fixed id, one BEACH spot is created
-- per beach point (same name, coordinates and order), and every existing hotel
-- and venue is attached to Cox's Bazar and to the spot of its beach point. On an
-- empty database only the Cox's Bazar row is written.
--
-- Rollback / mitigation (forward-only; apply as a new migration if needed):
--   ALTER TABLE "beach_points" DROP COLUMN "spot_id";
--   ALTER TABLE "hotels" DROP COLUMN "destination_id", DROP COLUMN "spot_id", DROP COLUMN "area";
--   ALTER TABLE "dining_venues" DROP COLUMN "destination_id", DROP COLUMN "spot_id";
--   DROP TABLE "spot_alerts", "emergency_contacts", "spots", "destinations";
--   DROP TYPE "SpotAlertSeverity", "SpotAlertKind", "EmergencyContactKind", "SpotKind", "DestinationAccent";

-- Enums ---------------------------------------------------------------------

CREATE TYPE "DestinationAccent" AS ENUM ('SEA', 'FOREST', 'LAKE', 'HILL', 'HERITAGE', 'NEUTRAL');
CREATE TYPE "SpotKind" AS ENUM ('BEACH', 'HILL', 'LAKE', 'RIVER', 'WATERFALL', 'FOREST', 'TEA_GARDEN', 'ISLAND', 'HERITAGE', 'PARK', 'MARKET', 'OTHER');
CREATE TYPE "EmergencyContactKind" AS ENUM ('NATIONAL', 'POLICE', 'FIRE', 'HOSPITAL', 'COAST_GUARD', 'DESK', 'OTHER');
CREATE TYPE "SpotAlertKind" AS ENUM ('WEATHER', 'SEA', 'CLOSURE', 'EVENT', 'NOTICE');
CREATE TYPE "SpotAlertSeverity" AS ENUM ('INFO', 'CAUTION', 'DANGER');

-- Tables --------------------------------------------------------------------

CREATE TABLE "destinations" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_bn" TEXT,
    "tagline" TEXT NOT NULL,
    "description" TEXT,
    "accent" "DestinationAccent" NOT NULL DEFAULT 'NEUTRAL',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "map_zoom" DOUBLE PRECISION NOT NULL DEFAULT 11,
    "content" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "destinations_slug_format_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT "destinations_coordinates_check" CHECK ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)
);

CREATE TABLE "spots" (
    "id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_bn" TEXT,
    "kind" "SpotKind" NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "open_hours" JSONB,
    "entry_info" TEXT,
    "content" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "spots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "spots_slug_format_check" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    CONSTRAINT "spots_coordinates_check" CHECK ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)
);

CREATE TABLE "emergency_contacts" (
    "id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "label_bn" TEXT,
    "phone" TEXT NOT NULL,
    "kind" "EmergencyContactKind" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "emergency_contacts_phone_check" CHECK ("phone" ~ '^\+?[0-9 -]{3,20}$')
);

CREATE TABLE "spot_alerts" (
    "id" UUID NOT NULL,
    "destination_id" UUID NOT NULL,
    "spot_id" UUID,
    "kind" "SpotAlertKind" NOT NULL,
    "severity" "SpotAlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "created_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "spot_alerts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "spot_alerts_window_check" CHECK ("ends_at" IS NULL OR "ends_at" > "starts_at")
);

CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");
CREATE INDEX "destinations_is_active_sort_order_idx" ON "destinations"("is_active", "sort_order");
CREATE UNIQUE INDEX "spots_destination_id_slug_key" ON "spots"("destination_id", "slug");
CREATE INDEX "spots_destination_id_is_active_sort_order_idx" ON "spots"("destination_id", "is_active", "sort_order");
CREATE INDEX "emergency_contacts_destination_id_sort_order_idx" ON "emergency_contacts"("destination_id", "sort_order");
CREATE INDEX "spot_alerts_destination_id_starts_at_idx" ON "spot_alerts"("destination_id", "starts_at");
CREATE INDEX "spot_alerts_spot_id_starts_at_idx" ON "spot_alerts"("spot_id", "starts_at");

ALTER TABLE "spots" ADD CONSTRAINT "spots_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "spot_alerts" ADD CONSTRAINT "spot_alerts_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "spot_alerts" ADD CONSTRAINT "spot_alerts_spot_id_fkey" FOREIGN KEY ("spot_id") REFERENCES "spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "spot_alerts" ADD CONSTRAINT "spot_alerts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: Cox's Bazar and one BEACH spot per beach point -----------------

INSERT INTO "destinations" ("id", "slug", "name", "name_bn", "tagline", "accent", "latitude", "longitude", "map_zoom", "content", "sort_order", "created_at", "updated_at")
VALUES (
    '30000000-0000-4000-8000-000000000001',
    'coxs-bazar',
    'Cox''s Bazar',
    'কক্সবাজার',
    'A long sandy sea beach on the Bay of Bengal',
    'SEA',
    21.385,
    91.995,
    13,
    '{}',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO "spots" ("id", "destination_id", "slug", "name", "kind", "description", "latitude", "longitude", "open_hours", "sort_order", "is_active", "created_at", "updated_at")
SELECT
    gen_random_uuid(),
    '30000000-0000-4000-8000-000000000001',
    trim(both '-' from regexp_replace(lower("name"), '[^a-z0-9]+', '-', 'g')),
    "name",
    'BEACH',
    "description",
    "latitude",
    "longitude",
    jsonb_build_object('open', "open_hour", 'close', "close_hour"),
    "sort_order",
    "is_active",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "beach_points";

ALTER TABLE "beach_points" ADD COLUMN "spot_id" UUID;
UPDATE "beach_points" AS bp
   SET "spot_id" = s."id"
  FROM "spots" AS s
 WHERE s."destination_id" = '30000000-0000-4000-8000-000000000001'
   AND s."name" = bp."name";
ALTER TABLE "beach_points" ALTER COLUMN "spot_id" SET NOT NULL;
CREATE UNIQUE INDEX "beach_points_spot_id_key" ON "beach_points"("spot_id");
ALTER TABLE "beach_points" ADD CONSTRAINT "beach_points_spot_id_fkey" FOREIGN KEY ("spot_id") REFERENCES "spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Hotels and venues belong to a destination ---------------------------------

ALTER TABLE "hotels"
    ADD COLUMN "destination_id" UUID,
    ADD COLUMN "spot_id" UUID,
    ADD COLUMN "area" TEXT;
UPDATE "hotels" AS h
   SET "destination_id" = '30000000-0000-4000-8000-000000000001',
       "area" = initcap(h."zone"::text),
       "spot_id" = (SELECT bp."spot_id" FROM "beach_points" AS bp WHERE bp."code" = h."nearest_beach_code");
ALTER TABLE "hotels" ALTER COLUMN "destination_id" SET NOT NULL;
CREATE INDEX "hotels_destination_id_is_active_idx" ON "hotels"("destination_id", "is_active");
CREATE INDEX "hotels_spot_id_idx" ON "hotels"("spot_id");
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_spot_id_fkey" FOREIGN KEY ("spot_id") REFERENCES "spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dining_venues"
    ADD COLUMN "destination_id" UUID,
    ADD COLUMN "spot_id" UUID;
UPDATE "dining_venues" AS v
   SET "destination_id" = '30000000-0000-4000-8000-000000000001',
       "spot_id" = (SELECT bp."spot_id" FROM "beach_points" AS bp WHERE bp."id" = v."beach_point_id");
ALTER TABLE "dining_venues" ALTER COLUMN "destination_id" SET NOT NULL;
CREATE INDEX "dining_venues_destination_id_is_active_idx" ON "dining_venues"("destination_id", "is_active");
CREATE INDEX "dining_venues_spot_id_idx" ON "dining_venues"("spot_id");
ALTER TABLE "dining_venues" ADD CONSTRAINT "dining_venues_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dining_venues" ADD CONSTRAINT "dining_venues_spot_id_fkey" FOREIGN KEY ("spot_id") REFERENCES "spots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
