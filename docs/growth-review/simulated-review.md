# Simulated task review — 28 September 2026
## Method and limits
Eight task-based fictional situations selected for variation, not a statistical or randomly sampled population. One analyst; no independent agents or invented tester quotes. This pass inspected public-page text/link destinations and current source plus existing production reports. The browser workspace was unavailable: no new account session, form submission, visual usability, accessibility certification or timed task completion is claimed.

Public retrieval on this date returned cached text (some pages crawled two or three days earlier). Programme/Help extracts omitted recently verified release content. Treat that as a retrieval limitation, NOT a demonstrated rollback or missing feature. Do not change production to match a stale extract.

Evidence classes: observed text/source; prior automated result; heuristic hypothesis; untested.
Public paths inspected: /, /start-here, /programme, /help, /provider-switch, /member/dashboard.

## Scenario run sheet
| ID / fictional situation | Task and expected useful outcome | Evidence this pass | Next browser action |
|---|---|---|---|
| S01: new visitor, no medication, no budget | Find free practical support, complete Start Here, reach one useful action | Text exposes no-medication and zero-budget choices; prior Passport test covers that combination through synthetic handoff | Complete ordinary signup with real inbox/security check; confirm resulting route stays non-medication |
| S02: time-poor member with ten minutes | Choose meal and shorten movement without losing meal choice | Prior full production journey passed exactly this behaviour | Repeat with another task/meal; record required hints and visible explanation |
| S03: already treated elsewhere | Understand that practical tools do not require moving prescription; save/retrieve own history | Provider-switch explains boundaries; prior Passport test covers own-history save/export | Start unaided from home; find keep-current-provider route and retrieve record |
| S04: returning after a lapse | Reopen saved next step, skip safely and restart without false completion | Prior persistence evidence exists; lapse-specific behaviour not tested here | Return in a fresh session; inspect unchanged saves and offer of manageable next action |
| S05: action does not fit twice | Receive a genuinely different useful action | Prior growth acceptance passed repeated negative feedback and fresh sign-in | Try a second starting action; check action identity and feedback linkage |
| S06: adjusted action helped | Keep useful adjustment on next visit | Prior growth acceptance passed helpful-feedback retention | Reload, logout/login, check exact retained action rather than just confirmation copy |
| S07: privacy-conscious member | Decline optional tracking, find export, distinguish erasure and deletion | Source distinguishes consent, health erasure and operator-handled account deletion | Inspect downloaded file readability; decline consent and verify no optional save |
| S08: member wants a person / cannot sign in | Find account support and understand availability | Help text supplies contact/sign-in routes; staffing response evidence absent | Exercise ordinary expired-link, resend/reset and support fallback without sending unnecessary personal data |

## Prioritised findings
| ID | Priority / classification | Evidence and implication | Fix or acceptance |
|---|---|---|---|
| F01 | P1 evidence gap | Current production browser script explicitly excludes ordinary CAPTCHA and email delivery. Synthetic success cannot prove a new person can register. | Real security check + accessible inbox: verify email, login, saved handoff, logout/return; reset/resend/expired/replay once. Never bypass. |
| F02 | P1 confirmed measurement mismatch | continuity scorecard uses first visible Today; older HQ uses registration; proposed pilot uses enrolment. Mixing these could manufacture improvement. | Separate labels, denominators and windows as pilot-measurement.md specifies. No metric renaming. |
| F03 | P1 confirmed measurement gap | medicationElsewhere is explicitly unavailable in scorecard. | Optional consented pilot self-report; unknown remains unknown. No inference from browsing or medication records. |
| F04 | P2 heuristic | Provider-switch's main onward action leads to Start Here; its extracted questions emphasise treatment preference/access/budget. A person keeping their provider may be unsure which route fits. | In browser, ask S03 to find practical support without switching. If confused, propose a direct free-My-Timber route using existing navigation; preview before release. |
| F05 | P2 capability gap to verify | Programme export is JSON. That establishes portability, not member-readable usefulness. Passport export is evidenced; human-readable end-to-end summary not established. | S07 must locate, open and understand actual export. Implement summary only if acceptance fails; contract in inventory. |
| F06 | P2 heuristic | Extracted Start Here result includes medicine-oriented headings alongside non-medication choices. Cached HTML includes hidden states, so visibility is unknown. | Inspect no-medication result in browser before filing copy defect; recent Passport test already preserves selection. |
| F07 | P1 operational dependency | Account deletion is received/queued, not automatically complete. Source requires an HQ operator to finish and evidence it. | Name operator and review queue; distinguish request receipt from completed erasure in support handling. No public SLA invented. |

## Findings to preserve
Already passed: saves survive fresh sign-in, meal choice survives movement adjustment, negative feedback changes action, helpful feedback retains it, Passport consent/isolation/export/optional erasure, Settings 503 repair. Avoid rebuilding these without new contradictory evidence.

## Execution and issue policy
Use isolated preview first. Each run records source/version, viewport/browser, scenario, task, visible steps, expected/actual outcome, screenshot, console/request failure and whether assistance was given. Exclude test users from real engagement reports. Do not fabricate elapsed weeks.
P0: account leakage, lost data or unsafe advice. P1: core task blocked or misleading essential promise. P2: recoverable friction. P3: cosmetic preference.
Record observed defects separately from subjective suggestions; verify twice where possible. No satisfaction scores, conversion uplift or independent human feedback is claimed.
