import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { prisma } from "../../../config/prisma.config";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email", // tell passport to use email not username
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        // No user found
        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        // OAuth user trying to use password login
        if (!user.password) {
          return done(null, false, { message: "Please login with Google or GitHub" });
        }

        // Compare password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);
