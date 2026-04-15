import { prisma } from "../../config/db.js";

export const dispatchWebhookEvent = async (event) => {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      companyId: event.payload.companyId,
      isActive: true,
    },
  });

  for (const endpoint of endpoints) {
    try {
      await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType: event.eventType,
          data: event.payload,
        }),
      });

      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
        },
      });
    } catch (error) {
      await prisma.webhookEvent.update({
        where: { id: event.id },
        data: {
          status: "FAILED",
        },
      });
    }
  }
};