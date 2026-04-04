/**
 * Apply custom SQL migrations that Drizzle ORM cannot handle:
 * - RLS policies
 * - GIN indexes for JSONB
 * - tsvector generated column
 * - updatedAt auto-refresh trigger
 *
 * Run: pnpm db:custom
 */

import postgres from "postgres";
import fs from "fs";
import path from "path";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

  const customDir = path.join(__dirname, "../drizzle/custom");
  const files = fs.readdirSync(customDir).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    const filePath = path.join(customDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    console.log(`Applying ${file}...`);
    try {
      await sql.unsafe(content);
      console.log(`  ✓ ${file} applied`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      // Skip "already exists" errors for idempotency
      if (msg.includes("already exists")) {
        console.log(`  ⚠ ${file} skipped (already applied)`);
      } else {
        console.error(`  ✗ ${file} failed:`, msg);
        throw error;
      }
    }
  }

  await sql.end();
  console.log("\nCustom migrations complete.");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
