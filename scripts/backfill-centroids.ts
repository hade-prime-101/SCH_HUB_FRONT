/**
 * Backfill NULL centroids for campus_features rows imported before the
 * ST_Centroid fix (Polygon / MultiPolygon geometry only — Point rows
 * always have their centroid set on insert).
 *
 * Safeguards:
 *   1. Prints and pauses on the target database host (password masked)
 *      so you can visually confirm the right database before anything runs.
 *   2. Runs a SELECT COUNT(*) dry run with the same WHERE clause and
 *      prints the count, then asks for explicit confirmation before the
 *      UPDATE executes.
 *
 * Usage:
 *   tsx scripts/backfill-centroids.ts
 *
 * The script reads DATABASE_URL from the .env file in the project root,
 * the same way all other scripts do.
 */

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import dotenv from 'dotenv';
import { PrismaClient, Prisma } from '@prisma/client';

dotenv.config();

// ── Helpers ───────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input, output });

async function ask(question: string): Promise<string> {
  return (await rl.question(question)).trim();
}

function divider(char = '─', width = 70) {
  console.log(char.repeat(width));
}

/**
 * Parse the host out of a postgres:// or postgresql:// connection string
 * and mask the password so it can be printed safely.
 *
 * Input:  postgresql://user:s3cr3t@db.supabase.co:5432/postgres?sslmode=require
 * Output: db.supabase.co:5432
 *
 * Returns null if the URL cannot be parsed.
 */
function parseDatabaseHost(url: string): string | null {
  try {
    // URL constructor requires a valid scheme — postgres:// is non-standard,
    // so normalise it to https:// just for parsing purposes.
    const normalised = url.replace(/^postgres(ql)?:\/\//, 'https://');
    const parsed = new URL(normalised);
    const host = parsed.hostname;
    const port = parsed.port;
    return port ? `${host}:${port}` : host;
  } catch {
    return null;
  }
}

function maskPassword(url: string): string {
  // Replace :password@ with :***@ in the URL for safe display
  return url.replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1***$2');
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  // --yes flag skips both confirmation prompts (for use in CI / piped environments)
  const autoConfirm = process.argv.includes("--yes");

  if (!databaseUrl) {
    console.error('\n❌  DATABASE_URL is not set. Check your .env file.\n');
    process.exit(1);
  }

  // ── Safeguard 1: print the target host ───────────────────────────────

  const host = parseDatabaseHost(databaseUrl);
  const maskedUrl = maskPassword(databaseUrl);

  divider('═');
  console.log('\n  CENTROID BACKFILL — PRE-FLIGHT CHECK\n');
  divider();
  console.log(`  DATABASE_URL : ${maskedUrl}`);
  console.log(`  Host         : ${host ?? '(could not parse — check URL format)'}`);
  divider();

  if (!autoConfirm) {
    const hostConfirm = await ask(
      '\n  ⚠️  Is the host above the CORRECT database (e.g. Supabase, not Aiven)?\n' +
      '  Type YES to continue, anything else to abort: '
    );
    if (hostConfirm !== 'YES') {
      console.log('\n🚫  Aborted — no changes made.\n');
      process.exit(0);
    }
  } else {
    console.log('\n  --yes flag set — skipping host confirmation.\n');
  }

  // ── Connect ───────────────────────────────────────────────────────────

  const prisma = new PrismaClient();

  try {
    // ── Safeguard 2: dry-run count ────────────────────────────────────

    console.log('\n  Running dry-run count…\n');

    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) AS count
      FROM "campus_features"
      WHERE
        "centroid" IS NULL
        AND ST_GeometryType("geometry") != 'ST_Point'
    `;

    const affectedRows = Number(countResult[0].count);

    divider();
    console.log(`\n  Rows with NULL centroid (non-Point geometry): ${affectedRows}\n`);
    divider();

    if (affectedRows === 0) {
      console.log('\n✅  Nothing to do — all non-Point features already have a centroid.\n');
      return;
    }

    if (!autoConfirm) {
      const updateConfirm = await ask(
        `\n  About to UPDATE ${affectedRows} row(s) — set centroid = ST_Centroid(geometry).\n` +
        '  Type YES to run the UPDATE, anything else to abort: '
      );
      if (updateConfirm !== 'YES') {
        console.log('\n🚫  Aborted — no changes made.\n');
        return;
      }
    } else {
      console.log(`\n  --yes flag set — proceeding to UPDATE ${affectedRows} row(s).\n`);
    }

    // ── Execute UPDATE ────────────────────────────────────────────────

    console.log('\n  Running UPDATE…\n');

    const updated: number = await prisma.$executeRaw`
      UPDATE "campus_features"
      SET
        "centroid"  = ST_Centroid("geometry"),
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE
        "centroid" IS NULL
        AND ST_GeometryType("geometry") != 'ST_Point'
    `;

    divider('═');
    console.log(`\n✅  Done. ${updated} row(s) updated.\n`);
    divider('═');

    // Verify: re-run the count to confirm zero remain
    const verifyResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) AS count
      FROM "campus_features"
      WHERE
        "centroid" IS NULL
        AND ST_GeometryType("geometry") != 'ST_Point'
    `;

    const remaining = Number(verifyResult[0].count);
    if (remaining === 0) {
      console.log('  Verification: ✅  0 rows with NULL centroid remaining.\n');
    } else {
      console.log(`  Verification: ⚠️  ${remaining} rows still have NULL centroid — check for geometry errors.\n`);
    }

  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main().catch((err) => {
  console.error(`\n❌  ${(err as Error).message}\n`);
  process.exit(1);
});
