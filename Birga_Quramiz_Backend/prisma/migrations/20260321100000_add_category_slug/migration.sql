-- AlterTable: add nullable slug to Category
ALTER TABLE "Category" ADD COLUMN "slug" TEXT;

-- CreateIndex (unique, partial — only enforces uniqueness on non-null values)
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
