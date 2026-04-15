import { prisma } from "../../config/db.js";

export const createWebhookEvent = async ({
  eventType,
  entityType,
  entityId,
  payload,
  status = "PENDING",
}) => {
  const event = await prisma.webhookEvent.create({
    data: {
      eventType,
      entityType,
      entityId,
      payload,
      status,
    },
  });

  return event;
};