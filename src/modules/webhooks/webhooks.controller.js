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