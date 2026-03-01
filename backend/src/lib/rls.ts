import { prisma } from './db';
import type { PrismaClient } from '@prisma/client';

/**
 * The interactive-transaction client type Prisma passes to $transaction callbacks.
 * Exported so service functions can declare it as an optional parameter.
 */
export type TransactionClient = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

/**
 * Wraps a Prisma database operation in a transaction that enforces PostgreSQL
 * Row Level Security using Supabase's native auth.uid() / auth.jwt() functions.
 *
 * Inside the transaction three statements are issued before the caller's query:
 *
 *   1. SET LOCAL ROLE authenticated
 *      Temporarily switches the connection to the 'authenticated' role for this
 *      transaction. This role does not have BYPASSRLS, so PostgreSQL evaluates
 *      RLS policies normally. Identical to how Supabase's PostgREST enforces RLS.
 *      Scoped to the current transaction — safe with PgBouncer transaction pooling.
 *
 *   2. SELECT set_config('request.jwt.claims', <json>, true)
 *      Publishes the user context as a transaction-local GUC variable.
 *      Supabase's auth.uid() reads request.jwt.claims.sub, and auth.jwt() returns
 *      the full object. This is identical to what PostgREST injects on every request,
 *      so the same RLS policies work for both PostgREST and Prisma callers.
 *      The third argument (is_local = true) makes it transaction-scoped.
 *
 * Usage in controllers:
 *
 *   const data = await withRLS(req.userId as string, req.user?.role as string, async (tx) => {
 *     return tx.application.findMany({ where: { userId } });
 *   });
 *
 * Rules:
 *   - Always use tx inside the callback, never the outer prisma singleton.
 *   - Audit log writes, Redis operations, and Socket.IO emits must stay OUTSIDE
 *     the callback (they either don't need RLS or must fire after commit).
 *   - Admin routes use the raw prisma singleton — they intentionally bypass RLS.
 *
 * @param userId  The authenticated user's UUID (req.userId)
 * @param role    The authenticated user's role string (req.user?.role)
 * @param fn      Callback that receives the transaction client
 */
export async function withRLS<T>(
  userId: string,
  role: string,
  fn: (tx: TransactionClient) => Promise<T>,
): Promise<T> {
  const claims = JSON.stringify({
    sub: sanitizeUuid(userId),
    user_metadata: { role: sanitizeRole(role) },
  });

  return prisma.$transaction(
    async (tx) => {
      // Switch to the 'authenticated' role for this transaction.
      // That role lacks BYPASSRLS, so PostgreSQL enforces RLS policies normally.
      // SET LOCAL means the role reverts at transaction end (safe with PgBouncer).
      await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated`);

      // Publish user context as a transaction-local GUC.
      // $executeRaw (tagged template) parameterizes the claims string safely.
      await tx.$executeRaw`SELECT set_config('request.jwt.claims', ${claims}, true)`;

      return fn(tx);
    },
    {
      isolationLevel: 'ReadCommitted',
      timeout: 25000,
      maxWait: 5000,
    },
  );
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitizeUuid(value: string): string {
  if (!UUID_RE.test(value)) {
    throw new Error(`withRLS: invalid userId format — expected UUID, got: ${value}`);
  }
  return value;
}

const ALLOWED_ROLES = new Set(['STUDENT', 'ORGANIZATION', 'ADMIN']);

function sanitizeRole(value: string): string {
  if (!ALLOWED_ROLES.has(value)) {
    throw new Error(`withRLS: unrecognized role: ${value}`);
  }
  return value;
}
