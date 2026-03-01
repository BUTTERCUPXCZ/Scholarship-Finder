-- ============================================================
-- ScholarSphere — PostgreSQL Row Level Security
-- Apply via Supabase SQL Editor or:
--   npx prisma db execute \
--     --file ./prisma/migrations/manual_rls/001_enable_rls.sql \
--     --schema ./prisma/schema.prisma \
--     --url "$DIRECT_URL"
-- ============================================================

-- Helper function: reads the user role stored in Supabase user_metadata.
-- Policies call app_role() = 'ORGANIZATION' instead of repeating the JSON path.
CREATE OR REPLACE FUNCTION app_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT auth.jwt() -> 'user_metadata' ->> 'role'
$$;

-- ── Enable RLS on all user-facing tables ─────────────────────────────────────
-- The postgres role has BYPASSRLS, so policies are not enforced until the
-- application explicitly issues SET LOCAL row_security = force inside a
-- transaction (which withRLS() does before every user-facing query).
ALTER TABLE "User"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Scholarship"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Application"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApplicationDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Archive"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecoveryCode"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"            ENABLE ROW LEVEL SECURITY;

-- ── User ─────────────────────────────────────────────────────────────────────
CREATE POLICY user_select_own ON "User"
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY user_update_own ON "User"
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INSERT policy needed for getCurrentUser's first-login sync path,
-- which runs inside withRLS and creates the row if missing.
CREATE POLICY user_insert_own ON "User"
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- ── Scholarship ───────────────────────────────────────────────────────────────
-- Any authenticated session may read scholarships (students browse; orgs see
-- their own via explicit WHERE filters that sit on top of this policy).
CREATE POLICY scholarship_select_any ON "Scholarship"
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY scholarship_insert_org ON "Scholarship"
  FOR INSERT
  WITH CHECK (
    "providerId" = auth.uid()
    AND app_role() = 'ORGANIZATION'
  );

CREATE POLICY scholarship_update_own ON "Scholarship"
  FOR UPDATE
  USING (
    "providerId" = auth.uid()
    AND app_role() = 'ORGANIZATION'
  )
  WITH CHECK (
    "providerId" = auth.uid()
    AND app_role() = 'ORGANIZATION'
  );

CREATE POLICY scholarship_delete_own ON "Scholarship"
  FOR DELETE
  USING (
    "providerId" = auth.uid()
    AND app_role() = 'ORGANIZATION'
  );

-- ── Application ───────────────────────────────────────────────────────────────
-- Students see only their own applications.
CREATE POLICY application_select_student ON "Application"
  FOR SELECT
  USING (
    "userId" = auth.uid()
    AND app_role() = 'STUDENT'
  );

-- Organizations see applications submitted to their scholarships.
-- Subquery used because JOINs are not supported directly in USING clauses.
CREATE POLICY application_select_org ON "Application"
  FOR SELECT
  USING (
    app_role() = 'ORGANIZATION'
    AND "scholarshipId" IN (
      SELECT id FROM "Scholarship" WHERE "providerId" = auth.uid()
    )
  );

CREATE POLICY application_insert_student ON "Application"
  FOR INSERT
  WITH CHECK (
    "userId" = auth.uid()
    AND app_role() = 'STUDENT'
  );

-- Students can withdraw (delete) their own applications.
CREATE POLICY application_delete_student ON "Application"
  FOR DELETE
  USING (
    "userId" = auth.uid()
    AND app_role() = 'STUDENT'
  );

-- Organizations can update the status of applications to their scholarships.
CREATE POLICY application_update_org ON "Application"
  FOR UPDATE
  USING (
    app_role() = 'ORGANIZATION'
    AND "scholarshipId" IN (
      SELECT id FROM "Scholarship" WHERE "providerId" = auth.uid()
    )
  )
  WITH CHECK (
    app_role() = 'ORGANIZATION'
    AND "scholarshipId" IN (
      SELECT id FROM "Scholarship" WHERE "providerId" = auth.uid()
    )
  );

-- ── ApplicationDocument ───────────────────────────────────────────────────────
-- Students can read documents attached to their own applications.
CREATE POLICY appdoc_select_student ON "ApplicationDocument"
  FOR SELECT
  USING (
    "applicationId" IN (
      SELECT id FROM "Application" WHERE "userId" = auth.uid()
    )
  );

-- Organizations can read documents on applications for their scholarships.
CREATE POLICY appdoc_select_org ON "ApplicationDocument"
  FOR SELECT
  USING (
    app_role() = 'ORGANIZATION'
    AND "applicationId" IN (
      SELECT a.id FROM "Application" a
      JOIN "Scholarship" s ON s.id = a."scholarshipId"
      WHERE s."providerId" = auth.uid()
    )
  );

-- Students can attach documents to their own applications.
CREATE POLICY appdoc_insert_student ON "ApplicationDocument"
  FOR INSERT
  WITH CHECK (
    "applicationId" IN (
      SELECT id FROM "Application" WHERE "userId" = auth.uid()
    )
  );

-- ── Archive ───────────────────────────────────────────────────────────────────
CREATE POLICY archive_select_own ON "Archive"
  FOR SELECT
  USING (
    "providerId" = auth.uid()
    AND app_role() = 'ORGANIZATION'
  );

CREATE POLICY archive_insert_own ON "Archive"
  FOR INSERT
  WITH CHECK (
    "providerId" = auth.uid()
    AND app_role() = 'ORGANIZATION'
  );

CREATE POLICY archive_delete_own ON "Archive"
  FOR DELETE
  USING (
    "providerId" = auth.uid()
    AND app_role() = 'ORGANIZATION'
  );

-- ── Notification ──────────────────────────────────────────────────────────────
CREATE POLICY notification_select_own ON "Notification"
  FOR SELECT
  USING ("userId" = auth.uid());

-- Any authenticated actor (including an organization updating an application
-- status and notifying the student) may insert notifications.
CREATE POLICY notification_insert_any ON "Notification"
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY notification_update_own ON "Notification"
  FOR UPDATE
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY notification_delete_own ON "Notification"
  FOR DELETE
  USING ("userId" = auth.uid());

-- ── RecoveryCode ──────────────────────────────────────────────────────────────
CREATE POLICY recoverycode_select_own ON "RecoveryCode"
  FOR SELECT
  USING ("userId" = auth.uid());

CREATE POLICY recoverycode_insert_own ON "RecoveryCode"
  FOR INSERT
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY recoverycode_update_own ON "RecoveryCode"
  FOR UPDATE
  USING ("userId" = auth.uid())
  WITH CHECK ("userId" = auth.uid());

CREATE POLICY recoverycode_delete_own ON "RecoveryCode"
  FOR DELETE
  USING ("userId" = auth.uid());

-- ── AuditLog ──────────────────────────────────────────────────────────────────
-- No user-facing policies. AuditLog is written via the raw prisma singleton
-- (fire-and-forget, outside withRLS) and read only by admin routes that
-- use the raw prisma singleton (intentional BYPASSRLS).
-- Any withRLS-wrapped query against AuditLog returns 0 rows (deny by default).
