
/**
 * Admin seed script
 *
 * Creates an ADMIN user in both Supabase Auth and the Prisma User table.
 * Idempotent — safe to run multiple times; skips creation if the email already exists.
 *
 * Credentials are read from env vars (falls back to defaults):
 *   ADMIN_EMAIL     – default: admin@scholarsphere.com
 *   ADMIN_PASSWORD  – default: generated and printed once
 *   ADMIN_FULLNAME  – default: ScholarSphere Admin
 *
 * Usage:
 *   npm run seed
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@scholarsphere.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
const ADMIN_FULLNAME = process.env.ADMIN_FULLNAME || 'ScholarSphere Admin';

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seed() {
  console.log('\n🌱  Starting admin seed...\n');

  // 1. Check if admin already exists in Prisma
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) {
    console.log(`ℹ️   Admin user already exists in the database: ${ADMIN_EMAIL}`);
    console.log('    Skipping creation. If you want to reset the password,');
    console.log('    use the Supabase dashboard → Authentication → Users.\n');
    return;
  }

  // 2. Create the user in Supabase Auth
  console.log(`📧  Creating Supabase Auth user: ${ADMIN_EMAIL}`);
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,           // skip email verification for admin
    user_metadata: {
      role: 'ADMIN',
      fullname: ADMIN_FULLNAME,
    },
  });

  if (authError || !authData.user) {
    // If user already exists in Supabase but not in Prisma, fetch the existing one
    if (authError?.message?.toLowerCase().includes('already registered')) {
      console.log('⚠️   User already exists in Supabase Auth — fetching existing user...');
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('❌  Failed to list Supabase users:', listError.message);
        process.exit(1);
      }
      const existingAuthUser = listData.users.find((u) => u.email === ADMIN_EMAIL);
      if (!existingAuthUser) {
        console.error('❌  Could not find the existing Supabase user. Please check the email.');
        process.exit(1);
      }
      // Update user_metadata to ensure ADMIN role is set
      await supabase.auth.admin.updateUserById(existingAuthUser.id, {
        user_metadata: { role: 'ADMIN', fullname: ADMIN_FULLNAME },
      });
      await createPrismaRecord(existingAuthUser.id);
    } else {
      console.error('❌  Supabase user creation failed:', authError?.message);
      process.exit(1);
    }
  } else {
    console.log(`✅  Supabase Auth user created (id: ${authData.user.id})`);
    await createPrismaRecord(authData.user.id);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅  Admin account seeded successfully!\n');
  console.log(`   Email    : ${ADMIN_EMAIL}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`   Password : ${ADMIN_PASSWORD}`);
    console.log('\n   ⚠️  Save this password — it will not be shown again.');
  } else {
    console.log('   Password : (from ADMIN_PASSWORD env var)');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function createPrismaRecord(supabaseUserId: string) {
  console.log(`🗄️   Creating Prisma User record (id: ${supabaseUserId})`);
  await prisma.user.create({
    data: {
      id: supabaseUserId,
      fullname: ADMIN_FULLNAME,
      email: ADMIN_EMAIL,
      password: '',       // password managed by Supabase Auth
      role: 'ADMIN',
      isVerified: true,
    },
  });
  console.log('✅  Prisma User record created');
}

seed()
  .catch((err) => {
    console.error('❌  Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
