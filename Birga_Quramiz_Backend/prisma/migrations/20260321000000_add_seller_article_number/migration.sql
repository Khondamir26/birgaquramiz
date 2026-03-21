-- AlterTable: add articleNumber as auto-increment to Seller
CREATE SEQUENCE IF NOT EXISTS "Seller_articleNumber_seq";

ALTER TABLE "Seller" ADD COLUMN "articleNumber" INTEGER NOT NULL DEFAULT nextval('"Seller_articleNumber_seq"');

ALTER SEQUENCE "Seller_articleNumber_seq" OWNED BY "Seller"."articleNumber";

-- Set the sequence to start after the current max (safe for existing rows)
SELECT setval('"Seller_articleNumber_seq"', COALESCE((SELECT MAX("articleNumber") FROM "Seller"), 0) + 1, false);

-- CreateIndex
CREATE UNIQUE INDEX "Seller_articleNumber_key" ON "Seller"("articleNumber");
