import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { createAuthRouter } from "../../api/auth/auth.routes";
import { errorHandlerMiddleware } from "../../middleware/error.middleware";

function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
  };
}

function createTestApp(prisma: any) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", createAuthRouter(prisma));
  app.use(errorHandlerMiddleware);
  return app;
}

describe("Auth API", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    app = createTestApp(prisma);
  });

  describe("POST /api/auth/register", () => {
    it("registers a new user and returns tokens", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: "user-1",
        email: "new@test.com",
        name: "New User",
        password: "hashed",
      });
      prisma.refreshToken.create.mockResolvedValue({});

      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "new@test.com", password: "password123", name: "New User" })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("new@test.com");
      expect(res.body.data.accessToken).toBeDefined();
    });

    it("returns 400 when email is missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ password: "password123", name: "User" })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it("returns 400 when email already exists", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "existing" } as any);

      const res = await request(app)
        .post("/api/auth/register")
        .send({ email: "existing@test.com", password: "password123", name: "User" })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/auth/login", () => {
    it("logs in and returns tokens", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        name: "Test User",
        password: "$2a$12$dummyhash", // won't match, but we mock the bcrypt
      } as any);
      prisma.refreshToken.create.mockResolvedValue({});

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@test.com", password: "password123" })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it("returns 401 for invalid credentials", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "wrong@test.com", password: "wrong" })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
