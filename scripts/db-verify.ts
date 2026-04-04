/**
 * Verify database connection and table existence.
 * Run: pnpm db:verify
 */

import postgres from "postgres";

const EXPECTED_TABLES = [
  "tenants", "users", "invitations", "admin_users",
  "subscriptions", "billing_events",
  "shops", "products",
  "creators", "creator_lists", "creator_list_members", "creator_relationships",
  "outreach_templates", "outreach_campaigns", "outreach_messages",
  "samples", "contents", "spark_codes",
  "contests", "contest_participants", "competitor_brands",
  "notifications", "webhook_events", "system_configs",
  "ai_usage_logs", "rate_limit_buckets", "activity_logs",
];

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

  console.log("🔍 Verifying database...\n");

  // 1. Connection test
  try {
    const result = await sql`SELECT NOW() as now`;
    console.log(`  ✓ Connected at ${result[0].now}`);
  } catch {
    console.error("  ✗ Connection failed");
    process.exit(1);
  }

  // 2. Table existence
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;
  const existingTables = new Set(tables.map((t) => t.table_name));

  let missing = 0;
  for (const table of EXPECTED_TABLES) {
    if (existingTables.has(table)) {
      console.log(`  ✓ ${table}`);
    } else {
      console.log(`  ✗ ${table} — MISSING`);
      missing++;
    }
  }

  // 3. Row counts for key tables
  console.log("\n  Row counts:");
  for (const table of ["tenants", "users", "creators", "outreach_messages"]) {
    if (existingTables.has(table)) {
      const count = await sql.unsafe(`SELECT count(*) FROM ${table}`);
      console.log(`    ${table}: ${count[0].count}`);
    }
  }

  // 4. RLS check
  const rlsTables = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND rowsecurity = true
  `;
  console.log(`\n  RLS enabled: ${rlsTables.length} tables`);

  await sql.end();

  if (missing > 0) {
    console.log(`\n⚠️  ${missing} tables missing. Run: pnpm db:push`);
    process.exit(1);
  } else {
    console.log("\n✅ All 27 tables verified.");
  }
}

main().catch((err) => {
  console.error("Verify failed:", err);
  process.exit(1);
});
