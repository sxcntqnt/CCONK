/*
  Warnings:

  - You are about to drop the column `category` on the `Seat` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Seat_category_idx";

-- AlterTable
ALTER TABLE "Seat" DROP COLUMN "category";
