import dotenv from "dotenv";
import { logger } from "./logger.config";

dotenv.config();

const env = process.env;

const requireEnv = (key: string): string => {
  const value = env[key];

  if (!value || value.trim() === "") {
    logger.error(`Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
};

const getString = (key: string, defaultValue: string): string => {
  const value = env[key];

  if (!value || value.trim() === "") {
    return defaultValue;
  }

  return value;
};

const getNumber = (key: string, defaultValue: number): number => {
  const value = env[key];

  if (!value || value.trim() === "") {
    return defaultValue;
  }

  const parsedValue = Number(value);

  if (Number.isNaN(parsedValue)) {
    logger.error(
      `Environment variable ${key} must be a valid number. Received: "${value}"`,
    );
    throw new Error(
      `Environment variable ${key} must be a valid number. Received: "${value}"`,
    );
  }

  return parsedValue;
};

const config = {
  PORT: getNumber("PORT", 8000),

  DATABASE_URL: requireEnv("DATABASE_URL"),

  REDIS_URL: requireEnv("REDIS_URL"),

  GROQ_API_KEY: requireEnv("GROQ_API_KEY"),
  GROQ_MODEL: getString("GROQ_MODEL", "llama-3.3-70b-versatile"),

  CLIENT_URL: getString("CLIENT_URL", "http://localhost:3000"),

  JWT_SECRET: requireEnv("JWT_SECRET"),
  JWT_REFRESH_SECRET: requireEnv("JWT_REFRESH_SECRET"),
  ACCESS_TOKEN_EXPIRY: getString("ACCESS_TOKEN_EXPIRY", "15m"),
  REFRESH_TOKEN_EXPIRY: getString("REFRESH_TOKEN_EXPIRY", "7d"),

  // Google OAuth (optional — server boots without these but /auth/google will be disabled)
  GOOGLE_CLIENT_ID: getString("GOOGLE_CLIENT_ID", ""),
  GOOGLE_CLIENT_SECRET: getString("GOOGLE_CLIENT_SECRET", ""),
  GOOGLE_CALLBACK_URL: getString(
    "GOOGLE_CALLBACK_URL",
    "http://localhost:8000/api/auth/google/callback",
  ),

  // GitHub OAuth (optional)
  GITHUB_CLIENT_ID: getString("GITHUB_CLIENT_ID", ""),
  GITHUB_CLIENT_SECRET: getString("GITHUB_CLIENT_SECRET", ""),
  GITHUB_CALLBACK_URL: getString(
    "GITHUB_CALLBACK_URL",
    "http://localhost:8000/api/auth/github/callback",
  ),

  NODE_ENV: getString("NODE_ENV", "development"),
  IS_PRODUCTION: getString("NODE_ENV", "development") === "production",
  IS_DEVELOPMENT: getString("NODE_ENV", "development") === "development",
} as const;

export default config;
