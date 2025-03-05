/*
  Warnings:

  - You are about to drop the column `datetime` on the `Scan` table. All the data in the column will be lost.
  - Added the required column `date` to the `Scan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Scan" DROP COLUMN "datetime",
ADD COLUMN     "date" DATE NOT NULL;
