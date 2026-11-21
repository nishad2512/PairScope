export enum StatusCode {
    Ok = 200,
    ServiceUnavailable = 503,
}

export enum SocketCode {
    Unauthorized = "UNAUTHORIZED",
    Forbidden = "FORBIDDEN",
    SessionClosed = "SESSION_CLOSED",
    NotJoined = "NOT_JOINED",
    InvalidPayload = "INVALID_PAYLOAD",
    RateLimited = "RATE_LIMITED",
    ServiceUnavailable = "SERVICE_UNAVAILABLE",
    DocumentTooLarge = "DOCUMENT_TOO_LARGE",
}
