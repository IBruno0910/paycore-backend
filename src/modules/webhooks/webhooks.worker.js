import { Worker } from "bullmq";
import { redisConnection } from "../../config/redis.js";
import { prisma } from "../../config/db.js";
import { dispatchWebhookEvent } from "./webhooks.dispatcher.js";
import { logger } from "../../shared/logger/logger.js";

export const webhookWorker = new Worker(
  "webhook-delivery",
  async (job) => {
    const { eventId } = job.data;

    logger.info(
      { job: "webhook-delivery", eventId },
      "Processing webhook job"
    );

    const event = await prisma.webhookEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error("Webhook event not found");
    }

    await dispatchWebhookEvent(event);
  },
  {
    connection: redisConnection,
  }
);

webhookWorker.on("completed", (job) => {
  logger.info(
    { jobId: job.id, queue: "webhook-delivery" },
    "Webhook job completed"
  );
});

webhookWorker.on("failed", (job, error) => {
  logger.error(
    {
      jobId: job?.id,
      queue: "webhook-delivery",
      error: error.message,
    },
    "Webhook job failed"
  );
});