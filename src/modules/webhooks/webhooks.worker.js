import { Worker } from "bullmq";
import { redisConnection } from "../../config/redis.js";
import { prisma } from "../../config/db.js";
import { dispatchWebhookEvent } from "./webhooks.dispatcher.js";

export const webhookWorker = new Worker(
  "webhook-delivery",
  async (job) => {
    const { eventId } = job.data;

    console.log("Processing webhook job:", eventId);

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