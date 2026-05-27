import { AgentType, PrismaClient } from "@prisma/client";
import { BaseAgent } from "./base.agent";
import { logger } from "../config/logger.config";
import groqClient from "../config/groq.config";

interface TransformAgentConfig {
  description: string;
}

export class TransformAgent extends BaseAgent {
  constructor(name: string, concurrency: number = 1, prisma: PrismaClient) {
    super(name, AgentType.TRANSFORM_AGENT, concurrency, prisma);
  }

  async execute(input: unknown, config: unknown): Promise<unknown> {
    // Cast to types
    const typedConfig = config as TransformAgentConfig;
    const typedInput = input as Record<string, unknown>;

    // Validate config
    if (!typedConfig.description) {
      throw new Error("TransformAgent requires a transformation description in config");
    }

    // Serialize input data to string for the prompt
    const inputAsString = JSON.stringify(typedInput, null, 2);

    // Build the Groq prompt
    const prompt = `You are a data transformation engine.
Given this input data:
${inputAsString}

Apply this transformation: ${typedConfig.description}

Return ONLY valid JSON. No explanation, no markdown, no code blocks. Raw JSON only.`;

    // Call Groq
    const response = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0, // 0 for deterministic JSON output
    });

    const result = response.choices[0].message.content;

    if (!result) {
      throw new Error("TransformAgent received empty response from Groq");
    }

    // Parse and validate JSON
    try {
      const parsed = JSON.parse(result.trim());
      logger.success(`TransformAgent transformed data successfully`);
      return parsed; // return the object directly, not wrapped in { text }
    } catch {
      // If Groq returned markdown fences despite instructions, strip them
      const cleaned = result.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return parsed;
    }
  }
}
