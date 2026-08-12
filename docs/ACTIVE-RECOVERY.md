# Active recovery checkpoint — 2026-08-12

## Current production authority
`main` = `88b00361039b5a59046e3c4c836c1ce6a2c065b5` — PR #82 merged.

Authoritative original audit remains **57 total / 16 PASS / 38 AMBER / 3 BLOCKED / 0 unmapped**. B03 behavioural remains **9/9 PASS and locked**. #55 remains behind us.

## Hard production closures already earned
- **G4-006 PASS / M03:** genuine production MHRA drug-safety, MHRA alerts and EMA scan completed through restricted OIDC.
- **G4-007 PASS / M03:** production freshness `GREEN/current:true`, inside SLOs; stale/failure/recovery adversarial states remain regression-protected.
- **G1-006 PASS / M10 route detection:** exhaustive 418 same-origin / 370 HTML production crawl, zero critical route/asset/blank-page failures, discovery exhausted without truncation.
- **G5-009 PASS / M07:** authenticated production member consumed reviewed/published structured Grub and Fit with validated nutrition, approved visual guidance and durable Nay behaviour. V4 is controlled migration fallback rather than future catalogue authority.

## Gate 1 — newest production evidence
PR #82 is merged and deployed. Production run `31639268727`, job `94257358057`, completed GREEN against `88b00361039b5a59046e3c4c836c1ce6a2c065b5`.

The G1-007 production failure-contract sweep proved controlled correlated responses for unknown routes, unauthenticated member/HQ access, malformed/invalid registration, invalid login, password-reset non-enumeration and unsupported methods. The first commissioning attempt had exposed a real defect: password-reset responses intercepted by `worker-entry-v6.js` lacked `X-Shift-Request-Id`. The acceptance test was not weakened; the product envelope was repaired with request correlation plus `Cache-Control:no-store` and `X-Content-Type-Options:nosniff`, then the deployed production gate passed unchanged.

**G1-007 remains AMBER** only because representative rendered member-facing failure-state acceptance is still outstanding. The deployed API error-contract/diagnostic-leakage portion is now hard-green. Evidence: `docs/evidence/2026-08-12-g1-007-production-error-contract.md`.

## Industrial content factory
Short-term objective: **2,500 commissioned Grub + 2,500 commissioned Fit**. Long-term minimum: **10,000+ quality objects in each universe**. The old 64/48 figures are historical commissioning checkpoints only.

### Grub
- Authored/schema-valid: **256** = 32 original + 224 industrial.
- Industrial batch: 56 breakfast / 56 lunch / 56 dinner / 56 snack.
- Nutrition-valid: **1**.
- Reviewed: **1**.
- Published: **1**.
- Production-served: **1** (`lighter-beef-cottage-pie`).
- Durable Nay exclusion: production-proven.
- 224 industrial objects remain quarantined pending ingredient-level validation/review.

### Fit
- Authored/schema-valid: **256** = 32 original + 224 industrial.
- Industrial structure: **28 canonical movements × 8 meaningful variants**.
- Member-QA visual: **3**.
- Reviewed: **3**.
- Published: **3**.
- Production-served: **3**; approved visual guidance and Nay exclusion production-proven.
- 224 industrial objects remain visual/review quarantined.

## Active Watchtower/HQ lane
PR #84 exists for a controlled Watchtower fire drill: GREEN baseline -> latency AMBER with operator next action -> core outage RED with operator next action -> retained probe history -> recovery -> GREEN after incident-window expiry. Its original branch is stale against the now-moving `main`; rebuild/reconcile it before merge. Do not promote G5-007 until the HQ-action portion of the original acceptance is genuinely evidenced. G5-008 authorised HQ operation remains separate.

## Remaining human/external boundary
Human/device: B01 real reset inbox-token chain; M09 real verification inbox click/login; representative rendered/mobile/cross-browser release-candidate acceptance.

External BLOCKED remain exactly:
- G5-001 signed clinical operating model/provider/pharmacy governance.
- G5-002 clinically governed Medication Companion prescribing/escalation.
- G5-003 provider-approved identity/weight/evidence verification.

## Active swarm
Gate 1 finite security/privacy closure; industrial Grub nutrition/review/publication conversion; Fit visual QA/review/publication conversion; long-horizon Grub/Fit simulation; B05; B06/B07; B08/Dave; M01; M04–M06; M08–M13; M17. Content scale must not queue finite AMBER closures.

## Exact next action
1. Merge this evidence checkpoint only after its gates are GREEN; it does not promote G1-007.
2. Continue Gate 1 G1-010/M05 threat/privacy release commissioning while human/device-only Gate 1 rows remain explicit AMBER.
3. Rebuild/reconcile the B07 Watchtower fire-drill lane onto current `main` and prove the actual HQ action path before claiming G5-007.
4. In parallel, convert industrial content rather than merely authoring: bulk Grub ingredient/nutrition validation + review/publication, and Fit visual QA + review/publication; quarantine failures without stopping clean objects.
5. Continue Dave/premium/mobile/accessibility/performance lanes while CI/content work runs.

Operating rule: **SWARM -> INDUSTRIALISE -> VALIDATE -> SERVE -> BREAK -> FIX -> PROVE -> CLOSE -> CONTINUE.**
