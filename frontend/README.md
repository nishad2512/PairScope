# PairScope frontend

React + TypeScript + Vite. The interface uses the existing Axios API helpers and Zustand auth store, with Tailwind CSS v4, Lucide icons, and the Paper grain shader.

## Development

```sh
npm install
npm run dev
```

Vite forwards `/api` to the existing gateway at `http://localhost:3000`. Start the PairScope backend separately. No credentials or sample data are embedded in the app.

```sh
npm run build
npm run lint
```

## Structure

- `src/components/ui/`: shared form controls, buttons, feedback, dialog, and the adapted `auth-section-1.tsx` reference.
- `src/components/`: navigation shell and reusable session UI.
- `src/pages/`: authentication, overview, sessions, organization/member management, and invitation joining.
- `src/hooks/use-resource.ts`: cancellable reads with explicit loading, failure, and retry states.
- `src/index.css`: design tokens, responsive layouts, and reduced-motion styling.
- `src/api/`, `src/store/`, `src/types/`: existing request flow and shared contracts.

`components.json`, the `@/` alias, Tailwind, and `src/lib/utils.ts` establish the shadcn-compatible structure. Keep reusable UI in `src/components/ui/` so generated components and application imports share one predictable location. No separate shadcn scaffold is needed.

## Routes

- `/login`, `/signup`: email/password authentication and session restoration.
- `/dashboard`: counts derived from the current user’s actual sessions.
- `/sessions`: search, type/status filters, creation, and optional scheduling.
- `/sessions/:sessionId`: overview and role-based invitation links.
- `/sessions/:sessionId/editor`: shared Monaco editor, participant presence, and remote cursors.
- `/organizations`: organization creation and browsing.
- `/organizations/:orgId`: members, adding existing users by ID, and confirmed removal.
- `/join/:token`: guest or signed-in participant joining.

The Editor uses simple components for its header, code area, participants, and output panels. Code edits sync through Yjs using the realtime service, alongside presence and cursor/selection positions. The editor loads the session snapshot on join and merges unacknowledged edits on reconnect. Editing pauses while disconnected; old local drafts are not imported into the shared document. The realtime service retains snapshots for 24 hours after the last edit; execution, debugging, chat, and video controls are unavailable placeholders. Monaco and its worker are bundled locally and loaded only on the Editor route.

Guest invitation joins retain their session-scoped token in `sessionStorage`, separately from registered-user auth. Account tokens remain in memory. Vite proxies both `/api` and `/socket.io` to the gateway. The existing realtime service must be running with a working session-authorization endpoint before real room joins can succeed. This frontend change does not modify or replace that backend endpoint.

Browser history routes need an `index.html` fallback in production, and the deployment must forward `/api` to the gateway. Access tokens remain in memory; refresh cookies restore an authenticated workspace after reload.
