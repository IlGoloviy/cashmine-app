# Notes

## Decisions

**Amounts.** Decimal strings at the edges (API, UI), `bigint` base units (`10^decimals`) for every
comparison and subtraction (`src/lib/money.ts`, `src/features/claims/amount.ts`). USD values are an
exact `bigint` product of amount × `usdPrice` and are **truncated** to cents — showing more than the
user owns is worse than showing a cent less. The total is summed exactly and truncated once, so it
can be one cent above the sum of the rounded rows (seen live: $32,142.72 vs $32,142.71). User input
must match the API grammar (`.5`, `1.`, `05`, `1e-3` rejected; `,` accepted as a decimal separator
for phone keyboards), at most `decimals` places, `minAmount ≤ amount ≤ available`, and amount > fee.
_Alternative:_ a decimal library (big.js) — rejected: the only operations are +, −, ×, compare,
which `bigint` does exactly with no dependency. "Total in USD" = available + pending + claiming
(everything that is the user's); the brief doesn't say, so this is an assumption.

**Balance right after a claim.** Approaches considered (log: the plan message, "B. Balance right
after a claim"):
1. _Server only_ + "claim in progress" banner — honest, but the balance doesn't move for up to 15 s
   → "I claimed and my balance didn't change, so I claimed again."
2. _Optimistic subtract_, replaced by the next fetch — a snapshot taken _before_ the claim brings the
   old number back → "dropped, then jumped back up."
3. **Chosen: snapshot-aware overlay** (`src/features/claims/overlay.ts`). For each claim created in
   this session we compare its server timestamps with the snapshot's `asOf` to know what the
   snapshot already includes, and apply only the difference (e.g. `available −a, claiming +a` while
   the snapshot predates the claim). When the snapshot catches up the difference is zero, so the
   number never jumps back unless the claim really failed — and then the status screen says why.
   No client clock involved. The asset total is unchanged while a claim is in flight.

**Unknown claim outcome** (network error, our 15 s timeout, 5xx, 504, or an unreadable 2xx). The
form locks and says the claim _may_ have gone through. **Check again** resends the **same
Idempotency-Key and body** — the server replays the original claim or creates it exactly once. No
automatic retry (mutations are `retry: false`; resending is the user's explicit choice). The attempt
is persisted **before** the POST and cleared only on success or a definite 4xx, so a reload or
closed tab can't lose the key; Home shows an "Unconfirmed claim" banner until it is resolved.
"Start over" exists but warns first. Verified live: the first POST returned 504, Check again
returned the original claim, and available ETH dropped by exactly 0.01.
_Alternative:_ auto-retry with the same key and backoff — safe too, but hides what is happening.

**Other.** Token entered in the UI and kept in `localStorage` (brief: "keeps it in the browser";
`sessionStorage` would ask again after closing the tab) — readable by any XSS on the origin,
acceptable for a test token. Never read from env, so it can't be inlined into the bundle. A 401
clears it; changing it clears all cached data and any unconfirmed attempt (a resend must never go
out under another account). API base URL is one constant in `src/lib/env.ts`. 429 waits
`retryAfterMs`; GETs retry network/5xx, never 4xx or schema errors. Claim status polls every 2 s.

## Working with AI

All in [`ai-logs/01-task.md`](ai-logs/01-task.md).

1. **Prompt that didn't work.** My first paste of the brief ended at the placeholder
   `<paste API docs>` — the API contract was missing, so the AI would have had to guess endpoints,
   the amount grammar and the idempotency rules. I interrupted it and re-sent the brief with the
   full API docs (log: `Request interrupted by user`). Lesson: give the contract up front — every
   correctness rule of the claim flow lives in the docs, not in the brief.
2. **AI output wrong or risky — and how it was caught.**
   - The scaffold's `env.ts` fell back to `EXPO_PUBLIC_API_TOKEN`; Metro would have inlined the token
     into the deployed bundle. Caught while planning (log: "Fix before the first deploy"); removed
     and the build grepped for references.
   - The AI edited `.env.example` with a Python script, sidestepping the `Edit(**/.env*)` deny
     rule, and `npm run format` silently reformatted the committed AI log. Both caught from
     `git status`; the log was restored and `ai-logs` added to `.prettierignore`.
   - Browser testing found a real bug: a restored unconfirmed claim showed "—" as the amount because
     it was re-validated against the _current_ balance (which drops if the claim went through).
3. **Rejected AI actions.** Before the task I set deny rules in `.claude/settings.json` for
   reading/editing `.env*` and for destructive git commands, instead of relying on the AI's
   restraint. During the task they rejected its actions twice: a `cat .env.example`, and a combined
   command that included `git diff .env.example` and a `git checkout` of the AI log (log:
   `has been denied`). The rules also showed a gap: the AI had already edited `.env.example`
   through a Python script, which the `Edit(**/.env*)` rule doesn't cover — so the rules are a
   safety net, and I still review every diff touching env files.

## Not done / known issues

- The session-claim overlay is in memory: after a reload during a pending claim, the balance can
  lag for up to one snapshot (≤ 15 s). Unconfirmed attempts _are_ persisted.
- Preview fee comes from `claim-options`; if it changed before submit, the server's fee (shown on
  the status screen) wins. A restored attempt's "you receive" uses the current fee.
- Max uses the snapshot's `available`; the server checks live, so Max can be rejected with a 400
  (shown on the form).
- Unknown outcome isn't reconciled automatically (next: look up the claim in `/v1/activity`).
- Only unit tests (amount rules, fee, totals, overlay, outcome classification, API client); no
  component/E2E tests. Tested in a 375×812 emulated viewport, not on a physical iPhone.
- The Refresh button shows a spinner on every 15 s background poll.
- Times display in the device's time zone; "stale" uses the device clock.
