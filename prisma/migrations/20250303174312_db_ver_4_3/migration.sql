/*
  Warnings:

  - You are about to drop the column `Otp` on the `OTP` table. All the data in the column will be lost.
  - You are about to drop the column `create` on the `OTP` table. All the data in the column will be lost.
  - You are about to drop the column `expires` on the `OTP` table. All the data in the column will be lost.
  - Added the required column `OTP` to the `OTP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `create_at` to the `OTP` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `OTP` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OTP" DROP COLUMN "Otp",
DROP COLUMN "create",
DROP COLUMN "expires",
ADD COLUMN     "OTP" VARCHAR(6) NOT NULL,
ADD COLUMN     "create_at" TIMESTAMP(6) NOT NULL,
ADD COLUMN     "expires_at" TIMESTAMP(6) NOT NULL;
