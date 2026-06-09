import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../../config";
import { AuthRepository } from "./auth.repository";
import { ValidationError, ApiError } from "../../utils/errors";
import { OAuthProfile } from "./auth.types";

// ─── Service ─────────────────────────────────────────────────────────────────

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  // ── Email / Password ────────────────────────────────────────────────────────

  async register(data: { email: string; password: string; name: string }) {
    const { email, password, name } = data;

    if (!email || !email.trim()) {
      throw new ValidationError("Email is required");
    }

    if (!password || password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters");
    }

    if (!name || !name.trim()) {
      throw new ValidationError("Name is required");
    }

    const existing = await this.authRepository.findByEmail(email);

    if (existing) {
      throw new ValidationError("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.authRepository.create({
      email,
      password: hashedPassword,
      name,
    });

    const tokens = await this.generateTokens(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    };
  }

  async login(data: { email: string; password: string }) {
    const { email, password } = data;

    if (!email || !password) {
      throw new ValidationError("Email and password are required");
    }

    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      throw new ApiError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    // Block OAuth-only users from using password login
    if (!user.password) {
      throw new ApiError(
        "This account uses Google or GitHub login. Please sign in with the appropriate provider.",
        400,
        "OAUTH_USER",
      );
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      throw new ApiError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    const tokens = await this.generateTokens(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    };
  }

  // ── OAuth ────────────────────────────────────────────────────────────────────

  async googleLogin(code: string) {
    if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
      throw new ApiError("Google OAuth is not configured", 503, "OAUTH_NOT_CONFIGURED");
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.GOOGLE_CLIENT_ID,
        client_secret: config.GOOGLE_CLIENT_SECRET,
        redirect_uri: config.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      throw new ApiError(
        "Failed to exchange Google authorization code",
        400,
        "OAUTH_ERROR",
      );
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      throw new ApiError("Failed to fetch Google user profile", 400, "OAUTH_ERROR");
    }

    const profile = (await profileRes.json()) as {
      sub: string;
      email: string;
      name: string;
    };

    const oauthProfile: OAuthProfile = {
      id: profile.sub,
      email: profile.email,
      name: profile.name,
    };

    return this.findOrCreateOAuthUser(oauthProfile, "google");
  }

  async githubLogin(code: string) {
    if (!config.GITHUB_CLIENT_ID || !config.GITHUB_CLIENT_SECRET) {
      throw new ApiError("GitHub OAuth is not configured", 503, "OAUTH_NOT_CONFIGURED");
    }

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: config.GITHUB_CLIENT_ID,
        client_secret: config.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: config.GITHUB_CALLBACK_URL,
      }),
    });

    if (!tokenRes.ok) {
      throw new ApiError(
        "Failed to exchange GitHub authorization code",
        400,
        "OAUTH_ERROR",
      );
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };

    const profileRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
      },
    });

    if (!profileRes.ok) {
      throw new ApiError("Failed to fetch GitHub user profile", 400, "OAUTH_ERROR");
    }

    const profile = (await profileRes.json()) as {
      id: number;
      name: string | null;
      login: string;
      email: string | null;
    };

    let email = profile.email;
    if (!email) {
      const emailsRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/vnd.github+json",
        },
      });

      if (emailsRes.ok) {
        const emails = (await emailsRes.json()) as Array<{
          email: string;
          primary: boolean;
          verified: boolean;
        }>;
        const primaryEmail = emails.find((e) => e.primary && e.verified);
        email = primaryEmail?.email ?? null;
      }
    }

    if (!email) {
      throw new ApiError(
        "Could not retrieve a verified email from your GitHub account.",
        400,
        "OAUTH_ERROR",
      );
    }

    const oauthProfile: OAuthProfile = {
      id: String(profile.id),
      email,
      name: profile.name ?? profile.login,
    };

    return this.findOrCreateOAuthUser(oauthProfile, "github");
  }

  private async findOrCreateOAuthUser(
    profile: OAuthProfile,
    provider: "google" | "github",
  ) {
    const idField = provider === "google" ? "googleId" : "githubId";

    let user =
      provider === "google"
        ? await this.authRepository.findByGoogleId(profile.id)
        : await this.authRepository.findByGithubId(profile.id);

    if (user) {
      const tokens = await this.generateTokens(user.id);
      return {
        user: { id: user.id, email: user.email, name: user.name },
        ...tokens,
      };
    }

    user = await this.authRepository.findByEmail(profile.email);

    if (user) {
      user = await this.authRepository.updateOAuthId(user.id, {
        [idField]: profile.id,
      });
      const tokens = await this.generateTokens(user.id);
      return {
        user: { id: user.id, email: user.email, name: user.name },
        ...tokens,
      };
    }

    const newUser = await this.authRepository.create({
      email: profile.email,
      name: profile.name,
      [idField]: profile.id,
    });

    const tokens = await this.generateTokens(newUser.id);
    return {
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
      ...tokens,
    };
  }

  // ── Token / Session ──────────────────────────────────────────────────────────

  async refresh(refreshToken: string) {
    const stored = await this.authRepository.findRefreshToken(refreshToken);

    if (!stored) {
      throw new ApiError("Invalid refresh token", 401, "UNAUTHORIZED");
    }

    if (stored.expiresAt < new Date()) {
      await this.authRepository.deleteRefreshToken(refreshToken);
      throw new ApiError("Refresh token expired", 401, "UNAUTHORIZED");
    }

    const user = await this.authRepository.findById(stored.userId);

    if (!user) {
      await this.authRepository.deleteRefreshToken(refreshToken);
      throw new ApiError("User not found", 401, "UNAUTHORIZED");
    }

    const accessToken = this.generateAccessToken(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
    };
  }

  async logout(refreshToken: string) {
    await this.authRepository.deleteRefreshToken(refreshToken);
  }

  async getMe(userId: string) {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new ApiError("User not found", 404, "NOT_FOUND");
    }
    return { id: user.id, email: user.email, name: user.name };
  }

  // ── Internals ────────────────────────────────────────────────────────────────

  private async generateTokens(userId: string) {
    const accessToken = this.generateAccessToken(userId);
    const refreshTokenValue = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + this.getRefreshTokenExpiryMs());

    await this.authRepository.createRefreshToken({
      token: refreshTokenValue,
      userId,
      expiresAt,
    });

    const refreshToken = jwt.sign(
      { tokenId: refreshTokenValue },
      config.JWT_REFRESH_SECRET,
      { expiresIn: this.getRefreshTokenExpiryS() },
    );

    return { accessToken, refreshToken };
  }

  private generateAccessToken(userId: string) {
    return jwt.sign({ userId }, config.JWT_SECRET, {
      expiresIn: this.getAccessTokenExpiryS(),
    });
  }

  getAccessTokenExpiryS(): number {
    return 15 * 60;
  }

  getRefreshTokenExpiryS(): number {
    return 7 * 24 * 60 * 60;
  }

  getAccessTokenExpiryMs(): number {
    return this.getAccessTokenExpiryS() * 1000;
  }

  getRefreshTokenExpiryMs(): number {
    return this.getRefreshTokenExpiryS() * 1000;
  }
}
