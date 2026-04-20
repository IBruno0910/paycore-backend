import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/config/db.js";
import { redisConnection } from "../src/config/redis.js";
import { webhookQueue } from "../src/modules/webhooks/webhooks.queue.js";

describe("Health endpoint", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should return API running status", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "PayCore API is running",
    });
  });
});