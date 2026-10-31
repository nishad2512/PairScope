# PairScope: MVP Product Requirements Document

|  |  |
| --- | --- |
| **Version** | 0.2 (aligned to the project planning document) |
| **Status** | Draft for review |
| **Date** | 28 Oct 2026 |
| **Scope** | MVP (v1), delivered in staged implementation phases (Section 12) |
| **Basis** | PairScope project planning and design document (the project was previously named CodePair) |

---

## 1. Overview

### 1.1 Problem

Traditional collaborative coding tools let interviewers and candidates share code, but they do not capture or synchronize the debugging process. An interviewer may see the final solution without learning how the candidate reasoned, where they became stuck, or how they recovered. Organizations also have no consistent record of how interviews went across interviewers.

### 1.2 Product Vision

PairScope is a collaborative technical interview and pair-debugging platform built around synchronized execution state, session recording, replay and debugging analytics. Participants edit the same JavaScript code and share breakpoints, call stacks and variable scopes. Session events are recorded so a session can be replayed, branched from supported checkpoints and analyzed. A multi-tenant layer lets organizations manage owners and interviewers, run interviews with a question bank and review their sessions.

### 1.3 MVP Hypothesis

Sharing execution state and reviewing session history provides more value than sharing code alone. The first compelling demo must prove three things:

1. Two users collaborate on the same JavaScript code.
2. Both users inspect the same live debugging state while permissions are enforced.
3. The session is recorded and can be replayed after it ends.

Branching and analytics build on these three capabilities.

### 1.4 Goals

1. Synchronize code editing and JavaScript execution state (breakpoints, pause/resume, stepping, variable inspection) across participants.
2. Run untrusted code in isolated sandboxes so a runaway program never affects collaborative editing.
3. Record ordered session events and make them available for replay and for branching from supported checkpoints.
4. Give interviewers per-session analytics and give authorized users cross-session struggle patterns.
5. Let organizations manage owner and interviewer memberships and list their sessions.
6. Give each service sole ownership of its own data and deliver in stages.

### 1.5 Success Metrics

These are design targets to validate by benchmark. No capacity claim should be made until editor sync, debugger event rate, execution queue and event-store throughput are measured under representative workloads.

| Metric | Target (initial) |
| --- | --- |
| Editor sync latency between participants in the same region | p95 under 300 ms (to be benchmarked) |
| Sandbox runs that end within limits and leave no orphaned container | 100% |
| Ended sessions that can be replayed end to end | 100% |
| Recorded events lost after acknowledgement, or applied twice | 0 |
| Unauthorized cross-session or cross-organization access in authorization tests | 0 |
| Sessions that use shared debugging at least once | Tracked as baseline |

### 1.6 Target Users

| User | What they need |
| --- | --- |
| Technical interviewers | Run structured coding interviews, observe debugging decisions and review the candidate's problem-solving process afterward |
| Candidates | Collaborate during the interview and review their own problem-solving process, mistakes and areas for improvement |
| Bootcamp instructors | Identify recurring difficulties across student sessions and use aggregated patterns to improve teaching |
| Remote development pairs | Inspect the same live code, breakpoints, call stacks and variable scopes while debugging together |

---

## 2. Users and Roles

| Role | Surface | Access |
| --- | --- | --- |
| **Organization Owner** | Web | Creates the organization, adds and removes interviewers, lists organization sessions and, where policy allows, reviews their analytics. One owner per organization. |
| **Interviewer** | Web | Creates and runs sessions, controls the debugger when they hold ownership, reviews replay and reports for sessions they conduct. Belongs to an organization through a membership. |
| **Candidate / participant** | Web | Joins an invited session through a supported invitation flow and can review their own session where permitted. Whether guests need an account is an open question (Section 11.3). |
| **Debugger owner** | Per session | Exactly one participant at a time. Only the debugger owner can issue privileged debug commands. |

In v1, organization roles are limited to `owner` and `interviewer`. There are no further permission tiers. A session can exist without an organization (for example, a pair-debugging session between two individuals).

---

## 3. Scope

### 3.1 MVP Capabilities

| Area | MVP capability |
| --- | --- |
| Identity | Signup, login, access tokens and refresh tokens |
| Sessions | Create, join, invite participants, end sessions |
| Collaborative editor | Monaco Editor with Yjs synchronization |
| Live collaboration | Cursors, presence and shared document updates |
| Code execution | Execute JavaScript in isolated sandboxes |
| Collaborative debugging | Breakpoints, pause/resume, stepping and variable inspection |
| Recording | Persist ordered editing and debugging events |
| Replay | Scrub through recorded session history |
| Branching | Create an alternate session path from a replay checkpoint |
| Insights | Per-session analytics and cross-session struggle heatmaps |
| Organization | Basic owner and interviewer memberships and session listing |
| Question bank | Create and manage questions with starter code and test cases; use them in sessions |

The first usable release prioritizes authentication, sessions, collaborative editing and safe JavaScript execution. Shared debugging follows once the execution pipeline is stable. Recording, replay, branching and analytics build on that foundation.

### 3.2 Explicitly Excluded from v1

- A general-purpose IDE with extensions, terminals or full project workspaces
- Programming languages other than JavaScript
- A complete applicant tracking, recruitment or scheduling platform (this includes interview scheduling, reminders and candidate scorecards)
- True reverse execution or restoration of arbitrary historical runtime state
- AI coaching summaries and AI interview modes
- Built-in video calling
- Payment processing and Stripe integration
- Complex organization-wide analytics dashboards and owner/interviewer chat
- Production-scale multi-region infrastructure

---

## 4. End-to-End Flows

### 4.1 Conduct a Technical Interview

1. The interviewer logs in and creates an interview session.
2. PairScope generates an invitation link with a defined expiry and permissions.
3. The candidate authenticates or joins through the supported invitation flow.
4. Both participants enter the same editor and see synchronized code and presence.
5. The interviewer runs the code, sets breakpoints and shares debugging state. Only the debugger owner controls execution.
6. The event pipeline records edits and debugging events while the session is active.
7. The interviewer ends the session. A durable session-ended event schedules analytics processing.
8. The interviewer reviews the replay and the generated report. Organization owners can access the session where permitted.

### 4.2 Replay and Explore an Alternative Solution

1. An authorized user opens a completed session.
2. Insights retrieves the replay metadata, a snapshot and the relevant ordered events.
3. The user scrubs the timeline to a point where the code or debugging state changed.
4. The interface reconstructs the supported document and debugger state.
5. The user creates a branch from a supported checkpoint.
6. PairScope creates a new session linked to its parent and checkpoint, preserving the original history.
7. The user modifies and runs the alternative solution in a fresh sandbox.
8. The branch receives its own event history and can be compared with the original path.

Replaying an event log and restoring a live Node.js process are different operations. v1 promises reconstruction from recorded events and supported snapshots, not arbitrary restoration of a previous runtime.

### 4.3 Statuses

| Entity | Statuses |
| --- | --- |
| Session | Active → Ended (final enum defined by the Session service; a branch references a parent session and checkpoint) |
| Invitation | Pending → Accepted, Expired or Revoked |
| Debugger ownership | Unclaimed → Held by one participant → Released or transferred |
| Execution run (proposed) | Queued → Running → Paused, Completed, Failed, Timed out or Killed |
| Analytics job | Scheduled on session end → Running → Done or Failed (retry, then dead-letter) |

---

## 5. Functional Requirements

Priority: **P0** = needed for the core demo (collaborate, share debugging, record and replay), **P1** = remaining MVP scope, **P2** = stretch. Delivery order is in Section 12.

### 5.1 Identity (Identity service)

| ID | Requirement | Priority |
| --- | --- | --- |
| AU-01 | Signup with name, email and password (`POST /auth/signup`). Email is normalized and unique. Passwords are stored as bcrypt hashes only. | P0 |
| AU-02 | Login (`POST /auth/login`) returns a JWT access token in the body (15-minute lifetime) and sets a refresh token in a Secure, HttpOnly cookie (30-day lifetime). | P0 |
| AU-03 | Refresh (`POST /auth/refresh`) rotates the refresh token. Refresh tokens are stored hashed with a unique `tokenId`, with expiry and revocation fields. | P0 |
| AU-04 | Logout (`POST /auth/logout`) revokes the refresh token and clears the cookie. | P0 |
| AU-05 | `GET /auth/me` returns safe profile fields only. | P0 |
| AU-06 | Token verification checks signature, issuer, audience and expiry. A valid JWT proves identity only; session and organization access are checked separately. | P0 |

**Acceptance (AU-03):** Given a valid refresh cookie, when the client refreshes, it receives a new access token and a rotated cookie; reusing the old refresh token is rejected.

### 5.2 Organization (Organization service)

| ID | Requirement | Priority |
| --- | --- | --- |
| OR-01 | Create an organization (`POST /organizations`). The organization and its owner membership are created atomically. | P1 |
| OR-02 | List the organizations a user belongs to and view one as a member. | P1 |
| OR-03 | Owner adds or invites an interviewer and removes members. Roles are `owner` or `interviewer`. Membership is unique per organization and user. | P1 |
| OR-04 | List members (owner and interviewer, per policy). | P1 |
| OR-05 | List organization sessions for authorized members (`GET /organizations/:orgId/sessions`). | P1 |
| OR-06 | Organization role checks are enforced by the Organization service. Organization deletion and session archiving are coordinated asynchronously by events. | P1 |

### 5.3 Sessions and Invitations (Session service)

| ID | Requirement | Priority |
| --- | --- | --- |
| SE-01 | Create a session (`POST /sessions`) with session type (for example `interview`), language (`javascript`), optional `questionId` and optional `orgId`. | P0 |
| SE-02 | Get session metadata and list accessible sessions. Access is limited to the creator and authorized participants. | P0 |
| SE-03 | Create an invitation (`POST /sessions/:sessionId/invitations`). Tokens are high-entropy, hashed, expiring, revocable and carry limited permissions. | P0 |
| SE-04 | Join with an invitation token (`POST /sessions/join/:token`). Authenticated participants are unique per session. Guest handling is defined explicitly (Section 11.3). | P0 |
| SE-05 | End a session (`POST /sessions/:sessionId/end`) with management permission. This emits a durable session-ended event. | P0 |
| SE-06 | Server-side participant and membership checks apply on every session operation, in addition to JWT validation. | P0 |
| SE-07 | Branch metadata (`parentSessionId` and source checkpoint) is stored on the branch session. | P1 |

**Acceptance (SE-04):** Given a valid, unexpired invitation, when the invitee joins, they become a participant and can enter the session room; an expired or revoked token is rejected with no session data exposed.

### 5.4 Question Bank (Session service)

| ID | Requirement | Priority |
| --- | --- | --- |
| QB-01 | Create and edit a question with title, description, starter code, test cases, difficulty and language. Test cases have validated input and expected-output formats. | P1 |
| QB-02 | Attach a question to a session at creation. The editor loads its starter code. | P1 |
| QB-03 | List and filter questions by difficulty and language. Archive and restore. | P1 |
| QB-04 | Editing a question does not alter sessions that already ended. | P1 |
| QB-05 | Import a question from LeetCode into a draft for review before it is used. Import is asynchronous and may fail; manual entry always remains available. | P2 |
| QB-06 | Run the code against a question's test cases and show pass or fail. | P2 |

LeetCode has no stable official public API, and its terms of use and problem-text copyright must be reviewed before QB-05 is built. QB-05 is carried over from the original idea and is not part of the planning document's MVP table.

### 5.5 Realtime Collaboration (Realtime service)

| ID | Requirement | Priority |
| --- | --- | --- |
| RT-01 | Monaco editor with Yjs synchronization. All participants see shared document updates. | P0 |
| RT-02 | Presence and cursors for every participant. | P0 |
| RT-03 | Socket authentication is verified once at connection. Session authorization is checked at `session:join`. The server derives the user ID from the connection and never trusts a client-supplied `userId`. | P0 |
| RT-04 | Debugger ownership: a participant claims control, everyone sees the current owner, and the Realtime service verifies ownership before forwarding any privileged debug command. | P0 |
| RT-05 | Every socket message carries a session ID and a validated payload. Message size, event frequency and sockets per user are limited. | P0 |
| RT-06 | A participant who reconnects rejoins the same session with document and debug state restored. | P1 |

**WebSocket events**

| Direction | Event | Purpose |
| --- | --- | --- |
| Client → Realtime | `session:join` | Request access to a session room |
| Realtime → Client | `session:joined` | Confirm authorized join |
| Both | `document:update` | Submit and broadcast a Yjs update |
| Client → Realtime | `presence:update` | Update cursor or presence |
| Client → Realtime | `debugger:claim` | Request debugger control |
| Realtime → Client | `debugger:ownership` | Report the current owner |
| Client → Realtime | `execution:run` | Request JavaScript execution |
| Client → Realtime | `debugger:stepOver` | Request a step-over |
| Realtime → Client | `execution:output` | Stream output |
| Realtime → Client | `debugger:paused` | Share paused execution state |
| Realtime → Client | `debugger:resumed` | Share resumed state |

### 5.6 Execution and Debugging (Execution service)

| ID | Requirement | Priority |
| --- | --- | --- |
| EX-01 | Run JavaScript in a disposable container: non-root user, dropped Linux capabilities, read-only root filesystem and a temporary filesystem. | P0 |
| EX-02 | No network access by default. The Docker socket and host files are never mounted into a sandbox. | P0 |
| EX-03 | Resource limits on memory, CPU, process count, output size and wall-clock time. Initial values to test: 256 MB memory, 0.5 CPU, 64 processes. Timed-out workloads are killed and cleaned up. | P0 |
| EX-04 | Stream stdout, stderr and errors to all participants through the Realtime service. | P0 |
| EX-05 | Execution requests go through a bounded job queue. Concurrent executions are limited per user and per session. | P0 |
| EX-06 | Debugging through the Chrome DevTools Protocol: breakpoints, pause, resume, step over and step into, with paused state shared to all participants. | P0 |
| EX-07 | Shared inspection of the call stack, scopes and variable values at the paused point. | P0 |
| EX-08 | Only the current debugger owner can issue privileged debug commands. | P0 |
| EX-09 | Containers are destroyed when a run ends, times out or the session ends. | P0 |
| EX-10 | The execution service and Docker management authority are separated from the public-facing gateway and realtime service. Hardened runtimes or microVM isolation are considered for production. | P1 |

**Acceptance (EX-06 to EX-08):** Given a run paused at a breakpoint with two participants connected, both see the same highlighted line, call stack and variables. A step issued by the debugger owner updates both views; a step command from any other participant is rejected.

The container controls above are reasonable limits to test, not a complete sandbox security guarantee.

### 5.7 Recording, Replay and Branching (Recorder and Insights services)

| ID | Requirement | Priority |
| --- | --- | --- |
| RC-01 | Every recorded event uses one envelope: `eventId`, `sessionId`, `sequence`, `type`, `actorId`, `timestamp`, `payload`, `schemaVersion`. The schema is defined and versioned before recording is implemented. | P0 |
| RC-02 | Recording uses durable delivery, not Redis Pub/Sub: acknowledgements, idempotent consumers and a recovery strategy. Where an accepted event must never be silently lost, a durable outbox is used at the point of production. | P0 |
| RC-03 | Events are unique and ordered per session by `(sessionId, sequence)`. Duplicate delivery never duplicates effects. | P0 |
| RC-04 | Edit and debugging events are persisted while a session is active. | P0 |
| RC-05 | Snapshots record the event sequence they represent, so replay can resume from the correct point. | P0 |
| RC-06 | `GET /sessions/:sessionId/events` returns event history with pagination. | P0 |
| RC-07 | `GET /sessions/:sessionId/replay` returns replay metadata and the required snapshot. The UI scrubs the timeline and reconstructs the document and supported debugger state. Responses use a cursor or sequence number, never an unbounded log. | P0 |
| RC-08 | Replay never claims to restore a live runtime process. | P0 |
| RC-09 | Create a branch (`POST /sessions/:sessionId/branches`) from a supported checkpoint. The new session links to its parent and checkpoint, runs in a fresh sandbox, has its own event history and leaves the original unchanged. List branches. | P1 |
| RC-10 | Compare a branch with the original path. | P2 |

**Event types (initial):** edit, presence, debugger claimed, run started, output, breakpoint set or removed, paused, resumed, step, session ended. The final catalogue is part of the event schema work.

### 5.8 Insights (Insights service)

| ID | Requirement | Priority |
| --- | --- | --- |
| IN-01 | A session-ended event schedules a background analytics job (BullMQ). | P1 |
| IN-02 | Per-session report (`GET /sessions/:sessionId/analytics`) with duration, pauses, branches and activity metrics. Long pauses and repeated edits are flagged as points worth reviewing. Available to the session's interviewer and to authorized organization owners. | P1 |
| IN-03 | Derived metrics are stored separately from source events so they can be recalculated if the logic changes. | P1 |
| IN-04 | Cross-session struggle heatmaps (`GET /sessions/:sessionId/heatmap`) are question-level aggregates over eligible sessions. The feature is enabled per policy and never exposes identifiable candidate data. | P1 |

### 5.9 API Conventions

- HTTP routes are versioned under `/api/v1`. Live collaboration uses WebSocket events.
- Access tokens are sent as `Authorization: Bearer <token>`. Public routes are signup, login and invitation acceptance where permitted.
- All HTTP bodies, query parameters, route parameters and socket payloads are validated at runtime (Zod).
- Errors use one typed envelope with `code`, `message`, `details` and `requestId`. Internal stack traces are never returned.
- Contracts are captured in OpenAPI, with request schemas, response schemas, event payloads and permission checks kept in version control.

| Status | Meaning |
| --- | --- |
| 400 | Invalid input |
| 401 | Missing or invalid authentication |
| 403 | Authenticated but not authorized |
| 404 | Resource not found or intentionally concealed |
| 409 | Duplicate or conflicting state |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |
| 503 | Required service temporarily unavailable |

---

## 6. Key Screens

The interface prioritizes coding and debugging. Analytics and organization management live on separate screens so they never distract from a live session.

### 6.1 Live Coding Session

- Monaco editor with a breakpoint gutter
- Participant list and live presence indicators
- Run, pause, resume, step-over and step-into controls
- Shared call stack, scopes and variable inspection
- Console output and execution errors
- Current debugger owner and recording status, with access to session replay

### 6.2 Replay and Analytics

- Timeline scrubber and playback controls with event markers and snapshot navigation
- Replay of code and supported debugger state
- Branch creation from a supported checkpoint
- Per-session activity metrics (duration, pauses, branches) and authorized heatmap views

### 6.3 Session and Organization Lists

- Session list for the user, filtered to what they may access
- Organization view with members and organization sessions (owner and interviewers)
- Question bank list and editor

---

## 7. Architecture

The target design has eight independently deployable backend services behind an API gateway, a React and TypeScript client (Monaco, Yjs, Socket.IO client, replay UI) and shared infrastructure. It is implemented in phases. All eight services are not needed to demonstrate the MVP.

### 7.1 Services

| Service | Owns | Dependencies and communication |
| --- | --- | --- |
| Gateway | Routing, access-token validation, rate limits, WebSocket routing | Upstream services; no business database |
| Identity | Signup, login, user profiles, access and refresh tokens | Its own MongoDB database |
| Organization | Organizations, memberships, roles and entitlements | Its own MongoDB database; membership-change events |
| Session | Sessions, participants, invitations, questions, branch metadata | Its own MongoDB database; identity and membership claims |
| Realtime | Document synchronization, presence, debugger ownership | Redis namespace `rt:`; session authorization at join |
| Execution | Sandboxes, code execution, CDP debugging, execution jobs | Redis namespace `exec:`, BullMQ, Docker |
| Recorder | Durable ingestion and persistence of session events | Durable Redis Streams or equivalent broker; event store |
| Insights | Replay queries, session reports, cross-session heatmaps | Event store, analytics projections, TimescaleDB if justified |

### 7.2 Principles

1. Business-capability boundaries: identity, organizations, sessions, execution and analytics have distinct responsibilities.
2. Single ownership of data: each service writes its own authoritative data and others consume APIs or events, never its database.
3. Independent failure isolation: a sandbox crash must not bring down collaborative editing.
4. Appropriate communication: REST where an immediate result is needed, durable messaging where events must not be lost.
5. Independent scaling: realtime connections, execution workloads and analytics workers scale separately.

### 7.3 Communication Rules

- **Synchronous REST:** Client to Gateway to Identity, Organization or Session, with timeouts, bounded retries and explicit error responses.
- **Ephemeral Redis Pub/Sub:** Realtime and Execution exchange transient debugger commands and state broadcasts. Redis Pub/Sub is not the event store.
- **Durable stream and job queue:** Realtime and Execution publish to a durable event pipeline consumed by the Recorder. A session-ended event triggers Insights jobs through BullMQ.
- **No cross-database reads:** services refer to users, organizations and sessions by ID. JWT claims or event-fed caches supply frequent authorization context.

---

## 8. Data Model

Cross-service relationships are references by ID, not MongoDB foreign keys. Redis prefixes show logical ownership; production uses separate credentials and ACLs so a service cannot touch another service's namespace.

### 8.1 Ownership

| Store | Owner | Principal collections or keys |
| --- | --- | --- |
| Identity MongoDB | Identity | `users`, `refresh_tokens` |
| Organization MongoDB | Organization | `organizations`, `memberships` |
| Session MongoDB | Session | `sessions`, `questions`, `invitations` |
| Realtime Redis | Realtime | `rt:document:*`, `rt:presence:*`, `rt:debugger:*` |
| Execution Redis | Execution | `exec:jobs:*`, `exec:state:*` |
| Event store | Recorder | `session_events`, optional snapshots |
| Analytics store | Insights | `session_metrics`, `heatmap_aggregates` |

### 8.2 Entities

| Entity | Key fields |
| --- | --- |
| User | id, name, email, passwordHash, tier, createdAt |
| RefreshToken | id, userId, tokenId, tokenHash, expiresAt, revokedAt |
| Organization | id, name, tier, ownerId, createdAt |
| Membership | id, orgId, userId, role (`owner` or `interviewer`), createdAt |
| Session | id, creatorId, orgId (optional), sessionType, language, status, questionId (optional), parentSessionId (optional) |
| Participant / Invitation | sessionId, userId (optional for guests), role, invitationTokenHash, expiresAt |
| Question | id, title, description, starterCode, testCases, difficulty, language |
| SessionEvent | eventId, sessionId, sequence, type, actorId, payload, timestamp, schemaVersion |
| Snapshot | sessionId, event sequence it represents, derived state |
| SessionMetrics / HeatmapAggregate | sessionId or question, time range, aggregate values |

### 8.3 Constraints

- **User:** unique normalized email. Password hashes only.
- **RefreshToken:** unique `tokenId`, hashed token, expiry and revocation fields. Indexed by user and token ID, with TTL cleanup.
- **Membership:** unique compound index `(orgId, userId)`. A business rule or transaction preserves the ownership invariant.
- **Organization:** `ownerId` references a user ID. Creating an organization and its owner membership is atomic.
- **Session:** valid status enum and creator reference. A branch references a valid source session and replay checkpoint.
- **Participants:** unique `(sessionId, userId)` for authenticated participants. Guest invitees are handled explicitly.
- **Question:** supported language only. Test cases have validated input and expected-output formats.
- **SessionEvent:** unique `(sessionId, sequence)` or an equivalent unique event ID and ordering scheme.
- **Snapshots:** record the event sequence they represent.
- **Analytics:** derived results are stored apart from source events so they can be recalculated.

### 8.4 Event Envelope

```json
{
  "eventId": "evt_01",
  "sessionId": "ses_01",
  "sequence": 42,
  "type": "debugger.paused",
  "actorId": "usr_01",
  "timestamp": "2026-10-27T12:00:00.000Z",
  "payload": { "file": "main.js", "line": 12, "reason": "breakpoint" },
  "schemaVersion": 1
}
```

A log of commands alone cannot reconstruct arbitrary runtime state. Branching resumes from supported checkpoints or snapshots.

---

## 9. Non-Functional Requirements

- **Authentication and authorization:** bcrypt password hashes; short-lived JWTs; refresh tokens in HttpOnly, Secure cookies with rotation and revocation; strict CORS allowlist and CSRF protection where required; server-side session, organization and debugger-ownership checks.
- **Sandbox security:** untrusted code runs only in disposable, resource-limited, network-less containers (Section 5.6). A container alone is not assumed to eliminate every host-escape risk.
- **Rate limiting and validation:** stricter limits on login, refresh, invitation generation, execution and replay endpoints; limits on message size, event frequency and sockets per user; runtime validation of every payload.
- **Failure handling:** timeouts and bounded retries between services; circuit breakers where repeated downstream failures could cascade; idempotent durable consumers with retries and dead-letter handling.
- **Reliability:** an accepted edit is not assumed durable just because a broadcast succeeded; acknowledgement and recovery are defined. A realtime or recording failure must not end an in-progress interview.
- **Auditability and observability:** correlation and request IDs, structured logs without secrets, per-service health checks.
- **Secrets:** kept in environment-specific secret storage, never in Git.
- **Privacy:** heatmaps use aggregated, eligible sessions and avoid identifiable candidate data. Participants are told the session is recorded.
- **Scalability (design targets, not measured claims):** gateway as stateless replicas; Realtime with the Redis adapter and multiple instances; Execution workers scaled independently behind a bounded queue; Recorder consumers partitioned by session; Insights as background jobs with precomputed aggregates; old sessions archived to object storage if volume warrants.

---

## 10. Environments and Hosting

- **Development:** pnpm and Turborepo monorepo, Docker Compose for services and dependencies, separate environment variables per service.
- **Demonstration:** React frontend and gateway on a public endpoint. Backend services on a suitable server or the K3s home lab, with a managed or carefully secured private database.
- **Public access:** Cloudflare Tunnel routes only the intended hostname to the gateway or ingress, with WebSocket support, trusted origins and timeouts configured. A tunnel is not a substitute for authorization or sandbox isolation.
- **Internal network:** Redis, MongoDB, the Docker daemon, execution workers and internal service ports are never exposed to the internet.
- **CI/CD:** versioned, scanned container images pushed to a registry and deployed with a restricted identity. No reliance on the mutable `latest` tag.
- **Capacity caveat:** the home lab is an older Debian machine with about 4 GB RAM. It suits learning K3s but is tight for all eight services, databases, realtime connections and sandboxes together. Run a reduced deployment with strict limits, keep execution concurrency conservative, and use managed data stores rather than weakening isolation.

---

## 11. Assumptions, Risks and Open Questions

### 11.1 Assumptions

1. v1 supports JavaScript only, with one interview journey end to end.
2. Interviewers use an external tool for video and voice.
3. The eight-service architecture is the target. Services are built in phases and not all are needed for the MVP demo.
4. Replay reconstructs document and supported debugger state from events and snapshots, not a live runtime.
5. All organizations are on a single free tier during the MVP.

### 11.2 Risks

| Risk | Mitigation |
| --- | --- |
| Malicious or runaway code escapes or exhausts the sandbox | Container isolation, resource limits, no network, non-root, disposable instances, bounded queue, security review |
| A recorded event is lost or applied twice | Durable stream, outbox where needed, acknowledgements, idempotent consumers, sequence checks |
| Debugger state diverges between participants | Execution service as single source of truth; Realtime verifies ownership; clients render state only |
| Users expect replay to restore a running process | State the limit in product copy; branch only from supported checkpoints |
| Eight services create heavy operational overhead for one builder | Phased delivery; the open decision in 11.3 on modular deployment |
| Home-lab capacity is insufficient | Reduced deployment, strict limits, managed data stores |
| LeetCode import breaks or breaches terms | Adapter, legal review, manual entry always available |
| Candidate privacy concerns about recording | Recording notice, aggregated heatmaps, retention policy |

### 11.3 Open Questions

- Will each of the eight services have its own deployable and database boundary from the start, or will fewer applications with clearly separated modules be deployed first and split as their phases arrive? Ownership boundaries must be preserved either way, with no cross-service database access.
- How are guest invitees handled: must candidates authenticate, or can they join through an invitation alone?
- Which checkpoints are supported for replay and branching in v1?
- Are questions private to a user, shared within an organization, or both?
- What is the data retention period for events, snapshots and analytics?
- Is LeetCode import limited to a user-provided URL, and will it be built before launch?
- What are the session-level access rules for organization owners viewing interviewers' sessions?

---

## 12. Delivery Phasing

| Phase | Focus |
| --- | --- |
| 1. Foundation | Separate Gateway, Identity and Session services; authentication and session APIs |
| 2. Realtime | Yjs synchronization, presence, session joins and debugger ownership |
| 3. Execution | Isolated JavaScript execution, CDP commands and output streaming |
| 4. Recorder | Durable event stream, persistence and ordered reconstruction |
| 5. Insights | Replay, branching, reports and heatmaps built from recorded events |
| 6. Organization | Full Organization service once dashboard and membership workflows are needed |

Growth stages: (1) local development with a few concurrent sessions and one execution worker; (2) a public demo with authentication, strict sandbox limits, monitoring and bounded queues; (3) multiple realtime instances, independently scaled execution workers, durable event processing and replay snapshots; (4) workload-driven storage optimization and stronger sandbox isolation as usage justifies.

---

## 13. Release Readiness (Definition of Done)

- Two users collaborate on the same JavaScript file with live presence.
- Both users see the same paused state, call stack and variables, and only the debugger owner can issue debug commands.
- A finished session is recorded and can be replayed by scrubbing the timeline.
- A branch can be created from a supported checkpoint and run in a fresh sandbox.
- A session report is generated after a session ends, and an organization owner can list their organization's sessions.
- Sandbox limits (memory, CPU, time, no network) are verified with adversarial test programs.
- Event durability and duplicate handling are tested; authorization tests cover session, organization and debugger-ownership rules.
- Deployment through the tunnel, health checks and monitoring are verified, and a recorded fallback demo exists.
- All P0 requirements pass their acceptance criteria.
