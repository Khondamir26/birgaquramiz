/*
  Warnings:

  - Added the required column `customerName` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerPhone` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeliveryType" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "comment" TEXT,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "customerPhone" TEXT NOT NULL,
ADD COLUMN     "deliveryAddress" TEXT,
ADD COLUMN     "deliveryType" "DeliveryType" NOT NULL DEFAULT 'DELIVERY',
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "imageUrl" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
