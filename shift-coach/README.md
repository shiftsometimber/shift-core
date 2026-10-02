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
