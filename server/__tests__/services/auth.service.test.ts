import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "../../api/auth/auth.service";
import { ValidationError, ApiError } from "../../utils/errors";

function createMockAuthRepository() {
  return {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    createRefreshToken: vi.fn(),
    findRefreshToken: vi.fn(),
    deleteRefreshToken: vi.fn(),
    deleteUserRefreshTokens: vi.fn(),
  };
}

describe("AuthService", () => {
  let repo: ReturnType<typeof createMockAuthRepository>;
  let service: AuthService;

  beforeEach(() => {
    repo = createMockAuthRepository();
    service = new AuthService(repo as any);
  });

  describe("register", () => {
    const validData = {
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    };

    it("registers a new user and returns tokens", async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        password: "hashed",
      });
      repo.createRefreshToken.mockResolvedValue({});

      const result = await service.register(validData);

      expect(repo.create).toHaveBeenCalledWith({
        email: "test@example.com",
        password: expect.any(String),
        name: "Test User",
      });
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("throws ValidationError when email is missing", async () => {
      await expect(
        service.register({ email: "", password: "pass123", name: "Test" }),
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when password is too short", async () => {
      await expect(
        service.register({
          email: "test@test.com",
          password: "12345",
          name: "Test",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when name is missing", async () => {
      await expect(
        service.register({
          email: "test@test.com",
          password: "password123",
          name: "",
        }),
      ).rejects.toThrow(ValidationError);
    });

    it("throws ValidationError when email already exists", async () => {
      repo.findByEmail.mockResolvedValue({ id: "existing" } as any);

      await expect(service.register(validData)).rejects.toThrow(ValidationError);
    });
  });

  describe("login", () => {
    it("throws ApiError with invalid credentials when user not found", async () => {
      repo.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: "nonexistent@test.com", password: "pass" }),
      ).rejects.toThrow(ApiError);
    });

    it("throws ApiError when email or password missing", async () => {
      await expect(service.login({ email: "", password: "" })).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe("refresh", () => {
    it("throws ApiError when refresh token not found", async () => {
      repo.findRefreshToken.mockResolvedValue(null);

      await expect(service.refresh("invalid-token")).rejects.toThrow(ApiError);
    });

    it("throws ApiError when refresh token expired", async () => {
      repo.findRefreshToken.mockResolvedValue({
        expiresAt: new Date(Date.now() - 1000),
        userId: "user-1",
      } as any);

      await expect(service.refresh("expired-token")).rejects.toThrow(ApiError);
    });

    it("returns a new access token for a valid refresh token", async () => {
      repo.findRefreshToken.mockResolvedValue({
        expiresAt: new Date(Date.now() + 100000),
        userId: "user-1",
      } as any);
      repo.findById.mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        name: "Test",
      } as any);

      const result = await service.refresh("valid-token");

      expect(result.accessToken).toBeDefined();
      expect(result.user.id).toBe("user-1");
    });
  });

  describe("logout", () => {
    it("deletes the refresh token", async () => {
      await service.logout("some-token");
      expect(repo.deleteRefreshToken).toHaveBeenCalledWith("some-token");
    });
  });
});
