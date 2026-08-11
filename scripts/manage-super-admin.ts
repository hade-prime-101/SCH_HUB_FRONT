/**
 * Super Admin CLI Management Script
 * Communicates exclusively through the backend REST API — no direct DB access.
 *
 * Usage:
 *   npm run admin list
 *   npm run admin create
 *   npm run admin delete <adminId>
 *   npm run admin reset-password <adminId>
 *   npm run admin login <email>
 *   npm run admin stats
 *   npm run admin schools
 */

import * as readline from 'node:readline/promises';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { stdin as input, stdout as output } from 'node:process';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = (process.env.ADMIN_API_BASE_URL ?? process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 5000}/api/v1`).replace(/\/+$/, '');
const SESSION_FILE = path.resolve(import.meta.dirname, '.admin-session');

// ── Helpers ───────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input, output });

async function ask(question: string): Promise<string> {
  return (await rl.question(question)).trim();
}

async function askPassword(prompt: string): Promise<string> {
  process.stdout.write(prompt);
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    let password = '';
    const handler = (ch: string) => {
      if (ch === '\r' || ch === '\n') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', handler);
        process.stdout.write('\n');
        resolve(password);
      } else if (ch === '\u0003') {
        process.stdout.write('\n');
        process.exit(0);
      } else if (ch === '\u007F') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else {
        password += ch;
        process.stdout.write('*');
      }
    };
    stdin.on('data', handler);
  });
}

/** Save token to session file */
function saveSession(token: string, email: string): void {
  fs.writeFileSync(SESSION_FILE, JSON.stringify({ token, email, savedAt: Date.now() }), { mode: 0o600 });
}

/** Load token from session file — exits with a helpful message if missing */
function requireToken(): string {
  // env var takes priority (useful in CI/scripts)
  if (process.env.ADMIN_TOKEN) return process.env.ADMIN_TOKEN;

  if (!fs.existsSync(SESSION_FILE)) {
    console.error('\n❌  Not logged in. Run:\n');
    console.error('    npm run admin login your@email.com\n');
    process.exit(1);
  }

  try {
    const { token } = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8')) as { token: string; email: string; savedAt: number };
    return token;
  } catch {
    console.error('\n❌  Session file is corrupted. Run:  npm run admin login your@email.com\n');
    process.exit(1);
  }
}

/** Clear saved session */
function clearSession(): void {
  if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
}

/** Thin fetch wrapper — prints structured errors */
async function api<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const rawText = await res.text();
  let json: { success?: boolean; data?: T; error?: string; message?: string } | undefined;

  if (rawText) {
    try {
      json = JSON.parse(rawText) as { success?: boolean; data?: T; error?: string; message?: string };
    } catch {
      json = undefined;
    }
  }

  if (!res.ok) {
    const msg = (json?.error ?? json?.message ?? rawText) || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (json && typeof json === 'object' && 'success' in json && json.success === false) {
    const msg = json.error ?? json.message ?? 'Request failed';
    throw new Error(msg);
  }

  return (json?.data as T) ?? (json as T);
}

const divider = () => console.log('─'.repeat(70));

// ── Commands ──────────────────────────────────────────────────────────────

/** Login → print token + export instructions */
async function login(email: string) {
  const password = await askPassword(`\nPassword for ${email}: `);

  let result: {
    accessToken: string;
    refreshToken: string;
    role: string;
    dashboardRedirect: string;
    user: { fullName: string; id: string };
  };

  try {
    result = await api('POST', '/auth/login', { email, password });
  } catch (err) {
    console.error(`\n❌  ${(err as Error).message}\n`);
    return;
  }

  if (result.role !== 'SUPER_ADMIN') {
    console.error(`\n❌  "${email}" is not a super admin (role: ${result.role}).\n`);
    return;
  }

  saveSession(result.accessToken, email);

  divider();
  console.log(`\n✅  Logged in as ${result.user.fullName}`);
  console.log(`    Session saved — no export needed.\n`);
  console.log('  Try:');
  console.log('    npm run admin list');
  console.log('    npm run admin stats');
  console.log('    npm run admin schools\n');
  divider();
}

/** List all super admin accounts */
async function listAdmins() {
  const token = requireToken();

  const admins = await api<Array<{
    id: string;
    fullName: string;
    email: string;
    isActive: boolean;
    isBlocked: boolean;
    createdAt: string;
  }>>('GET', '/super-admin/admins', undefined, token);

  if (!admins.length) {
    console.log('\n⚠️  No super admin accounts found.\n');
    return;
  }

  console.log(`\n  SUPER ADMIN ACCOUNTS (${admins.length})\n`);
  divider();
  for (const a of admins) {
    const status = a.isBlocked ? '🔴 blocked' : !a.isActive ? '🟡 inactive' : '🟢 active';
    console.log(`  Name    : ${a.fullName}`);
    console.log(`  Email   : ${a.email}`);
    console.log(`  ID      : ${a.id}`);
    console.log(`  Status  : ${status}`);
    console.log(`  Created : ${new Date(a.createdAt).toLocaleString()}`);
    divider();
  }
}

/** Create a new super admin interactively */
async function createAdmin() {
  const token = requireToken();

  console.log('\n── Create Super Admin ──────────────────────────────────────\n');

  const fullName = await ask('Full name : ');
  const email    = await ask('Email     : ');
  const password  = await askPassword('Password  : ');
  const password2 = await askPassword('Confirm   : ');

  if (password !== password2) {
    console.error('\n❌  Passwords do not match.\n');
    return;
  }

  const result = await api<{ id: string; fullName: string; email: string }>(
    'POST',
    '/super-admin/admins',
    { fullName, email, password },
    token,
  );

  console.log(`\n✅  Super admin created!`);
  console.log(`    ID    : ${result.id}`);
  console.log(`    Name  : ${result.fullName}`);
  console.log(`    Email : ${result.email}\n`);
}

/** Delete a super admin by ID */
async function deleteAdmin(adminId: string) {
  const token = requireToken();

  const confirm = await ask(`\n⚠️  Delete admin "${adminId}"? Type YES to confirm: `);
  if (confirm !== 'YES') {
    console.log('\n🚫  Aborted.\n');
    return;
  }

  await api('DELETE', `/super-admin/admins/${adminId}`, undefined, token);
  console.log(`\n✅  Admin ${adminId} deleted.\n`);
}

/** Reset a super admin password by ID */
async function resetAdminPassword(adminId: string) {
  const token = requireToken();

  const newPassword  = await askPassword(`\nNew password for admin ${adminId}: `);
  const newPassword2 = await askPassword('Confirm new password             : ');

  if (newPassword !== newPassword2) {
    console.error('\n❌  Passwords do not match.\n');
    return;
  }

  await api(
    'PATCH',
    `/super-admin/admins/${adminId}/reset-password`,
    { newPassword },
    token,
  );

  console.log(`\n✅  Password reset for admin ${adminId}. All existing sessions invalidated.\n`);
}

/** Logout — clear saved session */
function logout() {
  clearSession();
  console.log('\n✅  Logged out. Session cleared.\n');
}

/** Platform stats */
async function stats() {
  const token = requireToken();
  const data = await api<Record<string, unknown>>('GET', '/super-admin/stats', undefined, token);

  console.log('\n── Platform Stats ──────────────────────────────────────────\n');
  console.log(JSON.stringify(data, null, 2));
  console.log();
}

/** List all schools */
async function schools() {
  const token = requireToken();
  const data = await api<Array<{ id: string; name: string; shortCode: string; location: string; isActive: boolean }>>(
    'GET', '/super-admin/schools', undefined, token,
  );

  console.log(`\n── Schools (${data.length}) ──────────────────────────────────────────\n`);
  divider();
  for (const s of data) {
    console.log(`  Name      : ${s.name}`);
    console.log(`  Short code: ${s.shortCode}`);
    console.log(`  Location  : ${s.location}`);
    console.log(`  ID        : ${s.id}`);
    console.log(`  Active    : ${s.isActive ? '✅' : '❌'}`);
    divider();
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const [,, command, arg] = process.argv;

  if (!command) {
    console.log(`
Super Admin CLI — talks to the backend API at ${BASE_URL}

Commands:
  login <email>              Authenticate and save session locally
  logout                     Clear saved session
  list                       List all super admin accounts
  create                     Create a new super admin (interactive)
  delete <adminId>           Delete a super admin by ID
  reset-password <adminId>   Reset a super admin's password
  stats                      View platform analytics
  schools                    List all schools

Workflow:
  1. npm run admin login your@email.com
  2. npm run admin list / create / stats / ...
  3. npm run admin logout
`);
    return;
  }

  try {
    switch (command) {
      case 'login':
        if (!arg) { console.error('❌  Usage: login <email>'); break; }
        await login(arg);
        break;

      case 'logout':
        logout();
        break;

      case 'list':
        await listAdmins();
        break;

      case 'create':
        await createAdmin();
        break;

      case 'delete':
        if (!arg) { console.error('❌  Usage: delete <adminId>'); break; }
        await deleteAdmin(arg);
        break;

      case 'reset-password':
        if (!arg) { console.error('❌  Usage: reset-password <adminId>'); break; }
        await resetAdminPassword(arg);
        break;

      case 'stats':
        await stats();
        break;

      case 'schools':
        await schools();
        break;

      default:
        console.error(`❌  Unknown command: "${command}". Run without arguments to see usage.`);
    }
  } catch (err) {
    console.error(`\n❌  ${(err as Error).message}\n`);
    process.exit(1);
  }
}

main().finally(() => rl.close());
