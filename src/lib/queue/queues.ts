import { Queue } from "bullmq";
import { redis } from "./connection";

/**
 * Queue definitions — matching 10-QUEUE-DESIGN.md spec.
 * 9 queues total.
 */

export const outreachDmQueue = new Queue("outreach:dm", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

export const outreachEmailQueue = new Queue("outreach:email", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

export const outreachInviteQueue = new Queue("outreach:invite", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

export const tiktokSyncQueue = new Queue("tiktok:sync", {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "fixed", delay: 60000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 2000 },
  },
});

export const aiMatchQueue = new Queue("ai:match", {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 30000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  },
});

export const notificationQueue = new Queue("notification", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

export const sparkCheckQueue = new Queue("spark:check", {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 60000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

export const dataCleanupQueue = new Queue("data:cleanup", {
  connection: redis,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});

export const billingWebhookQueue = new Queue("billing:webhook", {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});
