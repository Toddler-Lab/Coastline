-- WP-09: one hero photo per beach point for Explore.
--
-- All three columns are nullable: a point without a verified, licensed photo
-- keeps NULLs and the interface falls back to a plain surface. image_credit
-- holds the attribution text when the photo's licence requires it.
--
-- Rollback / mitigation: ALTER TABLE "beach_points" DROP COLUMN "image_url",
-- DROP COLUMN "image_alt", DROP COLUMN "image_credit";

-- AlterTable
ALTER TABLE "beach_points" ADD COLUMN "image_url" TEXT,
ADD COLUMN "image_alt" TEXT,
ADD COLUMN "image_credit" TEXT;

-- Only https URLs may be stored.
ALTER TABLE "beach_points" ADD CONSTRAINT "beach_points_image_url_https_check"
  CHECK ("image_url" IS NULL OR "image_url" LIKE 'https://%');
