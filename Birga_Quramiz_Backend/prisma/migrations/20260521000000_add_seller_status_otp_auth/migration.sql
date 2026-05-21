-- CreateEnum
CREATE TYPE "SellerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- Add status column with temporary nullable to allow data migration
ALTER TABLE "Seller" ADD COLUMN "status" "SellerStatus";

-- Migrate existing data: verified=true → APPROVED, verified=false → PENDING
UPDATE "Seller" SET "status" = 'APPROVED' WHERE "verified" = true;
UPDATE "Seller" SET "status" = 'PENDING'  WHERE "verified" = false OR "verified" IS NULL;

-- Now set NOT NULL and default
ALTER TABLE "Seller" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Seller" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- Drop the old verified column
ALTER TABLE "Seller" DROP COLUMN "verified";

-- Add timestamps
ALTER TABLE "Seller" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Seller" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
