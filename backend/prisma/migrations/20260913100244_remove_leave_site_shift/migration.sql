/*
  Warnings:

  - You are about to drop the column `shiftId` on the `LeaveRequest` table. All the data in the column will be lost.
  - You are about to drop the column `siteId` on the `LeaveRequest` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "LeaveRequest" DROP CONSTRAINT "LeaveRequest_shiftId_fkey";

-- DropForeignKey
ALTER TABLE "LeaveRequest" DROP CONSTRAINT "LeaveRequest_siteId_fkey";

-- AlterTable
ALTER TABLE "LeaveRequest" DROP COLUMN "shiftId",
DROP COLUMN "siteId";
