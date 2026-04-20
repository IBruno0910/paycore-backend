import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/config/db.js";
import { redisConnection } from "../src/config/redis.js";
import { webhookQueue } from "../src/modules/webhooks/webhooks.queue.js";

describe("Transfers endpoints", () => {
  let accessToken;
  let sourceAccount;
  let destinationAccount;

  beforeAll(async () => {
    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "ignacio@example.com",
      password: "Password123",
    });

    accessToken = loginResponse.body.data.accessToken;

    const accounts = await prisma.account.findMany({
      where: {
        companyId: loginResponse.body.data.user.companyId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    sourceAccount = accounts[0];
    destinationAccount = accounts[1];
  });

    afterAll(async () => {
        await prisma.$disconnect();
    });

  it("should create a transfer successfully", async () => {
    const response = await request(app)
      .post("/api/transfers")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        sourceAccountId: sourceAccount.id,
        destinationAccountId: destinationAccount.id,
        amount: 10,
        description: "Test successful transfer",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Transfer completed successfully");
    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data.status).toBe("COMPLETED");
  });

  it("should fail when source account has insufficient balance", async () => {
    const response = await request(app)
      .post("/api/transfers")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        sourceAccountId: sourceAccount.id,
        destinationAccountId: destinationAccount.id,
        amount: 999999999,
        description: "Test failed transfer",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/Insufficient balance/i);
  });
});