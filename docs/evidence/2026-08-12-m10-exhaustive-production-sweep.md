# M10 / G1-006 exhaustive production route proof — 2026-08-12

Evidence source: Shift Whole-Estate Route Sweep, production push run `31637899433`, job `94252761447`, against merged `main` commit `57f83d71989a620fb6a78162cc0466655b579b78` (PR #73).

## Demonstrated production outcome

The unchanged production sweep started from `https://shiftsometimber.co.uk/` plus the member-login entry point and exhausted same-origin static `href` / `src` discovery rather than stopping at a configured sample ceiling.

Result:

- 418 same-origin URLs checked.
- 370 HTML pages checked.
- 0 critical route, asset or blank-page failures.
- Redirect chains audited.
- Obvious generic error pages rejected by the gate.
- Discovery completed with `truncated:false` under a 1,000-URL safety ceiling.
- Inline script/style bodies are excluded from static link discovery so template strings are not misclassified as real links; real static markup remains scanned.
- Failure output retains the parent page that discovered a bad URL, making remediation traceable.

The run completed GREEN and emitted: `418 same-origin URLs checked · 370 HTML pages · 0 critical route/asset/blank-page failures · discovery exhausted`.

## Commissioning decision

This is sufficient evidence for original audit row **G1-006 — broken/dead routes and links not centrally detected** to move to PASS: the release mechanism now centrally and exhaustively checks the discoverable same-origin estate and fails on broken routes/assets rather than relying on manual discovery.

This evidence does **not** by itself close G1-007, G1-008 or G1-009. Exhaustive member-facing error-state behaviour, rendered loading/empty/success acceptance, and real mobile/cross-browser acceptance remain separate evidence requirements.
