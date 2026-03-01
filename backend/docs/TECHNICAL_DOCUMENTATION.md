# ScholarSphere — Technical Documentation

> **Platform:** ScholarSphere Scholarship Management System
> **Stack:** Node.js · Express · TypeScript · Prisma · PostgreSQL (Supabase) · Redis · React 18 · TailwindCSS
> **Document scope:** Security, authorization, and administration features

---

## Table of Contents

1. [MFA Security](#1-mfa-security)
2. [Document-Level Encryption & Secure Access Expiration](#2-document-level-encryption--secure-access-expiration)
3. [Fine-Grained Database-Level Authorization](#3-fine-grained-database-level-authorization)
4. [System Administrator Interface](#4-system-administrator-interface)
5. [Advanced Administrative Reporting and Analytics](#5-advanced-administrative-reporting-and-analytics)

---

## 1. MFA Security

### 1.1 Overview

ScholarSphere implements Time-based One-Time Password (TOTP) Multi-Factor Authentication through Supabase Auth. MFA is opt-in for all user roles and adds a second verification layer on top of password authentication. When enrolled, a user must present a valid TOTP code (or a recovery code) at login in addition to their password. A full audit trail is maintained for every MFA-related event.

### 1.2 Authentication Assurance Levels

Supabase Auth uses the OAuth 2.0 Authenticator Assurance Level (AAL) standard:

| Level | Meaning | When Issued |
|---|---|---|
| `aal1` | Password-only session | After successful email/password login |
| `aal2` | Password + MFA verified | After TOTP or recovery code verification |

The backend exposes two authentication middleware functions:

| Middleware | File | AAL Requirement |
|---|---|---|
| `authenticate` | `src/middleware/auth.ts` | `aal1` (standard) |
| `authenticateWithMfa` | `src/middleware/auth.ts` | `aal2` if TOTP factors are enrolled |

#### `authenticateWithMfa` logic

```
1. Validate JWT token via Supabase Admin API (getUserById)
2. List the user's MFA factors (listFactors)
3. If verified TOTP factors exist:
   a. Decode token payload locally
   b. Reject with 403 MFA_REQUIRED if aal != "aal2"
4. If Supabase API unreachable: fail open (allow access) to avoid outage lock-out
```

Token lookup order — `Authorization: Bearer <token>` header is preferred; HTTP-only cookie (`authToken`) is used as fallback. This ensures post-MFA aal2 tokens from the Supabase JS SDK are always preferred over stale cookie tokens.

### 1.3 TOTP Enrollment Flow

The enrollment UI is a three-step wizard in `MfaEnroll.tsx`:

| Step | Key | What Happens |
|---|---|---|
| 1 | `qr` | Supabase generates a TOTP factor; QR code and manual secret are displayed for the authenticator app |
| 2 | `verify` | User enters a 6-digit TOTP code to confirm the factor; Supabase upgrades the session to `aal2` |
| 3 | `recovery` | Backend generates 10 recovery codes; shown once; user can copy or download them |

After step 2, the frontend calls `POST /mfa/recovery-codes` to generate and store hashed recovery codes.

### 1.4 Recovery Codes

Recovery codes allow a user to bypass TOTP when they lose access to their authenticator app.

#### Generation

```
crypto.randomBytes(4).toString('hex')  →  8-character hex string
```

10 codes are generated per enrollment. Each code is individually hashed with `bcrypt` (10 salt rounds) before storage. Plain-text codes are returned **once** to the user and never stored.

#### Storage — `RecoveryCode` model

```prisma
model RecoveryCode {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  codeHash  String            -- bcrypt hash
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

#### Verification flow

```
POST /mfa/recover
  ├── Fetch all unused codes for the user (withRLS — RLS policy enforces ownership)
  ├── bcrypt.compare(input, codeHash) for each code sequentially
  ├── On match: mark code as used (separate withRLS transaction)
  └── On no match: audit log FAILURE, return 400
```

Codes are consumed one at a time. A warning is shown in the UI when ≤ 2 codes remain.

### 1.5 TOTP Verification — `MfaChallenge` Component

The `MfaChallenge` component handles two modes:

**TOTP mode** (`/mfa-verify` route)
- Fetches the user's verified TOTP factors via Supabase JS SDK
- User enters a 6-digit code
- On 3 consecutive failures: 30-second cooldown before retry
- On success: session upgraded to `aal2`; backend `/users/refresh-session` called to sync HTTP-only cookie

**Recovery mode** (toggled via "Use a recovery code" link)
- Calls `POST /mfa/recover`
- On success: calls `POST /mfa/unenroll` to remove the compromised TOTP factor, then prompts re-enrollment

### 1.6 API Endpoints

All MFA endpoints require `authenticate` middleware (`aal1` sufficient — these manage MFA itself).

| Method | Path | Rate Limit | Handler |
|---|---|---|---|
| `POST` | `/mfa/recovery-codes` | None | `storeRecoveryCodes` |
| `POST` | `/mfa/recover` | 5 req / 15 min / user | `verifyRecoveryCode` |
| `GET` | `/mfa/status` | None | `getMfaStatus` |
| `POST` | `/mfa/unenroll` | 10 req / hour / user | `unenrollMfa` |

### 1.7 `getMfaStatus` Response

```json
{
  "success": true,
  "mfaEnabled": true,
  "factorCount": 1,
  "remainingRecoveryCodes": 8,
  "factors": [
    { "id": "<factor-uuid>", "friendlyName": null, "createdAt": "..." }
  ]
}
```

### 1.8 Audit Events

| Event | Trigger |
|---|---|
| `MFA_RECOVERY_CODES_GENERATED` | Recovery codes generated after enrollment |
| `MFA_RECOVERY_CODE_USED` (SUCCESS) | Valid recovery code consumed |
| `MFA_RECOVERY_CODE_USED` (FAILURE) | Invalid recovery code submitted |
| `MFA_UNENROLLED` (SUCCESS) | TOTP factor removed |
| `MFA_UNENROLLED` (FAILURE) | Supabase unenroll API error |

### 1.9 Frontend Route Guard

`MfaEnforcementRoute` wraps protected routes and redirects to `/mfa-verify` if the user has enrolled MFA but has not yet presented an `aal2` token in the current session.

### 1.10 Files Reference

| File | Role |
|---|---|
| `backend/src/controllers/mfa.controller.ts` | All MFA business logic |
| `backend/src/routes/mfa.routes.ts` | Route definitions and rate limiters |
| `backend/src/middleware/auth.ts` | `authenticate` and `authenticateWithMfa` |
| `frontend/src/pages/MfaSetup.tsx` | Enrollment page wrapper |
| `frontend/src/pages/MfaVerify.tsx` | TOTP challenge page |
| `frontend/src/components/MfaEnroll.tsx` | 3-step enrollment wizard |
| `frontend/src/components/MfaChallenge.tsx` | TOTP + recovery code verification |
| `frontend/src/components/MfaStatusSection.tsx` | Security settings panel |
| `frontend/src/components/MfaEnforcementRoute.tsx` | Route guard |

---

## 2. Document-Level Encryption & Secure Access Expiration

### 2.1 Overview

Application documents (PDFs, images, Word files) submitted by students are stored in Supabase Storage. Access is controlled by a two-layer security model that prevents unauthorized users from accessing any file, even if they know its storage path. All download links are time-limited signed URLs — they expire automatically and cannot be shared indefinitely.

### 2.2 Storage Architecture

```
Bucket: application-documents  (private — no public read)
Path pattern: {userId}/documents/{timestamp}-{randomId}-{originalFilename}

Example:
  a1b2c3d4-uuid/documents/1706745600000-x7k2q9-transcript.pdf
```

The userId prefix is essential to the Layer 1 security check (see §2.4).

### 2.3 File Upload

**Endpoint:** `POST /upload/documents`
**Middleware:** `uploadMiddleware` (multer, `upload.array('documents', 5)`)

| Constraint | Value |
|---|---|
| Maximum files per request | 5 |
| Maximum file size | 10 MB |
| Allowed MIME types | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `image/jpeg`, `image/png`, `image/jpg` |

Upload response includes, for each file:

```json
{
  "filename": "transcript.pdf",
  "contentType": "application/pdf",
  "size": 204800,
  "fileUrl": "https://<project>.supabase.co/storage/v1/object/public/...",
  "storagePath": "a1b2c3.../documents/1706745600000-x7k2q9-transcript.pdf"
}
```

The `storagePath` is stored in `ApplicationDocument.storagePath` and used for ownership verification on download.

### 2.4 Secure File Download — Two-Layer Ownership Verification

**Endpoint:** `POST /upload/download`
**Body:** `{ "storagePath": "<path>" }`

The download handler performs two independent ownership checks before generating a signed URL. Both layers must pass.

```
Request
  │
  ├─ Layer 1 — Path Prefix Guard (students only, no DB query)
  │   If role === 'STUDENT' and storagePath does not start with userId + '/'
  │   → 403 Access denied  (catches cross-user attempts cheaply)
  │
  ├─ Layer 2 — DB Ownership Check via RLS
  │   withRLS(userId, role, tx => tx.applicationDocument.findFirst({ where: { storagePath } }))
  │   RLS policy appdoc_select_student: student sees only docs on their own applications
  │   RLS policy appdoc_select_org:     org sees only docs on applications for their scholarships
  │   If findFirst returns null → 403 Access denied
  │
  └─ supabase.storage.createSignedUrl(storagePath, 3600)
      Returns a signed URL valid for exactly 1 hour
      → { "downloadUrl": "https://..." }
```

#### Why two layers?

| Layer | What it catches | Cost |
|---|---|---|
| Path prefix (L1) | Student trying another student's path | Zero DB queries |
| RLS policy (L2) | Any remaining unauthorized access, org boundary checks | One DB query |

Neither layer alone is sufficient: L1 does not cover organizations; L2 alone is correct but slower without L1 pre-filtering.

### 2.5 Signed URL Expiration

Supabase Storage signed URLs are generated with a TTL of **3600 seconds (1 hour)**. After expiry:
- The URL returns `400 Bad Request` from Supabase Storage
- A new signed URL must be requested via `POST /upload/download`
- The ownership check is re-evaluated on every new request

This means revoked access (e.g., withdrawn application) takes effect at most 1 hour after revocation, with no stale URL remaining usable beyond that window.

### 2.6 Storage-Level Encryption at Rest

Supabase Storage encrypts all objects at rest using **AES-256** via the underlying cloud provider (AWS S3 or equivalent). This is transparent to the application — no application-level encryption keys are managed by ScholarSphere. Data in transit is protected by TLS (HTTPS).

### 2.7 IDOR Vulnerability — Background

Before this feature was implemented, `downloadFile` passed `storagePath` from `req.body` directly to `supabase.storage.createSignedUrl()` with no ownership check. Any authenticated user could download any other user's files by constructing a valid storage path.

```bash
# Pre-fix exploit:
POST /upload/download
Authorization: Bearer <token-for-user-A>
{ "storagePath": "user-b-uuid/documents/private-transcript.pdf" }
# Response: 200 OK with a signed URL for user B's file
```

Both layers described in §2.4 close this vulnerability completely.

### 2.8 Audit Events

| Event | Trigger |
|---|---|
| `FILE_UPLOADED` | Successful upload of one or more files |

### 2.9 Files Reference

| File | Role |
|---|---|
| `backend/src/controllers/upload.controller.ts` | Upload and secure download handlers |
| `backend/src/routes/upload.routes.ts` | Route definitions |
| `backend/prisma/schema.prisma` — `ApplicationDocument` | File metadata storage model |

---

## 3. Fine-Grained Database-Level Authorization

### 3.1 Overview

ScholarSphere's Prisma client connects to Supabase PostgreSQL as the `postgres` role, which carries the `BYPASSRLS` privilege — meaning PostgreSQL Row Level Security policies are skipped by default. Prior to this feature, all access control was enforced only at the Express middleware/controller layer. A single missing `WHERE` clause could expose another user's data.

This feature adds a **second, independent authorization layer at the database level** using Supabase's native RLS infrastructure — the same mechanism Supabase's own PostgREST API uses. Any data that leaks past the application layer is stopped at the database.

### 3.2 Architecture

```
HTTP Request
    │
    ▼
authenticate middleware        Sets req.userId (UUID) and req.user.role
    │
    ▼
Controller function
    │
    ├── withRLS(userId, role, async (tx) => {
    │       │
    │       ▼
    │   prisma.$transaction begins (ReadCommitted isolation)
    │       │
    │       ├── SET LOCAL ROLE authenticated
    │       │     Switches to Supabase's 'authenticated' role for this transaction.
    │       │     That role does NOT have BYPASSRLS — so all RLS policies are
    │       │     evaluated. SET LOCAL reverts at transaction end (PgBouncer-safe).
    │       │
    │       ├── SELECT set_config('request.jwt.claims',
    │       │         '{"sub":"<uuid>","user_metadata":{"role":"STUDENT"}}', true)
    │       │     Publishes user context as a transaction-local GUC variable.
    │       │     Supabase's auth.uid() reads .sub; auth.jwt() returns the full object.
    │       │     Identical to what PostgREST injects on every request.
    │       │
    │       └── Caller's Prisma queries via tx  →  RLS policies evaluated
    │
    ├── Audit log write (raw prisma — intentional BYPASSRLS)
    ├── Redis cache invalidation
    └── Socket.IO emit (after commit — only fires on success)
```

### 3.3 `withRLS()` Wrapper

**File:** `backend/src/lib/rls.ts`

```typescript
export async function withRLS<T>(
  userId: string,
  role: string,
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T>
```

#### Input sanitization

```typescript
// UUID format enforced before any SQL is executed
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Role restricted to known enum values only
const ALLOWED_ROLES = new Set(['STUDENT', 'ORGANIZATION', 'ADMIN']);
```

Both validators throw synchronously before the transaction opens. The JWT claims JSON is passed to PostgreSQL via Prisma's tagged-template `$executeRaw` (parameterized query), never via string concatenation.

#### Transaction settings

| Parameter | Value | Reason |
|---|---|---|
| `isolationLevel` | `ReadCommitted` | PostgreSQL default; correct for OLTP workloads |
| `timeout` | 25 000 ms | Prevents hung transactions |
| `maxWait` | 5 000 ms | Prevents queue buildup during connection pool saturation |

#### PgBouncer compatibility

The project uses PgBouncer in **transaction mode** (`pgbouncer=true` in `DATABASE_URL`). In this mode each transaction may be served by a different backend connection. Both `SET LOCAL ROLE` and `set_config(..., true)` are transaction-scoped — they are automatically discarded when the transaction commits or rolls back. There is no risk of user context leaking between requests.

### 3.4 Database Policies

**Migration file:** `backend/prisma/sql/rls/001_enable_rls.sql`
**Rollback file:** `backend/prisma/sql/rls/001_rollback_rls.sql`

#### Helper function

```sql
CREATE OR REPLACE FUNCTION app_role()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT auth.jwt() -> 'user_metadata' ->> 'role'
$$;
```

Used in policies instead of repeating the JSON path for role extraction.

#### Policy summary by table

**`User`**

| Operation | Policy | Condition |
|---|---|---|
| SELECT | `user_select_own` | `id = auth.uid()` |
| UPDATE | `user_update_own` | `id = auth.uid()` |
| INSERT | `user_insert_own` | `id = auth.uid()` |

**`Scholarship`**

| Operation | Policy | Condition |
|---|---|---|
| SELECT | `scholarship_select_any` | `auth.uid() IS NOT NULL` |
| INSERT | `scholarship_insert_org` | `"providerId" = auth.uid()` AND `app_role() = 'ORGANIZATION'` |
| UPDATE | `scholarship_update_own` | `"providerId" = auth.uid()` AND `app_role() = 'ORGANIZATION'` |
| DELETE | `scholarship_delete_own` | `"providerId" = auth.uid()` AND `app_role() = 'ORGANIZATION'` |

**`Application`**

| Operation | Who | Policy | Condition |
|---|---|---|---|
| SELECT | Student | `application_select_student` | `"userId" = auth.uid()` AND `app_role() = 'STUDENT'` |
| SELECT | Org | `application_select_org` | `app_role() = 'ORGANIZATION'` AND scholarshipId ∈ org's scholarships |
| INSERT | Student | `application_insert_student` | `"userId" = auth.uid()` AND `app_role() = 'STUDENT'` |
| UPDATE | Org | `application_update_org` | Same as org SELECT |
| DELETE | Student | `application_delete_student` | `"userId" = auth.uid()` AND `app_role() = 'STUDENT'` |

**`ApplicationDocument`**

| Operation | Who | Policy | Condition |
|---|---|---|---|
| SELECT | Student | `appdoc_select_student` | `applicationId` IN student's own applications |
| SELECT | Org | `appdoc_select_org` | `applicationId` IN applications on org's scholarships |
| INSERT | Student | `appdoc_insert_student` | `applicationId` IN student's own applications |

**`Archive`**

| Operation | Policy | Condition |
|---|---|---|
| SELECT | `archive_select_own` | `"providerId" = auth.uid()` AND `app_role() = 'ORGANIZATION'` |
| INSERT | `archive_insert_own` | Same |
| DELETE | `archive_delete_own` | Same |

**`Notification`**

| Operation | Policy | Condition |
|---|---|---|
| SELECT | `notification_select_own` | `"userId" = auth.uid()` |
| INSERT | `notification_insert_any` | `auth.uid() IS NOT NULL` (orgs notify students on status changes) |
| UPDATE | `notification_update_own` | `"userId" = auth.uid()` |
| DELETE | `notification_delete_own` | `"userId" = auth.uid()` |

**`RecoveryCode`**

| Operation | Policy | Condition |
|---|---|---|
| SELECT | `recoverycode_select_own` | `"userId" = auth.uid()` |
| INSERT | `recoverycode_insert_own` | `"userId" = auth.uid()` |
| UPDATE | `recoverycode_update_own` | `"userId" = auth.uid()` |
| DELETE | `recoverycode_delete_own` | `"userId" = auth.uid()` |

**`AuditLog`** — RLS is enabled (deny by default), but **no user-facing policies are defined**. All audit log access is through admin routes which use the raw `prisma` singleton (BYPASSRLS). Any `withRLS`-wrapped query against `AuditLog` returns 0 rows.

### 3.5 Controllers Using `withRLS()`

| Controller | Functions |
|---|---|
| `scholar.controller.ts` | `createScholar`, `updateScholar`, `deleteScholarship`, `ArchiveScholarship`, `getOrganizationScholarships`, `getArchivedScholarships`, `DeleteArchivedScholarship`, `RestoreArchivedScholarship` |
| `application.controller.ts` | `submitApplication`, `getUserApplications`, `getApplicationById`, `withdrawApplication`, `getScholarshipApplications`, `updateApplicationStatus`, `getApplicants` |
| `user.controller.ts` | `getCurrentUser`, `updateUserProfile`, `getOrganizationStats` |
| `mfa.controller.ts` | `storeRecoveryCodes`, `verifyRecoveryCode`, `getMfaStatus`, `unenrollMfa` |
| `notification.controller.ts` | `fetchNotifications`, `readNotification`, `readAllNotifications`, `removeNotification` |
| `upload.controller.ts` | `downloadFile` |

### 3.6 Intentional BYPASSRLS Code Paths

| Code path | Reason |
|---|---|
| `admin.controller.ts` | Admin queries span all users by design |
| `auditLog.controller.ts` | Admin read — BYPASSRLS intentional |
| `auditLog.service.ts` (writes) | Fire-and-forget; must never fail from missing context |
| `userRegister`, `userLogin`, `requestPasswordReset` | Pre-authentication; no user context available |
| `getAllScholars`, `getPublicScholars`, `getScholarshipById` | Public endpoints; no auth required |
| `updateExpiredScholarships` | System cron job; no user session |

### 3.7 Belt-and-Suspenders Principle

Controller-level `WHERE` clauses (e.g., `where: { userId }`) are kept even where RLS alone would be sufficient:

- If RLS is disabled or misconfigured, explicit filters still protect data.
- If a developer forgets an explicit filter, RLS catches it at the database.
- Two independent layers must both fail for data to leak.

### 3.8 Socket.IO and Transaction Ordering

`updateApplicationStatus` previously emitted Socket.IO events inside `createNotification()`, which was called inside the transaction. This meant a socket event could fire for a DB write that subsequently rolled back.

The corrected pattern:

```typescript
// Inside withRLS — DB write only
await tx.notification.create({ data: { ... } });

// Outside withRLS — emitted only after successful commit
emitNotificationToUser(targetUserId, { message, type });
```

### 3.9 Applying the Migration

```bash
# Option A: Supabase SQL Editor (recommended for first run)
# Paste backend/prisma/sql/rls/001_enable_rls.sql and execute.

# Option B: Prisma CLI (requires DIRECT_URL — PgBouncer doesn't support DDL)
npx prisma db execute \
  --file ./prisma/sql/rls/001_enable_rls.sql \
  --schema ./prisma/schema.prisma \
  --url "$DIRECT_URL"
```

### 3.10 Files Reference

| File | Role |
|---|---|
| `backend/src/lib/rls.ts` | `withRLS()` wrapper, `TransactionClient` type, sanitizers |
| `backend/prisma/sql/rls/001_enable_rls.sql` | SQL: enable RLS, create policies |
| `backend/prisma/sql/rls/001_rollback_rls.sql` | SQL: disable RLS, drop policies |
| `backend/src/services/notification.ts` | Optional `tx` parameter for RLS-safe notification writes |
| `backend/docs/RLS_AUTHORIZATION.md` | Extended reference documentation |

---

## 4. System Administrator Interface

### 4.1 Overview

ScholarSphere includes a dedicated administration interface accessible only to users with the `ADMIN` role. It provides a real-time system overview, user management, and a comprehensive security audit log — all within an isolated admin layout separate from the student and organization UIs.

### 4.2 Access Control

#### Backend middleware chain

```
Route → authenticate → requireAdmin → handler
```

`requireAdmin` (`backend/src/middleware/requireAdmin.ts`) checks `req.user.role === "ADMIN"` and returns `403 Forbidden` if the condition is not met. Admin controllers use the raw `prisma` singleton (intentional BYPASSRLS) so queries span all users.

#### Frontend route protection

All admin pages are wrapped in `ProtectedRoute` with `allowedRoles={["ADMIN"]}`. Non-admin users attempting to navigate to `/admin/*` are redirected to their appropriate dashboard.

### 4.3 Admin Dashboard

**Route:** `/admin/dashboard`
**File:** `frontend/src/admin/AdminDashboard.tsx`
**API:** `GET /admin/stats`

The dashboard displays four stat cards pulled from a single aggregated endpoint:

| Card | Data |
|---|---|
| Total Users | Total count, with student and organization breakdown |
| Total Scholarships | Total count, with active count highlighted |
| Total Applications | Total count, with pending count highlighted |
| Security Events (24h) | Audit log entries in the last 24 hours |

Below the stat cards:

- **Recent Security Events** (2/3 width) — last 10 audit log entries with action type, IP address, status badge, and time-ago display. Links to the full audit logs page.
- **User Breakdown** (1/3 width) — progress bars showing student vs organization distribution; accepted and rejected application counts.

#### `GET /admin/stats` response structure

```json
{
  "success": true,
  "data": {
    "users": { "total": 142, "students": 128, "organizations": 14 },
    "scholarships": { "total": 37, "active": 22 },
    "applications": { "total": 315, "pending": 48, "accepted": 201, "rejected": 66 },
    "auditEvents24h": 89
  }
}
```

All 10 aggregate counts are executed in parallel via `Promise.all` to minimize response latency.

### 4.4 User Management

**Route:** `/admin/users`
**File:** `frontend/src/admin/AdminUsers.tsx`
**API:** `GET /admin/users`

A paginated table of all registered users with:

- **Search** — debounced text search across `fullname` and `email` (case-insensitive, PostgreSQL `ILIKE`)
- **Role filter** — dropdown to filter by `STUDENT`, `ORGANIZATION`, or `ADMIN`
- **Pagination** — 20 users per page, max 100 per request

#### Query parameters

| Parameter | Type | Default | Max |
|---|---|---|---|
| `page` | integer | 1 | — |
| `limit` | integer | 20 | 100 |
| `role` | `STUDENT` \| `ORGANIZATION` \| `ADMIN` | — | — |
| `search` | string | — | — |

#### Response structure

```json
{
  "success": true,
  "data": [
    { "id": "...", "fullname": "Jane Doe", "email": "jane@example.com", "role": "STUDENT" }
  ],
  "pagination": {
    "currentPage": 1, "totalPages": 8, "totalCount": 142,
    "hasNext": true, "hasPrev": false
  }
}
```

### 4.5 Security Audit Log

**Route:** `/admin/audit-logs`
**File:** `frontend/src/admin/AdminAuditLogs.tsx`
**API:** `GET /audit-logs`

A filterable, paginated view of the `AuditLog` table.

#### `AuditLog` model

```prisma
model AuditLog {
  id         String      @id @default(uuid()) @db.Uuid
  userId     String?     @db.Uuid       -- nullable: pre-auth events have no user
  action     AuditAction                -- enum: 20+ action types
  resource   String?                    -- entity type (SCHOLARSHIP, APPLICATION, etc.)
  resourceId String?     @db.Uuid
  ipAddress  String                     -- client IP (x-forwarded-for aware)
  userAgent  String
  status     AuditStatus                -- SUCCESS | FAILURE
  metadata   Json?                      -- action-specific extra data
  createdAt  DateTime    @default(now())

  @@index([userId])
  @@index([action])
  @@index([status])
  @@index([createdAt])
  @@index([userId, action])
  @@index([action, status])
  @@index([createdAt, action])
}
```

#### Available audit actions

| Category | Actions |
|---|---|
| Authentication | `USER_REGISTER`, `USER_LOGIN`, `USER_LOGOUT`, `SESSION_REFRESH` |
| Password | `PASSWORD_RESET_REQUEST`, `PASSWORD_RESET_COMPLETE` |
| Email | `EMAIL_VERIFICATION_RESEND` |
| MFA | `MFA_RECOVERY_CODES_GENERATED`, `MFA_RECOVERY_CODE_USED`, `MFA_UNENROLLED`, `MFA_STATUS_CHECKED` |
| Profile | `PROFILE_UPDATED` |
| Scholarship | `SCHOLARSHIP_CREATED`, `SCHOLARSHIP_UPDATED`, `SCHOLARSHIP_DELETED`, `SCHOLARSHIP_ARCHIVED`, `SCHOLARSHIP_RESTORED`, `ARCHIVED_SCHOLARSHIP_DELETED` |
| Application | `APPLICATION_SUBMITTED`, `APPLICATION_WITHDRAWN`, `APPLICATION_STATUS_UPDATED` |
| Files | `FILE_UPLOADED` |

#### Filter query parameters

| Parameter | Type | Description |
|---|---|---|
| `userId` | UUID | Filter by specific user |
| `action` | AuditAction | Filter by action type |
| `resource` | string | Filter by resource type |
| `status` | `SUCCESS` \| `FAILURE` | Filter by outcome |
| `startDate` | ISO 8601 | Lower bound on `createdAt` |
| `endDate` | ISO 8601 | Upper bound on `createdAt` |
| `page` | integer | Page number |
| `limit` | integer (max 100) | Results per page |

#### Audit log write pattern

```typescript
// Fire-and-forget — never blocks the HTTP response
createAuditLog({ userId, action, resource, resourceId, ipAddress, userAgent, status, metadata })
  .catch((err) => console.error('[AuditLog] Write failed:', err));
```

`extractIpAddress()` checks `x-forwarded-for`, `x-real-ip`, then `req.ip`, and normalizes `::1` to `127.0.0.1`.

### 4.6 Admin Layout

All admin pages share a common layout:

```tsx
<SidebarProvider>
  <div className="flex h-screen w-full">
    <AdminSidebar />                                    {/* left panel */}
    <SidebarInset className="flex-1">
      <Navbar showSidebarToggle={true} pageTitle="..." />  {/* top bar */}
      <div className="flex flex-1 flex-col gap-6 p-6 bg-gray-50 overflow-y-auto">
        {/* page content */}
      </div>
    </SidebarInset>
  </div>
</SidebarProvider>
```

The sidebar (`adminSidebar.tsx`) groups navigation into Overview, Management, Security, and Reporting sections.

### 4.7 Files Reference

| File | Role |
|---|---|
| `backend/src/controllers/admin.controller.ts` | `getAdminStats`, `getAllUsers` |
| `backend/src/controllers/auditLog.controller.ts` | `getAuditLogsHandler` |
| `backend/src/services/auditLog.service.ts` | `createAuditLog`, `getAuditLogs`, `extractIpAddress` |
| `backend/src/middleware/requireAdmin.ts` | Admin role guard |
| `backend/src/routes/admin.routes.ts` | All admin routes |
| `backend/src/routes/auditLog.routes.ts` | Audit log routes |
| `frontend/src/admin/AdminDashboard.tsx` | System overview page |
| `frontend/src/admin/AdminUsers.tsx` | User management page |
| `frontend/src/admin/AdminAuditLogs.tsx` | Audit log viewer page |
| `frontend/src/components/adminSidebar.tsx` | Admin navigation sidebar |

---

## 5. Advanced Administrative Reporting and Analytics

### 5.1 Overview

The standard admin dashboard provides static aggregate counts. This feature extends it with time-series analytics, per-scholarship performance metrics, an application status funnel, and downloadable data exports in CSV and PDF formats — all powered by a dedicated set of admin-only API endpoints.

### 5.2 Analytics Endpoints

All analytics endpoints are protected by `authenticate` + `requireAdmin` and use the raw `prisma` singleton (intentional BYPASSRLS — admin queries span all users).

#### `GET /admin/analytics/applications-over-time`

**Query param:** `period` — `7` | `30` | `90` (days, default `30`)

Returns daily application submission counts for the selected period. Days with zero submissions are filled in to produce a continuous x-axis.

```sql
SELECT DATE_TRUNC('day', "submittedAt") AS date,
       COUNT(*)::int                    AS count
FROM   "Application"
WHERE  "submittedAt" >= NOW() - (N::int || ' days')::INTERVAL
GROUP  BY date
ORDER  BY date ASC
```

**Response:**
```json
{ "success": true, "data": [{ "date": "2025-02-01", "count": 3 }, ...] }
```

#### `GET /admin/analytics/scholarship-performance`

Returns the top 10 scholarships ordered by total applications, with breakdowns by acceptance outcome.

```sql
SELECT s.id, s.title, s.status::text,
       COUNT(a.id)::int AS applications,
       SUM(CASE WHEN a.status = 'ACCEPTED'     THEN 1 ELSE 0 END)::int AS accepted,
       SUM(CASE WHEN a.status = 'REJECTED'     THEN 1 ELSE 0 END)::int AS rejected,
       SUM(CASE WHEN a.status = 'UNDER_REVIEW' THEN 1 ELSE 0 END)::int AS "underReview"
FROM   "Scholarship" s
LEFT   JOIN "Application" a ON a."scholarshipId" = s.id
GROUP  BY s.id, s.title, s.status
ORDER  BY applications DESC
LIMIT  10
```

#### `GET /admin/analytics/user-registrations`

**Query param:** `period` — same as applications-over-time

Derives daily registration counts from `AuditLog` (the `User` model has no `createdAt` field).

```sql
SELECT DATE_TRUNC('day', "createdAt") AS date,
       COUNT(*)::int                  AS count
FROM   "AuditLog"
WHERE  action     = 'USER_REGISTER'
  AND  status     = 'SUCCESS'
  AND  "createdAt" >= NOW() - (N::int || ' days')::INTERVAL
GROUP  BY date
ORDER  BY date ASC
```

#### `GET /admin/analytics/application-funnel`

Returns application counts grouped by status for a donut/funnel visualization.

```typescript
// Prisma groupBy (no raw SQL needed)
prisma.application.groupBy({
  by: ['status'],
  _count: { id: true },
})
// → [{ status: 'PENDING', count: 48 }, { status: 'ACCEPTED', count: 201 }, ...]
```

### 5.3 Export / Report Endpoints

All export endpoints stream file content directly in the response with appropriate `Content-Disposition` headers.

#### `GET /admin/reports/applications.csv`

Exports all applications with student and scholarship data.

**Columns:** ID, First Name, Last Name, Student Name, Student Email, Scholarship, Status, Submitted At, City, Address, Phone, Email

**Data source:** `prisma.application.findMany` with `include: { user, scholarship }`

#### `GET /admin/reports/scholarships.csv`

Exports all scholarships with provider details and application count.

**Columns:** ID, Title, Provider, Provider Email, Status, Type, Deadline, Created At, Applications

**Data source:** Raw SQL LEFT JOIN across `Scholarship`, `User`, and `Application`

#### `GET /admin/reports/users.csv`

Exports all registered users.

**Columns:** ID, Full Name, Email, Role, Verified

**Data source:** `prisma.user.findMany`

#### CSV Generation

CSV files are constructed entirely without external libraries:

```typescript
function escapeCSV(v: unknown): string {
  const s = v == null ? '' : String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s;
}
// Headers and rows joined with CRLF line endings (RFC 4180 compliant)
```

Response headers:

```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="applications-2025-02-01.csv"
```

#### `GET /admin/reports/summary.pdf`

Generates a formatted one-page A4 PDF summary using the `pdfkit` library.

**Sections:**
1. **Header** — Indigo banner with platform name and generation timestamp
2. **Users** — Total, students, organizations
3. **Scholarships** — Total, active, expired
4. **Applications** — Total, pending, accepted, rejected, under review / other
5. **Top 10 Scholarships table** — Title, application count, accepted count, acceptance rate %

All data for the PDF is gathered in parallel via `Promise.all` from the same Prisma queries used by `getAdminStats` and `getScholarshipPerformance`.

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="scholarsphere-summary.pdf"
```

### 5.4 Analytics Frontend — `AdminAnalytics` Page

**Route:** `/admin/analytics`
**File:** `frontend/src/admin/AdminAnalytics.tsx`
**Library:** `recharts` (v2, ships its own TypeScript types)

A 2×2 responsive chart grid with a period selector (7d / 30d / 90d) that applies to both time-series charts:

| Card | Chart Type | Recharts Component | Data Source |
|---|---|---|---|
| Applications Over Time | Line chart | `<LineChart>` | `fetchApplicationsOverTime` |
| User Registrations | Area chart | `<AreaChart>` | `fetchUserRegistrations` |
| Top Scholarships by Applications | Horizontal bar chart | `<BarChart layout="vertical">` | `fetchScholarshipPerformance` |
| Application Status Breakdown | Donut pie chart | `<PieChart>` with `innerRadius` | `fetchApplicationFunnel` |

All charts use `<ResponsiveContainer width="100%" height={260}>` for responsive layout. Data is fetched with `@tanstack/react-query` (`useQuery`) with a 5-minute `staleTime`. Loading states show skeleton placeholders.

**Funnel color mapping:**

| Status | Color |
|---|---|
| PENDING | Amber `#f59e0b` |
| SUBMITTED | Blue `#3b82f6` |
| UNDER_REVIEW | Purple `#8b5cf6` |
| ACCEPTED | Emerald `#10b981` |
| REJECTED | Red `#ef4444` |

### 5.5 Reports Frontend — `AdminReports` Page

**Route:** `/admin/reports`
**File:** `frontend/src/admin/AdminReports.tsx`

Four export cards arranged in a 2×2 grid:

| Card | Format | Report Type |
|---|---|---|
| Applications Report | CSV | `applications` |
| Scholarships Report | CSV | `scholarships` |
| Users Report | CSV | `users` |
| Executive Summary | PDF | `summary` |

Each card's download button:
1. Sets local loading state (disables all buttons while in progress)
2. Calls `downloadReport(token, type)` from `frontend/src/services/admin.ts`
3. The service function fetches the endpoint with the auth header, receives a blob, creates an object URL, and triggers a browser download via a temporary `<a>` element
4. On success: `react-hot-toast` success message
5. On error: `react-hot-toast` error message; loading state cleared

### 5.6 `downloadReport` Helper

```typescript
export const downloadReport = async (
  token: string,
  type: 'applications' | 'scholarships' | 'users' | 'summary',
): Promise<void> => {
  const ext = type === 'summary' ? 'pdf' : 'csv';
  const res = await fetch(`${API}/admin/reports/${type}.${ext}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to download ${type} report`);

  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${type}-${new Date().toISOString().slice(0, 10)}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

Using `fetch` with the `Authorization` header (rather than a direct `<a href>` link) ensures the admin token is sent — unauthenticated requests to export endpoints return `401`.

### 5.7 All API Routes Summary

| Method | Path | Handler |
|---|---|---|
| `GET` | `/admin/analytics/applications-over-time` | `getApplicationsOverTime` |
| `GET` | `/admin/analytics/scholarship-performance` | `getScholarshipPerformance` |
| `GET` | `/admin/analytics/user-registrations` | `getUserRegistrationsOverTime` |
| `GET` | `/admin/analytics/application-funnel` | `getApplicationFunnel` |
| `GET` | `/admin/reports/applications.csv` | `exportApplicationsCSV` |
| `GET` | `/admin/reports/scholarships.csv` | `exportScholarshipsCSV` |
| `GET` | `/admin/reports/users.csv` | `exportUsersCSV` |
| `GET` | `/admin/reports/summary.pdf` | `exportSummaryPDF` |

### 5.8 Files Reference

| File | Role |
|---|---|
| `backend/src/controllers/analytics.controller.ts` | 4 analytics query handlers |
| `backend/src/controllers/reports.controller.ts` | CSV helpers, 3 CSV exporters, PDF generator |
| `backend/src/routes/admin.routes.ts` | All admin + analytics + reports routes |
| `frontend/src/admin/AdminAnalytics.tsx` | Recharts analytics page |
| `frontend/src/admin/AdminReports.tsx` | Export download page |
| `frontend/src/services/admin.ts` | All admin API functions and interfaces |
| `frontend/src/components/adminSidebar.tsx` | Sidebar with Analytics + Reports nav items |
| `frontend/src/App.tsx` | Lazy-loaded routes for new admin pages |

---

## Appendix A — Environment Variables

| Variable | Used By | Description |
|---|---|---|
| `DATABASE_URL` | Prisma (PgBouncer) | Primary PostgreSQL connection (transaction pooling) |
| `DIRECT_URL` | Prisma migrations | Direct PostgreSQL connection (bypasses PgBouncer; required for DDL) |
| `SUPABASE_URL` | Supabase client | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin client | Service role key (full access; never expose to client) |

## Appendix B — Dependencies Added

| Package | Side | Purpose |
|---|---|---|
| `pdfkit` | Backend | PDF generation for summary report |
| `@types/pdfkit` | Backend (dev) | TypeScript types for pdfkit |
| `recharts` | Frontend | Chart components for analytics page |

## Appendix C — TypeScript Check

```bash
# Backend
cd backend && npx tsc --noEmit

# Frontend
cd frontend && npx tsc --noEmit
```

Both compile with zero errors.
