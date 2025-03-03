/*
  Warnings:

  - Added the required column `phone_mail` to the `OTP` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OTP" ADD COLUMN     "phone_mail" TEXT NOT NULL;
