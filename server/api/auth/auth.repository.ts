import { Prisma, PrismaClient, RefreshToken, User } from "@prisma/client";

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async createUser(userData: Prisma.UserCreateInput): Promise<User> {
    return await this.prisma.user.create({
      data: userData,
    });
  }

  async findRefreshToken(token: string): Promise<RefreshToken | null> {
    return await this.prisma.refreshToken.findUnique({
      where: {
        token,
      },
    });
  }

  async createRefreshToken(
    refreshTokenData: Prisma.RefreshTokenCreateInput,
  ): Promise<RefreshToken> {
    return await this.prisma.refreshToken.create({
      data: refreshTokenData,
    });
  }

  async deleteRefreshToken(token: string): Promise<RefreshToken> {
    return await this.prisma.refreshToken.delete({
      where: {
        token,
      },
    });
  }

  async deleteAllUserRefreshTokens(userId: string): Promise<Prisma.BatchPayload> {
    return await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });
  }
}
