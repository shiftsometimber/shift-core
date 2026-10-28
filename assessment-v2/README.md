# Compact pre-purchase assessment — corrected 28 October 2026

## Controlling content and correction

Matt explicitly removed measurement-date/method questions and requested restoration of the previously agreed grouped medical conditions, medical history and medicine lists. The preceding `cbf495b` implementation used the superseded 20 October 64-question expansion. Its questionnaire content was a regression and is superseded by this correction. The questionnaire-before-purchase progression remains.

The controlling question source is `shift-compact-v5-draft-2026-10-23`, recovered from the saved private clinical workspace v0.7 (version 9), corroborated by the 24 October clinical readiness pack. `compact-v5-reference.json` preserves that exact questionnaire. The restored sections, wording, items, answer options and conditional detail prompts match it exactly. The sole addition is the 28 October starting-treatment weight field for continuation paths, with structured units and an explicit unknown option. No measurement date or method is requested, including for starting weight.

Current schema: `shift-compact-v5-prepurchase-draft-2026-10-28`. It contains 31 entries, including conditional follow-ups; ordinary identity/contact, measurements and previous medicine/dose/date fields remain separate. This is still a draft for clinical approval, not an approved service.

## Implemented

- Medical conditions appear together as one checkbox list with mutually exclusive None of the above.
- Medical history and both medicine groups display the agreed full lists and one shared conditional detail field per group. No separate question and follow-up for each listed condition is rendered.
- Allergies, relevant reproductive safety questions, urgent symptoms, GP sharing and treatment confirmations retain the compact source wording and conditional prompts.
- Extra measurement dates/method, highest-weight/weight-history essays, previous-approach essays, goals essay, repeated per-condition history and duplicate generic condition/medicine summaries are removed from the customer form.
- The two older transport summary fields are derived from the grouped responses and explicitly point to the complete versioned answers. The full grouped answers are forwarded unchanged; details are not silently discarded.
- The medicine preference remains the selected variant and appears in the review; no new preference essay is requested.
- Sequence: complete questionnaire, review answers, GP/evidence checks, treatment-request/purchase review. Missing answers prevent progression and edits invalidate review. Empty continuation-only sections are skipped for new starters.
- Metric/imperial current and starting-weight controls remain. GP/evidence permissions remain separate and unticked; a No/Not sure sharing choice is retained for clinical discussion and cannot be converted to positive consent by the older transport.
- The new version is shared by the generated member/front-door scripts and server validator. An older schema/version cannot silently pass as the compact form. The provider-contract gate must explicitly accept the new version before real submission is possible; no environment or provider setting is enabled here.
- Both self-contained walkthroughs are regenerated from the same source. Styles keep the approved black, cream and ash-green palette. No payment, prescribing, clinical notification, stock, price, homepage or unrelated My Timber functionality is activated or modified.

## Verification and current state

52 tests pass: offline DOM integration against the actual generated HTML/client/runtime, exact compact-reference/content regression checks, conditional/uncertainty/checkbox behaviour, all four request routes, review invalidation, email and GP-sharing gates, unit conversion, and existing real-SQL same-case/anti-replay/payment/transport safeguards. The checkbox test caught an event-order issue during correction; the target updates its canonical value on input before host refresh, and the complete suite then passed. Syntax and diff checks pass.

## Guided visual design — 28 October 2026

The first spacing correction did not sufficiently change the document-like presentation. The latest review preview uses an open question canvas beside a dark progress rail, larger section typography and ash-green chapter numbers. Treatment requests are four illustrated radio cards. Short clinical answers are visible radio choices rather than repeated native dropdowns; longer answers wrap fully in cards. These controls use native radio grouping and keyboard interaction, retain every exact schema option, and synchronise with the same canonical assessment answers. UI-only radio names are removed before transport and omitted from the prescriber identity summary. Uncertainty is retained, conditional details remain conditional, and no question, clinical option, grouped list, validation rule or purchase gate changes.

The opening is shorter. The three-stage pathway uses connected circular markers, navigation and selected states have stronger contrast, and section changes use a brief fade/vertical movement. Reduced-motion settings remove animations and transitions. Mobile has its own visible completion strip and section selector. There is no automatic answer advance or claimed clinical approval. The approved palette remains exactly black, cream and ash green; no external fonts or images are fetched.

Native text/date/unit selectors keep 60px controls and 16px top/bottom padding. Answer cards use content-driven height, so longer options remain visible. Card headings remain in the document flow with accessible legends, rather than clipped native fieldset captions. Member and front-door forms share the same styling, runtime and intake client; generated standalone copies are identical.

Verified in the supported cloud Chromium preview: treatment card selection; keyboard arrow navigation; Yes/No controls; blocked empty review; all four fictional request paths through review to GP/evidence; disabled payment; 390px and 320px iframe layouts without horizontal overflow; and visible selected states. The 52-test suite covers canonical question/reference identity, real DOM card clicks and reset, conditional details and uncertainty, grouped condition exclusivity, review invalidation, account/GP gates, unit conversions and existing SQL/transport/payment safeguards. `review/assessment-guided-overview-20261028.jpg` and `review/assessment-guided-mobile-20261028.jpg` show actual rendered layouts. This is responsive Chromium QA, not physical-device or Safari acceptance. The authenticated provider/upload flow has not been browser-accepted or activated.

## Published public walkthrough — 28 October 2026

Matt approved the guided design and explicitly requested deployment. After automatic review required separate permission to publish the source to the public repository, Matt explicitly authorised that publication. Exact approved tree `3152fe90251679a396857eecfd74135210664dcf` is published as `b511f05809923da1d9fd74d45f844594e5e8d76b` on `feature/prepurchase-assessment-20261028`.

The approved fictional walkthrough is live at https://shiftsometimber.co.uk/assessment-walkthrough. Production Pages deployment `e128f7ac-b439-4bfb-b66a-c27fb3af224a` succeeded at 21:47 UTC. GitHub Actions run `40774854353` completed successfully and verified production at 21:48 UTC. Its admitted preview was `e6610682-0e03-4b27-a66d-6240ab9af575`, from successful stage run `40773622240` at source `4847790772cd53ffd10d32c78d77f459ba64b003`.

Only the existing `/assessment-walkthrough.html` Pages asset changed. The other 859 manifest assets, including `/index.html`, were retained byte for byte. Live homepage, Start Here, Health testing, My Timber and `/treatment-assessment` response hashes matched their pre-publication baselines. The finite release did not write Workers, routes, bindings, patient data, stock, prices or payment settings. Its production baseline is `bf87f7b6-467c-4553-9784-ee1910ba44ae`; rollback was unnecessary. Do not replay this one-time publication against a newer baseline.

The hosted preview passed 865 effective header contract comparisons. Its exact approved HTML SHA256 is `6e2dbb9d649f4c1074baa75f51ca60c9576108e330f005ac16b9c077ed8e3a66`. Live HTML includes the unchanged Core shell, so its response hash differs from the underlying asset. Hosted browser checks verified the approved desktop design, blocked empty review, a complete fictional starting case, grouped conditions/history/medicines in the full review, progression to GP/evidence, and disabled payment. The public production URL was then opened and visually checked. `review/assessment-guided-live-20261028.jpg` records that actual live page. Earlier 390px/320px Chromium review covers the identical approved source; no physical iPhone/Safari acceptance is claimed.

Ten finite release-guard tests and the existing 52 form/DOM/schema/SQL checks pass. Receipts, both manifests, browser admission and verification results are retained in `deployment/evidence-20261028/`. The original 865-contract detail is in Actions artifact `12853014919`, SHA256 `e2cd79020e6488ac44b162917ad4bd7ebdfe6b1a18f774644dcedc205e1980f1`; a compact summary and its original content hash are retained here.

This release publishes the approved fictional walkthrough. Authenticated clinical-entry/backend activation and its provider acceptance remain separately gated. Orders, payments, prescribing activation and stock remain closed. No email or other external message was sent.
