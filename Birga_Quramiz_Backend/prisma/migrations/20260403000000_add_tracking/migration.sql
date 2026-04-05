-- Add DISPATCHER and DRIVER to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DISPATCHER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DRIVER';

-- Create AssignmentStatus enum
DO $$ BEGIN
  CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'PICKED_UP', 'DELIVERED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create DriverStatus enum
DO $$ BEGIN
  CREATE TYPE "DriverStatus" AS ENUM ('OFFLINE', 'ONLINE', 'ON_DELIVERY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Add driverId column to Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "driverId" TEXT;

-- Add foreign key for driverId → User
DO $$ BEGIN
  ALTER TABLE "Order" ADD CONSTRAINT "Order_driverId_fkey"
    FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Index on driverId
CREATE INDEX IF NOT EXISTS "Order_driverId_idx" ON "Order"("driverId");

-- DriverProfile table
CREATE TABLE IF NOT EXISTS "DriverProfile" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "status"      "DriverStatus" NOT NULL DEFAULT 'OFFLINE',
  "lastLat"     DOUBLE PRECISION,
  "lastLng"     DOUBLE PRECISION,
  "lastSeenAt"  TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DriverProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DriverProfile_userId_key" ON "DriverProfile"("userId");

DO $$ BEGIN
  ALTER TABLE "DriverProfile" ADD CONSTRAINT "DriverProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DeliveryAssignment table
CREATE TABLE IF NOT EXISTS "DeliveryAssignment" (
  "id"           TEXT NOT NULL,
  "orderId"      TEXT NOT NULL,
  "driverId"     TEXT NOT NULL,
  "dispatcherId" TEXT NOT NULL,
  "status"       "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
  "note"         TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DeliveryAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryAssignment_orderId_key" ON "DeliveryAssignment"("orderId");
CREATE INDEX IF NOT EXISTS "DeliveryAssignment_driverId_idx" ON "DeliveryAssignment"("driverId");
CREATE INDEX IF NOT EXISTS "DeliveryAssignment_dispatcherId_idx" ON "DeliveryAssignment"("dispatcherId");
CREATE INDEX IF NOT EXISTS "DeliveryAssignment_status_idx" ON "DeliveryAssignment"("status");
CREATE INDEX IF NOT EXISTS "DeliveryAssignment_createdAt_idx" ON "DeliveryAssignment"("createdAt");

DO $$ BEGIN
  ALTER TABLE "DeliveryAssignment" ADD CONSTRAINT "DeliveryAssignment_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DeliveryAssignment" ADD CONSTRAINT "DeliveryAssignment_driverId_fkey"
    FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "DeliveryAssignment" ADD CONSTRAINT "DeliveryAssignment_dispatcherId_fkey"
    FOREIGN KEY ("dispatcherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
