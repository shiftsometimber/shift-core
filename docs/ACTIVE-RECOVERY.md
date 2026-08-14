# Active recovery checkpoint — 2026-08-14

## Authority and recovery rule

This file is a recovery pointer, not the status authority. On every resumed execution turn, read these in order before acting:

1. `docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md` — authoritative original 57-row audit state.
2. `docs/COMMISSIONING-EVIDENCE.md` plus the newest dated evidence checkpoint — retained proof/provenance.
3. `docs/LAUNCH-FINISH-LINE.md` — launch-board M-lane state.
4. `docs/MATT-FINAL-ACCEPTANCE-PACK.md` — finite human-only tail.

Snapshot reconciled from main at `62be9dc0a26d99ba7f218788b2de9b5de783e421`. Main can advance after this checkpoint; never use this SHA or this file to overwrite a newer matrix/ledger state.

The authoritative original audit is **57 total / 50 PASS / 4 AMBER / 3 BLOCKED / 0 unmapped**. Category mapping is **A=4 / B=0 / C=3**. PASS still requires demonstrated journey, retained state where relevant, expected member outcome and retained evidence. A source gate, build, deployment check or green merge is not enough by itself.

## Gate 1 — CLOSED

All original Gate-1 rows are PASS. In particular:

- **G1-001 PASS:** genuine connected-inbox password-reset delivery, real token consumption, reset login, authenticated password change, logout and retained final login are production-proven. Do not generate further recovery mail absent genuine regression evidence.
- **G1-003/G1-004 PASS:** genuine unverified registration -> real inbox verification -> blocked pre-verification login -> verified login -> Welcome ordering -> logout/final login are retained production evidence.
- **G1-012 PASS:** Dave's non-clinical authenticated/isolation/onboarding journey remains earned evidence. Shift Me is now kept in its own commissioning lane so an undeployed adjunct route cannot falsely reopen Dave.

## Exact four original-audit AMBER rows — Gate 2 human tail

### G2-002 / G2-003 / G2-004 — Grub

Current V1 launch authority is **806 clean recipes behind exactly 8 regenerated immutable aggregate decisions**. Breakfast 212 / lunch 204 / dinner 203 / snack 187. The decision -> publication bridge binds only to the unchanged regenerated manifest; all eight PASS yields exactly 806 reviewed/validated publication records and any FIX/REJECT emits no partial payload.

Retained review authority: run `31799592951`, artifact `9218697749` (`grub-101-editorial-review-surface`), digest `sha256:18225619aa8e28030fbd008ea40cdb39759adc92e2a9db73a261d318ae33fc6f`. Review only `grub-v1-launch-review.html`; the earlier 783-recipe pack is superseded and must not be resurfaced.

Remaining closure is irreducibly second-person: 8 genuine PASS/FIX/REJECT decisions -> automated immutable propagation -> publication -> production-serving proof. Do not manufacture additional recipe volume in place of those decisions.

### G2-007 — Fit

Current V1 launch authority is **26 canonical movement decisions / 1,326 eligible descendants**. Replacement premium candidates are **26/26 produced and 26/26 technically QA-passed**. Technical QA is not anatomy/member-comprehension/domain acceptance; that remains **0/26** until genuine review.

Retained review authority: run `31799592961`, artifact `9218694338` (`fit-premium-v1-26-review-pack`), digest `sha256:b48d5d2f7770d16c8ad4a4da76bb5036a26e360c6603704144194644de8a8a9f`. The rejected legacy schematic/stick-figure treatment must not return as final launch artwork.

Remaining closure is 26 genuine PASS/FIX/REJECT decisions -> publication/binding -> production-serving proof. Do not equate candidate production or technical visual QA with member/domain acceptance.

All other Gate-2 original rows are PASS. Do not reopen Today, Progress, Plans, Hydration, Conundrum, duration/learning or locked units/photo journeys without genuine regression evidence.

## Gate 3 and Gate 4

All original Gate-3 and Gate-4 rows remain PASS. The homepage-grade forest/cream premium system is the estate-wide design constitution. Fresh current-main production runs continue to prove premium-system and Today/G4 acceptance green at desktop + 390px. Do not restart cosmetic architecture or create a parallel member product.

## Gate 5

All automatable non-external original Gate-5 rows remain PASS. **G5-013 is PASS for non-clinical V1 at 19/20 non-duplicated Dave legs**; treatment support is the sole twentieth leg and remains external BLOCKED.

**G5-001 / G5-002 / G5-003** remain the only three external BLOCKED original rows: signed clinical/provider/pharmacy operating model, clinically governed Medication Companion prescribing/escalation, and provider-approved identity/weight/evidence verification. Keep unavailable/accurately qualified and continue non-clinical V1 around them.

**G5-012 remains PASS.** Fresh current-main production run `31800145725` measured natural member API p95 at **registration 602 ms / login 795 ms** against the unchanged **800 ms** budget with password security unchanged. Do not reopen it from stale earlier transient samples unless a repeatable current-production breach is demonstrated.

## M04 product analytics — separate launch-board AMBER

M04 remains a launch-board AMBER, not one of the four original-audit AMBER rows. Source already contains the restricted `/v1/commissioning/product-events` route and canonical worker dispatch; do not rewrite analytics logic to solve a serving problem.

Fresh current-main run `31800145725`, M04 job `94765983415`, polled the restricted route for the full five-minute readiness window and still received live **404 `not_found`**. Retained artifact `9219073982`, digest `sha256:f8ae5ae5e6437995c6ef7bddd3b2037025f44e51f5733e6d6b80a7d37ef17ee9`.

Issue **#298** is the infrastructure authority: successful Cloudflare/GitHub builds are producing versions but production traffic is not reliably promoted to the current Worker/module graph. The same drift is now independently visible in two additional ways: live `/v1/shift-me/render` remains 404 and the live Git-authoritative `member-product-v33d.js` hash lags current main. Treat these as deployment/promotion truth, not permission to invent duplicate M04/Shift Me/frontend implementations.

Only retry M04 after a genuinely newer production deployment/promotion is observed.

## Shift Me — isolated commissioned adjunct

PR **#318** merged at main `62be9dc0a26d99ba7f218788b2de9b5de783e421` to preserve commissioning integrity:

- Dave's earned authenticated/isolation/onboarding proof no longer imports Shift Me.
- Shift Me has its own fail-closed source/privacy + authenticated production technical gate.
- The exact Shift Me GitHub workflow is added to the existing narrow OIDC commissioning allow-list; the synthetic identity family is not widened.
- Shift Me production technical PASS is still withheld until the live Worker actually serves its route and the render/privacy/member-isolation proof passes.

Do not infer Shift Me production PASS from #318 or CI.

## Current frontend deployment regression from #317

Main `b07a55f0c6282b417b24030752cf33151a73f01c` / PR #317 correctly removed legacy Fit stick-figure generation, kept text-led fallback unless an approved visual URL exists, activated the existing Shift AI member panel and pointed it at `/v1/shift-ai/chat`.

The master integration gate subsequently caught a real deployment-authority mismatch: production `member-product-v33d.js` SHA did not match current Git authority. This is retained evidence that #317's source changes are not yet proven live. Do not cash #317's member-visible outcome until production serves current Git authority and a rendered Fit/Shift-AI journey passes. This deployment drift is part of #298's infrastructure investigation.

## Other launch-tail state

- **M08 release evidence/recovery checkpoint:** remains AMBER by definition until the release candidate is reconciled/frozen; keep this file and the evidence ledger current.
- **Timber Mill / issue #300:** Git/source authority is recovered. Remaining boundary is the real static Cloudflare publication of the corrected package plus desktop/mobile production visual acceptance. Do not reopen source discovery or build a parallel shop.
- **Final physical-device hostile acceptance:** remains a release-pack activity after the four Category-A human rows close; automated desktop/390px prerequisites are already retained PASS and should not be manually re-proven without regression evidence.

## Exact autonomous next actions

1. Keep the four Gate-2 Category-A rows at the genuine human-decision boundary; do not ask for already-consumed old decisions and do not manufacture more content.
2. Observe the newest main production suites after #318. Cash Dave/G5 evidence if unchanged journeys pass; keep Shift Me independently fail-closed.
3. Do not rerun M04/Shift Me merely to create red noise while production is demonstrably serving the stale Worker/module graph. Resume those proofs only after a genuinely newer deployment/promotion.
4. Preserve G5-012 and all other locked PASS rows absent repeatable current-production regression evidence.
5. Keep #298 as the single infrastructure defect for current Worker/module promotion drift; attach only genuinely new evidence.
6. Reconcile matrix/evidence/launch board immediately when — and only when — demonstrated evidence changes status.
7. After the four human Gate-2 rows close: freeze new product work -> publish/serve accepted Grub/Fit -> full RC regression -> Dave/security/Watchtower/routes/accessibility/performance -> final physical-device hostile acceptance -> release defects only.

Operating rule: **REUSE -> EXTEND -> CONNECT -> PRODUCTISE -> BUILD ONLY ON A REAL GAP -> PROVE IN PRODUCTION -> RETAIN EVIDENCE -> CONTINUE.**
