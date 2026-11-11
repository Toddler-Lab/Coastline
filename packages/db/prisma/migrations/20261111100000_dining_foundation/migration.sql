-- Dining foundation: venues, menus, tables, table reservations, sunbed food
-- delivery orders, and payment parents for the new order types.

-- Enums ---------------------------------------------------------------------

CREATE TYPE "DiningVenueKind" AS ENUM ('RESTAURANT', 'SEAFOOD_KITCHEN', 'BEACH_STALL');
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CHECKED_IN', 'CANCELLED');
CREATE TYPE "FoodOrderStatus" AS ENUM ('PLACED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED');

-- Venues and menus ----------------------------------------------------------

CREATE TABLE "dining_venues" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_bn" TEXT,
    "kind" "DiningVenueKind" NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "contact_phone" TEXT,
    "image_url" TEXT,
    "cuisine_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "beach_point_id" UUID,
    "open_hour" INTEGER NOT NULL,
    "close_hour" INTEGER NOT NULL,
    "reservations_enabled" BOOLEAN NOT NULL DEFAULT false,
    "delivery_enabled" BOOLEAN NOT NULL DEFAULT false,
    "reservation_deposit_minor" INTEGER NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "vendor_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "dining_venues_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "dining_venues_hours_check" CHECK ("open_hour" >= 0 AND "close_hour" <= 24 AND "close_hour" > "open_hour"),
    CONSTRAINT "dining_venues_deposit_check" CHECK ("reservation_deposit_minor" >= 0),
    CONSTRAINT "dining_venues_beach_point_id_fkey" FOREIGN KEY ("beach_point_id") REFERENCES "beach_points"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dining_venues_vendor_user_id_fkey" FOREIGN KEY ("vendor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "dining_venues_code_key" ON "dining_venues" ("code");
CREATE INDEX "dining_venues_beach_point_id_is_active_idx" ON "dining_venues" ("beach_point_id", "is_active");
CREATE INDEX "dining_venues_kind_is_active_idx" ON "dining_venues" ("kind", "is_active");

CREATE TABLE "menu_categories" (
    "id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "name_bn" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "menu_categories_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "dining_venues"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "menu_categories_venue_id_name_key" ON "menu_categories" ("venue_id", "name");
CREATE UNIQUE INDEX "menu_categories_id_venue_id_key" ON "menu_categories" ("id", "venue_id");

CREATE TABLE "menu_items" (
    "id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "name_bn" TEXT,
    "description" TEXT,
    "price_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "menu_items_price_check" CHECK ("price_minor" > 0),
    CONSTRAINT "menu_items_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "dining_venues"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    -- Composite FK: the category must belong to the same venue as the item.
    CONSTRAINT "menu_items_category_id_venue_id_fkey" FOREIGN KEY ("category_id", "venue_id") REFERENCES "menu_categories"("id", "venue_id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "menu_items_venue_id_is_available_idx" ON "menu_items" ("venue_id", "is_available");
CREATE INDEX "menu_items_category_id_sort_order_idx" ON "menu_items" ("category_id", "sort_order");

-- Tables and reservations ---------------------------------------------------

CREATE TABLE "dining_tables" (
    "id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "dining_tables_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "dining_tables_seats_check" CHECK ("seats" > 0),
    CONSTRAINT "dining_tables_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "dining_venues"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "dining_tables_code_key" ON "dining_tables" ("code");
CREATE INDEX "dining_tables_venue_id_is_active_idx" ON "dining_tables" ("venue_id", "is_active");

CREATE TABLE "table_reservations" (
    "id" UUID NOT NULL,
    "public_ref" TEXT NOT NULL,
    "tourist_id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "table_id" UUID NOT NULL,
    "venue_code" TEXT NOT NULL,
    "venue_name" TEXT NOT NULL,
    "table_code" TEXT NOT NULL,
    "party_size" INTEGER NOT NULL,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "deposit_minor" INTEGER NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "note" TEXT,
    "placed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMPTZ(6),
    "cancel_reason" TEXT,
    "cancelled_by_id" UUID,
    "checked_in_at" TIMESTAMPTZ(6),
    "checked_in_by_id" UUID,
    CONSTRAINT "table_reservations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "table_reservations_window_check" CHECK ("end_at" > "start_at"),
    CONSTRAINT "table_reservations_party_size_check" CHECK ("party_size" > 0),
    CONSTRAINT "table_reservations_deposit_check" CHECK ("deposit_minor" >= 0),
    CONSTRAINT "table_reservations_tourist_id_fkey" FOREIGN KEY ("tourist_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "table_reservations_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "dining_venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "table_reservations_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "dining_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "table_reservations_cancelled_by_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "table_reservations_checked_in_by_id_fkey" FOREIGN KEY ("checked_in_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "table_reservations_public_ref_key" ON "table_reservations" ("public_ref");
CREATE INDEX "table_reservations_tourist_id_placed_at_idx" ON "table_reservations" ("tourist_id", "placed_at");
CREATE INDEX "table_reservations_venue_id_start_at_idx" ON "table_reservations" ("venue_id", "start_at");
CREATE INDEX "table_reservations_table_id_start_at_idx" ON "table_reservations" ("table_id", "start_at");
CREATE INDEX "table_reservations_status_start_at_idx" ON "table_reservations" ("status", "start_at");

-- Occupancy: one row per table per reserved hour. The partial unique index is
-- the concurrency guarantee: no two active reservations can own a table-hour.
CREATE TABLE "table_slots" (
    "id" UUID NOT NULL,
    "reservation_id" UUID NOT NULL,
    "table_id" UUID NOT NULL,
    "slot_start" TIMESTAMPTZ(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "table_slots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "table_slots_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "table_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "table_slots_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "dining_tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "table_slots_reservation_id_slot_start_key" ON "table_slots" ("reservation_id", "slot_start");
CREATE UNIQUE INDEX "table_slots_active_table_slot_key" ON "table_slots" ("table_id", "slot_start") WHERE "is_active";
CREATE INDEX "table_slots_table_id_slot_start_idx" ON "table_slots" ("table_id", "slot_start");
CREATE INDEX "table_slots_slot_start_idx" ON "table_slots" ("slot_start");

-- Sunbed food delivery orders -----------------------------------------------

CREATE TABLE "food_orders" (
    "id" UUID NOT NULL,
    "public_ref" TEXT NOT NULL,
    "tourist_id" UUID NOT NULL,
    "venue_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "venue_code" TEXT NOT NULL,
    "venue_name" TEXT NOT NULL,
    "sunbed_code" TEXT NOT NULL,
    "beach_point_code" TEXT NOT NULL,
    "beach_point_name" TEXT NOT NULL,
    "status" "FoodOrderStatus" NOT NULL DEFAULT 'PLACED',
    "subtotal_minor" INTEGER NOT NULL,
    "total_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "note" TEXT,
    "placed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preparing_at" TIMESTAMPTZ(6),
    "ready_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "cancel_reason" TEXT,
    "cancelled_by_id" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "food_orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "food_orders_total_check" CHECK ("subtotal_minor" > 0 AND "total_minor" > 0),
    CONSTRAINT "food_orders_tourist_id_fkey" FOREIGN KEY ("tourist_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "food_orders_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "dining_venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "food_orders_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "food_orders_cancelled_by_id_fkey" FOREIGN KEY ("cancelled_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "food_orders_public_ref_key" ON "food_orders" ("public_ref");
CREATE INDEX "food_orders_tourist_id_placed_at_idx" ON "food_orders" ("tourist_id", "placed_at");
CREATE INDEX "food_orders_venue_id_status_placed_at_idx" ON "food_orders" ("venue_id", "status", "placed_at");
CREATE INDEX "food_orders_order_item_id_idx" ON "food_orders" ("order_item_id");

CREATE TABLE "food_order_items" (
    "id" UUID NOT NULL,
    "food_order_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "item_name" TEXT NOT NULL,
    "unit_price_minor" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "total_minor" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "food_order_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "food_order_items_quantity_check" CHECK ("quantity" > 0),
    CONSTRAINT "food_order_items_price_check" CHECK ("unit_price_minor" > 0 AND "total_minor" > 0),
    CONSTRAINT "food_order_items_food_order_id_fkey" FOREIGN KEY ("food_order_id") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "food_order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "food_order_items_food_order_id_idx" ON "food_order_items" ("food_order_id");
CREATE INDEX "food_order_items_menu_item_id_idx" ON "food_order_items" ("menu_item_id");

-- Payments: a payment now belongs to exactly one of sunbed order, table
-- reservation or food order. Existing rows all have order_id set, so the
-- CHECK holds on upgrade. Backward compatible for the sunbed flow.
ALTER TABLE "payments" ALTER COLUMN "order_id" DROP NOT NULL;
ALTER TABLE "payments" ADD COLUMN "reservation_id" UUID;
ALTER TABLE "payments" ADD COLUMN "food_order_id" UUID;

ALTER TABLE "payments" ADD CONSTRAINT "payments_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "table_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_food_order_id_fkey" FOREIGN KEY ("food_order_id") REFERENCES "food_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_single_parent_check" CHECK (num_nonnulls("order_id", "reservation_id", "food_order_id") = 1);

CREATE INDEX "payments_reservation_id_created_at_idx" ON "payments" ("reservation_id", "created_at");
CREATE INDEX "payments_food_order_id_created_at_idx" ON "payments" ("food_order_id", "created_at");
