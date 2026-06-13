import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { createAuthRouter } from "../../api/auth/auth.routes";
import { errorHandlerMiddleware } from "../../middleware/error.middleware";
import config from "../../config";

// We mock the config module so we can change client IDs dynamically in tests
vi.mock("../../config", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../config")>();
  return {
    default: {
      ...original.default,
      GOOGLE_CLIENT_ID: "mock-google-client-id",
      GOOGLE_CLIENT_SECRET: "mock-google-client-secret",
      GITHUB_CLIENT_ID: "mock-github-client-id",
      GITHUB_CLIENT_SECRET: "mock-github-client-secret",
      CLIENT_URL: "http://localhost:3000",
    },
  };
});

function createMockPrisma() {
  return {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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

describe("OAuth API Integration Tests", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let app: ReturnType<typeof createTestApp>;
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = createMockPrisma();
    app = createTestApp(prisma);

    // Default global fetch mock for Google and GitHub endpoints
    mockFetch = vi.fn().mockImplementation(async (url: string) => {
      if (
        url.includes("oauth2.googleapis.com/token") ||
        url.includes("github.com/login/oauth/access_token")
      ) {
        return {
          ok: true,
          json: async () => ({ access_token: "mock-access-token" }),
        };
      }
      if (url.includes("googleapis.com/oauth2/v3/userinfo")) {
        return {
          ok: true,
          json: async () => ({
            sub: "google-user-id",
            email: "google-user@test.com",
            name: "Google User",
          }),
        };
      }
      if (url.includes("api.github.com/user/emails")) {
        return {
          ok: true,
          json: async () => [
            { email: "github-fallback-email@test.com", primary: true, verified: true },
            { email: "github-secondary-email@test.com", primary: false, verified: true },
          ],
        };
      }
      if (url.includes("api.github.com/user")) {
        return {
          ok: true,
          json: async () => ({
            id: 12345,
            name: "GitHub User",
            login: "githubuser",
            email: "github-user@test.com",
          }),
        };
      }
      return { ok: false, status: 404 };
    });
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals(); // Cleans up fetch mocks after each test
  });

  // ── Google & GitHub Redirect Tests ──────────────────────────────────────────

  describe("GET /api/auth/google (Redirect)", () => {
    it("redirects to Google OAuth page when client ID is configured", async () => {
      const res = await request(app).get("/api/auth/google").expect(302);

      expect(res.headers.location).toContain(
        "https://accounts.google.com/o/oauth2/v2/auth",
      );

      const redirectUrl = new URL(res.headers.location);
      expect(redirectUrl.searchParams.get("client_id")).toBe("mock-google-client-id");
      expect(redirectUrl.searchParams.get("response_type")).toBe("code");
      expect(redirectUrl.searchParams.get("scope")).toBe("openid email profile");
    });

    it("returns 503 if Google OAuth is not configured", async () => {
      vi.mocked(config).GOOGLE_CLIENT_ID = "";

      const res = await request(app).get("/api/auth/google").expect(503);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Google OAuth is not configured");

      vi.mocked(config).GOOGLE_CLIENT_ID = "mock-google-client-id";
    });
  });

  describe("GET /api/auth/github (Redirect)", () => {
    it("redirects to GitHub OAuth page when client ID is configured", async () => {
      const res = await request(app).get("/api/auth/github").expect(302);

      expect(res.headers.location).toContain("https://github.com/login/oauth/authorize");

      const redirectUrl = new URL(res.headers.location);
      expect(redirectUrl.searchParams.get("client_id")).toBe("mock-github-client-id");
      expect(redirectUrl.searchParams.get("scope")).toBe("user:email read:user");
    });

    it("returns 503 if GitHub OAuth is not configured", async () => {
      vi.mocked(config).GITHUB_CLIENT_ID = "";

      const res = await request(app).get("/api/auth/github").expect(503);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("GitHub OAuth is not configured");

      vi.mocked(config).GITHUB_CLIENT_ID = "mock-github-client-id";
    });
  });

  // ── Google Callback Tests ───────────────────────────────────────────────────

  describe("GET /api/auth/google/callback", () => {
    it("redirects to login with error if no code is provided", async () => {
      const res = await request(app).get("/api/auth/google/callback").expect(302);

      expect(res.headers.location).toBe("http://localhost:3000/auth/login?error=no_code");
    });

    it("registers and logs in a new user when Google profile is retrieved successfully", async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null); // googleId check
      prisma.user.findUnique.mockResolvedValueOnce(null); // email check
      prisma.user.create.mockResolvedValue({
        id: "new-user-id",
        email: "google-user@test.com",
        name: "Google User",
      } as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);

      const res = await request(app)
        .get("/api/auth/google/callback?code=valid-code")
        .expect(302);

      expect(res.headers.location).toContain(
        "http://localhost:3000/auth/callback?token=",
      );
      expect(res.headers["set-cookie"][0]).toContain("refreshToken=");

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "google-user@test.com",
            name: "Google User",
            googleId: "google-user-id",
          }),
        }),
      );
    });

    it("logs in an existing user with matching Google ID", async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: "existing-user-id",
        email: "google-user@test.com",
        name: "Google User",
        googleId: "google-user-id",
      } as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);

      const res = await request(app)
        .get("/api/auth/google/callback?code=valid-code")
        .expect(302);

      expect(res.headers.location).toContain(
        "http://localhost:3000/auth/callback?token=",
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("links Google ID to an existing user with the same email", async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null); // googleId check
      prisma.user.findUnique.mockResolvedValueOnce({
        id: "existing-user-id",
        email: "google-user@test.com",
        name: "Google User",
        googleId: null,
      } as any); // email check
      prisma.user.update.mockResolvedValue({
        id: "existing-user-id",
        email: "google-user@test.com",
        name: "Google User",
        googleId: "google-user-id",
      } as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);

      const res = await request(app)
        .get("/api/auth/google/callback?code=valid-code")
        .expect(302);

      expect(res.headers.location).toContain(
        "http://localhost:3000/auth/callback?token=",
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "existing-user-id" },
          data: { googleId: "google-user-id" },
        }),
      );
    });

    it("returns 400 if Google token exchange fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      });

      const res = await request(app)
        .get("/api/auth/google/callback?code=invalid-code")
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("OAUTH_ERROR");
      expect(res.body.message).toContain("Failed to exchange Google authorization code");
    });

    it("returns 400 if Google userinfo profile fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "mock-access-token" }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      });

      const res = await request(app)
        .get("/api/auth/google/callback?code=valid-code")
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("OAUTH_ERROR");
      expect(res.body.message).toContain("Failed to fetch Google user profile");
    });
  });

  // ── GitHub Callback Tests ──────────────────────────────────────────────────

  describe("GET /api/auth/github/callback", () => {
    it("redirects to login with error if no code is provided", async () => {
      const res = await request(app).get("/api/auth/github/callback").expect(302);

      expect(res.headers.location).toBe("http://localhost:3000/auth/login?error=no_code");
    });

    it("registers and logs in a new user when GitHub profile has a public email", async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null); // githubId check
      prisma.user.findUnique.mockResolvedValueOnce(null); // email check
      prisma.user.create.mockResolvedValue({
        id: "new-user-id",
        email: "github-user@test.com",
        name: "GitHub User",
      } as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);

      const res = await request(app)
        .get("/api/auth/github/callback?code=valid-code")
        .expect(302);

      expect(res.headers.location).toContain(
        "http://localhost:3000/auth/callback?token=",
      );
      expect(res.headers["set-cookie"][0]).toContain("refreshToken=");

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "github-user@test.com",
            name: "GitHub User",
            githubId: "12345",
          }),
        }),
      );
    });

    it("falls back to emails endpoint if GitHub profile email is private/null", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "mock-access-token" }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 12345,
          name: "GitHub User",
          login: "githubuser",
          email: null,
        }),
      });

      prisma.user.findUnique.mockResolvedValueOnce(null); // githubId check
      prisma.user.findUnique.mockResolvedValueOnce(null); // email check
      prisma.user.create.mockResolvedValue({
        id: "new-user-id",
        email: "github-fallback-email@test.com",
        name: "GitHub User",
      } as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);

      const res = await request(app)
        .get("/api/auth/github/callback?code=valid-code")
        .expect(302);

      expect(res.headers.location).toContain(
        "http://localhost:3000/auth/callback?token=",
      );

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "github-fallback-email@test.com",
            githubId: "12345",
          }),
        }),
      );
    });

    it("logs in an existing user with matching GitHub ID", async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: "existing-user-id",
        email: "github-user@test.com",
        name: "GitHub User",
        githubId: "12345",
      } as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);

      const res = await request(app)
        .get("/api/auth/github/callback?code=valid-code")
        .expect(302);

      expect(res.headers.location).toContain(
        "http://localhost:3000/auth/callback?token=",
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("links GitHub ID to an existing user with the same email", async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null); // githubId check
      prisma.user.findUnique.mockResolvedValueOnce({
        id: "existing-user-id",
        email: "github-user@test.com",
        name: "GitHub User",
        githubId: null,
      } as any); // email check
      prisma.user.update.mockResolvedValue({
        id: "existing-user-id",
        email: "github-user@test.com",
        name: "GitHub User",
        githubId: "12345",
      } as any);
      prisma.refreshToken.create.mockResolvedValue({} as any);

      const res = await request(app)
        .get("/api/auth/github/callback?code=valid-code")
        .expect(302);

      expect(res.headers.location).toContain(
        "http://localhost:3000/auth/callback?token=",
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "existing-user-id" },
          data: { githubId: "12345" },
        }),
      );
    });

    it("returns 400 if GitHub callback cannot retrieve a verified email", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "mock-access-token" }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 12345,
          name: "GitHub User",
          login: "githubuser",
          email: null,
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { email: "github-private@test.com", primary: false, verified: false },
        ],
      });

      const res = await request(app)
        .get("/api/auth/github/callback?code=valid-code")
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("OAUTH_ERROR");
      expect(res.body.message).toContain(
        "Could not retrieve a verified email from your GitHub account",
      );
    });

    it("returns 400 if GitHub token exchange fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      });

      const res = await request(app)
        .get("/api/auth/github/callback?code=invalid-code")
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe("OAUTH_ERROR");
    });
  });
});
