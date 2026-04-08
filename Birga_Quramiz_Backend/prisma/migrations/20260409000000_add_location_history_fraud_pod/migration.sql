-- ─── DeliveryAssignment: new columns ─────────────────────────────────────────

ALTER TABLE "DeliveryAssignment"
  ADD COLUMN IF NOT EXISTS "otpVerified" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "DeliveryAssignment"
  ADD COLUMN IF NOT EXISTS "podPhotoUrl" TEXT;

ALTER TABLE "DeliveryAssignment"
  ADD COLUMN IF NOT EXISTS "podPhotoLat" DOUBLE PRECISION;

ALTER TABLE "DeliveryAssignment"
  ADD COLUMN IF NOT EXISTS "podPhotoLng" DOUBLE PRECISION;

ALTER TABLE "DeliveryAssignment"
  ADD COLUMN IF NOT EXISTS "podPhotoAt" TIMESTAMP(3);

-- ─── LocationHistory table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "LocationHistory" (
  "id"        TEXT NOT NULL,
  "driverId"  TEXT NOT NULL,
  "lat"       DOUBLE PRECISION NOT NULL,
  "lng"       DOUBLE PRECISION NOT NULL,
  "heading"   DOUBLE PRECISION,
  "speed"     DOUBLE PRECISION,
  "accuracy"  DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LocationHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LocationHistory_driverId_createdAt_idx"
  ON "LocationHistory"("driverId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "LocationHistory"
    ADD CONSTRAINT "LocationHistory_driverId_fkey"
    FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── FraudEvent table ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "FraudEvent" (
  "id"        TEXT NOT NULL,
  "driverId"  TEXT NOT NULL,
  "reason"    TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FraudEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FraudEvent_driverId_idx"
  ON "FraudEvent"("driverId");

DO $$ BEGIN
  ALTER TABLE "FraudEvent"
    ADD CONSTRAINT "FraudEvent_driverId_fkey"
    FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
