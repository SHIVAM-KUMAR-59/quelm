import { AuthProvider, User } from "@prisma/client";
import { AuthRepository } from "./auth.repository";
import config from "../../config";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../utils/errors";

type AuthResponse = {
  user: Omit<User, "password">;
  accessToken: string;
  refreshToken: string;
};

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async register(email: string, password: string, name?: string): Promise<AuthResponse> {
    const existingUser = await this.authRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictError("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.authRepository.createUser({
      email,
      name,
      password: hashedPassword,
      provider: AuthProvider.LOCAL,
    });

    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = await this.generateRefreshToken(user.id);

    const { password: _password, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  async login(user: User): Promise<AuthResponse> {
    const accessToken = this.generateAccessToken(user.id);

    const refreshToken = await this.generateRefreshToken(user.id);

    const { password: _password, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  async refresh(token: string): Promise<{ accessToken: string }> {
    const storedToken = await this.authRepository.findRefreshToken(token);

    if (!storedToken) {
      throw new ValidationError("Invalid refresh token");
    }

    if (storedToken.expiresAt < new Date()) {
      await this.authRepository.deleteRefreshToken(token);

      throw new AuthenticationError("Refresh token expired");
    }

    try {
      const payload = jwt.verify(token, config.JWT.REFRESH_TOKEN_SECRET) as {
        userId: string;
      };

      const accessToken = this.generateAccessToken(payload.userId);

      return {
        accessToken,
      };
    } catch {
      throw new AuthenticationError("Invalid refresh token");
    }
  }

  async logout(token: string): Promise<void> {
    await this.authRepository.deleteRefreshToken(token);
  }

  async getUser(id: string): Promise<Omit<User, "password">> {
    const user = await this.authRepository.findById(id);

    if (!user) {
      throw new NotFoundError("User", id);
    }

    const { password: _password, ...safeUser } = user;

    return safeUser;
  }

  async handleOAuthUser(
    email: string,
    name: string,
    provider: AuthProvider,
    avatar?: string,
  ): Promise<AuthResponse> {
    const user = await this.authRepository.upsertOAuthUser(email, name, provider, avatar);

    const accessToken = this.generateAccessToken(user.id);

    const refreshToken = await this.generateRefreshToken(user.id);

    const { password: _password, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken,
    };
  }

  private generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, config.JWT.ACCESS_TOKEN_SECRET as Secret, {
      expiresIn: config.JWT.ACCESS_TOKEN_EXPIRE_TIME as SignOptions["expiresIn"],
    });
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = jwt.sign({ userId }, config.JWT.REFRESH_TOKEN_SECRET as Secret, {
      expiresIn: config.JWT.REFRESH_TOKEN_EXPIRE_TIME as SignOptions["expiresIn"],
    });

    const decoded = jwt.decode(token) as jwt.JwtPayload;

    const expiresAt = new Date((decoded.exp ?? 0) * 1000);

    await this.authRepository.createRefreshToken({
      token,
      expiresAt,
      user: {
        connect: {
          id: userId,
        },
      },
    });

    return token;
  }
}
