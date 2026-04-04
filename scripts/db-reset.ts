/**
 * Reset database — drops all tables and re-creates from schema.
 * Run: pnpm db:reset
 *
 * WARNING: This destroys all data. Use only in development.
 */

import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

  console.log("⚠️  Resetting database...\n");

  // Drop all tables in correct dependency order
  await sql.unsafe(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO public;
  `);

  console.log("  ✓ Schema dropped and recreated");
  console.log("\nNext steps:");
  console.log("  pnpm db:push       # Re-apply Drizzle schema");
  console.log("  pnpm db:custom     # Re-apply RLS/GIN/triggers");
  console.log("  pnpm db:seed:dev   # Re-seed development data");

  await sql.end();
}

main().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
