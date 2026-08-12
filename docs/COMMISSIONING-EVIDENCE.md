# Shift Commissioning Evidence Ledger

This ledger records demonstrated evidence. Source/merge alone is not PASS. AMBER means required evidence remains. BLOCKED means a genuine external dependency is required. `docs/LAUNCH-FINISH-LINE.md` is the authoritative closure board.

## Current closure evidence — reconciled through PR #49, 2026-08-12

### PASS CLOSED
**B02 authenticated member isolation + durable longitudinal state: PASS.** PR #47 created two fresh authenticated production members and proved separate sessions, member-state preferences, Progress, Brain context, Today context and logout/login retained state with no A/B contamination.

**B04 One Shift Brain longitudinal behaviour: PASS.** PR #42 proves current intent overrides stale stored preference and unrelated domains remain isolated. PR #48 adds authenticated production stored food dislike -> Grub -> Nay -> logout -> login -> regenerated plan excluding the Nayed meal, while Fit remains unaffected by the Grub signal and respects its own running dislike. The commissioning run exposed a real defect where a Nayed meal could reappear; the product path was fixed and the hard proof rerun green.

**M02 reviewed Knowledge publication lifecycle: PASS.** Reviewed Knowledge publish -> canonical retrieval -> provenance/grounding -> withdrawal -> no longer grounding is regression-protected.

### B03 product evidence
PR #48 production behaviour PASS: Grub and Fit. Grub proves authenticated generation, stored dislike application, durable Nay across return, changed later recommendation and semantic quality floor. Fit proves authenticated generation, exercise dislike, cross-product isolation and semantic quality floor. Their only remaining B03 closure item is rendered premium/mobile member journey plus graceful member-facing failure state.

PR #49 production behaviour PASS: Today, Hydration, Conundrum and My Plans. The production suite proves Conundrum recognises chicken+cheese+wrap, coffee contributes to hydration while beer does not, hydration plan/log state survives logout/login, My Plans retains the active hydration plan, and Today consumes that plan before and after return. Their only remaining B03 closure item is rendered premium/mobile member journey plus appropriate empty/error/validation state.

Progress remains AMBER: #49 proves its production summary safely returns `empty` or `ready`, but authenticated create/log -> persist -> refresh -> leave/return and rendered journey remain.
Progress Picture remains AMBER: authenticated upload/save/history/comparison/delete/privacy plus rendered/mobile journey remain.
Shift AI remains AMBER: authenticated ask -> grounded/provenance-aware answer -> retained context/no cross-member leakage plus rendered journey remain.

### B01 authentication recovery
Production Welcome and password-reset messages are proven received in the connected Shift inbox. The production recovery implementation includes single-use hashed reset tokens, 30-minute expiry, password reset, session revocation and authenticated change-password. Remaining evidence is the actual real inbox token -> reset POST -> login with new password -> authenticated change-password -> logout -> login again. The token must not be committed/logged. If the active execution environment cannot securely submit the inbox token to the production POST, this is a secure-runtime/human interaction dependency rather than missing product code.

### Remaining launch blockers
B01 AMBER — real-token recovery completion only.
B03 AMBER — six products behaviour-green/rendered-proof remaining; Progress/Picture/AI behavioural + rendered proof remaining.
B05 AMBER — production public trust audit.
B06 AMBER — authorised HQ operator workflow under controlled failure/recovery.
B07 AMBER — controlled production-safe degradation -> detect/history/HQ next action -> recovered.
B08 AMBER — fresh Dave end-to-end release candidate.

### Remaining MUST FINISH
M01 AMBER — One Shift rendered representative public/member evidence.
M03 AMBER — Radar live scan/publication/ticker freshness evidence.
M04 AMBER — full real-flow launch analytics QA.
M05 AMBER — release security/privacy review including export/delete/uploads/audit/privilege boundaries.
M06 AMBER — interaction accessibility + production performance evidence.
M07 AMBER — production structured-content path/migration reconciliation; 10k benchmark already green.
M08 AMBER — final release evidence/recovery checkpoint, continuously maintained.

## Current recovery point
`main` is reconciled through merged PR #49 plus this ledger update. No known unresolved regression from #48/#49. Critical path: B01 secure token completion; B03 Progress/Picture/AI behavioural closure and rendered evidence; B06/B07 controlled operations proof; B08 Dave. Parallel closure lanes: B05, M03, M04, M05, M06, M07. Do not reopen the green production behaviours for Grub/Fit/Today/Hydration/Conundrum/My Plans unless a regression is discovered.
