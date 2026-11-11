-- CreateEnum
CREATE TYPE "HotelZone" AS ENUM ('KOLATOLI', 'SUGANDHA', 'LABONI', 'HIMCHARI', 'PECHARDWIP', 'INANI');

-- CreateEnum
CREATE TYPE "HotelRoomStatus" AS ENUM ('AVAILABLE', 'MAINTENANCE', 'RETIRED');

-- CreateTable
CREATE TABLE "hotels" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bangla_name" TEXT,
    "zone" "HotelZone" NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "star_rating" INTEGER NOT NULL DEFAULT 3,
    "featured_image" TEXT NOT NULL,
    "gallery_images" JSONB NOT NULL DEFAULT '[]',
    "description" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "check_in_time" TEXT NOT NULL DEFAULT '14:00',
    "check_out_time" TEXT NOT NULL DEFAULT '11:00',
    "amenities" JSONB NOT NULL DEFAULT '[]',
    "nearest_beach_code" TEXT NOT NULL,
    "distance_meters" INTEGER NOT NULL,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_types" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "max_guests" INTEGER NOT NULL DEFAULT 2,
    "bed_config" TEXT NOT NULL,
    "base_price_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "amenities" JSONB NOT NULL DEFAULT '[]',
    "images" JSONB NOT NULL DEFAULT '[]',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_rooms" (
    "id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "room_type_id" UUID NOT NULL,
    "room_number" TEXT NOT NULL,
    "floor" TEXT,
    "status" "HotelRoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "hotel_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_bookings" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "hotel_id" UUID NOT NULL,
    "room_type_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "hotel_name" TEXT NOT NULL,
    "hotel_slug" TEXT NOT NULL,
    "room_type_name" TEXT NOT NULL,
    "room_number" TEXT NOT NULL,
    "check_in_date" TEXT NOT NULL,
    "check_out_date" TEXT NOT NULL,
    "nights" INTEGER NOT NULL,
    "guests_count" INTEGER NOT NULL DEFAULT 2,
    "nightly_price_minor" INTEGER NOT NULL,
    "total_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "status" "OrderItemStatus" NOT NULL DEFAULT 'RESERVED',
    "checked_in_at" TIMESTAMPTZ(6),
    "checked_in_by_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_room_nights" (
    "id" UUID NOT NULL,
    "hotel_booking_id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "stay_date" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hotel_room_nights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hotels_slug_key" ON "hotels"("slug");

-- CreateIndex
CREATE INDEX "hotels_zone_is_active_idx" ON "hotels"("zone", "is_active");

-- CreateIndex
CREATE INDEX "hotels_is_featured_idx" ON "hotels"("is_featured");

-- CreateIndex
CREATE INDEX "room_types_hotel_id_is_active_idx" ON "room_types"("hotel_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "room_types_hotel_id_code_key" ON "room_types"("hotel_id", "code");

-- CreateIndex
CREATE INDEX "hotel_rooms_room_type_id_status_idx" ON "hotel_rooms"("room_type_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_rooms_hotel_id_room_number_key" ON "hotel_rooms"("hotel_id", "room_number");

-- CreateIndex
CREATE INDEX "hotel_bookings_order_id_idx" ON "hotel_bookings"("order_id");

-- CreateIndex
CREATE INDEX "hotel_bookings_room_id_check_in_date_idx" ON "hotel_bookings"("room_id", "check_in_date");

-- CreateIndex
CREATE INDEX "hotel_bookings_hotel_id_status_idx" ON "hotel_bookings"("hotel_id", "status");

-- CreateIndex
CREATE INDEX "hotel_room_nights_room_id_stay_date_idx" ON "hotel_room_nights"("room_id", "stay_date");

-- CreateIndex
CREATE UNIQUE INDEX "hotel_room_nights_hotel_booking_id_stay_date_key" ON "hotel_room_nights"("hotel_booking_id", "stay_date");

-- Concurrency guarantee: no two active reservations can hold the same room on the same date
CREATE UNIQUE INDEX "hotel_room_nights_active_room_date_key" ON "hotel_room_nights" ("room_id", "stay_date") WHERE "is_active";

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_rooms" ADD CONSTRAINT "hotel_rooms_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_rooms" ADD CONSTRAINT "hotel_rooms_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "hotel_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_checked_in_by_id_fkey" FOREIGN KEY ("checked_in_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_room_nights" ADD CONSTRAINT "hotel_room_nights_hotel_booking_id_fkey" FOREIGN KEY ("hotel_booking_id") REFERENCES "hotel_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_room_nights" ADD CONSTRAINT "hotel_room_nights_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "hotel_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
