/**
 * Create a Supabase Auth account for a new admin.
 *
 * Admin access in this app is gated by two things:
 *   1. A confirmed Supabase Auth user (this script).
 *   2. The email being present in the ADMIN_EMAILS allowlist (see src/middleware.ts).
 * This script only handles (1). The allowlist must be updated separately.
 *
 * Idempotent: if the user already exists, the password is reset instead.
 *
 *   node --env-file=.env.local scripts/create-admin-user.mjs <email> <password>
 */

import { createClient } from '@supabase/supabase-js';

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Usage: node --env-file=.env.local scripts/create-admin-user.mjs <email> <password>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing Supabase env'); process.exit(1); }

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Look for an existing auth user with this email (case-insensitive).
const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listErr) { console.error('listUsers failed:', listErr.message); process.exit(1); }
const existing = list.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (error) { console.error('updateUser failed:', error.message); process.exit(1); }
  console.log(`Updated existing auth user ${email} (id ${existing.id}) — password reset, email confirmed.`);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) { console.error('createUser failed:', error.message); process.exit(1); }
  console.log(`Created auth user ${email} (id ${data.user.id}).`);
}

console.log('Reminder: ensure this email is in the ADMIN_EMAILS allowlist (src/middleware.ts + Vercel env).');
