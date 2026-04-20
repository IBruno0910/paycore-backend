import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/config/db.js";

describe("Webhook endpoints", () => {
  let accessToken;

  beforeAll(async () => {
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "ignacio@example.com",
      password: "Password123",
    });

    accessToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should return webhook events", async () => {
    const response = await request(app)
      .get("/api/webhooks/events")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);

    if (response.body.data.length > 0) {
      const event = response.body.data[0];

      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("eventType");
      expect(event).toHaveProperty("entityType");
      expect(event).toHaveProperty("entityId");
      expect(event).toHaveProperty("status");
      expect(event).toHaveProperty("payload");
      expect(event).toHaveProperty("createdAt");
    }
  });

  it("should create a webhook endpoint", async () => {
    const uniqueUrl = `https://example.com/webhook/${Date.now()}`;

    const response = await request(app)
      .post("/api/webhooks/endpoints")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        url: uniqueUrl,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data).toHaveProperty("companyId");
    expect(response.body.data).toHaveProperty("url");
    expect(response.body.data).toHaveProperty("isActive");
    expect(response.body.data.url).toBe(uniqueUrl);
    expect(response.body.data.isActive).toBe(true);
  });

  it("should retry a webhook event", async () => {
    const existingEvent = await prisma.webhookEvent.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    expect(existingEvent).toBeTruthy();

    const response = await request(app)
      .post(`/api/webhooks/events/${existingEvent.id}/retry`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Webhook retry triggered");
  });
});