export class EmailError extends Error {
    constructor(
        public readonly code: string,
        public readonly retryable = false,
    ) {
        super(code);
    }
}
