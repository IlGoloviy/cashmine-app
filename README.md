# CashMine — React Native (Expo) web task

**Live:** <!-- fill in: https://… -->

Expo SDK 58 · React Native 0.88 + react-native-web · React 19.3 · TypeScript 6 (strict) · Expo Router · TanStack Query 5 · zod 4

Built with Expo / React Native and delivered as a **mobile web app** (open the live link on a phone).

## Run locally

```bash
npm install
cp .env.example .env.local   # API URL + token from the brief
npm run web                  # http://localhost:8081
```

| Script                   | What it does                                      |
| ------------------------ | ------------------------------------------------- |
| `npm run check`          | typecheck + lint + tests (also in GitHub Actions) |
| `npm run build:web`      | static export to `dist/`                          |
| `npm run preview:web`    | serve `dist/` locally like production             |
| `npm run deploy:preview` | build + deploy a Netlify draft URL                |
| `npm run deploy`         | build + deploy to production on Netlify           |

## What I built

<!-- Fill in during the task: scope from the brief, screenshots -->

## Architecture

```
src/
  app/                 Expo Router routes (screens only)
  features/<name>/     schemas.ts (zod) · api.ts · queries.ts · components/
  components/ui/       Screen, Button, TextField, QueryView, Loading/Error/Empty
  lib/api/             typed fetch client + ApiError
  lib/auth/            token storage (SecureStore native / sessionStorage web)
  lib/money.ts         decimal-string / bigint amount helpers
  lib/query-client.ts  TanStack Query defaults
public/                copied into the web build (`_redirects` SPA fallback for Netlify)
ai-logs/               AI conversations
```

### Key decisions

- **Every response is validated with zod.** A contract change surfaces as a clear `parse` error,
  not as `undefined` rendered on a balance screen.
- **Typed error model** (`http` / `network` / `timeout` / `parse`) → one place mapping errors to user messages.
- **Amounts never touch JS `number`.** Decimal strings for display, `bigint` base units for math.
- **Mutations are never auto-retried; money-moving calls carry an `Idempotency-Key`.**
- **Server state lives in TanStack Query**, no global store.
- **Web-first details:** phone-width layout, 16px inputs (no iOS Safari zoom), browser `confirm` instead of
  the no-op `Alert`, SPA rewrites so deep links survive a refresh.

## Trade-offs & what I'd do next

- The API token is provided as `EXPO_PUBLIC_API_TOKEN`, so it is visible in the deployed JS bundle.
  Acceptable for a test token; in production the token would come from a user sign-in, or requests
  would go through a backend/edge proxy that holds the secret.

<!-- Fill in at the end: what was cut for time, known issues, next steps -->

## AI usage

See [`ai-logs/`](ai-logs).
