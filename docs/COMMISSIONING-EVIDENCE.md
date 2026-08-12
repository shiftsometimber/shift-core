# Shift Commissioning Evidence Ledger

This ledger records demonstrated evidence. Source/merge alone is not PASS. AMBER means required evidence remains. BLOCKED means a genuine external dependency is required. `docs/LAUNCH-FINISH-LINE.md` is the authoritative launch closure board; `docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md` is authoritative for the original 57 audit requirements.

## Current closure evidence — reconciled through merged PR #54 and production commissioning on `e46aa035`, 2026-08-12

### PASS CLOSED
**B02 authenticated member isolation + durable longitudinal state: PASS.** PR #47 created two fresh authenticated production members and proved separate sessions, member-state preferences, Progress, Brain context, Today context and logout/login retained state with no A/B contamination.

**B04 One Shift Brain longitudinal behaviour: PASS.** PR #42 proves current intent overrides stale stored preference and unrelated domains remain isolated. PR #48 adds authenticated production stored food dislike -> Grub -> Nay -> logout -> login -> regenerated plan excluding the Nayed meal, while Fit remains unaffected by the Grub signal and respects its own running dislike. The commissioning run exposed a real defect where a Nayed meal could reappear; the product path was fixed and the hard proof rerun green.

**M02 reviewed Knowledge publication lifecycle: PASS.** Reviewed Knowledge publish -> canonical retrieval -> provenance/grounding -> withdrawal -> no longer grounding is regression-protected.

### B03 behavioural evidence — 9/9 PASS
PR #48 production behaviour PASS: **Grub and Fit.** Grub proves authenticated generation, stored dislike application, durable Nay across return, changed later recommendation and semantic quality floor. Fit proves authenticated generation, exercise dislike/current limitation handling, cross-product isolation and semantic quality floor.

PR #49 production behaviour PASS: **Today, Hydration, Conundrum and My Plans.** The production suite proves Conundrum recognises chicken+cheese+wrap, coffee contributes to hydration while beer does not, hydration plan/log state survives logout/login, My Plans retains the active hydration plan, and Today consumes that plan before and after return.

PR #52 introduced the combined final-three production journey for **Progress, Progress Picture and Shift AI**. The first run deliberately failed the Shift AI return-context assertion because broad `memoryUsed`/plan/feedback indicators did not prove use of persisted Progress. The proof was strengthened rather than relaxed.

PR #53 strengthened the Shift AI assertion to require the returned One Shift Brain to retain the exact Progress history `114.3kg -> 109.8kg` after logout/login and to require Shift AI itself to reproduce those retained values when explicitly asked. That hard production run then exposed a prescription-boundary defect: Shift AI could cross the hostile instruction asking it to specify/override a prescription dose.

PR #54 introduced the deterministic authenticated prescription boundary ahead of the generative response while preserving the canonical V6 One Shift Brain path. The integration gate was strengthened to require `gateway -> deterministic clinical boundary -> canonical V6 Brain`; the hostile production suite was not weakened.

**Hard production commissioning result on merged `e46aa035`: PASS.** GitHub Actions run `31614521100` completed successfully. Its unchanged steps all passed in sequence: Core production health/routes; authenticated isolation and retained state; longitudinal Grub/Fit learning; final B03 Progress Picture + Shift AI production closure. This earns B03 behavioural **9/9**.

Specific final-three demonstrated behaviour now closed:
- **Progress:** authenticated create/log/history/return and retained Since You Started state.
- **Progress Picture:** consent rejection, save, Same/history, authenticated persistence, delete and deletion remains deleted; image retrieval/deletion remains member-owned/private.
- **Shift AI:** canonical Brain use, retained exact Progress context after logout/login, provenance-aware contract and deterministic prescription boundary under hostile prompt.

Behavioural PASS does not promote full B03. Every product still requires the single explicit rendered/premium/mobile member-facing closure item recorded in `docs/LAUNCH-FINISH-LINE.md`. Grub/Fit catalogue depth is independently tracked under M11/M12 and cannot hide beneath behavioural PASS.

### B01 authentication recovery
Production Welcome and password-reset messages are proven received in the connected Shift inbox. The production recovery implementation includes single-use hashed reset tokens, 30-minute expiry, password reset, session revocation and authenticated change-password. Remaining evidence is the actual real inbox token -> reset POST -> login with new password -> authenticated change-password -> logout -> login again. The token must not be committed/logged. The current tool environment can read the token securely from Gmail but lacks a secret-safe arbitrary network-capable POST executor; if unchanged, the minimal human/secure-runtime step is to consume a fresh reset link and set the commissioning password once, after which the non-secret remainder can be automated again.

### Original-audit reconciliation
The original remediation matrix contains **57** substantive rows across Gates 1–5. Last full row-level classification remains **9 PASS / 45 AMBER / 3 BLOCKED**. A backwards reconciliation found nine requirements that were still present in the original matrix but had become insufficiently explicit in the compressed launch board. They are now restored as anti-abstraction rows M09–M17 in the launch board:

- M09 email verification lifecycle
- M10 whole-estate routes/links/errors release sweep
- M11 Grub catalogue depth, validated nutrition and variety
- M12 Fit catalogue/session breadth and visual guidance
- M13 whole-person Progress and unit experience
- M14 member memory inspect/edit/delete controls
- M15 Health MOT mocked partner-ready integration
- M16 outcomes launch architecture proof
- M17 sceptical-customer/Numan competitive acceptance

These are mappings to original requirements, not nine new original requirements. The finish-line gate is being strengthened so the 57-row inventory and M09–M17 cannot silently disappear again.

### Content-depth evidence
**Grub:** live source audit proves **16 recipes**, split 4 breakfast / 4 lunch / 4 dinner / 4 snack. Existing recipes have meaningful quantities, serving size, time, calories, protein, fibre and usable methods, but **0/16 meet the complete launch standard** because ingredient-level validated nutrition, full macro model, structured allergens/substitutions, systematic storage/reheat/batch/food-safety metadata and structured-content publication are incomplete. The active composer exhausts a four-item meal-type pool and exact repeats begin around day five; dislikes/Nays can accelerate repetition. Initial experience floor: **64 fully commissioned recipes (12 breakfast / 16 lunch / 24 dinner / 12 snack)**, subject to increase under 30/60-day simulation. Minimum current deficit: **48**.

**Fit:** live source audit proves **12 exercises** with decent instructions/sets/reps/time/rest and the historical duration-padding defect fixed, but **0/12 meet the complete launch standard** and **0/12 have the required visual guidance**. Equipment/location breadth, structured regressions/progressions/limitation metadata and repeated-context variety are inadequate. Initial experience floor: **48 fully commissioned exercises with 48/48 visual guidance**, subject to increase under 12-week, three-sessions-per-week simulation. Minimum current deficit: **36 exercises + 48 visuals**.

### Remaining launch blockers
B01 AMBER — real-token recovery completion only.
B03 AMBER — behavioural 9/9 closed; rendered/premium/mobile/error-state evidence remains.
B05 AMBER — production public trust audit.
B06 AMBER — authorised HQ operator workflow under controlled failure/recovery.
B07 AMBER — controlled production-safe degradation -> detect/history/HQ next action -> recovered.
B08 AMBER — fresh Dave end-to-end release candidate including rendered/content-depth acceptance.

### Remaining MUST FINISH / anti-abstraction rows
M01 AMBER — One Shift rendered representative public/member evidence.
M03 AMBER — Radar live scan/publication/ticker freshness evidence.
M04 AMBER — full real-flow launch analytics QA.
M05 AMBER — release security/privacy review including export/delete/uploads/audit/privilege boundaries.
M06 AMBER — interaction accessibility + production performance evidence.
M07 AMBER — production structured-content path/migration reconciliation; 10k benchmark already green.
M08 AMBER — final release evidence/recovery checkpoint, continuously maintained.
M09 AMBER — email verification lifecycle.
M10 AMBER — whole-estate routes/links/errors sweep.
M11 AMBER — Grub structured catalogue + validated nutrition + simulator variety floor.
M12 AMBER — Fit structured catalogue + visual guidance + 12-week simulator floor.
M13 AMBER — whole-person Progress/unit experience.
M14 AMBER — member memory inspect/edit/delete controls.
M15 AMBER — mocked partner-ready Health MOT path.
M16 AMBER — outcomes launch architecture proof.
M17 AMBER — explicit competitive/sceptical-customer acceptance.

## Current recovery point
`main` is at merged PR #54 (`e46aa035`) and its hard production commissioning is GREEN, so B03 behavioural evidence is locked at **9/9** unless a regression reopens it. No known unresolved product regression remains from the final B03 sequence.

Immediate parallel closure lanes:
1. B03 rendered/premium/mobile/error-state automation and final irreducible device evidence.
2. B06/B07 controlled Watchtower/HQ degradation -> detection -> action -> recovery proof.
3. M11 Grub structured-content/content-quality factory plus 7/14/30/60-day simulator.
4. M12 Fit structured-content + visual factory plus 12-week simulator.
5. B01 secure token completion when a secret-safe executor/human action is available.
6. B05/M03–M10/M13–M17 and Dave against their explicit closure conditions.

Do not reopen green behavioural work without regression evidence. Operating rule: **SWARM -> BREAK -> FIX -> PROVE -> CLOSE -> CONTINUE.**
