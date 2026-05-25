import { AgentType, PrismaClient } from "@prisma/client";
import { BaseAgent } from "./base.agent";
import { interpolateTemplate } from "../utils/templates.utils";
import { logger } from "../config/logger.config";

// Shape of the input data flowing into this agent from the previous task
interface HttpAgentInput {
  [key: string]: string;
}

// Shape of the config defined in the workflow builder for this node
interface HttpAgentConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

interface HttpAgentResponse {
  status: number;
  data: unknown;
  headers: Record<string, string>;
}

export class HttpAgent extends BaseAgent {
  constructor(name: string, concurrency: number = 1, prisma: PrismaClient) {
    super(name, AgentType.HTTP_AGENT, concurrency, prisma);
  }

  async execute(input: unknown, config: unknown): Promise<HttpAgentResponse> {
    const typedInput = input as HttpAgentInput;
    const typedConfig = config as HttpAgentConfig;

    if (!typedConfig.url || !typedConfig.method) {
      throw new Error("HttpAgent requires a URL and method in config");
    }

    // Replace {{placeholders}} in URL
    const interpolatedUrl = interpolateTemplate(typedConfig.url, typedInput);

    logger.debug(`HttpAgent URL: ${interpolatedUrl}`);

    // Interpolate body values as well
    const interpolatedBody = typedConfig.body
      ? JSON.parse(interpolateTemplate(JSON.stringify(typedConfig.body), typedInput))
      : undefined;

    const response = await fetch(interpolatedUrl, {
      method: typedConfig.method,
      headers: {
        "Content-Type": "application/json",
        ...typedConfig.headers,
      },
      body:
        typedConfig.method === "GET" || typedConfig.method === "DELETE"
          ? undefined
          : JSON.stringify(interpolatedBody),
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `HTTP request failed: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const contentType = response.headers.get("content-type");

    // Convert Headers object into serializable plain object
    const responseHeaders: Record<string, string> = {};

    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const data = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    return {
      status: response.status,
      data,
      headers: responseHeaders,
    };
  }
}
