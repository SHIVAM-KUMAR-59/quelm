import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../../config";
import { AuthRepository } from "./auth.repository";
import { ValidationError, ApiError } from "../../utils/errors";

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

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
