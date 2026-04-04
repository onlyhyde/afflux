import IORedis from "ioredis";

export const redis = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
  retryStrategy: (times) => Math.min(times * 200, 5000),
});
