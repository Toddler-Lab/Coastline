-- Snapshot the hotel's check-in time on the booking so the cancellation cutoff
-- (and any later policy change at the hotel) is evaluated against what the guest
-- was shown. Existing rows get the platform default.
ALTER TABLE "hotel_bookings" ADD COLUMN "check_in_time" TEXT NOT NULL DEFAULT '14:00';
