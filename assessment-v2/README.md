# Expanded treatment assessment — 20 October 2026

This is the candidate implementation requested by Matt for the Health Finder Pro / Prescriptr discussion. It is not clinical approval or evidence of a connected provider API.

- 64 additional questions, in eight sections, share one versioned schema across the member form, walkthrough and server validator.
- Starting, switching, restarting and repeat requests have conditional questions. “Not sure” opens a detail prompt where relevant.
- Existing account, contact, DOB, measurements, insulin service boundary, GP, consent and evidence requirements remain. Identity and BMI still need independent verification; images alone do not establish either.
- The member can express a preference. A prescribing clinician must decide the medicine and dose with the member. No automated prescribing or dose recommendation was added.
- An expanded submission requires `PHARMACY_ASSESSMENT_VERSION=shift-assessment-v2-2026-10-20`, alongside the existing configured secure endpoint and secret. Set this version only after the commissioned provider approves the question set, its clinical routing and the complete data contract. With the v2 version configured, missing expanded answers cannot bypass the server validator.
- The existing transient partner payload now carries `expandedAssessment`, `questionnaireVersion`, `selectionIsPreference=true` and `prescribingApproval=pending`. The partner must map the schema's question IDs into its clinician case view and confirm receipt of the whole case. No health answers or image bytes are added to SHIFT's database or browser storage.
- Submission identity includes the complete expanded answers. Changed-answer replays cannot silently replace an existing submission. Status, account isolation and same-case clarification remain in the original transport.
- No fee, payment deduction or clinical integration is activated. Customer copy states the prescription approval requirement and current closed-ordering position. Unresolved fee and supplier decisions are kept in internal implementation records; they must not appear as instructions to ourselves on customer screens.

## Build and review

Run `node assessment-v2/build.mjs` after editing the schema or browser runtime. This regenerates both copies of the question script and the self-contained walkthrough. The proposed production route is `/assessment-walkthrough`; the account-gated assessment remains `/treatment-assessment`.

The existing private medicine-front-door preview was updated, preserving its identity and owner-only audience. Its `/assessment-walkthrough.html` presents fictional cases without any clinical, payment, upload or provider requests. It is a demonstration, not main-site deployment.

Evidence: 102 relevant server, real SQLite, commerce, privacy and existing trust tests passed on the shared source baseline; 24 existing assessment browser cases passed; 15 walkthrough cases passed across desktop/mobile-width Chromium and mobile-width WebKit. These are synthetic checks, not partner acceptance or physical-device testing. The final walkthrough change added section selection and the proposed fee terms, then passed the 15 cases again.

## Provider decisions still required

Confirm the legal prescribing entity, named clinician/regulator, dispensing pharmacy and allocation of responsibilities; the actual API owner, documentation, sandbox credentials, authentication, full payload mapping, receipt/status/clarification contract; prices and any assessment/administration fee; health-data notices and responsibilities; clinical approval of all questions, urgent routing, switching/restart and repeat protocols, independent measurement/identity verification, GP contact, evidence uploads, consultation and monitoring.

The main-site candidate must be admitted after the existing shared Core/diary release through the current guarded release process. It must retain all previously accepted functionality, GP configuration, stock/payment restrictions and the homepage. The historical 16 October questionnaire release must not be rerun against its obsolete predecessor.

## Sources checked

- [GPhC distance services guidance, February 2025](https://assets.pharmacyregulation.org/files/2025-02/gphc-guidance-registered-pharmacies-providing-pharmacy-services-distance-february-2025.pdf), especially preference before consultation, two-way communication and independent checks.
- [Mounjaro UK product information](https://www.medicines.org.uk/emc/product/15481/smpc).
- [Wegovy UK product information](https://www.medicines.org.uk/emc/product/13799/smpc).
- [MHRA GLP-1 medicines information](https://www.gov.uk/government/publications/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know).
- [ASA prescription-only medicine websites guidance](https://www.asa.org.uk/advice-online/health-prescription-only-medicines-websites.html). Preference wording is not a substitute for advertising compliance.
- [CMA fair contract guidance](https://www.gov.uk/guidance/writing-a-fair-contract-for-customers). A fee is not made fair merely by mentioning it in terms.

## 20 October follow-up — oral options and customer copy

Matt requested oral options, verified pricing, all items remaining OOS, and removal of internal instructions/unfinished decisions from customer-facing pages. He then assigned the wider website copy review to a separate chat, explicitly preserving this Health Finder call work. No site-wide rewrite or competing release process was started here.

The existing private preview now includes Wegovy tablets, Foundayo tablets and Orlistat capsules alongside the two weekly injections and the existing catalogue's liraglutide option. All 29 variant prices match the public SHIFT retail catalogue read on 20 October; every route remains OOS and checkout is disabled. No supplier cost was converted into an invented selling price. The selected fictional medicine and strength/pack carry into the assessment and pending handover through an URL fragment, without browser storage or clinical network requests. The 64-question schema and backend contract are unchanged.

Unfinished fee instructions, API sign-off reminders, proposed-terms labels and production-photography notes were removed from the member-facing call version. The corresponding main-site candidate includes treatment-page wording and the existing terms/refunds routes; the wider site's remaining pages are explicitly outside this chat's follow-up scope. Medical warnings, prescribing responsibility, actual availability and statutory rights remain. Fee decisions remain internal and no deduction is enabled.

Verification: 18 product-to-assessment browser flows passed across phone/desktop Chromium and phone-width WebKit, checking all 29 prices against a separate live-catalogue capture, all OOS statuses, disabled checkout, oral illustrations, no horizontal overflow and preference in the prescriber handover. The expanded assessment's 24 browser cases passed, including three oral preferences across the same engines. A 23-pixel mobile overflow caused by the capsule pack selector was corrected and the full 18-flow set passed afterwards; failed evidence retained. 41 directly relevant copy, trust, front-door and intake continuity checks passed. The earlier unchanged server/SQLite/commerce evidence remains valid; these are synthetic checks, not partner or physical-device acceptance.

Private preview source d8bb0a39fd3acf344baba1f4f1d9d248580b93f7 was published successfully in deployment appgdep_6ad73ff6ba38819188f4a52b4fcac33e. Audience remains owner-private. Main Core production release is still a separate, open delivery dependency.
