# CashMine — React Native task

Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript 6 (strict) · Expo Router · TanStack Query 5 · zod 4

## Run

```bash
npm install
cp .env.example .env.local   # fill API URL + token from the brief
npm run ios                  # or: npm run android / npx expo start (Expo Go)
```

Quality gate (also runs in GitHub Actions): `npm run check` → typecheck, lint, tests.

## What I built

<!-- Fill in during the task: scope from the brief, screenshots / short video -->

## Architecture

```
src/
  app/                 Expo Router routes (screens only)
  features/<name>/     schemas.ts (zod) · api.ts · queries.ts · components/
  components/ui/       Button, QueryView, Loading/Error/Empty views
  lib/api/             typed fetch client + ApiError
  lib/auth/            token storage (SecureStore)
  lib/money.ts         decimal-string / bigint amount helpers
  lib/query-client.ts  TanStack Query defaults, AppState focus
```

### Key decisions

- **Every response is validated with zod.** A server contract change surfaces as a clear `parse` error,
  not as `undefined` rendered on a balance screen.
- **Typed error model** (`http` / `network` / `timeout` / `parse`) → one place mapping errors to user messages.
- **Amounts never touch JS `number`.** Decimal strings for display, `bigint` base units for math.
- **Mutations are never auto-retried; transfers carry an `Idempotency-Key`** so a retry after a timeout
  cannot move money twice.
- **Server state lives in TanStack Query**, no global store. Refetch on app foreground via `AppState`.
- **Token in SecureStore** (Keychain / Keystore), not AsyncStorage.

## Trade-offs & what I'd do next

<!-- Fill in at the end: what was cut for time, known issues, next steps -->

## AI usage

See [`docs/ai-conversations`](docs/ai-conversations).
