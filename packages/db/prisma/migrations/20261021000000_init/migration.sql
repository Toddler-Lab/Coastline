-- Coastline baseline: catalogue, hourly occupancy, orders, mock payments, audit.

-- Enums ---------------------------------------------------------------------

CREATE TYPE "UserRole" AS ENUM ('TOURIST', 'ADMIN');
CREATE TYPE "SunbedStatus" AS ENUM ('AVAILABLE', 'OUT_OF_SERVICE', 'RETIRED');
CREATE TYPE "OrderStatus" AS ENUM ('CONFIRMED', 'CANCELLED');
CREATE TYPE "OrderItemStatus" AS ENUM ('RESERVED', 'CHECKED_IN', 'CANCELLED');
CREATE TYPE "PaymentType" AS ENUM ('CHARGE', 'REFUND');
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCEEDED');

-- Identity ------------------------------------------------------------------

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TOURIST',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");

-- Catalogue -----------------------------------------------------------------

CREATE TABLE "beach_points" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "open_hour" INTEGER NOT NULL,
    "close_hour" INTEGER NOT NULL,
    "default_hourly_price_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "beach_points_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "beach_points_hours_check" CHECK ("open_hour" >= 0 AND "close_hour" <= 24 AND "open_hour" < "close_hour"),
    CONSTRAINT "beach_points_price_check" CHECK ("default_hourly_price_minor" >= 0)
);

CREATE UNIQUE INDEX "beach_points_code_key" ON "beach_points" ("code");
CREATE INDEX "beach_points_sort_order_idx" ON "beach_points" ("sort_order");

CREATE TABLE "sunbeds" (
    "id" UUID NOT NULL,
    "beach_point_id" UUID NOT NULL,
    "seq" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "hourly_price_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "status" "SunbedStatus" NOT NULL DEFAULT 'AVAILABLE',
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "sunbeds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sunbeds_seq_check" CHECK ("seq" > 0),
    CONSTRAINT "sunbeds_price_check" CHECK ("hourly_price_minor" >= 0),
    CONSTRAINT "sunbeds_beach_point_id_fkey" FOREIGN KEY ("beach_point_id") REFERENCES "beach_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "sunbeds_code_key" ON "sunbeds" ("code");
CREATE UNIQUE INDEX "sunbeds_beach_point_id_seq_key" ON "sunbeds" ("beach_point_id", "seq");
CREATE INDEX "sunbeds_beach_point_id_status_idx" ON "sunbeds" ("beach_point_id", "status");

-- Orders --------------------------------------------------------------------

CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "public_ref" TEXT NOT NULL,
    "tourist_id" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'CONFIRMED',
    "subtotal_minor" INTEGER NOT NULL,
    "total_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "placed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMPTZ(6),
    "cancel_reason" TEXT,
    "cancelled_by_id" UUID,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "orders_amounts_check" CHECK ("subtotal_minor" >= 0 AND "total_minor" >= 0 AND "total_minor" = "subtotal_minor"),
    CONSTRAINT "orders_tourist_id_fkey" FOREIGN KEY ("tourist_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_cancelled_by_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "orders_public_ref_key" ON "orders" ("public_ref");
CREATE INDEX "orders_tourist_id_placed_at_idx" ON "orders" ("tourist_id", "placed_at");
CREATE INDEX "orders_status_placed_at_idx" ON "orders" ("status", "placed_at");

CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "sunbed_id" UUID NOT NULL,
    "beach_point_code" TEXT NOT NULL,
    "beach_point_name" TEXT NOT NULL,
    "sunbed_code" TEXT NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "unit_price_minor" INTEGER NOT NULL,
    "total_minor" INTEGER NOT NULL,
    "status" "OrderItemStatus" NOT NULL DEFAULT 'RESERVED',
    "checked_in_at" TIMESTAMPTZ(6),
    "checked_in_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "order_items_time_check" CHECK (
        "end_at" > "start_at"
        AND EXTRACT(MINUTE FROM "start_at") = 0
        AND EXTRACT(SECOND FROM "start_at") = 0
        AND EXTRACT(MICROSECOND FROM "start_at") = 0
        AND EXTRACT(MINUTE FROM "end_at") = 0
        AND EXTRACT(SECOND FROM "end_at") = 0
        AND EXTRACT(MICROSECOND FROM "end_at") = 0
        AND (EXTRACT(EPOCH FROM ("end_at" - "start_at"))::bigint % 3600) = 0
    ),
    CONSTRAINT "order_items_amount_check" CHECK ("unit_price_minor" >= 0 AND "total_minor" >= 0),
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_sunbed_id_fkey" FOREIGN KEY ("sunbed_id") REFERENCES "sunbeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "order_items_checked_in_by_id_fkey" FOREIGN KEY ("checked_in_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "order_items_order_id_idx" ON "order_items" ("order_id");
CREATE INDEX "order_items_sunbed_id_start_at_idx" ON "order_items" ("sunbed_id", "start_at");
CREATE INDEX "order_items_start_at_status_idx" ON "order_items" ("start_at", "status");

-- Occupancy: one row per sunbed per booked hour. The partial unique index is
-- the concurrency guarantee: no two active bookings can own the same bed-hour.
CREATE TABLE "booking_slots" (
    "id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "sunbed_id" UUID NOT NULL,
    "slot_start" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_slots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "booking_slots_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "booking_slots_sunbed_id_fkey" FOREIGN KEY ("sunbed_id") REFERENCES "sunbeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "booking_slots_order_item_id_slot_start_key" ON "booking_slots" ("order_item_id", "slot_start");
CREATE UNIQUE INDEX "booking_slots_active_sunbed_slot_key" ON "booking_slots" ("sunbed_id", "slot_start") WHERE "is_active";
CREATE INDEX "booking_slots_sunbed_id_slot_start_idx" ON "booking_slots" ("sunbed_id", "slot_start");
CREATE INDEX "booking_slots_slot_start_idx" ON "booking_slots" ("slot_start");

-- Payments (append-only) ----------------------------------------------------

CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "type" "PaymentType" NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'MOCK',
    "status" "PaymentStatus" NOT NULL DEFAULT 'SUCCEEDED',
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "external_ref" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payments_amount_check" CHECK ("amount_minor" > 0),
    CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "payments_external_ref_key" ON "payments" ("external_ref");
CREATE INDEX "payments_order_id_created_at_idx" ON "payments" ("order_id", "created_at");

-- Audit ---------------------------------------------------------------------

CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "details" JSONB,
    "request_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "audit_events_entity_type_entity_id_created_at_idx" ON "audit_events" ("entity_type", "entity_id", "created_at");
CREATE INDEX "audit_events_actor_user_id_created_at_idx" ON "audit_events" ("actor_user_id", "created_at");

