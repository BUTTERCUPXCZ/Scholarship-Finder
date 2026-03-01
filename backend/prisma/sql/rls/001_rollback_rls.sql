-- ============================================================
-- ScholarSphere — PostgreSQL RLS Rollback
-- Removes all RLS policies and disables row-level security.
-- Run via Supabase SQL Editor or:
--   npx prisma db execute \
--     --file ./prisma/migrations/manual_rls/001_rollback_rls.sql \
--     --schema ./prisma/schema.prisma \
--     --url "$DIRECT_URL"
-- ============================================================

-- Drop policies — User
DROP POLICY IF EXISTS user_select_own  ON "User";
DROP POLICY IF EXISTS user_update_own  ON "User";
DROP POLICY IF EXISTS user_insert_own  ON "User";

-- Drop policies — Scholarship
DROP POLICY IF EXISTS scholarship_select_any  ON "Scholarship";
DROP POLICY IF EXISTS scholarship_insert_org  ON "Scholarship";
DROP POLICY IF EXISTS scholarship_update_own  ON "Scholarship";
DROP POLICY IF EXISTS scholarship_delete_own  ON "Scholarship";

-- Drop policies — Application
DROP POLICY IF EXISTS application_select_student  ON "Application";
DROP POLICY IF EXISTS application_select_org      ON "Application";
DROP POLICY IF EXISTS application_insert_student  ON "Application";
DROP POLICY IF EXISTS application_delete_student  ON "Application";
DROP POLICY IF EXISTS application_update_org      ON "Application";

-- Drop policies — ApplicationDocument
DROP POLICY IF EXISTS appdoc_select_student  ON "ApplicationDocument";
DROP POLICY IF EXISTS appdoc_select_org      ON "ApplicationDocument";
DROP POLICY IF EXISTS appdoc_insert_student  ON "ApplicationDocument";

-- Drop policies — Archive
DROP POLICY IF EXISTS archive_select_own  ON "Archive";
DROP POLICY IF EXISTS archive_insert_own  ON "Archive";
DROP POLICY IF EXISTS archive_delete_own  ON "Archive";

-- Drop policies — Notification
DROP POLICY IF EXISTS notification_select_own  ON "Notification";
DROP POLICY IF EXISTS notification_insert_any  ON "Notification";
DROP POLICY IF EXISTS notification_update_own  ON "Notification";
DROP POLICY IF EXISTS notification_delete_own  ON "Notification";

-- Drop policies — RecoveryCode
DROP POLICY IF EXISTS recoverycode_select_own  ON "RecoveryCode";
DROP POLICY IF EXISTS recoverycode_insert_own  ON "RecoveryCode";
DROP POLICY IF EXISTS recoverycode_update_own  ON "RecoveryCode";
DROP POLICY IF EXISTS recoverycode_delete_own  ON "RecoveryCode";

-- Disable RLS on all tables
ALTER TABLE "User"                DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Scholarship"         DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Application"         DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ApplicationDocument" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Archive"             DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification"        DISABLE ROW LEVEL SECURITY;
ALTER TABLE "RecoveryCode"        DISABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"            DISABLE ROW LEVEL SECURITY;

-- Drop helper function
DROP FUNCTION IF EXISTS app_role();
