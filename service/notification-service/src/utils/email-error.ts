export class EmailError extends Error {
    constructor(public readonly code: string, public readonly retryable = false) {
        super(code);
    }
}

export function failureCode(error: unknown): string {
    return error instanceof EmailError ? error.code : "DELIVERY_UNAVAILABLE";
}

export function canRetry(error: unknown): boolean {
    return !(error instanceof EmailError) || error.retryable;
}
