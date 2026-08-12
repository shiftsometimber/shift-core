# Shift Commissioning Evidence Ledger

This ledger records demonstrated evidence. `docs/LAUNCH-FINISH-LINE.md` is the launch board; `docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md` preserves the original 57 requirements. Code existence is not PASS.

## Locked behavioural PASS
- **B02 PASS:** authenticated A/B member isolation + durable leave/return state.
- **B03 behavioural PASS — 9/9:** Grub, Fit, Today, Hydration, Conundrum, My Plans, Progress, Progress Picture and Shift AI. Do not reopen without genuine regression evidence.
- **B04 PASS:** One Shift Brain current-intent precedence, durable Grub/Fit learning, cross-domain isolation and retained Progress/AI context.
- **M02 PASS:** reviewed Knowledge publish -> canonical retrieval -> provenance/grounding -> withdrawal -> no grounding.
- **M03 / G4-006/G4-007 PASS:** genuine production MHRA/EMA scan + freshness inside declared SLOs; adversarial stale/failure/recovery transitions remain locked.
- **M14 / G4-002 PASS:** member memory inspect/correct/delete, provenance/confidence, privacy controls and cross-member isolation.
- **M15 / G5-004 PASS:** mocked partner MOT -> idempotent persistence -> sourced Progress -> Brain -> authenticated Today, member-isolated and non-diagnostic.
- **M16 / G5-006 PASS:** member-one Progress + engagement cohort proof with internal-only/non-causal guardrails.

## Current production proof — `main` d28d0fde59b1146506c98d8f16f4ff5c88e82138
Production commissioning run `31638147840`, job `94253583485`, completed GREEN unchanged.

### M03 genuine regulator scan / freshness
The restricted GitHub Actions OIDC commissioning identity invoked the real deployed regulator scanner. Source results:
- `mhra-drug-safety`: OK, 40 items.
- `mhra-alerts`: OK, 40 items.
- `ema-news`: OK, 5 items.
- Production freshness immediately returned `GREEN`, `current:true`, no freshness reasons, scan/event inside declared SLOs.

### Authenticated isolation / retained state
The same production run proved two real commissioning sessions remained isolated across member state, One Shift Brain, Today and Progress; logout/login retained each member's own state.

### Longitudinal Grub/Fit learning
The run proved registration, initial Grub recommendation, Nay persistence across return, exclusion of the Nayed Grub item, Fit isolation from Grub feedback, and Fit semantic quality.

### Progress Picture / Shift AI
The run proved Progress create/persist/return, “since you started” context, Progress Picture save/history/private ownership/delete, Shift AI Brain context, provenance contract, return behaviour and clinical boundary.

## M07 / G5-009 — production structured serving PASS
The final production stage in run `31638147840` proved reviewed/published structured catalogue objects genuinely supply authenticated members.

**Grub:**
- runtime `shift_grub_plan_v7`
- published available: 1
- served: 1
- example: `lighter-beef-cottage-pie`
- validated nutrition retained
- durable Nay respected: true

**Fit:**
- runtime `shift_fit_plan_v7`
- published available: 3
- served: 3
- example: `dumbbell-goblet-squat`
- approved visual returned: `assets/fit/shift-fit-batch2.svg#goblet-squat`
- durable Nay respected: true

The unchanged production gate emitted: `PASS M07 authenticated production member consumes reviewed/published structured Grub/Fit content with validated nutrition, approved visual guidance and durable Nay behaviour; legacy remains controlled migration fallback only.`

This closes **G5-009 runtime authority**, not catalogue depth. M11/M12 and G2 catalogue-depth rows remain AMBER.

Two real production defects were fixed before the unchanged proof passed:
1. PR #77 stopped V7 cycling only three commissioned Fit movements through a plan; each eligible structured movement is used at most once, with Brain/Nay-aware legacy selection only as migration fallback.
2. PR #80 moved final V7 semantic-quality enforcement after structured enrichment while preserving V6 fail-closed behaviour for ordinary V6 callers.

Evidence file: `docs/evidence/2026-08-12-m07-production-structured-serving.md`.

## M10 / G1-006 — exhaustive route detection PASS
Merged PR #73 production route run `31637899433`, job `94252761447`, proved:
- 418 same-origin URLs checked.
- 370 HTML pages checked.
- 0 critical route/asset/blank-page failures.
- Redirect chains audited.
- same-origin discovery exhausted with `truncated:false` under a 1,000-URL fail-closed safety ceiling.
- failure diagnostics retain discovery parent.

This closes **G1-006 central broken/dead-route detection**. G1-007 error-state quality, G1-008 rendered states and G1-009 mobile/cross-browser remain separate.

Evidence file: `docs/evidence/2026-08-12-m10-exhaustive-production-sweep.md`.

## Gate 1 error-contract adversarial evidence — active PR #82
A new production failure-contract sweep intentionally exercises unknown route, unauthenticated member, unauthenticated HQ, malformed JSON, invalid registration, invalid login, password-reset account non-enumeration and wrong-method handling.

Initial run `31638458536` passed the first six cases then failed on a real defect: password-reset responses intercepted by `worker-entry-v6.js` lacked `X-Shift-Request-Id`. The gate was not weakened. `worker-entry-v6.js` was fixed to attach correlation plus `Cache-Control:no-store` and `X-Content-Type-Options:nosniff` to intercepted member responses. Latest repair commit on #82: `f6bafa3b4e1bff9949bc902029615e2fa7784bc8`; unchanged rerun remains the truth boundary.

## Industrial content evidence
Current authored structured universe:

### Grub
- 32 original structured authored objects.
- 224 additional industrial authored/schema-valid objects.
- Total authored universe: **256**.
- Current commissioned floor: **1 CoFID ingredient-level nutrition validated / 1 reviewed / 1 published / 1 production-served**.
- 224 industrial additions remain quarantined pending ingredient-level validation/review.
- Short-term objective: **2,500 commissioned**.
- Long-term minimum: **10,000+**.

### Fit
- 32 original structured authored objects.
- 224 additional industrial authored/schema-valid movement/variant objects across 28 canonical movements × 8 meaningful variation identities.
- Total authored universe: **256**.
- Current commissioned floor: **3 member-QA illustrated / 3 reviewed / 3 published / 3 production-served**.
- 224 industrial additions remain visual/review quarantined.
- Short-term objective: **2,500 commissioned**.
- Long-term minimum: **10,000+**.

The 10k structured-content load benchmark proves architecture/load capacity only. It is never counted as 10,000 commissioned Grub/Fit objects.

## B01 / M09 human inbox boundary
Implementation and deterministic gates prove explicit verification, unverified-login blocking, resend invalidation/replay rejection, recovery/change-password and transactional delivery telemetry. Remaining launch proof is secret-bearing real inbox interaction: verification click/login and reset token -> reset -> login new password -> authenticated change-password -> logout/login. Tokens must never be committed or logged.

## Current evidence-led original-audit scoreboard
Evidence now earns **57 total / 16 PASS / 38 AMBER / 3 BLOCKED / 0 abstraction orphans**, pending merge of the reconciliation PR that writes these earned closures into the authoritative matrix.

The three external BLOCKED originals remain exactly:
- G5-001 signed clinical operating model/provider/pharmacy governance.
- G5-002 clinically governed Medication Companion prescribing/escalation.
- G5-003 provider-approved identity/weight/evidence verification.

## Active recovery
- PR #81 reconciles G1-006 and G5-009 evidence into the matrix/launch board/ledger and must merge only after the 57-row finish gate is GREEN.
- PR #82 owns the next Gate 1 failure-contract defect and must rerun unchanged after the correlation-header repair.
- Catalogue scale conversion continues independently; authored count alone is not launch readiness.
- B06/B07, Dave, premium/mobile, security/privacy, accessibility/performance and other non-blocked closure lanes remain active while CI/content work waits.

Operating rule: **SWARM -> INDUSTRIALISE -> VALIDATE -> SERVE -> BREAK -> FIX -> PROVE -> CLOSE -> CONTINUE.**
