# PairScope API — Postman Documentation

**Status:** Proposed API contract, not a verified live API.  
**Base URL:** `{{baseUrl}}/api/v1` (local default `http://localhost:3000/api/v1`)  
**Import:** Import `PairScope_Postman_Collection.json` and optionally `PairScope_Local_Environment.postman_environment.json` into Postman.

## Setup
1. Set `baseUrl` to your API Gateway URL.
2. Run Sign up or Log in. The collection's test script saves access/refresh tokens and user ID when returned.
3. Create a session to save `sessionId`.
4. Protected routes use `Authorization: Bearer {{accessToken}}`.
5. Use dummy credentials only in examples. Never commit real tokens.

## Response conventions
Success envelope: `{"data": ..., "meta": {"requestId": "req_example_01"}}`  
Error envelope:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request parameters or body are invalid.",
    "details": {"fieldErrors":[{"field":"email","issue":"Invalid value"}]},
    "requestId": "req_example_01"
  }
}
```
Timestamps are UTC ISO-8601. IDs are opaque strings. Lists should use bounded pagination (recommended `limit` maximum 100). Add `Idempotency-Key` for retried create/run operations. `204` has no response body.

## Status code policy
| Code | Meaning | Typical use |
|---|---|---|
| 200 | OK | Read, update, or synchronous command |
| 201 | Created | New resource |
| 202 | Accepted | Asynchronous execution/job accepted |
| 204 | No Content | Successful operation with no body |
| 400 | Bad Request | Malformed JSON or invalid parameters/schema |
| 401 | Unauthorized | Missing/invalid/expired token or invalid credentials |
| 403 | Forbidden | Authenticated caller lacks permission |
| 404 | Not Found | Missing resource or resource intentionally concealed |
| 409 | Conflict | Duplicate email/slug, stale version, invalid lifecycle transition |
| 410 | Gone | Expired/revoked invitation |
| 413 | Payload Too Large | Body/code/event batch too large |
| 415 | Unsupported Media Type | Unsupported Content-Type |
| 422 | Unprocessable Entity | Request violates a business rule |
| 429 | Too Many Requests | Rate limit; include `Retry-After` |
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Dependency returned invalid response |
| 503 | Service Unavailable | Temporary service/dependency outage |
| 504 | Gateway Timeout | Dependency timed out |

Not every code applies to every endpoint. A read endpoint normally does not return 201; an unauthenticated signup route normally does not return a resource-membership 403. The collection includes the success response and relevant errors for each request. Adapt the list to actual middleware, authorization rules, and dependency boundaries.

## Endpoint inventory
### Authentication
- `POST /auth/signup` — 201
- `POST /auth/login` — 200
- `POST /auth/refresh` — 200
- `POST /auth/logout` — 204
- `GET /auth/me` — 200
- `PATCH /auth/me` — 200

### Sessions and invitations
- `POST /sessions` — 201
- `GET /sessions` — 200
- `GET /sessions/{sessionId}` — 200
- `PATCH /sessions/{sessionId}` — 200
- `POST /sessions/{sessionId}/invitations` — 201
- `POST /sessions/join/{invitationToken}` — 200
- `GET /sessions/{sessionId}/participants` — 200
- `POST /sessions/{sessionId}/leave` — 204
- `POST /sessions/{sessionId}/end` — 200
- `POST /sessions/{sessionId}/branches` — 201
- `GET /sessions/{sessionId}/branches` — 200
- `GET /branches/{branchId}` — 200

### Execution and debugging
- `POST /sessions/{sessionId}/executions` — 202
- `GET /executions/{executionId}` — 200
- `POST /executions/{executionId}/commands` — 200
- `POST /executions/{executionId}/stop` — 200

### Recording and replay
- `GET /sessions/{sessionId}/events` — 200
- `GET /sessions/{sessionId}/replay` — 200
- `GET /sessions/{sessionId}/snapshots/{snapshotId}` — 200

### Insights and analytics
- `GET /sessions/{sessionId}/analytics` — 200
- `GET /organizations/{organizationId}/analytics/heatmap` — 200

### Organizations (planned later phase)
- `POST /organizations` — 201
- `GET /organizations` — 200
- `GET /organizations/{organizationId}` — 200
- `GET /organizations/{organizationId}/members` — 200
- `POST /organizations/{organizationId}/members` — 201
- `PATCH /organizations/{organizationId}/members/{memberId}` — 200
- `DELETE /organizations/{organizationId}/members/{memberId}` — 204

### Question bank
- `GET /questions` — 200
- `GET /questions/{questionId}` — 200

## Representative request examples

### Create session
`POST {{baseUrl}}/api/v1/sessions`
```json
{
  "title": "Array debugging interview",
  "language": "javascript",
  "visibility": "invite_only",
  "settings": {"allowBranching": true, "recordSession": true}
}
```
Expected `201 Created`:
```json
{
  "data": {
    "id": "ses_123",
    "title": "Array debugging interview",
    "language": "javascript",
    "status": "scheduled",
    "ownerId": "usr_123",
    "createdAt": "2026-10-28T05:40:00Z"
  },
  "meta": {"requestId": "req_10"}
}
```

### Submit JavaScript execution
`POST {{baseUrl}}/api/v1/sessions/{{sessionId}}/executions`
```json
{
  "code": "const values = [2, 4, 6];\nconsole.log(values.reduce((sum, n) => sum + n, 0));",
  "mode": "run",
  "breakpoints": [{"line": 2}],
  "limits": {"timeoutMs": 5000, "memoryMb": 128}
}
```
Expected `202 Accepted`:
```json
{
  "data": {
    "executionId": "exe_123",
    "sessionId": "ses_123",
    "status": "queued",
    "submittedAt": "2026-10-28T06:20:00Z"
  },
  "meta": {"requestId": "req_30"}
}
```

### Join a session
`POST {{baseUrl}}/api/v1/sessions/join/{{invitationToken}}`
```json
{}
```
Expected `200 OK`:
```json
{
  "data": {
    "sessionId": "ses_123",
    "participant": {"userId": "usr_123", "role": "participant"},
    "websocketUrl": "wss://api.pairscope.example/realtime"
  },
  "meta": {"requestId": "req_15"}
}
```

## Realtime Socket.IO contract
The REST collection covers API endpoints; collaboration uses Socket.IO and should be tested with a Socket.IO client/request, not by sending arbitrary raw WebSocket frames without the Socket.IO handshake.

Client → server:
- `session:join` — `{ "sessionId": "ses_123" }`
- `document:update` — `{ "sessionId": "ses_123", "update": "<encoded CRDT update>", "clientRevision": 12 }`
- `presence:update` — `{ "sessionId": "ses_123", "state": { "cursor": 120, "selection": [120,126] } }`
- `debugger:claim` — `{ "sessionId": "ses_123" }`
- `execution:run` — `{ "sessionId": "ses_123", "code": "...", "breakpoints": [] }`
- `debugger:stepOver` — `{ "sessionId": "ses_123", "executionId": "exe_123" }`
- `debugger:resume` — `{ "sessionId": "ses_123", "executionId": "exe_123" }`

Server → client:
`session:joined`, `presence:changed`, `document:updated`, `debugger:ownershipChanged`, `execution:queued`, `execution:output`, `execution:paused`, `execution:resumed`, `execution:completed`, `session:error`.

Recommended durable event envelope:
```json
{
  "eventId": "evt_123",
  "sessionId": "ses_123",
  "sequence": 43,
  "type": "execution.paused",
  "actorId": "usr_123",
  "timestamp": "2026-10-28T06:20:02Z",
  "payload": {"line": 2},
  "schemaVersion": 1
}
```

## Architecture and security invariants
- Identity owns users and refresh tokens.
- Organization owns organizations and memberships.
- Session owns session metadata, invitations, participants, and branch metadata.
- Realtime uses Redis namespace `rt:`; Execution uses `exec:`.
- Recorder owns durable event history and snapshots; Insights owns derived metrics and heatmaps.
- Services must not read one another's databases directly.
- Durable events need stable `eventId`, per-session `sequence`, `schemaVersion`, and idempotent consumers.
- Invitation tokens should be high-entropy, expiring, revocable, usage-limited, and stored hashed server-side.
- Check session membership and debugger permission on each privileged action; a valid JWT alone is not authorization.
- JavaScript must execute in a strongly isolated sandbox with network disabled by default and CPU, memory, process, time, and output limits. Never mount host secrets or the Docker socket.
- Production browser clients should generally use Secure, HttpOnly refresh-token cookies plus an appropriate CSRF strategy. The JSON refresh token in the collection is for easy local testing and must be reconciled with the actual implementation.

## Decisions to confirm before implementation
1. Refresh-token transport: JSON for local tests versus Secure HttpOnly cookies in production.
2. Which debugger commands use REST versus Socket.IO.
3. Session/execution lifecycle states and allowed transitions.
4. Roles: host, participant, observer; organization owner/admin/member.
5. Retention and size limits for events, replay, code payloads, and pagination.
6. Exact retry, timeout, and rate-limit policy.
7. Add contract tests so every documented status and response matches implementation.
