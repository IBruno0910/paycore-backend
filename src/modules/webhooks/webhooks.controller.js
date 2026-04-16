import { prisma } from "../../config/db.js";

export const getWebhookEventsHandler = async (req, res, next) => {
  try {
    const events = await prisma.webhookEvent.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

export const createWebhookEndpointHandler = async (req, res, next) => {
  try {
    const { url } = req.body;

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        url,
        companyId: req.user.companyId,
      },
    });

    return res.status(201).json({
      success: true,
      data: endpoint,
    });
  } catch (error) {
    next(error);
  }
};

import { dispatchWebhookEvent } from "./webhooks.dispatcher.js";

export const retryWebhookEventHandler = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.webhookEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Webhook event not found",
      });
    }

    await dispatchWebhookEvent(event);

    return res.status(200).json({
      success: true,
      message: "Webhook retry triggered",
    });
  } catch (error) {
    next(error);
  }
};