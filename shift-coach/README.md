# Shift AI coaching integration candidate

This branch is a real-account integration candidate, not a live release or evidence that the complete Shift AI v2 work order has passed. It starts from recorded `shift-core` main `7a02f42a58a7992ce4728d9fd91808f2654f7cdf`. The synthetic prototype is commit `8e775b08d41b604b5f93449b497648eb33e3b72c`.

## Implemented

The scoped wrapper preserves the original Worker, named Durable Object exports, routes and scheduled jobs. Only the dashboard Today panel receives the new component. The separate candidate Wrangler configuration changes only its entrypoint; the existing production configuration and deployment workflow are unchanged. Merging these additions alone does not switch the feature on.

`/v1/shift-coach` uses existing member session authentication, current optional health-tracking consent, same-origin writes and optimistic revision checks. Member identity cannot be supplied in a request. Coaching lives at `member_state.preferences.lifeBack.progress.shiftAI`, within the existing protected Life Back object. Full-profile and Journey saves preserve it; existing health erasure removes it; member-state export includes it. It introduces no database, migration, provider, secret or paid service.

Members confirm a goal, their working week and one focus. Today reads a previously prepared action. Accepted actions can receive an optional in-app follow-up; outcomes select a smaller step or another approach. Confirmed memory is editable and deletable; rejected action types require explicit restoration. A weekly personal rating, chosen components and a prepared weekly plan are available. Other-prescriber and stopped-medication modes retain history and never generate medicine instructions.

The opt-in scheduled review is paged, repeat-safe, rule-based and makes zero model calls. External notifications, calendar writes and device imports are disabled. `SHIFT_COACH_OFF=true` stops background preparation and automatic in-app follow-up presentation while leaving Today readable. Quiet hours, three follow-up presentations per seven days and one presentation per day are enforced. Two unanswered prompts pause follow-ups; explicit restoration is required. This is within My Timber only.

There are six fixed everyday action types. This is not an internet-trained or self-improving model, and the action library has not passed independent voice/relevance review. New text never trains a model. Finite input boundary checks decline matched medical, safeguarding or under-age text; they are not validated triage or a guarantee of detection. Official help is always visible and nobody is represented as monitoring messages. Existing Ask Timber remains a separate unchanged service.

## Privacy and concurrency

Consent is rechecked during writes. A consent event ID binds the snapshot; withdrawal and regrant cannot resurrect old memory. Coaching changes share Life Back's parent revision, so stale tabs and concurrent Life Back writes cannot overwrite one another. Whole-coach deletion increments that revision to prevent an in-flight old snapshot returning. Removing a fact also removes derived actions, queued follow-ups, plans and dependent references. No content is copied to a separate audit store.

History older than 90 days is pruned on the next mutation, not by a guaranteed daily deletion job. Confirmed facts remain until deletion. This proposed retention and the existing consent purpose still need the retained privacy assessment; code placement is not proof that consent is legally sufficient. Snapshot size is bounded and returns a recoverable conflict when full.

## Evidence and limits

- `node --test shift-coach/integration.test.mjs`: real session-table authentication and native SQLite checks, synthetic accounts only.
- Preserved-route regression suite: member experience, auth, Journey, promise, app layout and footer checks.
- `browser-proof.mjs`: rendered mobile/desktop component on a synthetic shell, not the full production My Timber route. Records browser interactions, persistence and isolation. Timings are local simulated-network measurements.
- `workerd-proof.cjs`: the complete compiled Worker with actual local workerd/D1, synthetic users and the original session implementation. No production resources or fixture login endpoint are exposed.
- `scope.mjs`: exact new-file list and zero modifications to existing tracked source.

Formal acceptance remains BLOCKED for independent review and unimplemented requirements. Calendar read/write/undo, automatic device import/conflict handling, push, per-source live integration controls, full My Journey-only onboarding and validated pattern thresholds are not completed. No launch or competitor superiority is claimed.

## Promotion requirements

The user requested real use on 2 October. The saved no-partner amendment still retains privacy assessment, intended-purpose classification and independent evidence before real use. That request does not invent those decisions. A bounded coaching launch would also amend the approved one-complete-v2 launch scope; it cannot be silently labelled full v2.

Existing production checks must pass before a new entrypoint is promoted through the authorised release path. Run 36974740617 on the recorded main failed waiting for the mobile Fit setup summary, with the four Progress/My Plans checks successful. This is an observed existing acceptance failure, not evidence of its cause or of a coaching regression. No live data was used by this candidate's tests, no release guards were altered and no deployment occurred.

## Re-review on current main, 2 October

The additions are now reconciled with recorded main `fff6a5cae91e9fdb8a778d6ccf8f6d363e34a21b`. New evidence is appended to `launch-assessment.json`; earlier entries are retained. `privacy-purpose-review.md` contains the completed technical purpose/data-flow/risk assessment and the specific unresolved controller decisions. The new `full-page-proof.mjs` uses the actual current My Timber HTML/scripts and original Worker with synthetic SQLite and no external network. Six checks passed, including app/web mobile/desktop layout, feedback, persistent correction and consent withdrawal. Its unseeded Grub responses remain explicitly reported. It is builder evidence, not independent acceptance.

The full preserved/native suite passes 330 checks. Streamed request bodies are bounded before full buffering. Typographic punctuation no longer bypasses the listed finite support phrases. Hidden tabs do not acknowledge follow-ups, returning to Today rechecks consent, and the card is placed after the preserved Today heading and restored after the existing client repaints. Only audit/night-run history has 90-day mutation-based pruning; the member copy now states this accurately.

Existing Ask Timber is live under successful production run 36991043036. This proactive candidate is not deployed. Its production integration must be durable across ordinary deployments, and the retained launch gates and complete-v2 scope still need resolution.

## Proposed durable release integration, 2 October

This addendum records the necessary backend additions before preparing them. They are reviewable branch work, not approval of the full product, privacy decisions or launch. Recorded current main is `3c1704b23955fb4abf57e1b05bc56464d10ed08c`; its four-file Watch update is retained exactly.

Proposed additions: `shift-coach/release-contract.mjs`, `shift-coach/release-manifest.json`, `shift-coach/release.test.mjs`. Proposed existing backend changes: `wrangler.jsonc` (one entrypoint replacement); `.github/workflows/cloudflare-production-promote.yml` (coach trigger, tests and explicit launch check); `release/app-scope.mjs`, `release/app-preflight.mjs`, `release/growth-scope.mjs`, `release/growth-adopt-deployment.mjs`, `release/shift-ai-scope.mjs`, `scripts/b1-release-scope.mjs` (exact source/configuration preservation and current Watch binding); `tests/b1-release-scope.test.mjs` (current Watch expectations); `tests/shift-ai-release.test.mjs` (retain the two-flag contract with the separately checked entrypoint). All original runtime bindings, routes, assets, consent, authentication, styles and content remain byte-identical.

Affected runtime surfaces: the new `/v1/shift-coach` API, `/assets/shift-coach.mjs`, and `/member/dashboard` Today; the existing 15-minute cron gains opt-in preparation. All other Worker routes are delegated to the unchanged original entrypoint. Root entrypoint selection affects the entire Worker, so the full existing production preservation, rollback and live checks remain mandatory. No parallel deployment or automatic re-deployment workaround is introduced.

The production workflow must stop before production work until separate scope, privacy, intended-purpose, independent acceptance/voice and launch decisions have genuine recorded evidence. Matt has already requested live deployment; that authority is preserved. His latest request to sort follows the proposed bounded in-app launch and is recorded as its scope authority. Privacy, purpose and independent review outcomes are not inferred from it.

Current-main reconciliation: `5ce97113112f3af637c4b108ee90813b1328d7b5` now includes PRs #943 and #946, which independently repaired the observed Watch release blockers. Those fixes and their updated manifest/tests are retained. The proposed `tests/b1-release-scope.test.mjs` edit is no longer needed; the actual coaching delta is nine existing backend files and 33 additions. No credit for those other fixes is claimed.

Prepared-action speed change: the dashboard embeds a fresh snapshot obtained through the same original session-authenticated coaching GET, with current consent checks and private/no-store headers. Inert JSON escapes HTML delimiters, and the scoped client is inlined at the coaching section. It avoids a serial API request and does not wait for other deferred site scripts. Existing visibility/consent refresh and write-time checks remain. The full-page timing fixture now requires seven distinct full-document navigations; earlier same-fragment samples are retained but not treated as seven independent timings. A gzip fixture is explicitly a transport simulation, not a verified production account setting.

Production baseline rechecked: main `5ce97113112f3af637c4b108ee90813b1328d7b5` successfully deployed in run `37003235380`, version `4396d20d-e8df-4f83-8e82-354146b89c76`. The candidate adoption check now requires that observed version. Existing Ask Timber remains live; this coaching branch is not deployed.

Additional backend proposal: `release/home-banner-scope.mjs` must recognise only the separately pinned coaching workflow additions before doing its original exact homepage/workflow comparison. Every affected route and original homepage byte remains preserved. The first hosted source check failed on this unextended historical guard (runs 37005279219 / 37005284445), before deployment. This is recorded as a failed attempt, not a successful release. The actual delta now includes ten existing backend files.

## Final current-main reconciliation

After the four hosted coaching/master/route checks passed on `e09fe1170d7a65b431da7a23991ecb651a4cd943`, independently approved PR #944 advanced main to `e895c0c498fae5272fb4ed36203a8f42227bd2fe`. Its public wording, menu mark, preview pins and tests must be retained exactly; they are not coaching changes. Resolve only the two overlapping backend import/source-comparison blocks, preserving both exact checks. The ten-file backend coaching scope does not widen. Re-pin the candidate application and record this new main before rerunning checks. The separate new-main production run 37007862438 failed before deployment because its expected starting Worker was stale; the observed active Worker was still `4396d20d-e8df-4f83-8e82-354146b89c76`, which this candidate already requires.

Final pre-reconciliation evidence is retained: 388 local checks; four hosted checks; 8 scoped browser, 6 actual-page interaction and 10 compiled workerd/D1 checks. Hosted component p95 was 433.8ms; full-page p95 was 2342.8ms, so the 1000ms target failed. Existing production acceptance run 37003998254 failed waiting for a Fit disclosure; its screenshot shows the new-member notes field visible. A proposed `release/app-member-live.mjs` verifier correction is recorded in the separate review pack but is not applied or tested, and does not count as a successful acceptance rerun. Privacy, purpose and independent-review decisions remain absent. This is still a draft and not a live or complete-v2 release.


## Ownership clarified by Matt, 2 October at 16:20 BST

My Timber and Shift AI own everyday coaching during and after treatment: food, movement, difficult weeks, routines and setbacks. Medication purchases stopping must not remove coaching access or history. The clinical partner owns treatment decisions. The coaching loop remembers member-confirmed context, offers one action, asks whether it helped and changes the type when it did not help. Returning food noise is a reason to support everyday routines; no claim of symptom assessment, treatment selection or medication advice is made.

The earlier generic GP link labelled as a prescriber route was inadequate. It is now correctly labelled as GP information. The panel instructs members to use their actual prescriber contact/portal from treatment confirmation and provides the existing SHIFT contact page for help finding those details, with no clinical-response or automatic-referral promise. A direct named clinical-partner channel remains unverified and must be provided before that hand-off can be represented as integrated. Neither the ordinary support page nor a stored coaching message sends a clinical referral.

## Phantom-member repairs, 2 October 2026

Matt authorised repair of the gaps found by the three synthetic members. The changes add fixed practical instructions and Grub/Fit handoffs, visible next-focus choices after exhaustion, an explicit retry of previously rejected suggestions, plain-language focus correction and visibly smaller tasks after did-not-fit. Feedback and identity continue across treatment phases; stopped-treatment support now includes repeatable routines, food-noise context and setbacks. This is everyday coaching content, not a staffed after-treatment service or a clinical programme.

Ordinary illness wording is declined before storage. The help panel opens on a declined form submission. Previously stored illness context also suppresses actionable suggestions, acceptance and follow-ups until corrected or deleted. These finite checks cannot diagnose, grade urgency or guarantee detection. No message is sent to a clinician. Relevant references checked 2 October: Guy’s and St Thomas’ NHS “Managing side effects with diet” (healthcare-team/GP contact for inability to keep down fluids), and NICE QS212 statement 7 (support after medicines stop). The new practical strings remain subject to the recorded voice and independent acceptance review; source citation is not clinical approval.

`shift-coach/phantom-members.mjs` is a reproducible three-account browser harness. It serves repository-pinned dashboard HTML and existing member assets through the original Worker with synthetic SQLite, blocks external HTTP, and exercises visible forms, saved context, feedback, phase changes, help, choices, consent and account isolation. Grub/Fit page handoff checks validate the local page response, not the real catalogue, prescription or staffing. Browser failures cause a nonzero exit; the simulated one-second speed target is recorded separately as a diagnostic. Digital-confidence personas are heuristics, not observed human participants.

The repair reconciles current main `afa730029198f39b60f6ea82d6469e5681d93575` including the newer specialist Watch and treatment guidance changes. The subsequent accepted coaching launch on main92ea1f3a is also retained, including concurrency protections, prescriber contact routing and recorded privacy/purpose decisions. Independent acceptance is explicitly pending for this repair delta; the earlier receipt only covers the earlier payload. No production deployment is claimed by these repairs.

## Owner acceptance of the repaired release

On 2 October at 17:25 BST Matt asked to deploy after the pending independent-review hold was disclosed. The assistant stated the interpretation before proceeding: deploy these tested bounded repairs on owner acceptance and engineering evidence, retaining every other source, privacy, safety, pre/post-deployment and rollback check. The release gate now represents that specific alternative honestly. `independentAcceptance.approved` remains false for this repair; `ownerAcceptance` binds the exact application commit and records that no new independent review was completed. This is not clinical approval, a review receipt or authority for unverified future source. The previous independent receipt remains as historical evidence.


## Completing the everyday coaching brief — 2 October 2026

Matt instructed this work at 18:24 BST. The fixed library now has 18 practical actions, with an explicit member-selected difficulty: everyday basics, busy days, evenings, weekends, returning food thoughts, setbacks or low motivation. No diagnosis or treatment is inferred from that choice. Rejected approaches stay excluded within the member's chosen focus until explicitly restored; “didn't fit” preserves the strategy with a smaller first step. Helpful feedback influences the next choice. Reasons refer to recent feedback only while its confirmed source context remains current. Corrections/deletion remove obsolete explanations. History displays the saved action title alongside feedback; older records are labelled as earlier steps rather than inventing their original wording.

Prescriber contact continues to use the member's actual treatment details; no verified partner portal or monitored clinical handoff has been invented. No new model costs, schema, device connection or external messages are introduced. Newer merged GLIMR Watch and approved book-voice work are retained byte-for-byte in the composed release. Live delivery requires the guarded production workflow, including exact assets, existing routes, current-main verification and automatic rollback.

## Weekly-plan continuity repair, 2 October

Matt requested the current experience be resolved after asking for stronger evidence across changed circumstances and repeated, difficult weeks. Three checks reproduced a specific fault in the deployed source: an unchanged set of memory IDs could keep an obsolete weekly plan after unhelpful feedback or a treatment-situation change, and the old plan could still be accepted.

This repair binds new weekly plans to their prepared action. Existing plans without an action ID remain usable only while their full title, reason, component, duration and source/context snapshot match the available action. Read-only member responses identify superseded plans as earlier history; the UI removes their acceptance button, and the authenticated API rejects stale acceptance. Accepted history and member feedback remain; there is no data migration, external notification, model call, prescription change or additional monitoring claim. Plans also wait while a member is deciding whether an untried step is still wanted.

Engineering evidence includes the three original failing checks, all 38 saved-state integration checks passing after repair, 310 preserved member/authentication/Journey/layout/footer/book-voice checks, and ten compiled Worker/D1 checks. The added longitudinal check advances a clock through eight scripted visits, including a break longer than a fortnight. It checks saved feedback, a smaller action, changed working week, stopping treatment, a different approach, wanted confirmation, return without backlog, professional-help routing and account isolation. It is software evidence from invented records, not eight weeks of observed member usefulness or retention. The three-person browser harness now also exercises current-plan acceptance, persistence, historical rendering and the server-side stale-plan rejection. Its rendered evidence and compiled Worker checks must pass before release.

The composed release starts from the successfully verified book-voice production run 37035367629, source ac7b4a225d3e3004a2b79d2d6cb82032e2dbbd8b and Worker version 8d8cb64c-b87b-4070-abd5-58e9744ee2c9. The subsequent Watch run 37041685495 stopped before production mutation because its older expected version no longer matched. The exact version assertion and fresh rollback capture remain in place.

## Progressive everyday coaching loop — 2 October 2026

Owner instruction: fix the audited issues and close the loop positively and progressively. The finite release adds explicit time, budget and cooking choices; food options selected against those choices; a blocker question after two unhelpful steps; a truthful never-treated mode; preparation for treatment ending; and a first-week orientation based on actual saved actions and feedback. Elapsed days never count as completion. Successful smaller steps are offered at the same size; another step remains a member choice.

An accepted, still-valid action survives weekly reviews and a return after absence. Changing the relevant facts, practical constraints or treatment situation explicitly replaces affected plans. Weekly plans bind to their source action and obsolete plans cannot be accepted. New coach feedback enters the existing aggregate Continuity scorecard with staff/test exclusions and no member free text in the report.

Everyday help requests use the existing `support_tickets` table and existing authenticated HQ support dashboard. No schema is added and no email/push is sent. The member must explicitly share the typed message; coaching records are not attached. Requests have a reference, status, assignment indication and a reopen action after staff closure. Admission is capped at three open requests per member, checked inside SQL. Matched symptoms are routed to the existing professional-help panel instead. This finite boundary is not triage.

The queue is initially unassigned; a staffed response time is not invented. SHIFT must agree coverage, a responsible queue owner and a review routine, then test an actual staffed response. The implementation establishes the handoff and member-visible status, not evidence of human responsiveness. Active staff time cannot be inferred from ticket age and is not reported as such.

The existing privacy/purpose boundaries continue to apply. Support messages are independently and explicitly shared operational records; they remain in the existing support system after coaching deletion, as the UI says. Existing account/data-request processes apply. A withdrawn tracking consent stops personalised coaching; no invisible background or external follow-up is enabled. Owner-authorised engineering acceptance is distinct from independent or clinical review.

The final composition preserves the independently reviewed earlier challenge catalogue from main `0b211140`. That earlier review is historical evidence; the new practical constraints, progress, persistent feedback and support changes are released on the separately recorded exact owner-authorised engineering acceptance. Final local composition: 59 integration/measurement, 307 preserved regression, 8 release-contract and 15 compiled Worker/D1 checks passed; all 87 phantom-browser checks passed, zero browser errors, p95 921.6 ms.

## Homepage delivery prerequisite for the progressive repair

Two guarded attempts of main `c636e2b6` rolled back because homepage Lighthouse median LCP exceeded the unchanged 2.5-second budget (2669.487 ms and 2534.904 ms). The measured LCP is the hero image; the HTML included an 87,120-byte Barlow Condensed font. The new homepage-only delivery projection substitutes a 34,920-byte subset covering the captured page and printable ASCII, preserving font outlines, metrics, hinting and layout closure. Three browser widths produce identical pixels and geometry. The original approved font, copy, styles and imagery remain in their source files. The full response loses 69,600 raw bytes and about 31 KB compressed. This is evidence of reduced payload, not a claim that production speed already passed.

Only the exact known font/CSS pair can be projected and reversed for preservation checks; unknown changes still fail. The projection is source-pinned, and its unit/browser checks are required in hosted CI. The original production speed threshold and rollback checks are retained.

Run `37047576206` timed out after deploying Worker `7204ee91-dc82-4f3f-90ce-ead305baf9ae` while APT installed browser dependencies. Its job-level cancellation skipped the rollback step. The recovery permits only that exact unverified version, that cancelled first attempt and the separately verified run/version; it restores `b9dbe47f-9695-4d2c-b17c-208384a86c37` without changing data, then rechecks the runtime. Unknown or newer runtimes are rejected. Browser preparation and a launch probe now occur before deployment. APT is used only if the existing runner cannot launch the browser; preparation has a three-minute step limit. Live heading verification has a two-minute step limit so failure leaves time for the existing rollback. The 2.5-second LCP limit is unchanged, as Matt reaffirmed at 19:45 BST.

## Fit live verification disclosure repair, 2 October

The final production phone journey in run 37044165909 failed at Fit notes after its five earlier member checks passed. The screenshot shows the saved session and a closed “Adjust your session” disclosure. The verifier previously waited for a visible field without opening its ancestor when the `data-app-fit-setup` marker was absent. The screen composer can reuse an existing disclosure, and a wrapper can appear after the field is attached.

The verification helper now inspects the field’s actual closed ancestor disclosures and clicks an ordinary visible summary, retrying within the existing 45-second limit while the screen settles. It never forces visibility, modifies disclosure state through script, or edits serving presentation. Browser fixtures cover fresh, saved, nested, reused and delayed disclosures. All 14 component browser checks and 69 saved-state, measurement, release and client-proof checks pass locally. This fixes a verification gap; the real signed-in production journey must still pass before that journey is called green. Source pins, medical boundaries, stock, pricing and production rollback remain intact.

Run `37050632949` completed recovery and browser preflight, passed live appearance/preservation, then rolled back on homepage mobile median LCP 2553.242 ms (runs 2732.445, 1994.994 and 2553.242 ms). The next change losslessly packages the same subset as 14,804-byte WOFF2, preserving cmap, metrics, coordinates and hinting. Pixel comparison at all three widths remains identical. This removes another approximately 8.5 KB compressed font payload; the production 2.5-second gate remains unchanged and must pass before success is claimed.

At 20:17 BST Matt explicitly accepted 20% tolerance for timing checks. Homepage LCP retains a 2500ms target and permits up to 3000ms, with the report labelling target-met versus within-tolerance. Prepared-coach p95 retains the accepted 1100ms target and permits up to 1320ms. All functional, safety, privacy, preservation, CLS and TBT checks retain their requirements. Prior failed releases remain failures; only a fresh full release can establish success under this decision.

The latest production source0d6075c5 completed run37053664919 successfully with Worker82df9eb3-dc35-492a-8c62-081c8482c178. All production checks passed; homepage median LCP2182.455ms (individual runs2182.455,2161.3065,3421.302ms), CLS0, TBT0. The next release starts from this exact verified runtime and preserves it as the guarded baseline. Median success does not imply every sampled load or real-user navigation met2.5s.

Final deployment attempt37055286304 stopped before deployment because the preservation normalizer knew only the new WOFF2 payload, while the verified live homepage still contained the earlier exact TTF subset. The normalizer now recognises both source-pinned full-CSS/font pairs and rejects unknown styles, duplicates and mixed fonts. No HTML comparison is skipped. The previous font is used by release checks only; tree shaking must keep it out of the deployed Worker.

## Market entry: earn the difference through useful follow-through — 3 October 2026

The proposition is practical everyday help for ordinary men, during treatment, after treatment and without buying medication. The existing first-week journey, consented memory, smaller-step feedback and different-approach feedback are retained. Neither AI coaching nor long-term support alone is claimed unique. Treatment decisions remain with the prescriber.

This release makes the next operator action concrete:

- After two unhelpful approaches, the member can open the existing everyday-help form directly. Nothing is submitted, shared or attached until the member explicitly sends it.
- Open requests stay above closed history. A request with no recorded update for 48 hours offers a direct contact route and its reference. This is a visibility rule, not a service-level promise, clinical escalation or evidence that staff have replied.
- The authenticated `/v1/hq/continuity?days=90` report adds `firstWeekUsefulStep`: mature first-Today starters who reported at least one saved step helpful in their first seven London calendar days. Missing feedback stays in the denominator, multiple helpful steps count once per member, in-window corrections apply and old/future/late evidence is excluded. This does not establish eating, exercise completion or clinical outcomes.
- The same aggregate report adds `supportFollowThrough`: retained real-member open/unassigned requests and requests with no update for 48 hours, including old work outside the cohort window. Test/staff accounts are excluded using the existing rules. A team-marked closure is not reported as a member-confirmed resolution. No message text, member identity or treatment segment is exposed.

Use the existing prepared 10–15-person pilot in `activation-measurement/pilot-protocol.md`, with a mixture of technical confidence and medication situations. Recruitment is not completed; invitation drafts are not sent. Participant data stays in the approved operational system. No invented volunteers, testimonials, effectiveness results or comparative superiority claims.

Suggested operating sequence: ordinary signup and inbox acceptance; first useful action without assistance; day-seven feedback; mature day-28 return plus whether the step helped. Record barriers, missing follow-ups and prompted versus unprompted visits. Show exact counts with denominators. The existing expansion gate remains unassessed until actual thresholds and real evidence are recorded.

Matt or an appointed operator must own unassigned requests, give an actual reply through an approved contact channel and check whether it resolved the problem. The current queue has no member-visible reply thread or resolution-confirmation record. Shipping these visibility/reporting changes does not close those service gaps. The next product improvement should bind an authorised staff reply and a member-confirmed resolution to the request, with explicit retention, access and live-delivery acceptance. Do not sell monitored support or a response time before staffing and end-to-end evidence exist.

Acquisition should use demonstrated member value: a consented, fictional-account walkthrough of a difficult week and returning after treatment, followed by approved real-member examples when available. Human-help coverage, week-four usefulness, post-treatment engagement and sustainable staff time are the proof needed to strengthen the commercial claim; synthetic tests only verify mechanics. Maintain treatment through Start Here as the core route; elsewhere-treated membership remains the second entrance.

### Deeper practical knowledge and circumstances

`knowledge.mjs` supplies ten fixed guidance modules: balanced ordinary meals, budget, shift work, movement, sore knees, small appetite, food noise, setbacks, treatment boundaries and life afterwards. The action carries the relevant modules from confirmed focus, challenge, budget and treatment mode; the dashboard exposes them under “Useful detail for my situation”. This expands the usefulness of the existing coaching rather than creating new public pages or calling a paid model. Source links and source-check date are displayed. The copy is owner-authorised and builder-verified, not independently clinically reviewed.

Two new confirmed difficulty choices—sore knees and small appetite—add four bounded planning actions. Knee-related movement choices are restricted to suitability questions and practical support, including after an approach is rejected. They do not prescribe exercise therapy. Small-appetite choices organise ordinary meals or reduce preparation; they do not set calories or change medicines. Existing symptom/crisis boundaries, clinical contacts, feedback, account isolation and consent remain required. Source checking does not supply clinical certification. Changed facts/constraints regenerate context under the existing memory rules; accepted unfinished actions and historical feedback remain preserved.

## Something changed — 3 October

Matt agreed to a single member-visible transition route on Today. It handles stopped treatment, a tighter everyday budget, a changed provider/situation, a confirmed appetite difficulty and a changed routine in one revision-protected write. It preserves the goal, reported feedback and excluded unsuccessful approaches. Provider/situation and appetite choices are explicit; a changed routine needs the member's current-week description and produces a smaller step without replacing a saved sore-knee difficulty. Old affected actions cannot be accepted. Matched clinical concerns fail before persistence and use the existing professional-help panel.

The member chooses whether an accepted replacement step receives the existing consented in-app follow-up from tomorrow. Quiet hours, caps and pauses remain enforced. There is no external email/push re-engagement and no prescriber referral is sent. The due follow-up asks whether the step still works or needs to be smaller. This change makes existing continuity mechanics directly discoverable; it does not establish real-member usefulness or physical native-app acceptance.

Local checks: 61 session/SQLite integration checks and 317 preserved member/auth/Journey/layout/footer checks pass. The rendered browser proof exercises all five transition choices and reload persistence. Exact-source hosted gates and guarded production/live verification remain required before any live claim.
