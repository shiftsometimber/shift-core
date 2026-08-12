# Active recovery checkpoint — 2026-08-12

Authoritative execution state if interrupted.

## Last merged
PR #47 merged to main. Its production commissioning leg created two fresh authenticated members and demonstrated separate sessions, separate member-state preferences, separate Progress, separate Brain context, Today consuming each member's Brain, logout/login retained state, and no A/B contamination. This closes the authenticated isolation/retained-state evidence required by B02. PR #45 previously established observable transactional auth delivery and connected Gmail evidence proved real Welcome + password-reset messages reached INBOX.

## Current critical path
No open batch is authoritative at this checkpoint. B02 is closed by PR #47 evidence. B04 is materially advanced by authenticated retained-state proof but remains incomplete until an authenticated preference/Nay signal is shown to change a later recommendation after leave/return while unrelated product context remains unaffected. B01 remains incomplete only for reset-token submission -> password mutation/change -> subsequent login/logout; real inbox receipt is already PASS.

## Exact next action
1. Attack B04 recommendation-change proof first: authenticated preference/Nay -> leave/logout -> return/login -> later Grub/Fit/Today recommendation demonstrably changes as intended, with current intent overriding stale memory and no unrelated-product contamination.
2. In parallel begin B03 route-level primary member journey closure for Today, Grub, Fit, Hydration, Conundrum, Progress, Picture, My Plans and Shift AI. Require persistence where relevant, graceful failure and semantic quality; fix defects in place.
3. Continue B01 reset-token submission -> password mutation -> login/change-password/login only through a secure execution path. Never place live reset tokens in repository/history.
4. Then close B06/B07 using controlled production-safe degradation -> AMBER/RED -> HQ action -> recovery evidence and keep extending Dave as blockers turn green.
5. Reconcile LAUNCH-FINISH-LINE, COMMISSIONING-EVIDENCE and remediation matrix whenever a closure is evidenced. Do not promote physical-device, clinical/provider or other genuinely external proof.

Operating rule: SWARM -> BREAK -> FIX -> PROVE -> CLOSE -> CONTINUE.
