# Shift AI: bounded coaching release review

Prepared 2 October 2026. This is an engineering assessment and a proposed controller decision, not a recorded approval or independent acceptance.

## Exact scope and authority

The first candidate was based on `7a02f42a58a7992ce4728d9fd91808f2654f7cdf`, head `aab02b588f231fcf04aea3be40203e929cbe71de`, draft PR #935. This review reconciles its additions with recorded main `fff6a5cae91e9fdb8a778d6ccf8f6d363e34a21b`. Existing source, production configuration, deployment workflow and database schema remain unchanged.

Matt has explicitly requested live availability. That authorises work towards launch. It does not supply missing supplier facts, create an independent reviewer, or turn this partial implementation into the complete v2 product. The saved No-Partner Amendment retains privacy, intended-purpose and independent-evidence gates before real use.

Existing Ask Timber is already live. Production run 36991043036 passed and deployed Worker version `53f0bf4a-6d3d-4c6c-b18e-0ff3d8ec64df`. Its context/memory flags were true. That is separate from this new coaching component. Fresh generated answers in that run took 2,680–7,012ms to finish; cached public answers took 202–287ms. Those figures do not establish a universal subsecond chat response.

The proposed bounded addition offers one prepared everyday action, accept/decline, four feedback outcomes, editable confirmed context, optional background preparation inside My Timber, a weekly personal rating and a prepared weekly plan. It uses six fixed action types. It makes no model calls, trains no model, sends no external notifications and writes no calendar entries. Calendar, devices, validated pattern detection and the full My Journey-only onboarding are incomplete. A bounded release would require an explicit change to the complete-v2 launch scope.

## Intended purpose and clinical boundary

Proposed purpose: help adult members organise and review ordinary meals, enjoyable movement and personal weekly reflection using goals and working-week information they confirm. There is no intended diagnosis, symptom assessment, treatment recommendation, prescribing, dose adjustment, tapering, restart advice or automated clinical decision. Prescription situation changes the framing, not medicine instructions.

A fixed help panel is always available. Finite input checks reject some medicine, crisis, eating-concern and under-age wording before it enters coaching memory. These checks are not validated triage and cannot guarantee that every concerning phrase is detected. Nobody receives or monitors these messages through this feature. Storing a record is not a hand-off.

Preliminary classification inference: this bounded everyday-planning purpose is closer to general wellbeing software than software intended to inform treatment. This is not an MHRA determination. Intended purpose must be assessed across public claims, instructions and technical behaviour; a disclaimer alone does not decide classification. Great Britain and Northern Ireland must both be considered before a UK-wide decision is recorded.

Source: [MHRA software guidance](https://www.gov.uk/government/publications/medical-devices-software-applications-apps), including the linked standalone-software guidance, reviewed 2 October. Any later symptom scoring, clinical pattern interpretation or medicine intervention reopens this assessment.

## Existing privacy record and proposed extension

The current public privacy page identifies Shift Some Timber Ltd as controller and describes optional consent-led health tracking and personalisation. The existing consent checkbox names personalisation. Its wording and version are preserved. Those observations support the proposed purpose mapping; they do not prove that a completed controller decision exists.

The saved V42N DPIA, dated 18 August, was read in full. It records a proposed Article 6 consent and Article 9 explicit-consent model and leaves controller approval, processor/transfer details and retention decisions open. Its earlier self-service-erasure engineering gap is now addressed by the existing health-erasure route and locally checked integration. Its unresolved governance entries have not been silently marked passed.

Sources: [current privacy page](https://shiftsometimber.co.uk/privacy), [data governance](https://shiftsometimber.co.uk/data-governance), and `SHIFT-SOME-TIMBER-V42N-DPIA-DATA-GOVERNANCE.md` (`libfile_833977057a408191b4e7f636055a075f`).

## Data flow and minimisation

| Item | Processing and control |
| --- | --- |
| Account/session | Existing cookie authentication resolves the member. Requests cannot supply another member ID. No authentication changes. |
| Coaching inputs | Member-confirmed goal, working week and focus; stage, prescription situation, selected Life Back components and weekly rating. Free text is limited to 240 characters per fact. |
| Outcomes | Accepted/declined actions and whether an action helped, did not help, did not fit or was not tried. Used to choose from the fixed library. |
| Saved store | Existing D1 `member_state.preferences.lifeBack.progress.shiftAI`. No new database or external processor. |
| Derived data | Prepared actions, weekly plans and in-app follow-up queue in the same snapshot. No invented health measurements or inferred facts. |
| Audit | Decision type, time, outcome and reference IDs. No copied health text in a separate audit store or new console logs. |
| External sources | Calendar, scale, wearable, voice, photos and location are not read. External source permissions stay off. |
| Inference | No coaching data is sent to a model. The separate existing Ask Timber service is unchanged and is outside this addition's inference claim. |

Writes recheck the latest health-consent record and share Life Back's revision. A consent ID fences each snapshot: withdrawal and subsequent regrant cannot revive old context. Parent revision checks prevent stale tabs, concurrent profile writes or in-flight deletion races from restoring old coaching memory.

Consent withdrawal stops context use and new saves; it does not itself erase historical records. The member can erase coaching alone or use existing whole-health-history erasure. Existing member export includes the snapshot. These controls have synthetic-store evidence; production rights handling and backup deletion have not been newly verified.

## Retention, deletion and processing location

Proposed working rule for this bounded addition: confirmed context, outcomes and plans stay until the member deletes them or the account data is erased, matching the current public tracking rule. Audit and night-run history older than 90 days is pruned at the next mutation. That is not a guaranteed nightly deletion deadline. Dormant-account lifecycle and backup retention require an actual operational record.

Deleting one confirmed item removes dependent actions, plans, queued prompts and related references. Deleting all coaching removes the entire snapshot and advances the parent revision. No promise is made that this deletes unrelated security records or immediately deletes infrastructure backups.

Cloudflare is the existing runtime/database supplier. This change adds no supplier or paid service. Its actual account contract, subprocessors, configured data locations, transfer safeguards, backup retention and staff-access controls must be evidenced in the controller's register. These business facts cannot be established from a source diff or public vendor terms alone.

## Risk review

These are assessed risks, not certified scores.

| Risk | Implemented mitigation | Remaining evidence |
| --- | --- | --- |
| Another account reads health context | Original session checks, identity rejection, private no-store responses, synthetic account isolation | Independent security/interaction review |
| Stale or withdrawn context still drives an action | Consent-ID fence, revision check, dependent cancellation, refresh when returning to Today | Independent review of full consent lifecycle |
| A hidden tab consumes a follow-up | Visibility-based acknowledgement; quiet hours and caps checked server-side | Full-page synthetic interaction proof; independent acceptance pending |
| Medical concern is mistaken for coaching | Fixed ordinary-action library, finite input boundary, permanently available official help, no implied monitoring | Boundary limitations remain; no claim of universal detection |
| Incorrect memory creates inappropriate advice | Confirmed facts only, displayed reasons, correction/deletion, no diagnosis or medical measurement inference | Independent relevance/voice review |
| Sensitive input leaks into telemetry | Coaching client sends inputs only to its account endpoint; existing analytics filtering preserved | Production and opted-in analytics payload inspection not completed here |
| Excess retention | User erasure, bounded snapshot, disclosed mutation-based audit pruning | Processor/backups and dormant-account schedule unresolved |
| Feature disappears at the next deploy | Separate wrapper is prepared, but production entrypoint is unchanged | Durable integration into the ordinary guarded deployment remains to be implemented |

## Review and launch decision

ICO guidance permits an organisation to allocate DPIA work internally; outsourcing is optional. It calls for the assessment to inform design, mitigation and accountable sign-off. Unresolved high residual risks require the appropriate further process, rather than a fabricated pass. Source: [ICO DPIA process](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/how-do-we-do-a-dpia/), reviewed 2 October.

No paid partner, mandatory outsourced assessor or staffed clinical inbox is proposed. The remaining decision is not another generic permission to deploy. It is whether Matt adopts this bounded scope and its purpose/privacy decisions, supplies the unresolved account governance facts, and changes the original complete-v2/independent-acceptance launch condition. The present work order still requires independent evidence; a builder cannot certify himself as its independent reviewer.

Status: **not approved for real-member use**. Formal criteria 1–39 retain their earlier BLOCKED status. This review adds evidence without rewriting earlier entries. Live promotion and its rollback proof have not run. Existing full-member production acceptance currently also contains two observed failures: mobile Fit disclosure in run 36991756785 and chosen-meal rendering in run 36991756688. Their causes have not been established. Neither is relabelled a coaching regression or an acceptable pass.


## Proposed bounded-release decision — 2 October, updated after final rendered review

This addendum supersedes the earlier engineering-status statements above. The normal production entrypoint now includes the wrapper. Hosted run 37021460449 passed compiled Worker/D1 checks, eight component interactions and seven full-current-page interactions. Independent AI engineering review inspected source, rendered screenshots and stored results, including account separation, changed action type after unhelpful feedback, memory corrections, consent withdrawal and active-session expiry. It is not human, clinical or controller certification. The measured full-page p95 remains 1820ms against the original 1000ms target; Matt subsequently instructed launch with that result disclosed. Full v2 is not approved or represented as complete.

The proposed purpose remains adult members' ordinary food, movement and weekly reflection planning, available independently of a treatment purchase. It must not be promoted as managing a diagnosed condition, assessing symptoms, changing treatment, or monitoring clinical safety. No clinical benefit is established. Internal classification inference for this fixed action library is general wellbeing software, based on actual function and intended claims; it is not MHRA approval. Current MHRA guidance on standalone software distinguishes general fitness/health/wellbeing from medical purpose. Any future treatment or symptom decision function requires reassessment. Sources reviewed 2 October: https://www.gov.uk/government/publications/medical-devices-software-applications-apps and https://assets.publishing.service.gov.uk/media/64a7d22d7a4c230013bba33c/Medical_device_stand-alone_software_including_apps__including_IVDMDs_.pdf.

Concrete proposed privacy decision: use the existing optional, versioned health/personalisation consent and existing member account/Cloudflare store; add no processor or model service. Confirmed coaching facts and outcomes remain until the member deletes them or uses health-data erasure. Audit history over 90 days is pruned on the next mutation; this is not a guaranteed daily purge. Consent withdrawal prevents use/display and invalidates prior consent context; it does not represent immediate deletion of every retained record. The feature exposes correction and deletion controls and records no new personal data in external analytics by its own code.

Outstanding controller facts remain the existing Cloudflare contract/processor/transfer register, operational backup retention and dormant-account retention. No actual contractual or backup setting has been inferred from public terms. The controller must either evidence these arrangements or explicitly decide whether the bounded launch can proceed with these existing-platform uncertainties and the disclosed retention above. A generic engineering request has not been recorded as that decision. Proposed decision owner: Matt, acting for Shift Some Timber Ltd. Decision: pending explicit adoption of this purpose, retention and residual-risk assessment.

### Progressive-loop delta, 2 October 2026

The owner requested correction of the service audit. New structured choices cover everyday time, food budget and cooking facilities; no condition, diagnosis or medication change is inferred. These choices live in the consent-bound existing coaching snapshot and are removed with that snapshot. Their identifier participates in action validity. First-week orientation reports actual saved feedback and never imputes completion from time.

A member can explicitly send a typed everyday-help message to the existing SHIFT HQ support queue. The UI explains destination, lack of an urgent/clinical service or response-time promise, and separate support-record retention. It does not attach the coach's memory. Authenticated account ownership, same-origin restrictions, bounded input, current consent, idempotence and an atomic admission cap apply. The existing table, existing HQ staff permissions and account/data-request infrastructure are reused. No new external recipient, notification, model provider or dataset is introduced. The clinical partner continues to own treatment decisions. Staff coverage and genuine service response remain operational evidence to establish; builder tests do not supply clinical review or independent acceptance.
