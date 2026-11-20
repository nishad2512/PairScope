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
- `/organizations`: organization creation and browsing.
- `/organizations/:orgId`: members, adding existing users by ID, and confirmed removal.
- `/join/:token`: guest or signed-in participant joining.

The editor file is intentionally untouched and has no route in this UI. Session creation opens the session overview; guest joining confirms participation. Editor handoff can be added when the editor is ready. Social login, password reset, and download links are omitted because corresponding API flows do not exist.

Browser history routes need an `index.html` fallback in production, and the deployment must forward `/api` to the gateway. Access tokens remain in memory; refresh cookies restore an authenticated workspace after reload.
