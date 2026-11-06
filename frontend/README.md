# PairScope frontend

## Run locally

```sh
npm install
npm run dev
```

The Vite server runs on port `5173`. Requests to `/api` are proxied to
`http://localhost:3000`, so the browser can use the API gateway without
requiring cross-origin configuration. The signup and login screens are
available at `/signup` and `/login`.

Set `VITE_API_BASE_URL` to change the API prefix. In a deployed build, configure
your web server or reverse proxy to route that prefix to the API gateway; Vite's
proxy is only active during local development.

## Source layout

- `src/components/` contains reusable interface elements and auth form pieces.
- `src/pages/` contains route-level screens.
- `src/hooks/` contains reusable React state logic.
- `src/services/` and `src/lib/` contain API operations and the shared HTTP client.
- `src/types/` contains shared TypeScript contracts.
