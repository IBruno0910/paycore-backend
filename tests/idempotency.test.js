import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/config/db.js";
import { redisConnection } from "../src/config/redis.js";
import { webhookQueue } from "../src/modules/webhooks/webhooks.queue.js";

describe("Idempotency - Transfers", () => {
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

  it("should not create duplicate transfers with same idempotency key", async () => {
    const idempotencyKey = `test-idem-${Date.now()}`;

    const payload = {
      sourceAccountId: sourceAccount.id,
      destinationAccountId: destinationAccount.id,
      amount: 20,
      description: "Idempotency test",
    };

    const firstResponse = await request(app)
      .post("/api/transfers")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Idempotency-Key", idempotencyKey)
      .send(payload);

    const secondResponse = await request(app)
      .post("/api/transfers")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Idempotency-Key", idempotencyKey)
      .send(payload);

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(200);

    expect(firstResponse.body.data.id).toBe(
      secondResponse.body.data.id
    );
  });
});