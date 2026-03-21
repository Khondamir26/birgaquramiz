-- Performance indexes for Product table
-- These cover the most common query patterns: status filter, seller products,
-- category/brand browsing, and sorting by createdAt and price.

CREATE INDEX IF NOT EXISTS "Product_status_idx" ON "Product"("status");
CREATE INDEX IF NOT EXISTS "Product_sellerId_idx" ON "Product"("sellerId");
CREATE INDEX IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX IF NOT EXISTS "Product_brandId_idx" ON "Product"("brandId");
CREATE INDEX IF NOT EXISTS "Product_status_createdAt_idx" ON "Product"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Product_status_price_idx" ON "Product"("status", "price");

-- Performance indexes for Order table
-- Cover status filtering and user order history lookups.

CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order"("userId");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt" DESC);
