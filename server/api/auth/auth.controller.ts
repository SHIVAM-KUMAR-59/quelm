import { AuthService } from "./auth.service";
import { User } from "@prisma/client";
import config from "../../config";
import { BodyController, Controller } from "../../utils/types";

const REFRESH_TOKEN_COOKIE = "refreshToken";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.IS_PRODUCTION,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

interface RegisterUserRequest {
  email: string;
  password: string;
  name: string;
}

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register: BodyController<RegisterUserRequest> = async (
    req,
    res,
    next,
  ): Promise<void> => {
    try {
      const { email, password, name } = req.body;

      const { user, accessToken, refreshToken } = await this.authService.register(
        email,
        password,
        name,
      );

      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: { user, accessToken },
      });
    } catch (error) {
      next(error);
    }
  };

  login: Controller = async (req, res, next): Promise<void> => {
    try {
      // req.user is set by Passport local strategy
      const { user, accessToken, refreshToken } = await this.authService.login(
        req.user as User,
      );

      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: { user, accessToken },
      });
    } catch (error) {
      next(error);
    }
  };

  googleCallback: Controller = async (req, res, next): Promise<void> => {
    try {
      // req.user is set by Passport Google strategy
      const { accessToken, refreshToken } = await this.authService.login(
        req.user as User,
      );

      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);

      // Redirect to frontend with access token in query param
      res.redirect(`${config.CLIENT_URL}/auth/callback?token=${accessToken}`);
    } catch (error) {
      next(error);
    }
  };

  githubCallback: Controller = async (req, res, next): Promise<void> => {
    try {
      // req.user is set by Passport GitHub strategy
      const { accessToken, refreshToken } = await this.authService.login(
        req.user as User,
      );

      res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, COOKIE_OPTIONS);

      // Redirect to frontend with access token in query param
      res.redirect(`${config.CLIENT_URL}/auth/callback?token=${accessToken}`);
    } catch (error) {
      next(error);
    }
  };

  refresh: Controller = async (req, res, next): Promise<void> => {
    try {
      const token = req.cookies[REFRESH_TOKEN_COOKIE];

      if (!token) {
        res.status(401).json({
          success: false,
          message: "No refresh token provided",
          errorCode: "UNAUTHORIZED",
        });
        return;
      }

      const { accessToken } = await this.authService.refresh(token);

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: { accessToken },
      });
    } catch (error) {
      next(error);
    }
  };

  logout: Controller = async (req, res, next): Promise<void> => {
    try {
      const token = req.cookies[REFRESH_TOKEN_COOKIE];

      if (token) {
        await this.authService.logout(token);
      }

      res.clearCookie(REFRESH_TOKEN_COOKIE, COOKIE_OPTIONS);

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };

  me: Controller = async (req, res, next): Promise<void> => {
    try {
      const userId = (req.user as { userId: string }).userId;

      const user = await this.authService.getUser(userId);

      res.status(200).json({
        success: true,
        message: "User fetched successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };
}
