-- AddColumn pushToken to DriverProfile
ALTER TABLE "DriverProfile" ADD COLUMN IF NOT EXISTS "pushToken" TEXT;
