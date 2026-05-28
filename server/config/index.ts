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

  NODE_ENV: getString("NODE_ENV", "development"),
  IS_PRODUCTION: getString("NODE_ENV", "development") === "production",
  IS_DEVELOPMENT: getString("NODE_ENV", "development") === "development",
  CLIENT_URL: getString("CLIENT_URL", "http://localhost:3000"),

  JWT: {
    ACCESS_TOKEN_SECRET: requireEnv("JWT_ACCESS_TOKEN_SECRET"),
    ACCESS_TOKEN_EXPIRE_TIME: requireEnv("JWT_ACCESS_TOKEN_EXPIRE_TIME"),
    REFRESH_TOKEN_SECRET: requireEnv("JWT_REFRESH_TOKEN_SECRET"),
    REFRESH_TOKEN_EXPIRE_TIME: requireEnv("JWT_REFRESH_TOKEN_EXPIRE_TIME"),
  },

  GITHUB_CREDENTIALS: {
    CLIENT_ID: requireEnv("GITHUB_CLIENT_ID"),
    CLIENT_SECRET: requireEnv("GITHUB_CLIENT_SECRET"),
    CALLBACK_URL: requireEnv("GITHUB_CALLBACK_URL"),
  },

  GOOGLE_CREDENTIALS: {
    CLIENT_ID: requireEnv("GOOGLE_CLIENT_ID"),
    CLIENT_SECRET: requireEnv("GOOGLE_CLIENT_SECRET"),
    CALLBACK_URL: requireEnv("GOOGLE_CALLBACK_URL"),
  },
} as const;

export default config;
