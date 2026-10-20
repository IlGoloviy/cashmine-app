# CashMine — payback balances & claims (Expo, mobile web)

**Live:** https://cashmine-holovii.netlify.app — open on a phone, paste your API token on first open.

Expo SDK 58 · React Native 0.88 + react-native-web · TypeScript (strict) · Expo Router ·
TanStack Query 5 · zod 4. Decisions, AI usage and known issues: [NOTES.md](NOTES.md).

## Run locally

```bash
npm install
npm run web          # http://localhost:8081 — the app asks for the API token
```

No `.env` is needed: the API base URL is a constant in [`src/lib/env.ts`](src/lib/env.ts) and the
token is entered in the app (never bundled). Optional: put `EXPO_PUBLIC_API_TOKEN=…` in `.env.local`
so `npm run ai-logs` can redact it from exported conversations — the app itself doesn't read it.

| Script                | What it does                                                  |
| --------------------- | ------------------------------------------------------------- |
| `npm run check`       | typecheck + lint + unit tests                                 |
| `npm test`            | unit tests only                                               |
| `npm run build:web`   | static export to `dist/`                                      |
| `npm run preview:web` | serve `dist/` like production                                 |
| `npm run deploy`      | build + deploy to Netlify                                     |
| `npm run ai-logs`     | export the Claude Code session to `ai-logs/` (token redacted) |

## What works

- **Token** — asked on first open, verified against the API before saving, kept in this browser
  (`localStorage`), changeable from the header. A 401 sends you back to the token screen.
- **Balances (Home)** — per asset: available, pending, claiming and USD value; portfolio total in USD;
  "as of N s ago" with a stale warning; auto-refresh every 15 s, Refresh button and pull-to-refresh;
  loading, error + retry, empty states; transient API errors (503, network) retried with backoff,
  429 waits the server's `retryAfterMs`.
- **Claim** — pick asset and destination, enter an amount or tap Max; validated against the API
  rules as you type (format, decimals, min, available, fee); fee and "you receive" shown before a
  confirm dialog. One Idempotency-Key per claim, never auto-retried, button disabled while sending.
- **Claim status** — polls until completed or failed (with the failure reason); balances and
  activity refresh when it settles. Balances reflect a just-submitted claim without double counting
  or jumping back (see NOTES.md).
- **Unknown outcome** (timeout, 5xx, network) — form locks, "Check again" safely resends the same
  request; the attempt survives reloads and is flagged on Home until resolved.
- **Activity** — paginated history of accruals, reversals and claims (infinite scroll + Load more);
  your claims open their status screen.
- **Tests** — 58 unit tests: amount parsing/validation, fee and receive amount, USD totals, the
  balance-after-claim overlay, outcome classification, API client and retry policy.

## Structure

```
src/app/              routes: index (balances), claim, claims/[id], activity, token
src/features/         auth · balances · claims · activity  (schemas.ts · api.ts · queries.ts · components/)
src/lib/              api client + ApiError, money (bigint), token storage, query client
ai-logs/              raw AI conversations
```
