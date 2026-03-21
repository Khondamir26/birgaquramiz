-- DropIndex
DROP INDEX IF EXISTS "Order_createdAt_idx";

-- DropIndex
DROP INDEX IF EXISTS "Product_status_createdAt_idx";

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "Product_status_createdAt_idx" ON "Product"("status", "createdAt");
