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
CREATE UNIQUE INDEX "Archive_scholarshipId_key" ON "public"."Archive"("scholarshipId");

-- CreateIndex
CREATE INDEX "Archive_providerId_idx" ON "public"."Archive"("providerId");

-- CreateIndex
CREATE INDEX "Archive_archivedAt_idx" ON "public"."Archive"("archivedAt");

-- AddForeignKey
ALTER TABLE "public"."Archive" ADD CONSTRAINT "Archive_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
