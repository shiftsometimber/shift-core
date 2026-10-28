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

## Deployment request and automatic publication block

Matt approved the guided design and explicitly requested deployment on 28 October 2026. The approved implementation is `0b2bcbe69af2587335f3ecb73f1fff0325640e46`; its 52 tests pass and its desktop/narrow-width review evidence is retained.

Automatic approval review rejected `git push origin HEAD:refs/heads/feature/prepurchase-assessment-20261028`: deployment approval was not accepted as explicit permission for publishing this source to a public GitHub repository. No alternate tool, remote-device push, API upload or other workaround was attempted. A subsequent GitHub branch search returned no matching remote branch. Explicit permission for that public source publication is now the next user decision; design/deployment approval itself is already recorded.

Read-only live checks show the existing public walkthrough still carries the 20 October schema, the old clinical stylesheet is still served, and the expanded runtime URL returns 404. The new Health testing service is live and must be preserved. The Mac source link and the retained task’s Git link still point into an absent source repository. These are current observations, not reasons to restore retired checkouts or bypass release controls. The old branch and its historical pinned release helpers must not be deployed over current production as a whole-site release.

`release-candidate-20261028.json` records exact file hashes, the publication rejection, live baseline observations and the next scoped release action. No production, routes, bindings, clinical/provider activation, payment, stock or communication settings were changed. After explicit source-publication permission, reconcile the current serving source and use the existing scoped deployment/rollback workflow. Clinical/provider approval remains separate from publication of this reviewed design.
