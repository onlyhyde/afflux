/**
 * Development seed — generates realistic random data for local development.
 * Run: pnpm db:seed:dev
 *
 * Generates:
 * - 3 tenants (free, starter, growth plans)
 * - 10 users across tenants
 * - 5 shops
 * - 20 products
 * - 500 creators
 * - 10 creator lists with members
 * - 100 creator relationships (CRM)
 * - 15 outreach templates (en/ko)
 * - 10 outreach campaigns
 * - 1000 outreach messages
 * - 200 contents
 * - 50 spark codes
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../src/lib/db/schema";
import crypto from "crypto";

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

// ── Helpers ──────────────────────────────────────

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number) {
  return new Date(Date.now() - randomInt(0, daysBack) * 86400000);
}

const CATEGORIES = [
  "Beauty", "Fashion", "Food", "Tech", "Fitness",
  "Home", "Pets", "Gaming", "Travel", "Education",
];
const COUNTRIES = ["US", "KR", "GB", "JP", "ID", "TH", "VN", "MY", "MX", "SG"];
const CONTENT_STYLES = [
  ["review", "tutorial"], ["unboxing", "haul"], ["vlog", "grwm"],
  ["comparison", "top-list"], ["before-after", "transformation"],
];
const PIPELINE_STAGES = [
  "discovered", "contacted", "negotiating", "active", "inactive",
] as const;

// ── Generators ───────────────────────────────────

function generateCreator(i: number) {
  const category = randomPick(CATEGORIES);
  const country = randomPick(COUNTRIES);
  const followers = randomInt(1000, 5000000);
  const genderMale = Math.random();
  const genderFemale = Math.max(0, 1 - genderMale - Math.random() * 0.05);

  return {
    tiktokId: `tt_${i.toString().padStart(8, "0")}`,
    username: `creator_${category.toLowerCase()}_${i}`,
    displayName: `${category} Creator ${i}`,
    bio: `${category} content creator sharing tips and reviews. Based in ${country}.`,
    avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=creator${i}`,
    followers,
    following: randomInt(100, 5000),
    totalVideos: randomInt(10, 2000),
    avgViews: randomInt(500, Math.floor(followers * 0.3)),
    avgLikes: randomInt(50, Math.floor(followers * 0.05)),
    engagementRate: (Math.random() * 10 + 0.5).toFixed(4),
    gmv: (Math.random() * 500000).toFixed(2),
    totalSales: randomInt(0, 10000),
    aov: (Math.random() * 100 + 10).toFixed(2),
    category,
    subcategories: [category.toLowerCase(), randomPick(CATEGORIES).toLowerCase()],
    country,
    language: country === "KR" ? "ko" : country === "JP" ? "ja" : "en",
    email: `creator${i}@example.com`,
    trustScore: randomInt(30, 100),
    audienceDemographics: {
      genderSplit: {
        male: Math.round(genderMale * 100),
        female: Math.round(genderFemale * 100),
        other: Math.round(Math.max(0, 1 - genderMale - genderFemale) * 100),
      },
      ageGroups: {
        "13-17": randomInt(5, 20),
        "18-24": randomInt(20, 40),
        "25-34": randomInt(20, 35),
        "35-44": randomInt(5, 20),
        "45+": randomInt(2, 10),
      },
      topCountries: { [country]: randomInt(40, 80), US: randomInt(10, 30) },
    },
    contentStyles: randomPick(CONTENT_STYLES),
    isTiktokShopCreator: Math.random() > 0.3,
    lastActiveAt: randomDate(30),
    dataUpdatedAt: new Date(),
  };
}

// ── Main ─────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding development data...\n");

  // 0. Clean existing seed data (reverse dependency order)
  console.log("  Cleaning existing data...");
  await db.delete(schema.sparkCodes);
  await db.delete(schema.contents);
  await db.delete(schema.outreachMessages);
  await db.delete(schema.outreachCampaigns);
  await db.delete(schema.outreachTemplates);
  await db.delete(schema.creatorRelationships);
  await db.delete(schema.creatorListMembers);
  await db.delete(schema.creatorLists);
  await db.delete(schema.creators);
  await db.delete(schema.products);
  await db.delete(schema.shops);
  await db.delete(schema.users);
  await db.delete(schema.tenants);
  console.log("    ✓ cleaned");

  // 1. Tenants
  console.log("  Tenants...");
  const tenantRows = await db
    .insert(schema.tenants)
    .values([
      { name: "Demo Free Corp", plan: "free", locale: "en", currency: "USD" },
      { name: "Demo Starter Inc", plan: "starter", locale: "en", currency: "USD" },
      { name: "데모 Growth 주식회사", plan: "growth", locale: "ko", currency: "KRW", timezone: "Asia/Seoul" },
    ])
    .returning();
  console.log(`    ✓ ${tenantRows.length} tenants`);

  // 2. Users
  console.log("  Users...");
  const userValues = [];
  const roles: Array<"owner" | "admin" | "manager" | "viewer"> = ["owner", "admin", "manager", "viewer"];
  for (const tenant of tenantRows) {
    for (let j = 0; j < roles.length; j++) {
      userValues.push({
        tenantId: tenant.id,
        email: `${roles[j]}@${tenant.name.toLowerCase().replace(/\s+/g, "")}.com`,
        name: `${roles[j].charAt(0).toUpperCase() + roles[j].slice(1)} User`,
        role: roles[j] as "owner" | "admin" | "manager" | "viewer",
        locale: tenant.locale,
      });
    }
  }
  const userRows = await db.insert(schema.users).values(userValues).returning();
  console.log(`    ✓ ${userRows.length} users`);

  // 3. Shops
  console.log("  Shops...");
  const shopValues = tenantRows.flatMap((t, i) => [
    { tenantId: t.id, name: `Shop ${i * 2 + 1}`, category: randomPick(CATEGORIES), tiktokShopId: `ts_${i * 2 + 1}` },
    { tenantId: t.id, name: `Shop ${i * 2 + 2}`, category: randomPick(CATEGORIES), tiktokShopId: `ts_${i * 2 + 2}` },
  ]);
  const shopRows = await db.insert(schema.shops).values(shopValues).returning();
  console.log(`    ✓ ${shopRows.length} shops`);

  // 4. Products
  console.log("  Products...");
  const productValues = shopRows.flatMap((shop) =>
    Array.from({ length: 4 }, (_, i) => ({
      shopId: shop.id,
      tenantId: shop.tenantId,
      name: `${randomPick(CATEGORIES)} Product ${i + 1}`,
      category: randomPick(CATEGORIES),
      price: (Math.random() * 200 + 5).toFixed(2),
      commissionRate: (Math.random() * 20 + 5).toFixed(2),
      targetGender: randomPick(["male", "female", "all"] as const),
      targetAgeMin: randomPick([18, 20, 25]),
      targetAgeMax: randomPick([35, 40, 45, 55]),
    }))
  );
  const productRows = await db.insert(schema.products).values(productValues).returning();
  console.log(`    ✓ ${productRows.length} products`);

  // 5. Creators (500)
  console.log("  Creators (500)...");
  const creatorBatch = Array.from({ length: 500 }, (_, i) => generateCreator(i + 1));
  for (let i = 0; i < creatorBatch.length; i += 100) {
    const chunk = creatorBatch.slice(i, i + 100);
    await db.insert(schema.creators).values(chunk);
    console.log(`    ${Math.min(i + 100, 500)}/500`);
  }
  const allCreators = await db.select({ id: schema.creators.id }).from(schema.creators);
  console.log(`    ✓ ${allCreators.length} creators`);

  // 6. Creator Lists
  console.log("  Creator lists...");
  const listValues = tenantRows.flatMap((t) =>
    Array.from({ length: 5 }, (_, i) => ({
      tenantId: t.id,
      name: `${randomPick(CATEGORIES)} Creators #${i + 1}`,
    }))
  );
  const listRows = await db.insert(schema.creatorLists).values(listValues).returning();

  // Add members
  const memberValues = listRows.flatMap((list) => {
    const members = Array.from({ length: randomInt(5, 20) }, () => randomPick(allCreators));
    const unique = [...new Map(members.map((m) => [m.id, m])).values()];
    return unique.map((m) => ({
      tenantId: list.tenantId,
      listId: list.id,
      creatorId: m.id,
    }));
  });
  await db.insert(schema.creatorListMembers).values(memberValues);
  console.log(`    ✓ ${listRows.length} lists, ${memberValues.length} members`);

  // 7. Creator Relationships (CRM)
  console.log("  CRM relationships...");
  const relValues = tenantRows.flatMap((t) => {
    const selected = allCreators.slice(0, 50);
    return selected.map((c, i) => ({
      tenantId: t.id,
      creatorId: c.id,
      stage: PIPELINE_STAGES[i % 5],
      tags: [randomPick(CATEGORIES).toLowerCase()],
      lastContactedAt: i % 5 > 0 ? randomDate(30) : null,
    }));
  });
  await db.insert(schema.creatorRelationships).values(relValues);
  console.log(`    ✓ ${relValues.length} relationships`);

  // 8. Outreach Templates
  console.log("  Outreach templates...");
  const templateValues = tenantRows.flatMap((t) => [
    { tenantId: t.id, name: "Initial DM", locale: "en", channel: "tiktok_dm" as const, body: "Hi {{creator_name}}! We'd love to work with you on {{product_name}}. {{commission_rate}}% commission!" },
    { tenantId: t.id, name: "Initial DM", locale: "ko", channel: "tiktok_dm" as const, body: "안녕하세요 {{creator_name}}님! {{product_name}} 협업을 제안드립니다. {{commission_rate}}% 수수료!" },
    { tenantId: t.id, name: "Follow Up", locale: "en", channel: "email" as const, subject: "Partnership with {{brand_name}}", body: "Hi {{creator_name}},\n\nJust following up on our previous message..." },
    { tenantId: t.id, name: "Collab Invite", locale: "en", channel: "tiktok_invite" as const, body: "Check out {{product_name}} - {{commission_rate}}% commission!" },
  ]);
  await db.insert(schema.outreachTemplates).values(templateValues);
  console.log(`    ✓ ${templateValues.length} templates`);

  // 9. Outreach Campaigns
  console.log("  Campaigns + messages...");
  const campaignValues = tenantRows.flatMap((t) =>
    Array.from({ length: 5 }, (_, i) => ({
      tenantId: t.id,
      name: `${randomPick(CATEGORIES)} Campaign ${i + 1}`,
      status: randomPick(["draft", "running", "completed", "scheduled"] as const),
    }))
  );
  const campaignRows = await db.insert(schema.outreachCampaigns).values(campaignValues).returning();

  // 10. Outreach Messages (1000)
  const msgValues = campaignRows.flatMap((c) =>
    Array.from({ length: 100 }, () => ({
      tenantId: c.tenantId,
      campaignId: c.id,
      creatorId: randomPick(allCreators).id,
      channel: randomPick(["tiktok_dm", "email", "tiktok_invite"] as const),
      status: randomPick(["sent", "delivered", "opened", "replied", "failed"] as const),
      body: "Automated outreach message",
      sentAt: randomDate(30),
    }))
  );
  for (let i = 0; i < msgValues.length; i += 200) {
    await db.insert(schema.outreachMessages).values(msgValues.slice(i, i + 200));
  }
  console.log(`    ✓ ${campaignRows.length} campaigns, ${msgValues.length} messages`);

  // 11. Contents
  console.log("  Contents...");
  const contentValues = Array.from({ length: 200 }, (_, i) => ({
    tenantId: randomPick(tenantRows).id,
    creatorId: randomPick(allCreators).id,
    productId: randomPick(productRows).id,
    tiktokVideoId: `vid_${i}`,
    title: `${randomPick(CATEGORIES)} Review #${i}`,
    views: randomInt(100, 1000000),
    likes: randomInt(10, 50000),
    comments: randomInt(0, 5000),
    shares: randomInt(0, 2000),
    conversions: randomInt(0, 500),
    gmv: (Math.random() * 10000).toFixed(2),
    publishedAt: randomDate(60),
  }));
  await db.insert(schema.contents).values(contentValues);
  console.log(`    ✓ ${contentValues.length} contents`);

  // 12. Spark Codes
  console.log("  Spark codes...");
  const sparkValues = Array.from({ length: 50 }, (_, i) => ({
    tenantId: randomPick(tenantRows).id,
    creatorId: randomPick(allCreators).id,
    code: crypto.randomUUID().slice(0, 12),
    status: randomPick(["requested", "received", "active", "expired"] as const),
    expiresAt: new Date(Date.now() + randomInt(-10, 30) * 86400000),
  }));
  await db.insert(schema.sparkCodes).values(sparkValues);
  console.log(`    ✓ ${sparkValues.length} spark codes`);

  await client.end();
  console.log("\n✅ Development seed complete!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
