-- AlterTable
ALTER TABLE "Citizen" ADD COLUMN     "address" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Detective" ADD COLUMN     "badgeNumber" TEXT,
ADD COLUMN     "unit" TEXT;

-- AlterTable
ALTER TABLE "ForensicOfficer" ADD COLUMN     "lab" TEXT,
ADD COLUMN     "specialization" TEXT;

-- AlterTable
ALTER TABLE "JudicialAdmin" ADD COLUMN     "court" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "PatrolOfficer" ADD COLUMN     "badgeNumber" TEXT,
ADD COLUMN     "rank" TEXT,
ADD COLUMN     "station" TEXT;

-- AlterTable
ALTER TABLE "Prosecutor" ADD COLUMN     "jurisdiction" TEXT,
ADD COLUMN     "office" TEXT;

-- AlterTable
ALTER TABLE "Supervisor" ADD COLUMN     "department" TEXT,
ADD COLUMN     "region" TEXT;
