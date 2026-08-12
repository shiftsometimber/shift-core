# Shift Some Timber — Definitive Launch Finish Line

This document supersedes open-ended commissioning as the day-to-day execution ledger. The remediation matrix remains the audit source; this file classifies the remaining acceptance work into exactly three launch categories.

## Definition of DONE

Shift V1 is DONE when a fresh member can discover, trust, register, recover access, onboard, use the core member products, leave, return and retain state; the critical public/member experience meets the One Shift premium/mobile/accessibility bar; member boundaries and security/privacy controls are commissioned; HQ can see and act on operational health; and any clinical functionality shown as live is backed by a real approved operating model. No critical journey may depend on developer intervention.

Clinical features whose operating partner/governance is not yet formally commissioned must not be represented as live. They remain launch BLOCKERS for the paid clinical service, while non-clinical engineering continues.

## Burn-down baseline — 12 Aug 2026

- Launch BLOCKERS: 24
- MUST FINISH: 22
- POST-LAUNCH: 10
- Already closed from original matrix: G1-011
- Dave genuinely GREEN: 4/18 automated legs = 22% (discover, trust, Core health, anonymous member-boundary protection). Authenticated/inbox/partner legs are not counted green.
- Production surface families considered: 12. Demonstrated complete: 3/12 (public discover/trust baseline, Core health/routing baseline, anonymous auth boundary). The remaining member/HQ/auth surface families require launch acceptance evidence.
- Regressions unresolved at baseline: 0 known red CI regressions on main.

## BLOCKER — cannot launch without it

| ID | Remaining launch requirement | Finish condition |
|---|---|---|
| G1-001 | Password recovery | real reset request -> received email -> one-time reset -> old sessions revoked -> login succeeds |
| G1-002 | Transactional email deployment | production welcome/reset email actually received, not merely API-send attempted |
| G1-003 | Registration email lifecycle | real new account receives expected transactional communication and can sign in |
| G1-004 | Email verification policy | explicit V1 policy implemented; member state cannot misleadingly imply verification |
| G1-005 | Authenticated member persistence | save -> refresh -> logout/login -> same canonical state across critical products |
| G1-009 | Critical mobile/browser journey | iOS Safari + Chrome + desktop critical journey evidence |
| G1-010 | Auth/security commissioning | production auth/session/reset abuse checks plus current password hashing/rate/session policy |
| G1-012 | Authenticated Dave release gate | automated/synthetic journey extends through authenticated member lifecycle wherever technically possible |
| G2-001 | Shift Today | genuinely useful daily screen; not dashboard/scaffolding |
| G2-002 | Grub recipe usability | every surfaced launch recipe is independently cookable with quantities/method/timing |
| G2-003 | Grub nutrition trust | launch recipes' nutrition is tied to stated quantities or clearly validated source/model |
| G2-006 | Fit session composition | 10/15/20/30/45/60 minute sessions make practical physiological sense |
| G2-007 | Fit exercise usability | prescribed launch exercises have clear instructions/visual guidance and safe alternatives |
| G2-013 | Progress Picture persistence | private upload/save/reload/delete/history works reliably on mobile |
| G3-001 | One Shift premium parity | random critical public/member page looks like same premium product as homepage |
| G3-004 | Premium controls | no browser-default/prototype controls in launch journeys |
| G3-008 | Accessibility critical journeys | keyboard/focus/forms/errors/navigation/contrast/reduced-motion critical-path acceptance |
| G5-001 | Clinical operating boundary | real provider/pharmacy/prescriber/governance model approved before paid clinical launch |
| G5-002 | Medication Companion clinical pathways | real clinical owner approves support/escalation before treatment feature is live |
| G5-003 | Identity/weight verification | real provider/regulatory requirement implemented before clinical treatment launch |
| G5-005 | Public trust | visitor can identify operator, clinical responsibility, pharmacy/provider when formal, privacy and AI boundary |
| G5-007 | Watchtower launch operations | critical website/Core/email/AI/member-product failures are detectable with useful action state |
| G5-011 | Security/privacy | member isolation, permissions, secrets, uploads, export/delete and audit evidence closed |
| G5-013 | Fresh Dave end-to-end | zero unresolved P0/P1 defects in the agreed fresh-persona journey |

## MUST FINISH — agreed V1 product, but can run in parallel with blockers

| ID | Remaining V1 requirement |
|---|---|
| G1-006 | release route/link/form integrity report |
| G1-007 | consistent traceable member-safe errors |
| G1-008 | coherent loading/empty/success states |
| G2-005 | durable Grub Yay/Nay learning demonstrated longitudinally |
| G2-008 | durable Fit Yay/Nay learning demonstrated longitudinally |
| G2-009 | Conundrum launch-quality kitchen logic |
| G2-010 | Hydration launch-quality multi-drink logging |
| G2-011 | whole-person Since You Started experience |
| G2-012 | stone/lb/kg and metric controls consistently used |
| G2-014 | Progress Picture premium presentation |
| G2-015 | My Plans understandable active/replaced/completed state |
| G3-002 | canonical responsive header/navigation behaviour |
| G3-003 | canonical footer parity |
| G3-005 | card/spacing/type consistency |
| G3-007 | member IA centred on Today/Grub/Fit/Progress/Ask Shift |
| G4-001 | One Shift Brain authenticated cross-surface behaviour proof |
| G4-002 | appropriate learned-memory inspect/change/delete controls |
| G4-003 | recommendation outcome learning proof |
| G4-005 | grounding provenance inspectable where required |
| G4-007 | stale GLP ticker cannot present itself as current |
| G4-008 | coherent explainable proactive Today behaviour |
| G5-008 | HQ attention-first operational home usable by an operator |

## POST-LAUNCH — valuable, does not delay V1 launch

| ID | Deferred improvement |
|---|---|
| G2-004 | catalogue breadth beyond the minimum launch-quality recipe variety floor |
| G3-006 | further Knowledge Hub editorial refinement beyond current One Shift treatment |
| G4-004 | fully automatic CMS classification/review/index lifecycle where launch can use an approved controlled publication path |
| G4-006 | full live Radar commissioning if Radar/ticker remains accurately hidden or fail-safe until proven current |
| G5-004 | real Health MOT/lab provider integration beyond the already partner-neutral data contract |
| G5-006 | advanced cohort/outcome analytics and governed publication capability |
| G5-009 | migration of all reusable content to structured repository beyond launch-scale content required by V1 |
| G5-010 | analytics breadth beyond the critical acquisition->activation->core-use->return funnel |
| G5-012 | optimisation beyond the agreed launch performance budgets |
| G5-014 | formalised competitive/Numan review after Dave acceptance; launch copy/product must still pass the basic trust proposition |

## Critical path

1. Auth/email/account recovery evidence and security hardening.
2. Authenticated Dave identity + canonical persistence across Today/Grub/Fit/Progress.
3. Close core member product quality/premium/mobile gaps: Today, Grub, Fit, Progress Picture.
4. One Shift critical-path mobile/accessibility acceptance.
5. Watchtower/HQ operational acceptance and security/privacy closure.
6. Fresh Dave rerun with zero P0/P1 defects.
7. Paid clinical launch only after the genuine external provider/governance blockers are signed off.

Parallel streams: member-product quality, One Shift/mobile/accessibility, HQ/Watchtower, public trust and clinical-partner preparation can progress concurrently while auth/inbox evidence is being gathered.

## Forecast

Engineering-only V1 finish is now constrained mainly by authenticated/inbox/device/member-product acceptance rather than missing architecture. Earliest credible engineering-ready point is approximately 1–2 concentrated days of uninterrupted blocker burn-down if no new P0 defect is exposed. A paid clinical production launch cannot be credibly dated from the repository alone because G5-001/G5-002/G5-003 require external provider/governance decisions. Those external dependencies are the only acceptable reason the clinical launch date may extend beyond the engineering finish.

No new work enters BLOCKER or MUST FINISH unless it closes one of these requirements or is a defect discovered while closing them.
