import { EmailError } from "./email-error";

export function handleError(error: unknown, context: string) {
    const code = error instanceof EmailError ? error.code : "EMAIL_UNAVAILABLE";
    const retryable = !(error instanceof EmailError) || error.retryable;
    console.error(`${context}: ${code}`);
    return { code, retryable };
}
