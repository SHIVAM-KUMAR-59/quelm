import passport from "passport";
import { Strategy as GitHubStrategy, Profile } from "passport-github2";
import { prisma } from "../../../config/prisma.config";
import config from "../../../config";
import { AuthProvider } from "@prisma/client";
import { VerifyCallback } from "passport-google-oauth20";

passport.use(
  new GitHubStrategy(
    {
      clientID: config.GITHUB_CREDENTIALS.CLIENT_ID,
      clientSecret: config.GITHUB_CREDENTIALS.CLIENT_SECRET,
      callbackURL: config.GITHUB_CREDENTIALS.CALLBACK_URL,
      scope: ["user:email"],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const email =
          profile.emails?.find((e) => e.type === "primary")?.value ??
          profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, { message: "No email found in GitHub profile" });
        }

        const user = await prisma.user.upsert({
          where: { email },
          create: {
            email,
            name: profile.displayName || profile.username,
            avatar: profile.photos?.[0]?.value,
            provider: AuthProvider.GITHUB,
          },
          update: {
            name: profile.displayName || profile.username,
            avatar: profile.photos?.[0]?.value,
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    },
  ),
);
