import passport from "passport";
import { Strategy as GoogleStrategy, VerifyCallback } from "passport-google-oauth20";
import { prisma } from "../../../config/prisma.config";
import config from "../../../config";
import { AuthProvider } from "@prisma/client";

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CREDENTIALS.CLIENT_ID,
      clientSecret: config.GOOGLE_CREDENTIALS.CLIENT_SECRET,
      callbackURL: config.GOOGLE_CREDENTIALS.CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done: VerifyCallback) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false, { message: "No email found in Google profile" });
        }

        // Upsert user — create if not exists, update if exists
        const user = await prisma.user.upsert({
          where: { email },
          create: {
            email,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            provider: AuthProvider.GOOGLE,
          },
          update: {
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);
