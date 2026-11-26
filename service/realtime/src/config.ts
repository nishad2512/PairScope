import "dotenv/config";
import { configSchema } from "./validator/config.validator";

export const config = configSchema.parse(process.env);
