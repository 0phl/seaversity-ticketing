import "dotenv/config";
import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";

// Load REDIS_URL from environment (with password)
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
console.log("Connecting to Redis...");

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

console.log("Worker starting...");

// Email queue worker
const emailWorker = new Worker(
  "email",
  async (job) => {
    console.log(`Processing email job ${job.id}:`, job.data);
    // Email processing logic will be implemented here
  },
  { connection }
);

emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  await emailWorker.close();
  await connection.quit();
  process.exit(0);
});

console.log("Worker is running. Press Ctrl+C to stop.");
