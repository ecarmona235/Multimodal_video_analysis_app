import { env } from "@/app/config/env";
import { Logger } from "@/utils/logger";
import OpenAI from "openai";

const logger = new Logger("geminiClient");

export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

const GEMINI_MODELS = [
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-2.0-flash-exp",
];

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

const openai = new OpenAI({
  apiKey: env.GEM_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function tryWithRetries(
  modelName: string,
  messages: Message[],
  maxRetries: number = MAX_RETRIES
): Promise<string> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      logger.info(
        `Attempting to generate content with model ${modelName} {attempt ${attempt + 1}/${maxRetries}}`
      );
      logger.debug(
        "GEMINI Messages:",
        messages.map(m => ({ role: m.role, length: m.content.length }))
      );

      const response = await openai.chat.completions.create({
        model: modelName,
        messages: messages,
        response_format: { type: "json_object" },
      });

      logger.info(`Successfully generated content with model ${modelName}`);
      return response.choices[0].message.content || "";
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        logger.warn(
          `Attempt ${attempt + 1} / ${maxRetries} failed for model ${modelName}, Retrying in ${delay}ms`,
          { error: lastError }
        );
        await sleep(delay);
        continue;
      }
      logger.error(
        `Final attempt ${maxRetries}/${maxRetries} failed for model ${modelName}`,
        { error: lastError }
      );
    }
  }
  throw lastError;
}

export async function getGeminiResponse(message: Message[]): Promise<string> {
  let lastError: Error | null = null;

  logger.info("Starting AI response generation with fallback models");

  for (const modelName of GEMINI_MODELS) {
    try {
      const response = await tryWithRetries(modelName, message);
      logger.info(`Successfully generated response using model ${modelName}`);
      return response;
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        `All retries failed for model ${modelName}, attempting next model`,
        { error: lastError }
      );
      continue;
    }
  }
  logger.error("All models and retries exhausted", { error: lastError });
  throw new Error(
    `All models and retries failed. Last error: ${lastError?.message}`
  );
}
