/**
 * Seed script — populates the creators table with sample data for development.
 * Run with: pnpm db:seed
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { creators } from "../src/lib/db/schema";

const CATEGORIES = [
  "Beauty", "Fashion", "Food", "Tech", "Fitness",
  "Home", "Pets", "Gaming", "Travel", "Education",
];

const COUNTRIES = ["US", "KR", "GB", "JP", "ID", "TH", "VN", "MY", "MX", "SG"];

const CONTENT_STYLES = [
  ["review", "tutorial"],
  ["unboxing", "haul"],
  ["vlog", "grwm"],
  ["comparison", "top-list"],
  ["before-after", "transformation"],
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCreator(index: number) {
  const category = randomPick(CATEGORIES);
  const country = randomPick(COUNTRIES);
  const followers = randomInt(1000, 5000000);
  const engagementRate = (Math.random() * 10 + 0.5).toFixed(4);
  const gmv = (Math.random() * 500000).toFixed(2);
  const genderMale = Math.random();
  const genderFemale = 1 - genderMale - Math.random() * 0.05;

  return {
    tiktokId: `tt_${index.toString().padStart(8, "0")}`,
    username: `creator_${category.toLowerCase()}_${index}`,
    displayName: `${category} Creator ${index}`,
    bio: `${category} content creator sharing tips and reviews. Based in ${country}.`,
    avatarUrl: `https://api.dicebear.com/9.x/avataaars/svg?seed=creator${index}`,
    followers,
    following: randomInt(100, 5000),
    totalVideos: randomInt(10, 2000),
    avgViews: randomInt(500, followers * 0.3),
    avgLikes: randomInt(50, followers * 0.05),
    engagementRate,
    gmv,
    totalSales: randomInt(0, 10000),
    aov: (Math.random() * 100 + 10).toFixed(2),
    category,
    subcategories: [category.toLowerCase(), randomPick(CATEGORIES).toLowerCase()],
    country,
    language: country === "KR" ? "ko" : country === "JP" ? "ja" : "en",
    email: `creator${index}@example.com`,
    trustScore: randomInt(30, 100),
    audienceDemographics: {
      genderSplit: {
        male: Math.round(genderMale * 100),
        female: Math.round(Math.max(0, genderFemale) * 100),
        other: Math.round(Math.max(0, 1 - genderMale - Math.max(0, genderFemale)) * 100),
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
    lastActiveAt: new Date(Date.now() - randomInt(0, 30) * 86400000),
    dataUpdatedAt: new Date(),
  };
}

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client);

  console.log("Seeding 200 creators...");

  const batch = Array.from({ length: 200 }, (_, i) => generateCreator(i + 1));

  // Insert in batches of 50
  for (let i = 0; i < batch.length; i += 50) {
    const chunk = batch.slice(i, i + 50);
    await db.insert(creators).values(chunk);
    console.log(`  Inserted ${Math.min(i + 50, batch.length)}/${batch.length}`);
  }

  console.log("Seed complete.");
}

main().catch(console.error);
