-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "joiningDate" TIMESTAMP(3),
ADD COLUMN     "employmentType" TEXT,
ADD COLUMN     "defaultSiteId" TEXT,
ADD COLUMN     "defaultShiftId" TEXT,
ADD COLUMN     "basicSalary" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "salaryAllowances" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "salaryTax" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "salaryProvidentFund" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_companyName_key" ON "User"("email", "companyName");

-- CreateIndex
CREATE INDEX "User_defaultSiteId_idx" ON "User"("defaultSiteId");

-- CreateIndex
CREATE INDEX "User_defaultShiftId_idx" ON "User"("defaultShiftId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_defaultSiteId_fkey" FOREIGN KEY ("defaultSiteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_defaultShiftId_fkey" FOREIGN KEY ("defaultShiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
