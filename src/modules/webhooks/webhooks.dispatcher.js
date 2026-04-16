import { prisma } from "../../config/db.js";
import { generateWebhookSignature } from "./webhooks.signature.js";

export const dispatchWebhookEvent = async (event) => {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      companyId: event.payload.companyId,
      isActive: true,
    },
  });

  for (const endpoint of endpoints) {
    try {
      const payload = {
            eventType: event.eventType,
            data: event.payload,
        };

        const signature = generateWebhookSignature(payload, endpoint.secret || "");

        await fetch(endpoint.url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-PayCore-Signature": signature,
        },
        body: JSON.stringify(payload),
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