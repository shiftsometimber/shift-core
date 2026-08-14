# Active recovery checkpoint — 2026-08-14

## Authority and recovery rule

This file is a recovery pointer, not the status authority. On every resumed execution turn, read these in order before acting:

1. `docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md` — authoritative original 57-row audit state.
2. `docs/COMMISSIONING-EVIDENCE.md` — retained commissioning proof and provenance.
3. `docs/LAUNCH-FINISH-LINE.md` — launch-board M-lane state.
4. `docs/MATT-FINAL-ACCEPTANCE-PACK.md` — finite human-only tail.

Snapshot reconciled from main at `b4740d2598977c405292835b38adcdcbeadca152`. Main can advance after this checkpoint; never use this SHA or this file to overwrite a newer matrix/ledger state.

The authoritative original audit at this snapshot is **57 total / 48 PASS / 6 AMBER / 3 BLOCKED / 0 unmapped**. PASS still requires demonstrated journey, retained state where relevant, expected member outcome and retained evidence. A source gate, build, deployment check or green merge is not enough by itself.

## Exact six AMBER rows

### Gate 1

- **G1-001** — the sole remaining Gate-1 AMBER. Requires one genuine reset-inbox token lifecycle: reset -> login with new password -> authenticated change-password -> logout -> final login, with retained evidence. Do not generate another reset merely to show activity; if the existing genuine human click is the only missing step, leave the acceptance action explicit and work elsewhere.

**G1-003 and G1-004 are now PASS.** Fresh production run `31793828102`, rerun job `94753848697`, proved genuine unverified registration, real connected-inbox verification, blocked pre-verification login, successful post-verification login, logout and final fresh login. Welcome ordering was observed only after verification. Evidence: `docs/evidence/2026-08-14-g1-003-g1-004-real-verification-pass.md`.

### Gate 2

- **G2-002 / G2-003 / G2-004 — Grub:** technical production is finite and ready for human editorial acceptance. Current V1 cohort = **783 clean recipes behind 8 immutable aggregate decisions**. The entire industrial nutrition pool remains validated; publication/production-serving breadth must follow genuine acceptance. Current review surface is retained in run `31796868151`, artifact `9217696352`; use `grub-v1-launch-review.html`, not the wider template surface.
- **G2-007 — Fit:** **26 canonical movement decisions / 1,326 eligible descendants**. The 26 premium visual candidates have been produced and technically QA'd, but technical QA is not domain/member-comprehension acceptance. Genuine 26/26 domain decisions must precede publication and production serving.

All other Gate-2 original rows are PASS. Do not reopen Today, Progress, Plans, Hydration, Conundrum or the duration/learning rows without genuine regression evidence.

### Gate 3 and Gate 4

All original Gate-3 and Gate-4 rows are PASS. The homepage-grade forest/cream premium system is the estate-wide design constitution and fresh production acceptance continues to run at desktop and 390px. Do not restart cosmetic architecture or re-open these gates without a demonstrated regression.

### Gate 5

- **G5-013** remains AMBER at **16/20 non-duplicated Dave legs**. The remaining non-external closure is real recovery/final unassisted-device acceptance; treatment support remains external.
- **G5-001 / G5-002 / G5-003** remain the only three external BLOCKED rows. Keep them unavailable/accurately labelled and continue the non-clinical V1 around them.

**G5-012 remains PASS.** A fresh production run briefly exposed a login-p95 breach (913 ms against the 800 ms budget), so it was treated as genuine regression evidence and re-proved rather than ignored. The next fresh production run on `5dff8f29...` cleared the same unchanged gate at **registration p95 413 ms / login p95 644 ms**, with 17/11 natural samples respectively and unchanged password security. The transient RED is retained evidence, but there is no basis to reopen the original row after the immediate clean reproduction.

## M04 product analytics — separate launch-board AMBER

M04 is not one of the six original-audit AMBER rows, but it is a live launch-board blocker. The production proof is correctly fail-closed: it must register/login/onboard, exercise Today/Grub/Fit/Progress/Shift AI/error/return flows, then retrieve and verify the retained product-event funnel.

Current source contains the restricted `/v1/commissioning/product-events` route and canonical worker dispatch. Commit `5dff8f29c66cb021e1fce61c03a9d6980f1c0d2a` added an explicit commissioning-ops production fingerprint/source gate. However, a fresh bounded production rerun against the preceding deployed source still timed out after five minutes with a live **404 not_found** at 11:38:56 UTC, artifact `9217761689`. Therefore **M04 stays AMBER**: source/build existence must not be promoted to PASS until the merged-production route is genuinely served and the retained end-to-end event funnel passes.

Continue using the newest production run after each current-main deployment. If the route remains 404 after a successful current build, treat it as a deployment/traffic-serving truth defect rather than rewriting already-present analytics logic or simply lengthening waits.

## Current finite human tail

The current acceptance pack is reconciled to **A=6 / B=0 / C=3**. Do not ask for already-consumed decisions again. The remaining human work is finite:

- G1-001 genuine password-reset token journey.
- 8 Grub aggregate editorial decisions, followed by automatic propagation/publication/serving proof.
- 26 Fit visual/domain/member-comprehension decisions, followed by publication/serving proof.
- G5-013 final recovery/unassisted physical-device Dave acceptance.

If a human-only click or editorial judgement is the sole remaining step for one lane, record the exact acceptance action and immediately move execution capacity to another non-blocked lane.

## Exact autonomous next actions

1. Keep polling/re-running the newest **M04 retained product-analytics production proof** only after a genuinely newer deployment; do not generate auth email noise for it.
2. Preserve G5-012 as PASS unless a repeatable current-production breach is demonstrated; retain both the transient RED and the clean reproduction.
3. Keep Gate-3 premium-system, G2-001 Today/G4-008, security/privacy, Dave synthetic, route integrity and retained-state suites green on current-main changes; cash evidence, do not narratively reopen them.
4. Hold Grub and Fit at the finite human decision boundary; do not manufacture more candidate content in place of the required decisions.
5. Leave G1-001 at the genuine reset-token boundary without redundant reset mail. Once the human token step exists, automation owns the rest of the password lifecycle proof.
6. Reconcile matrix/evidence/launch board immediately when — and only when — demonstrated evidence changes status.

Operating rule: **REUSE -> EXTEND -> CONNECT -> PRODUCTISE -> BUILD ONLY ON A REAL GAP -> PROVE IN PRODUCTION -> RETAIN EVIDENCE -> CONTINUE.**
