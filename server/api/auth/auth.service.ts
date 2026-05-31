import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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

    const tokens = this.generateTokens(user.id);

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

    const tokens = this.generateTokens(user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as {
        userId: string;
      };

      const user = await this.authRepository.findById(decoded.userId);

      if (!user) {
        throw new ApiError("User not found", 401, "UNAUTHORIZED");
      }

      const accessToken = this.generateAccessToken(user.id);

      return {
        user: { id: user.id, email: user.email, name: user.name },
        accessToken,
      };
    } catch {
      throw new ApiError("Invalid refresh token", 401, "UNAUTHORIZED");
    }
  }

  private generateTokens(userId: string) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = jwt.sign({ userId }, config.JWT_REFRESH_SECRET, {
      expiresIn: this.getRefreshTokenExpiryS(),
    });

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
