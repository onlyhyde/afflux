/**
 * BullMQ Worker entry point.
 * Run: pnpm worker:dev
 *
 * This is a separate Node.js process from the Next.js app.
 * It processes background jobs from Redis queues.
 */

import "dotenv/config";
import { Worker } from "bullmq";
import { redis } from "@/lib/queue/connection";
import { processOutreachDm } from "./handlers/outreach-dm";
import { processOutreachEmail } from "./handlers/outreach-email";
import { processNotification } from "./handlers/notification";

console.log("🚀 Starting BullMQ workers...\n");

const workers = [
  new Worker("outreach:dm", processOutreachDm, {
    connection: redis,
    concurrency: 5,
  }),
  new Worker("outreach:email", processOutreachEmail, {
    connection: redis,
    concurrency: 10,
  }),
  new Worker("notification", processNotification, {
    connection: redis,
    concurrency: 10,
  }),
  // Additional workers will be added as features are implemented:
  // new Worker("outreach:invite", processOutreachInvite, { connection: redis, concurrency: 5 }),
  // new Worker("tiktok:sync", processTiktokSync, { connection: redis, concurrency: 3 }),
  // new Worker("ai:match", processAiMatch, { connection: redis, concurrency: 2 }),
  // new Worker("spark:check", processSparkCheck, { connection: redis, concurrency: 1 }),
  // new Worker("data:cleanup", processDataCleanup, { connection: redis, concurrency: 1 }),
  // new Worker("billing:webhook", processBillingWebhook, { connection: redis, concurrency: 5 }),
];

for (const worker of workers) {
  worker.on("completed", (job) => {
    console.log(`✓ [${worker.name}] Job ${job.id} completed`);
  });
  worker.on("failed", (job, err) => {
    console.error(`✗ [${worker.name}] Job ${job?.id} failed:`, err.message);
  });
  console.log(`  Worker registered: ${worker.name}`);
}

console.log(`\n✅ ${workers.length} workers running. Waiting for jobs...\n`);

// Graceful shutdown
async function shutdown() {
  console.log("\nShutting down workers...");
  await Promise.all(workers.map((w) => w.close()));
  await redis.quit();
  console.log("Workers stopped.");
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
