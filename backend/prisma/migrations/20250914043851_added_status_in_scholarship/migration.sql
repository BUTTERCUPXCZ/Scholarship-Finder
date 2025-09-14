-- CreateEnum
CREATE TYPE "public"."ScholarshipStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- AlterTable
ALTER TABLE "public"."Scholarship" ADD COLUMN     "status" "public"."ScholarshipStatus" NOT NULL DEFAULT 'ACTIVE';
