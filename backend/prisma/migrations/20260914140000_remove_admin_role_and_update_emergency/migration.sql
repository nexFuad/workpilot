-- Remove accounts that do not belong to the supported HR/employee role system.
DELETE FROM "User" WHERE "role" NOT IN ('hr', 'employee');

-- Keep account availability aligned with employment status.
UPDATE "User"
SET "employmentStatus" = CASE WHEN "isActive" THEN 'active' ELSE 'inactive' END;

-- Replace emergency-contact relationship with an address.
ALTER TABLE "User" DROP COLUMN "emergencyContactRelation",
ADD COLUMN "emergencyContactAddress" TEXT;

-- Prevent unsupported roles from being stored in the future.
ALTER TABLE "User" ADD CONSTRAINT "User_role_check" CHECK ("role" IN ('hr', 'employee'));
