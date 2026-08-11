# Shift Commissioning Evidence Ledger

This file records demonstrated evidence against the authoritative remediation matrix. A merge or source presence alone is not PASS.

## Gate 1

### G1-001 — Password recovery consolidation
Status: AMBER / IN PROGRESS.

Evidence:
- `auth-recovery-v1.js` is wired before fallback routing in `worker-entry-v6.js`.
- integration source gate asserts authoritative recovery wiring.
- reset/change-password source contracts exist.

Outstanding before PASS:
- real inbox receipt of reset email;
- one-time reset link works;
- existing sessions revoked;
- login with new password succeeds.

### G1-002 — Email delivery binding
Status: AMBER / IN PROGRESS.

Evidence:
- Email Service binding `EMAIL` configured on production Worker by owner.
- Cloudflare dependency/toolchain failure diagnosed and permanently remediated.
- stable Wrangler/Node/npm toolchain pinned and guarded against prerelease drift.
- Cloudflare branch deployment for PR #28 succeeded after remediation.

Outstanding before PASS:
- production Worker demonstrates reset and welcome mail reaching a real inbox.

### G1-003 — Registration transactional lifecycle
Status: AMBER / IN PROGRESS.

Evidence:
- registration wrapper calls transactional welcome email through `env.EMAIL` when registration succeeds.

Outstanding before PASS:
- new account receives welcome/verification lifecycle expected at launch.

### G1-005 — Member persistence
Status: AMBER / IN PROGRESS.

Evidence:
- canonical profile persists in `users`.
- canonical member preferences/state persists in `member_state` via `ON CONFLICT(user_id) DO UPDATE`.
- Gate 1 persistence source contract is enforced in CI.
- `gate1-production-journey-probe.mjs` implements non-destructive save -> reread -> logout -> login -> retained-state commissioning and restores the test account afterwards.

Outstanding before PASS:
- run authenticated production probe with dedicated commissioning credentials and capture PASS output.

### G1-006 — Broken/dead route detection
Status: IN PROGRESS.

Evidence:
- production probe deliberately requests a nonexistent API route and requires controlled 404 behaviour.
- public production route probe now runs in the master integration gate.

Outstanding before PASS:
- complete public-site/internal-link/form route inventory and zero critical broken journeys.

### G1-007 — Error handling / traceability
Status: IN PROGRESS.

Evidence:
- production API probe demonstrated controlled 404 with `X-Shift-Request-Id` and body `requestId`.
- source gate requires request IDs on unhandled errors and not-found responses.

Outstanding before PASS:
- member-facing critical errors use shared safe UX states and all important failures remain traceable.

### G1-011 — Production entry-point wiring
Status: PASS.

Evidence:
- master integration gate asserts production entry-point wiring for member commissioning, personal routes, Knowledge Graph, Radar, scheduled intelligence and authoritative auth recovery.
- Shift Master Integration Gate passed after the toolchain remediation.
- Cloudflare deployment succeeded using the pinned production toolchain.

Regression control:
- source gate fails if authoritative routing disappears.

### G1-012 — Synthetic member commissioning
Status: IN PROGRESS.

Evidence:
- existing member commissioning endpoint tests product-engine contracts.
- production persistence journey probe added and wired to CI for public checks.

Outstanding before PASS:
- authenticated register/login/member-product/return journey automated end-to-end, including frontend states.

## Gate 2–5

Evidence will be appended against the same matrix IDs as commissioning progresses. Items with genuine external clinical/partner dependencies remain BLOCKED rather than being omitted.
