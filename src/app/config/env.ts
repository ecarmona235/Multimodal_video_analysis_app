import { z } from "zod";
import { Logger } from "@/utils/logger";

const logger = new Logger("Config:Env");

// schema
const envSchema = z.object({
  GEM_API_KEY: z.string(),
});

const validateEnv = () => {
  try {
    logger.info("validating environment variables");
    const env = {
      GEM_API_KEY: process.env.GEM_API_KEY,
    };
    logger.debug("Environment variables", {
      hasGoogleAPIKe: !!env.GEM_API_KEY,
    });
    const parsed = envSchema.parse(env);
    logger.info("Environment variables validated successfully");
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join("."));
      logger.error("Invalid environment variables", { missingVars });
      throw new Error(
        `Invalid environment variables: ${missingVars.join(",")},
                Please check your .env file`
      );
    }
    throw error;
  }
};

export const env = validateEnv();
