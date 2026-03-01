# Fine-Grained Database-Level Authorization — PostgreSQL RLS

## Overview

ScholarSphere's backend connects to Supabase PostgreSQL via Prisma using the `postgres` role, which has the `BYPASSRLS` privilege. This means PostgreSQL Row Level Security policies are not enforced by default — access control previously lived entirely in Express middleware and controller-level `WHERE` clauses.

This document describes the two-layer authorization architecture now in place:

1. **Database layer** — PostgreSQL RLS policies on every user-facing table using Supabase's native `auth.uid()` / `auth.jwt()` functions.
2. **ORM layer** — A `withRLS()` Prisma transaction wrapper that injects the authenticated user's context into every DB operation, activating those policies.

Additionally, a **critical file-download vulnerability** (IDOR — Insecure Direct Object Reference) in `upload.controller.ts` was fixed as part of this work.

---

## Architecture

```
HTTP Request
    │
    ▼
authenticate middleware           Sets req.userId (UUID) and req.user.role
    │
    ▼
Controller function
    │
    ├── withRLS(userId, role, async (tx) => { ... })
    │       │
    │       ▼
    │   prisma.$transaction begins
    │       │
    │       ├── SET LOCAL ROLE authenticated
    │       │     Switches to the 'authenticated' role (no BYPASSRLS) for this
    │       │     transaction — identical to what PostgREST does per request.
    │       │
    │       ├── SELECT set_config('request.jwt.claims', '{"sub":"<uuid>","user_metadata":{"role":"STUDENT"}}', true)
    │       │     Transaction-local GUC variable. Supabase's auth.uid() reads .sub,
    │       │     auth.jwt() returns the full object. Identical to what PostgREST injects.
    │       │
    │       └── User's Prisma queries via tx — RLS policies are evaluated
    │
    ├── Audit log write (raw prisma — intentional BYPASSRLS)
    ├── Redis cache invalidation
    └── Socket.IO emit (after transaction commits)
```

### What uses `withRLS()`

| Controller | Functions wrapped |
|---|---|
| `scholar.controller.ts` | `createScholar`, `updateScholar`, `deleteScholarship`, `ArchiveScholarship`, `getOrganizationScholarships`, `getArchivedScholarships`, `DeleteArchivedScholarship`, `RestoreArchivedScholarship` |
| `application.controller.ts` | `submitApplication`, `getUserApplications`, `getApplicationById`, `withdrawApplication`, `getScholarshipApplications`, `updateApplicationStatus`, `getApplicants` |
| `user.controller.ts` | `getCurrentUser`, `updateUserProfile`, `getOrganizationStats` |
| `mfa.controller.ts` | `storeRecoveryCodes`, `verifyRecoveryCode`, `getMfaStatus`, `unenrollMfa` |
| `notification.controller.ts` | `fetchNotifications`, `readNotification`, `readAllNotifications`, `removeNotification` |
| `upload.controller.ts` | `downloadFile` |

### What intentionally bypasses RLS

| Code path | Reason |
|---|---|
| `admin.controller.ts` | Admin queries span all users by design |
| `auditLog.controller.ts` | Admin read — BYPASSRLS intentional |
| `auditLog.service.ts` (writes) | Fire-and-forget; must never fail from missing context |
| `userRegister`, `userLogin`, `requestPasswordReset` | Pre-authentication; no user context available |
| `getAllScholars`, `getPublicScholars`, `getScholarshipById` | Public endpoints; no auth required |
| `updateExpiredScholarships` | System cron job; no user session |

---

## Database Policies

### Applying the Migration

```bash
# Option A: Supabase SQL Editor (recommended for first run)
# Paste backend/prisma/sql/rls/001_enable_rls.sql into the editor and execute.

# Option B: Prisma CLI (must use DIRECT_URL — PgBouncer doesn't support DDL)
npx prisma db execute \
  --file ./prisma/sql/rls/001_enable_rls.sql \
  --schema ./prisma/schema.prisma \
  --url "$DIRECT_URL"
```

### Rolling Back

```bash
npx prisma db execute \
  --file ./prisma/sql/rls/001_rollback_rls.sql \
  --schema ./prisma/schema.prisma \
  --url "$DIRECT_URL"
```

### Helper Function

```sql
-- Reads the user role from Supabase user_metadata in the JWT claims.
-- Used in policies instead of repeating the JSON path.
CREATE OR REPLACE FUNCTION app_role()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT auth.jwt() -> 'user_metadata' ->> 'role'
$$;
```

### Policy Summary by Table

#### `User`
| Operation | Condition |
|---|---|
| SELECT | `id = auth.uid()` |
| UPDATE | `id = auth.uid()` |
| INSERT | `id = auth.uid()` (first-login sync path) |

#### `Scholarship`
| Operation | Condition |
|---|---|
| SELECT | Any authenticated session (`auth.uid() IS NOT NULL`) |
| INSERT | `providerId = auth.uid()` AND `app_role() = 'ORGANIZATION'` |
| UPDATE | `providerId = auth.uid()` AND `app_role() = 'ORGANIZATION'` |
| DELETE | `providerId = auth.uid()` AND `app_role() = 'ORGANIZATION'` |

#### `Application`
| Operation | Who | Condition |
|---|---|---|
| SELECT | Student | `userId = auth.uid()` AND `app_role() = 'STUDENT'` |
| SELECT | Organization | `app_role() = 'ORGANIZATION'` AND `scholarshipId IN (SELECT id FROM "Scholarship" WHERE "providerId" = auth.uid())` |
| INSERT | Student | `userId = auth.uid()` AND `app_role() = 'STUDENT'` |
| UPDATE | Organization | Same as org SELECT |
| DELETE | Student | `userId = auth.uid()` AND `app_role() = 'STUDENT'` |

#### `ApplicationDocument`
| Operation | Who | Condition |
|---|---|---|
| SELECT | Student | Document's application belongs to `auth.uid()` |
| SELECT | Organization | Document's application's scholarship belongs to `auth.uid()`'s org |
| INSERT | Student | Application belongs to `auth.uid()` |

#### `Archive`
| Operation | Condition |
|---|---|
| SELECT | `providerId = auth.uid()` AND `app_role() = 'ORGANIZATION'` |
| INSERT | Same |
| DELETE | Same |

#### `Notification`
| Operation | Condition |
|---|---|
| SELECT | `userId = auth.uid()` |
| INSERT | `auth.uid() IS NOT NULL` (any authenticated actor, including orgs notifying students) |
| UPDATE | `userId = auth.uid()` |
| DELETE | `userId = auth.uid()` |

#### `RecoveryCode`
| Operation | Condition |
|---|---|
| SELECT | `userId = auth.uid()` |
| INSERT | `userId = auth.uid()` |
| UPDATE | `userId = auth.uid()` |
| DELETE | `userId = auth.uid()` |

#### `AuditLog`
No user-facing policies. RLS is enabled (deny by default), but audit log access is only through admin routes which use the raw `prisma` singleton (BYPASSRLS). Any `withRLS`-wrapped query against `AuditLog` returns 0 rows.

---

## The `withRLS()` Wrapper

**File:** `backend/src/lib/rls.ts`

```typescript
export async function withRLS<T>(
  userId: string,
  role: string,
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T>
```

### How it works

Opens a Prisma interactive transaction and issues three SQL statements before the caller's query:

```sql
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"<uuid>","user_metadata":{"role":"STUDENT"}}', true);
```

- `SET LOCAL ROLE authenticated` — temporarily switches the connection to Supabase's `authenticated` role for the duration of the transaction. This role does **not** have `BYPASSRLS`, so PostgreSQL evaluates all RLS policies normally. `SET LOCAL` ensures the role reverts on commit/rollback — safe with PgBouncer. This is identical to how PostgREST enforces RLS.
- `set_config(..., true)` — the third argument `is_local = true` makes this equivalent to `SET LOCAL`, scoping the GUC variable to the transaction. Supabase's `auth.uid()` reads `request.jwt.claims.sub` and `auth.jwt()` returns the full object. This is the same mechanism PostgREST uses.

### Why `SET LOCAL` is safe with PgBouncer

The project uses PgBouncer in transaction mode (`pgbouncer=true` in `DATABASE_URL`). In transaction mode, each transaction may be served by a different backend connection. `SET LOCAL` is discarded when the transaction ends — there is no risk of the user context leaking to the next request that uses the same connection.

### Input sanitization

```typescript
// UUID format enforced before passing to SQL
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Role restricted to known enum values
const ALLOWED_ROLES = new Set(['STUDENT', 'ORGANIZATION', 'ADMIN']);
```

Both sanitizers throw before the transaction opens if values are invalid. The claims JSON string is passed to PostgreSQL via Prisma's `$executeRaw` tagged template (parameterized query), not string concatenation.

### Usage pattern in controllers

```typescript
import { withRLS } from '../lib/rls';

export const getUserApplications = async (req: Request, res: Response) => {
    const userId = req.userId as string;
    const role = (req.user?.role as string) || 'STUDENT';

    // All Prisma queries inside the lambda use tx, not the prisma singleton.
    const applications = await withRLS(userId, role, async (tx) => {
        return tx.application.findMany({
            where: { userId },   // Explicit filter kept for belt-and-suspenders
            include: { documents: true, scholarship: true },
        });
    });

    // Audit logs, Redis, and Socket.IO stay outside withRLS.
    res.status(200).json({ success: true, data: applications });
};
```

### Belt-and-suspenders principle

Controller-level `WHERE` clauses are kept even where RLS would handle it alone. This means:
- If RLS is disabled or misconfigured, explicit filters still protect data.
- If a developer forgets an explicit filter, RLS catches it at the database level.

### Socket.IO and transactions

`updateApplicationStatus` previously called `createNotification()` (which emits Socket.IO events) before the transaction committed. With `withRLS`, the notification **DB write** happens inside the transaction and the **Socket.IO emit** happens after `withRLS()` returns — guaranteeing the event only fires on a successful commit.

```typescript
// Inside withRLS callback — DB write
await tx.notification.create({ data: { ... } });

// Outside withRLS — emit only fires after commit
emitNotificationToUser(targetUserId, { ... });
```

### Notification service — optional `tx` parameter

`backend/src/services/notification.ts` functions accept an optional `tx: TransactionClient` parameter. When provided, they use `tx` for DB operations and skip Socket.IO emissions (the caller handles them). When omitted, they use the `prisma` singleton and emit as before.

```typescript
// Called from notification.controller.ts (inside withRLS):
const updated = await markNotificationAsRead(id, userId, tx);
// Caller emits after withRLS returns:
emitNotificationUpdate(userId, updated);

// Called from legacy code without RLS (uses prisma, emits immediately):
await markNotificationAsRead(id, userId);
```

---

## File Download Vulnerability Fix

**File:** `backend/src/controllers/upload.controller.ts` — `downloadFile`

### The vulnerability (before)

The `storagePath` value from `req.body` was passed directly to `supabase.storage.createSignedUrl()` using the service role key. No ownership check was performed. Any authenticated user could download any other user's files by supplying a known or guessed path.

**Example exploit:**
```bash
POST /upload/download
Authorization: Bearer <token-for-user-A>
Content-Type: application/json

{ "storagePath": "user-b-uuid/documents/private.pdf" }
# Response: signed URL for user B's file
```

### The fix (after)

Two-layer ownership verification before any signed URL is generated:

**Layer 1 — Path prefix guard (students only):**
Files are stored as `<userId>/documents/<file>`. If the acting user is `STUDENT`, the `storagePath` must begin with their own `userId`. This rejects the obvious cross-user case with no DB round-trip.

**Layer 2 — DB ownership check via `withRLS`:**
Queries `ApplicationDocument` with the exact `storagePath`. RLS policies enforce:
- `appdoc_select_student`: students see only documents on their own applications.
- `appdoc_select_org`: organizations see only documents on applications to their scholarships.

If the row is not visible under the acting user's RLS context, `findFirst` returns `null` and the request is rejected with `403`. The signed URL is only generated after both checks pass.

```
Request
  │
  ├─ role === 'STUDENT' && !storagePath.startsWith(userId + '/')
  │   → 403 immediately
  │
  ├─ withRLS(...) → tx.applicationDocument.findFirst({ where: { storagePath } })
  │   → null if RLS policy blocks access → 403
  │
  └─ supabase.storage.createSignedUrl(storagePath, 3600)
      → Returns signed URL only after both checks pass
```

---

## Verification

### Manual SQL verification

Connect to the database using `DIRECT_URL` (bypasses PgBouncer):

```sql
-- Test student isolation
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"<student-uuid>","user_metadata":{"role":"STUDENT"}}', true);

-- Should return 0 rows (can't see other users' data)
SELECT id FROM "Application" WHERE "userId" != '<student-uuid>';
SELECT id FROM "Notification" WHERE "userId" != '<student-uuid>';
SELECT id FROM "RecoveryCode" WHERE "userId" != '<student-uuid>';
ROLLBACK;

-- Test organization isolation
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"<org-uuid>","user_metadata":{"role":"ORGANIZATION"}}', true);

-- Only applications for this org's scholarships visible
SELECT count(*) FROM "Application"; -- filtered by application_select_org policy
ROLLBACK;

-- Test admin bypass (no SET LOCAL — postgres role has BYPASSRLS)
SELECT count(*) FROM "Application"; -- returns total count, unfiltered
```

### End-to-end functional checklist

1. **Org creates scholarship** → org dashboard shows only own scholarships ✓
2. **Student submits application** → student sees only own applications ✓
3. **Org updates application status** → student receives notification ✓
4. **Student downloads own document** → succeeds ✓
5. **Student provides another user's `storagePath`** → 403 ✓
6. **Org downloads applicant's document (their scholarship)** → succeeds ✓
7. **Admin dashboard loads stats** → succeeds (raw `prisma`, BYPASSRLS) ✓
8. **MFA recovery code generation and verification** → succeeds ✓

### TypeScript compilation

```bash
cd backend && npx tsc --noEmit
```

---

## Files Changed

| File | Change |
|---|---|
| `prisma/sql/rls/001_enable_rls.sql` | **Created** — SQL to enable RLS and create all policies |
| `prisma/sql/rls/001_rollback_rls.sql` | **Created** — SQL to disable RLS and drop all policies |
| `src/lib/rls.ts` | **Created** — `withRLS()` wrapper and `TransactionClient` type export |
| `src/services/notification.ts` | **Modified** — optional `tx` parameter on all DB functions |
| `src/controllers/scholar.controller.ts` | **Modified** — 8 functions wrapped with `withRLS()` |
| `src/controllers/application.controller.ts` | **Modified** — 7 functions wrapped; `updateApplicationStatus` uses inline `tx.notification.create` |
| `src/controllers/user.controller.ts` | **Modified** — `getCurrentUser`, `updateUserProfile`, `getOrganizationStats` wrapped |
| `src/controllers/mfa.controller.ts` | **Modified** — 4 functions wrapped |
| `src/controllers/notification.controller.ts` | **Modified** — all 4 handlers wrapped; Socket.IO emits moved outside `withRLS` |
| `src/controllers/upload.controller.ts` | **Modified** — `downloadFile` critical security fix |

**Not changed:** `prisma/schema.prisma`, `admin.controller.ts`, `auditLog.controller.ts`, all middleware, all routes, all frontend code.
