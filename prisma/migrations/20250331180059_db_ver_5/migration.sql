/*
  Warnings:

  - You are about to drop the column `datetime` on the `Scan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Scan" DROP COLUMN "datetime",
ADD COLUMN     "date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
