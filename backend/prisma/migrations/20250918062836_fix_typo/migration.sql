-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('STUDENT', 'ORGANIZATION', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."ScholarshipStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'STUDENT',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Scholarship" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "benefits" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "status" "public"."ScholarshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Address" TEXT NOT NULL,
    "City" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Firstname" TEXT NOT NULL,
    "Lastname" TEXT NOT NULL,
    "Middlename" TEXT NOT NULL,
    "Phone" TEXT NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApplicationDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Archive" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "benefits" TEXT NOT NULL,
    "requirements" TEXT NOT NULL,
    "originalStatus" "public"."ScholarshipStatus" NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedBy" TEXT NOT NULL,
    "originalCreatedAt" TIMESTAMP(3) NOT NULL,
    "originalUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Archive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Scholarship_providerId_status_idx" ON "public"."Scholarship"("providerId", "status");

-- CreateIndex
CREATE INDEX "Scholarship_deadline_idx" ON "public"."Scholarship"("deadline");

-- CreateIndex
CREATE INDEX "Application_scholarshipId_idx" ON "public"."Application"("scholarshipId");

-- CreateIndex
CREATE INDEX "Application_userId_idx" ON "public"."Application"("userId");

-- CreateIndex
CREATE INDEX "ApplicationDocument_applicationId_idx" ON "public"."ApplicationDocument"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "Archive_scholarshipId_key" ON "public"."Archive"("scholarshipId");

-- CreateIndex
CREATE INDEX "Archive_providerId_idx" ON "public"."Archive"("providerId");

-- CreateIndex
CREATE INDEX "Archive_archivedAt_idx" ON "public"."Archive"("archivedAt");

-- AddForeignKey
ALTER TABLE "public"."Scholarship" ADD CONSTRAINT "Scholarship_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "public"."Scholarship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApplicationDocument" ADD CONSTRAINT "ApplicationDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "public"."Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Archive" ADD CONSTRAINT "Archive_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
