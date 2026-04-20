import request from "supertest";
import app from "../src/app.js";
import { prisma } from "../src/config/db.js";
import { redisConnection } from "../src/config/redis.js";
import { webhookQueue } from "../src/modules/webhooks/webhooks.queue.js";

describe("Auth endpoints", () => {
    afterAll(async () => {
        await prisma.$disconnect();
    });

  it("should login successfully with valid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "ignacio@example.com",
      password: "Password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Login successful");
    expect(response.body.data).toHaveProperty("accessToken");
    expect(response.body.data).toHaveProperty("refreshToken");
    expect(response.body.data.user.email).toBe("ignacio@example.com");
  });

  it("should reject invalid credentials", async () => {
    const response = await request(app).post("/api/auth/login").send({
      email: "ignacio@example.com",
      password: "WrongPassword123",
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/Invalid credentials/i);
  });
});