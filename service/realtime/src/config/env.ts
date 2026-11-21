import "dotenv/config";
import { realtimeConfigSchema } from "@/validators/config.validator";

export const config = realtimeConfigSchema.parse(process.env);
