# Email delivery

Email-only RabbitMQ worker. No public HTTP endpoint or in-app notification delivery is added. Session and organization services retain invitation creation, permissions, acceptance, and token ownership.

## Run locally

From this directory:

```sh
docker compose up -d --build
```

This starts an isolated development stack with RabbitMQ, Mailpit, and this worker. It does not change the root application's Compose stack.

- RabbitMQ management: http://localhost:15673 (user `notification`, password `local-notification-password`)
- Mailpit inbox: http://localhost:8026
- RabbitMQ AMQP: localhost:5673
- SMTP capture: localhost:1026

The Compose credentials are development-only. Ports bind to loopback. Mailpit captures email instead of sending to real recipients.

To run the worker on the host instead:

```sh
docker compose up -d rabbitmq mailpit
cp config.example .env
npm ci
npm run build
npm start
```

No database is required. RabbitMQ stores pending delivery work; this service does not create notification records or an inbox.

For a real SMTP provider, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `EMAIL_FROM`. Use `SMTP_SECURE=true` for implicit TLS (commonly port 465), or `SMTP_SECURE=false` and `SMTP_REQUIRE_TLS=true` for STARTTLS (commonly port 587). The example disables required TLS only for local Mailpit.

## Exchanges and queues

| Exchange | Type | Purpose |
| --- | --- | --- |
| `pairscope.events` | topic | Accept domain events |
| `pairscope.notification.delivery` | direct | Return retries to email processing, key `email` |
| `pairscope.notification.retry` | direct | Select retry bucket, keys `email.retry.1` through `email.retry.3` |
| `pairscope.notification.dead` | direct | Terminal failures, key `email` |

The main queue is `notification.email`. Its event bindings are:

- `session.invitation.created.v1`
- `organization.invitation.created.v1`
- `email.requested.v1`

Default retry queues are `notification.email.retry.10000ms`, `notification.email.retry.60000ms`, and `notification.email.retry.300000ms`. They have no consumers: their queue-level TTL expires messages back to the delivery exchange. There are four total attempts, including the initial attempt. Terminal failures go to `notification.email.dlq`, which has no automatic consumer or replay loop.

All queues are durable quorum queues with a 64 MiB byte limit and reject-publish overflow. Sources that dead-letter use at-least-once dead lettering. Main-queue broker redeliveries are also capped at 20 to quarantine crash loops. This local single-node broker provides persistence, not node-failure redundancy.

Retry TTLs and queue arguments are declared together in `src/messaging/topology.ts`. Changing an existing queue's TTL/type/arguments requires a planned queue migration; redeclaring incompatible arguments fails. Keep delay configuration identical across worker replicas. Changing delays adds new buckets; drain old buckets before removing them.

## Publish from another service

Publish JSON to `pairscope.events` with the event type as the routing key. Use persistent messages, publisher confirms, and `mandatory: true`; handle returned messages, since confirmation alone does not guarantee routing. Provision exchanges/queues before enabling producers. The worker declares them on startup; it can also be done as a deployment provisioning step.

Do not call the email provider from session/org services, or import this service's implementation. Save an event in a transactional outbox beside the invitation, then have an outbox publisher forward it to RabbitMQ and mark it published after confirmation. Those producer/outbox integrations are not added by this service.

Example session invitation:

```json
{
  "eventId": "9c876c18-35bf-4f1a-9d45-a85d408c6d88",
  "type": "session.invitation.created.v1",
  "occurredAt": "2026-11-26T10:00:00Z",
  "data": {
    "invitationId": "f03c3f22-b963-45cb-91d4-53c720bec627",
    "sessionId": "785d8049-5780-431c-9e7e-70569e5ee3c3",
    "recipientEmail": "person@example.com",
    "inviterName": "Nishad",
    "sessionTitle": "Pair programming",
    "invitationUrl": "http://localhost:5173/join/your-invitation-token",
    "expiresAt": "2026-11-26T11:00:00Z"
  }
}
```

Use current timestamps when trying this example. For organization invitations, change the type to `organization.invitation.created.v1` and replace `sessionId`/`sessionTitle` with `organizationId`/`organizationName`. The producer supplies the real acceptance URL; this service does not implement organization invitation acceptance.

For other text emails, publish `email.requested.v1` with the same envelope and data containing `recipientEmail`, `subject`, `text`, and `expiresAt`. Attachments and arbitrary HTML are intentionally unsupported. Invitation links must match `FRONTEND_URL`'s origin. All events require an expiry; expired events are skipped and acknowledged.

Use a stable `eventId` for redelivery. A deliberate resend is a new event ID. Producers must supply the original invitation URL securely: hashed tokens cannot reconstruct it.

## Delivery and failure behavior

- Consumers acknowledge only after SMTP acceptance, or after a confirmed retry/DLQ transfer.
- Delivery is at least once. There is no database or durable sent-message deduplication. Producers should use stable event IDs for tracing; SMTP may accept duplicates after ambiguous failures.
- Invalid events, unexpected invitation URL origins, and permanent SMTP failures go directly to the DLQ.
- SMTP connection errors, rate limits, temporary failures, and other temporary failures use bounded retries. Authentication errors are flagged `SMTP_AUTH_FAILED` and eventually reach the DLQ; alert on this code and fix configuration.
- Retry transfers use a separate publisher-confirm channel. Unroutable transfers, channel failures, or confirm timeouts close the connection without acknowledging the original. RabbitMQ redelivers after recovery.
- Reconnection redeclares topology and recreates consumers with backoff. Shutdown cancels consumption and drains in-flight work before closing connections, with a bounded process shutdown deadline.
- Logs contain event IDs, statuses, and safe error codes, not email bodies, recipient addresses, invitation URLs, SMTP responses, or credentials.

SMTP acceptance is not inbox delivery. This service does not yet consume delivery/bounce webhooks. SMTP acceptance and RabbitMQ acknowledgement are separate operations: if a worker crashes between them, a duplicate remains possible. The stable Message-ID aids tracing but is not a provider idempotency guarantee.

Inspect and correct DLQ failures before controlled replay. Retry metadata is application-owned (`x-retry-attempt`); reset it deliberately for a replay and preserve the original event ID for tracing. Do not replay expired or revoked invitations blindly; revocation remains owned by the invitation service and is not queried by this worker.

## Operations

Use dedicated production broker users/vhosts, least-privilege permissions, AMQPS, a verified sender domain. Publishers should have no consumer or management permissions. The notification worker requires topology configuration and delivery queue permissions.

Monitor queue age/depth, DLQ depth, retry codes, worker readiness logs, SMTP rejection rates, and RabbitMQ disk/memory alarms. Queue contents and the DLQ can contain invitation URLs and recipient data; restrict access and define retention/cleanup policies.
