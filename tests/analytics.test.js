import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/config/db.js";

describe("Analytics endpoints", () => {
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

  it("should return analytics summary", async () => {
    const response = await request(app)
      .get("/api/analytics/summary")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveProperty("transfers");
    expect(response.body.data).toHaveProperty("webhooks");

    expect(response.body.data.transfers).toHaveProperty("totalTransfers");
    expect(response.body.data.transfers).toHaveProperty("completedTransfers");
    expect(response.body.data.transfers).toHaveProperty("failedTransfers");
    expect(response.body.data.transfers).toHaveProperty("totalTransferredVolume");
    expect(response.body.data.transfers).toHaveProperty("successRate");
    expect(response.body.data.transfers).toHaveProperty("failedRate");

    expect(response.body.data.webhooks).toHaveProperty("totalWebhookEvents");
    expect(response.body.data.webhooks).toHaveProperty("deliveredWebhookEvents");
    expect(response.body.data.webhooks).toHaveProperty("failedWebhookEvents");
    expect(response.body.data.webhooks).toHaveProperty("deliveryRate");
  });

  it("should return top accounts by volume", async () => {
    const response = await request(app)
        .get("/api/analytics/top-accounts")
        .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(true);

    if (response.body.data.length > 0) {
        const account = response.body.data[0];

        expect(account).toHaveProperty("id");
        expect(account).toHaveProperty("alias");
        expect(account).toHaveProperty("currency");
        expect(account).toHaveProperty("totalVolume");
        expect(account).toHaveProperty("totalDebits");
        expect(account).toHaveProperty("totalCredits");
        expect(account).toHaveProperty("transactionCount");
    }
  });
    
  it("should return operational alerts", async () => {
    const response = await request(app)
        .get("/api/analytics/alerts")
        .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(true);

    if (response.body.data.length > 0) {
        const alert = response.body.data[0];

        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("details");
    }
  });

  it("should return analytics insights", async () => {
    const response = await request(app)
        .get("/api/analytics/insights")
        .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveProperty("insights");
    expect(response.body.data).toHaveProperty("smartAlerts");

    expect(Array.isArray(response.body.data.insights)).toBe(true);
    expect(Array.isArray(response.body.data.smartAlerts)).toBe(true);

    if (response.body.data.insights.length > 0) {
        const insight = response.body.data.insights[0];

        expect(insight).toHaveProperty("type");
        expect(insight).toHaveProperty("message");
    }
  });
});