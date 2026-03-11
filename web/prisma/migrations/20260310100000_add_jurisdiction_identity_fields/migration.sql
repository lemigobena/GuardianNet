-- AlterTable
ALTER TABLE "Citizen"
ADD COLUMN     "identityVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jurisdiction" TEXT,
ADD COLUMN     "nationalIdNumber" TEXT;

-- AlterTable
ALTER TABLE "PatrolOfficer"
ADD COLUMN     "department" TEXT,
ADD COLUMN     "employmentVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jurisdiction" TEXT;

-- AlterTable
ALTER TABLE "Detective"
ADD COLUMN     "department" TEXT,
ADD COLUMN     "employmentVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jurisdiction" TEXT;

-- AlterTable
ALTER TABLE "Supervisor"
ADD COLUMN     "employmentVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jurisdiction" TEXT;

-- AlterTable
ALTER TABLE "ForensicOfficer"
ADD COLUMN     "department" TEXT,
ADD COLUMN     "employmentVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jurisdiction" TEXT;

-- AlterTable
ALTER TABLE "JudicialAdmin"
ADD COLUMN     "employmentVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jurisdiction" TEXT;

-- AlterTable
ALTER TABLE "Prosecutor"
ADD COLUMN     "employmentVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Registrar"
ADD COLUMN     "employmentVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jurisdiction" TEXT,
ADD COLUMN     "nationalIdNumber" TEXT;

