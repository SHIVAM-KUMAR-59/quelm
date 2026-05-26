import { AgentType, PrismaClient } from "@prisma/client";
import { BaseAgent } from "./base.agent";
import groqClient from "../config/groq.config";
import { interpolateTemplate } from "../utils/templates.utils";
import { logger } from "../config/logger.config";

// Shape of the input data flowing into this agent from the previous task
interface LLMAgentInput {
  [key: string]: string;
}

// Shape of the config defined in the workflow builder for this node
interface LLMAgentConfig {
  promptTemplate: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class LLMAgent extends BaseAgent {
  constructor(name: string, concurrency: number = 1, prisma: PrismaClient) {
    // Pass fixed AgentType.LLM_AGENT to base — LLMAgent always handles LLM tasks
    super(name, AgentType.LLM_AGENT, concurrency, prisma);
  }

  async execute(input: unknown, config: unknown): Promise<unknown> {
    // Cast to typed interfaces
    const typedInput = input as LLMAgentInput;
    const typedConfig = config as LLMAgentConfig;

    if (!typedConfig.promptTemplate) {
      throw new Error("LLMAgent requires a promptTemplate in config");
    }

    // Replace {{placeholders}} in the prompt with actual input values
    const interpolatedPrompt = interpolateTemplate(
      typedConfig.promptTemplate,
      typedInput,
    );
    logger.debug(`LLMAgent input received: ${JSON.stringify(input)}`);
    logger.debug(`LLMAgent prompt before interpolation: ${typedConfig.promptTemplate}`);
    logger.debug(`LLMAgent prompt after interpolation: ${interpolatedPrompt}`);

    logger.debug(`LLMAgent prompt: ${interpolatedPrompt}`);

    // Call Groq with the interpolated prompt
    const response = await groqClient.chat.completions.create({
      model: typedConfig.model ?? "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: interpolatedPrompt }],
      max_tokens: typedConfig.maxTokens ?? 1000,
      temperature: typedConfig.temperature ?? 0.7,
    });

    const result = response.choices[0].message.content;

    if (!result) {
      throw new Error("LLMAgent received empty response from Groq");
    }

    logger.success(`LLMAgent got response [${result.length} chars]`);

    return { text: result };
  }
}
