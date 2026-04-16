import { Queue } from "bullmq";
import { redisConnection } from "../../config/redis.js";

export const webhookQueue = new Queue("webhook-delivery", {
  connection: redisConnection,
});

export const enqueueWebhookEvent = async (eventId) => {
  await webhookQueue.add(
    "dispatch-webhook",
    { eventId },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
};