import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import config from "../../config";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Email / Password ─────────────────────────────────────────────────────────

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;
      const result = await this.authService.register({ email, password, name });

      this.setRefreshCookie(res, result.refreshToken);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login({ email, password });

      this.setRefreshCookie(res, result.refreshToken);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: "Refresh token required",
          errorCode: "UNAUTHORIZED",
        });
        return;
      }

      const result = await this.authService.refresh(refreshToken);

      res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/api/auth",
      });

      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (err) {
      next(err);
    }
  };

  // ── /me ──────────────────────────────────────────────────────────────────────

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await this.authService.getMe(req.userId!);
      res.status(200).json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  };

  // ── Google OAuth ─────────────────────────────────────────────────────────────

  googleRedirect = (_req: Request, res: Response) => {
    if (!config.GOOGLE_CLIENT_ID) {
      res.status(503).json({ success: false, message: "Google OAuth is not configured" });
      return;
    }

    const params = new URLSearchParams({
      client_id: config.GOOGLE_CLIENT_ID,
      redirect_uri: config.GOOGLE_CALLBACK_URL,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  };

  googleCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.query.code as string;

      if (!code) {
        res.redirect(`${config.CLIENT_URL}/auth/login?error=no_code`);
        return;
      }

      const result = await this.authService.googleLogin(code);
      this.setRefreshCookie(res, result.refreshToken);

      res.redirect(
        `${config.CLIENT_URL}/auth/callback?token=${encodeURIComponent(result.accessToken)}`,
      );
    } catch (err) {
      next(err);
    }
  };

  // ── GitHub OAuth ─────────────────────────────────────────────────────────────

  githubRedirect = (_req: Request, res: Response) => {
    if (!config.GITHUB_CLIENT_ID) {
      res.status(503).json({ success: false, message: "GitHub OAuth is not configured" });
      return;
    }

    const params = new URLSearchParams({
      client_id: config.GITHUB_CLIENT_ID,
      redirect_uri: config.GITHUB_CALLBACK_URL,
      scope: "user:email read:user",
    });

    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  };

  githubCallback = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.query.code as string;

      if (!code) {
        res.redirect(`${config.CLIENT_URL}/auth/login?error=no_code`);
        return;
      }

      const result = await this.authService.githubLogin(code);
      this.setRefreshCookie(res, result.refreshToken);

      res.redirect(
        `${config.CLIENT_URL}/auth/callback?token=${encodeURIComponent(result.accessToken)}`,
      );
    } catch (err) {
      next(err);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/api/auth",
      maxAge: this.authService.getRefreshTokenExpiryMs(),
    });
  }
}
