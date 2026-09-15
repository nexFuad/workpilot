-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gender" TEXT,
ADD COLUMN     "employmentStatus" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "salaryBonus" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "salaryType" TEXT NOT NULL DEFAULT 'monthly',
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "emergencyContactRelation" TEXT;
