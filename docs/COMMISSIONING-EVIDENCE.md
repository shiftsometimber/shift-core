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
- Email Service binding `EMAIL` configured on production Worker and represented in current `wrangler.jsonc`.
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
- frontend audit identified and removed split-brain API ownership in the prepared V3.3G public package: old adapters and the legacy shell could overwrite the current `window.SST_API`.

Outstanding before PASS:
- run authenticated production probe with dedicated commissioning credentials and capture PASS output;
- deploy V3.3G+ frontend integrity package and exercise critical member saves on production.

### G1-006 — Broken/dead route detection
Status: AMBER / IN PROGRESS.

Evidence:
- production probe deliberately requests a nonexistent API route and requires controlled 404 behaviour.
- public production route probe runs in the master integration gate.
- V3.3F public package static inventory inspected 418 HTML files.
- V3.3G remediation package has zero unresolved local href/src references after static route resolution.
- frontend integrity audit recorded in `docs/GATE1-FRONTEND-INTEGRITY-AUDIT.md`.

Outstanding before PASS:
- deploy remediated public package and complete production navigation/form journey check on mobile.

### G1-007 — Error handling / traceability
Status: AMBER / IN PROGRESS.

Evidence:
- production API probe demonstrated controlled 404 with `X-Shift-Request-Id` and body `requestId`.
- source gate requires request IDs on unhandled errors and not-found responses.
- current API adapter converts timeout/network failures to member-safe messages.

Outstanding before PASS:
- member-facing critical errors use shared safe UX states after frontend deployment and all important failures remain traceable.

### G1-010 — Auth/session security commissioning
Status: AMBER / IN PROGRESS.

Evidence:
- auth security regression gate enforces `HttpOnly`, `Secure`, `SameSite=Lax` session cookies.
- failed-login lockout, session revocation, reset-token expiry, reset password minimum length, PBKDF2 and constant-time comparison are regression-protected in CI.

Outstanding before PASS:
- formal rate-limit/session/security commissioning including production behaviour and abuse cases.

### G1-011 — Production entry-point wiring
Status: PASS.

Evidence:
- master integration gate asserts production entry-point wiring for member commissioning, personal routes, Knowledge Graph, Radar, scheduled intelligence and authoritative auth recovery.
- Shift Master Integration Gate passed after the toolchain remediation.
- Cloudflare deployment succeeded using the pinned production toolchain.

Regression control:
- source gate fails if authoritative routing disappears.

### G1-012 — Synthetic member commissioning
Status: AMBER / IN PROGRESS.

Evidence:
- existing member commissioning endpoint tests product-engine contracts.
- production persistence journey probe added and wired to CI for public checks.
- frontend route/adapter integrity has now been statically commissioned in the V3.3G package.

Outstanding before PASS:
- authenticated register/login/member-product/return journey automated end-to-end, including frontend states.

## Gate 2 — Nothing Half-Finished

### G2-001 — Shift Today daily command centre
Status: AMBER / IN PROGRESS.

Evidence:
- PR #33 merged after Master Integration Gate + Academy PASS.
- `member-daily-v2.js` now composes Today from active Grub/Fit/Hydration plans, Progress and member context.
- response deliberately prioritises up to five actions plus Ask Shift rather than exposing a backend dashboard.
- source regression gate protects the Today contract.

Outstanding before PASS:
- member frontend consumes the V2 contract cleanly;
- phone commissioning demonstrates priorities are understandable within five seconds;
- proactive/medication context remains appropriately integrated where available.

### G2-002 — Real Grub recipes
Status: AMBER / IN PROGRESS.

Evidence:
- PR #31 merged after corrected full gate PASS.
- Grub V4 contains structured ingredients with quantities, servings, method, timings, equipment/storage metadata and independently cookable reference recipes.
- the previous `Cook pasta / Brown chicken` reference implementation is no longer the authoritative Grub route.

Outstanding before PASS:
- breadth/variety is still insufficient for a premium paid product;
- allergens/substitutions/easier alternatives/batch metadata are not complete across the catalogue;
- frontend/mobile recipe presentation still requires final commissioning.

### G2-003 — Nutrition integrity
Status: AMBER / IN PROGRESS.

Evidence:
- Grub V4 explicitly labels current nutrition as curated estimates tied to stated quantities instead of implying false precision.
- source gate prevents removal of the declared nutrition basis.

Outstanding before PASS:
- commission an ingredient nutrition source/calculation workflow and reconcile every displayed serving;
- validated figures must replace curated estimates before PASS.

### G2-004 — Grub variety/repetition
Status: AMBER / IN PROGRESS.

Evidence:
- Grub V4 avoids repeating recipes within a generated plan while unused valid options exist.

Outstanding before PASS:
- starter catalogue is intentionally small and not premium-scale;
- structured catalogue/content migration must materially expand cuisines, formats, cooking methods and ordinary-bloke food variety.

### G2-005 — Durable Grub Yay/Nay learning
Status: AMBER / IN PROGRESS.

Evidence:
- PR #32 merged after Master Integration Gate + Academy PASS.
- `product_feedback` persists Yay/Nay per member/product/entity.
- a requested replacement records the rejected meal as a Nay signal.
- later Grub replacements and plans consult historical Nays and avoid rejected meals where a valid alternative exists.
- adjusted active plans are persisted back to D1.

Outstanding before PASS:
- credentialed production proof: Nay -> later session/new plan -> rejected meal remains excluded;
- frontend must send explicit Yay as well as replacement/Nay signals.

### G2-006 — Fit session duration composition
Status: AMBER / IN PROGRESS.

Evidence:
- PR #31 merged with session-composer contract.
- Fit V4 composes by requested time, location, equipment and limitations and returns requested vs estimated duration.
- source gate explicitly prohibits the historical time-padding behaviour.

Outstanding before PASS:
- production/member proof across 10/20/40/60 minute sessions;
- frontend must expose location/equipment controls, not hide the capability behind free text.

### G2-007 — Fit exercise quality/instructions
Status: AMBER / IN PROGRESS.

Evidence:
- Fit V4 returns named movements, sets/reps/time, rest and plain-English `how` instructions plus safety stop guidance.
- current frontend has simple line-diagram support for movement groups.

Outstanding before PASS:
- exercise library breadth remains too small;
- movement-specific premium illustrations, regressions/progressions and common-mistake cues need commissioning;
- member should never need external search to perform a prescribed movement.

### G2-008 — Durable Fit Yay/Nay learning
Status: AMBER / IN PROGRESS.

Evidence:
- PR #32 merged with the same durable `product_feedback` model used by Grub.
- rejected exercises become persistent Nay signals and later plans/replacements consult them.

Outstanding before PASS:
- credentialed production proof across a later plan/session;
- frontend explicit Yay persistence and preference controls.

### G2-009 — Conundrum kitchen intelligence
Status: AMBER / IN PROGRESS.

Evidence:
- PR #34 merged after all integration steps passed.
- current authoritative Conundrum route ranks explicit ingredient relationships such as bacon+bread and chicken+cheese+wrap.
- pantry assumptions are explicit and limited; no unlisted ingredient is silently invented.
- weak matches return an honest no-match state rather than hallucinating a meal.

Outstanding before PASS:
- frontend needs premium ingredient-entry/selection treatment and mobile proof;
- broaden candidate intelligence using the structured recipe catalogue rather than a small hard-coded practical set.

### G2-010 — Hydration beyond water
Status: AMBER / IN PROGRESS.

Evidence:
- PR #34 added persisted hydration logging for water, tea/brews, coffee, squash, milk, juice, soft drinks, energy drinks and beer/alcohol.
- daily hydration contribution is calculated separately from total drink volume.
- alcohol can be logged but is deliberately not counted toward the hydration target.

Outstanding before PASS:
- frontend quick-log controls and Today integration;
- authenticated mobile save/reload proof.

### G2-011 — Whole-person Progress story
Status: AMBER / IN PROGRESS.

Evidence:
- PR #33 added `Since You Started` summary across weight, waist, BP, steps, sleep and mood where data exists.
- improvement milestones are generated without treating weight as the only useful signal.

Outstanding before PASS:
- frontend visualisation/narrative commissioning;
- confirm additional member metrics and treatment context are surfaced only where appropriate.

### G2-012 — Progress unit consistency
Status: AMBER / IN PROGRESS.

Evidence:
- Progress summary now returns latest weight in kg plus stone/lb representation.
- existing frontend Progress Picture already uses dropdown-based stone/lb/kg inputs rather than free text.

Outstanding before PASS:
- shared reusable unit controls across all member Progress surfaces;
- mobile proof and removal of remaining inconsistent/free-text weight inputs.

### G2-013 — Progress Picture persistence/reliability
Status: AMBER / IN PROGRESS.

Evidence:
- authenticated original-photo save/list/image/delete routes exist and are user-scoped.
- PR #34 added the missing agreed `Same` comparison state.
- V2 visualisation flow can save the original photo during the visualisation journey when requested.
- original-photo history is available through the list route.

Outstanding before PASS:
- authenticated phone proof: upload -> save -> reload -> retrieve -> delete;
- generated comparison-history policy/storage still needs explicit commissioning;
- current D1 text/base64 storage is not the final scale architecture.

### G2-014 — Progress Picture premium UI
Status: AMBER / IN PROGRESS.

Evidence:
- current frontend includes dropdown-based weight/waist controls and saved-photo preview/history.

Outstanding before PASS:
- `Same` must be exposed in the member UI;
- final premium visual treatment, comparison states, delete UI and mobile commissioning.

### G2-015 — My Plans product surface
Status: AMBER / IN PROGRESS.

Evidence:
- PR #33 added readable plan-manager output grouped into current/replaced/other states.
- Grub/Fit/Hydration plan summaries no longer need to be exposed as raw JSON.

Outstanding before PASS:
- member frontend must consume `/v1/plan/list` and present current/replaced history cleanly;
- authenticated return journey must demonstrate plan state persists.

## Gates 3–5

Evidence will continue against the same matrix IDs as commissioning progresses. Items with genuine external clinical/partner dependencies remain BLOCKED rather than being omitted.
