-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "AssignmentEvent" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_quota" (
    "key" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ai_quota_pkey" PRIMARY KEY ("key","day")
);

-- CreateTable
CREATE TABLE "DeliveryRating" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssignmentEvent_assignmentId_createdAt_idx" ON "AssignmentEvent"("assignmentId", "createdAt");

-- CreateIndex
CREATE INDEX "idx_ai_quota_key_day" ON "ai_quota"("key", "day");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRating_orderId_key" ON "DeliveryRating"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryRating_assignmentId_key" ON "DeliveryRating"("assignmentId");

-- CreateIndex
CREATE INDEX "DeliveryRating_driverId_idx" ON "DeliveryRating"("driverId");

-- CreateIndex
CREATE INDEX "DeliveryRating_driverId_createdAt_idx" ON "DeliveryRating"("driverId", "createdAt");

-- CreateIndex
CREATE INDEX "DriverProfile_status_idx" ON "DriverProfile"("status");

-- CreateIndex
CREATE INDEX "DriverProfile_status_lastSeenAt_idx" ON "DriverProfile"("status", "lastSeenAt");

-- CreateIndex
CREATE INDEX "LocationHistory_createdAt_idx" ON "LocationHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "AssignmentEvent" ADD CONSTRAINT "AssignmentEvent_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DeliveryAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRating" ADD CONSTRAINT "DeliveryRating_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRating" ADD CONSTRAINT "DeliveryRating_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DeliveryAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRating" ADD CONSTRAINT "DeliveryRating_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
