# Pharmacy → My Timber integration contract V1

The 29 October 2026 shared prescription receipt stages and provisional callback contract are specified in [PRESCRIPTION-WORKFLOW-V1.md](PRESCRIPTION-WORKFLOW-V1.md). New workflow-version-1 orders require signed, sent and pharmacy-received confirmations before dispensing.

Medicines must remain out of stock until this contract has passed against the chosen pharmacy and live-mode Stripe configuration.

## Member journey

1. A verified My Timber member chooses an available treatment variant. Stock and partner configuration remain server-controlled.
2. Before payment, the member completes the clinical intake, GP details, consent and required identity/body-image uploads.
3. SHIFT forwards the intake to the configured pharmacy endpoint. A pharmacy verification result issues a short-lived token bound to the member and selected variant; an outstanding review does not open payment.
4. The member returns to the selected variant and may continue to Stripe only with a valid verification token and available stock.
5. The Stripe webhook moves a paid order to `assessment_pending`. Identity/intake verification is not a prescribing approval.
6. The pharmacy updates the order's clinical state through the authenticated integration endpoint.
7. My Timber shows the latest state without exposing clinical answers.
8. `approved` makes the two-minute My Journey essentials mandatory before weekly treatment support and reordering unlock.
9. The member continues with weekly Journey check-ins.
10. Reorder becomes available only after `fulfilled`, the Journey setup is complete and the pharmacy-provided eligibility date has arrived.

## Questionnaire coverage and integration evidence — 16 October 2026

This is an engineering source review, not a clinical approval or a claim that a particular partner's API is connected. The source reviewed was main `3ab4dc5f8f47e44108f3f6d5503ffbac90b6adef`. The bounded corrections do not activate stock, payments or a clinical service. Original prepared commit `495e865009674b8a801e7176fc5f5362d7134f57` is preserved as the parent; main remained `3ab4dc5f8f47e44108f3f6d5503ffbac90b6adef` at reconciliation, with no subsequent overlapping questionnaire changes. The original 29 checks were rerun successfully before extension (receipt `prepared-29.tap`).

| Area | Current implementation | Remaining acceptance |
| --- | --- | --- |
| Age, measurements and service eligibility | Date of birth, height, weight, weight-related-condition answer and the injection-service insulin question; server-side age, BMI and service checks. | The prescriber specifies and independently verifies the evidence needed. Uploaded photographs do not themselves prove BMI verification. |
| Medical history and medicines | Required general conditions and medicines text boxes. Text beyond the existing 1,000-character transport limit is rejected before any pharmacy call, rather than silently truncated. | There is no demonstrated partner-approved structured question set. Agree required allergy, relevant-history, current-symptom, tolerability and follow-up coverage with the prescriber. These are coverage categories, not an approved question set. Confirm that answer-size limits can hold the full history; never omit relevant facts to fit a field. |
| Previous treatment | Yes/no choice; medicine, dose and last-dose date when yes. This change enforces those existing requirements on the server, checks a real non-future date, and clears stale previous-treatment values when no. | Agree the partner's evidence requirements for new, switching and repeat patients, including evidence of prior supply where applicable. |
| GP and consent | GP name, practice, address, postcode, GP-contact consent, image-sharing consent, answer confirmation and consent version are forwarded. The payload also has optional GP-phone/NHS-number fields. | Agree identifiers, data-sharing roles, consent wording and the exact provider fields. No verified GP contact or records access is inferred merely from collecting details. |
| Identity and images | Required photo ID plus clothed front/side images are validated for declared file type and size and forwarded to the pharmacy. SHIFT records a manifest/reference rather than the uploaded image files. | Identity matching, genuine file validation and the pharmacy's independent verification process require partner acceptance. |
| Patient/contact mapping | The intake includes the internal member reference. The authenticated member lookup has name/email, but this intake payload does not explicitly forward name, email, phone or address. | Specify patient creation/lookup and identifiers in the actual partner API; prove that the clinician can reliably resolve the patient and make necessary contact. Do not assume an internal SHIFT ID is meaningful to the provider. |
| Dose and navigation continuity | The selected variant is carried into verification and restored on return; return navigation remains on the same origin. | Prove the complete browser journey on the deployed Pages/Worker asset versions. The API token remains bound to the member and variant. |
| More information and resuming | Pending verification is polled in-page. `more_information_required` and `declined` statuses exist. | A complete secure clarification/resubmission route and durable resume-after-refresh/reopen behaviour are not demonstrated by this implementation. A status label is not a working clinician-patient conversation. |
| API reliability | A configurable pharmacy URL and bearer credential are present; order status transitions have a defined state machine. | Map the actual partner authentication/schema. Prove bounded timeouts, safe duplicate handling, failure recovery, correlation/audit and attachment acceptance in the partner sandbox. Generic intake calls currently do not demonstrate those guarantees. |
| Repeat monitoring | My Journey, treatment status and reorder eligibility exist. | A partner-approved repeat assessment and clinical monitoring process remain separate from lifestyle/member check-ins. |

### Clinical communication and verification boundary

The objective is to reduce avoidable chasing and repeated entry while preserving appropriate clinical contact. Do not promise that no prescriber contact will be needed.

GPhC distance-services guidance requires a means of timely two-way communication. It also states that weight-management prescribing must not rely on questionnaire information alone and requires independent verification of weight, height and/or BMI.

Primary source: [GPhC guidance for registered pharmacies providing pharmacy services at a distance, February 2025](https://assets.pharmacyregulation.org/files/2025-02/gphc-guidance-registered-pharmacies-providing-pharmacy-services-distance-february-2025.pdf), sections 4.1/4.2, particularly pages 17 and 24–25.

### Evidence for the bounded correction

- The original medicine suite passed 13/13 before this change.
- A new 16-case behavioural regression suite reproduced 14 failures on the unchanged source, including absent previous-treatment validation, hidden stale details, variant loss and an off-origin backslash return.
- The unchanged original suite plus the new behavioural suite pass 29/29 after the correction. Tests use synthetic members, images and a fake pharmacy; no real clinical information or partner requests are used.
- The assessment files under `frontend/member/` are the Worker-served assets and must remain byte-identical to the `frontend/medicine-front-door/` source copies.
- These receipts establish bounded local code behaviour only. They do not establish full release qualification, deployment, a rendered live journey, a pharmacy sandbox journey or clinical approval.

## Pharmacy status endpoint

`POST /v1/integrations/pharmacy/treatment-status`

Authentication: `Authorization: Bearer <PHARMACY_INTEGRATION_SECRET>`

Payload:

```json
{
  "orderNumber": "SST-…",
  "status": "approved",
  "reasonCode": "approved_standard",
  "reorderEligibleAt": "2026-10-02T09:00:00.000Z"
}
```

`reasonCode` is optional, controlled and machine-readable. Do not send symptoms, assessment answers or free-text clinical notes to this endpoint.

Allowed states:

- `assessment_pending`
- `more_information_required`
- `approved`
- `declined`
- `refund_pending`
- `refunded`
- `prescription_signed`
- `sent_to_pharmacy`
- `pharmacy_received`
- `dispensing`
- `dispatched`
- `fulfilled`

The server rejects skipped or backwards transitions. Repeated delivery of the current state is idempotent.

## Member endpoints

- `GET /v1/treatment/orders` — authenticated member treatment timeline.
- `POST /v1/treatment/journey-setup-complete` — confirms that the server-validated Journey essentials are complete.

## My Journey essentials

The mandatory gate requires:

- start date;
- starting weight;
- current weight;
- target weight or maintenance band.

Measurements are controlled dropdowns in the member UI. Optional football, boxing, F1, rugby, activity, food, drink and apparel preferences use controlled choices with `Not applicable / no preference` and `Prefer not to say` options.

Injury and ongoing-condition categories are optional My Timber context. They require an explicit “use this to personalise support” choice, are not pharmacy assessment answers and are discarded when that choice is off.

## Pre-sale acceptance gate

- Test successful payment → pending assessment → approval → Journey setup → weekly check-in → eligible reorder.
- Test more-information-required → resubmitted → approval.
- Test decline → refund pending → refunded.
- Test failed and expired Stripe sessions.
- Prove an unverified or signed-out user cannot order.
- Prove one member cannot see or reorder another member’s order.
- Prove invalid state jumps are rejected.
- Prove duplicate Stripe and pharmacy callbacks are harmless.
- Complete iPhone Safari and desktop Chrome/Safari acceptance.
- Restore every medicine’s stock and reserved quantities to zero after testing.


## Extended engineering contract — 16 October 2026

**Status:** implemented in the existing questionnaire branch; local synthetic evidence only until the release and live rows below are completed. This is SHIFT's provisional `shift-pharmacy-handover-v2-2026-10-16` contract, not a Phlo, Blueco, Onescript, Molecule or other partner API adapter. No chosen prescriber, partner-approved questionnaire, SHIFT-specific OpenAPI specification, sandbox credentials or genuine partner test was recovered. The existing 14 October foundation ZIP (`libfile_c985b3427a7881919546fdfb1067824c`) was read: its five service profiles and 49 checks explicitly describe offline, unselected, unagreed working assumptions. They are preserved; none is promoted to clinical approval. The public Phlo documentation URL could not be read through the web reader; no authentication or schema is inferred from it.

### Field-by-field map

All health answers and files are forwarded transiently over HTTPS to the configured provider; SHIFT stores references, consent metadata and attachment hashes, not the answers or image bytes. Provider destination names below are **proposed SHIFT transport names**. Each actual partner field remains unconfirmed.

| Visible question/input | Condition and server validation | Proposed transmitted field | SHIFT storage / destination gap |
| --- | --- | --- | --- |
| Treatment and dose selection | Positive variant ID; authoritative medicine/strength/provider, current stock and existing service eligibility checked server-side | `variantId`, `medicineName`, `strengthLabel`, `providerReference` | Intake member/variant/reference. Partner product catalogue IDs and dose codes required. |
| First and last name | Required administrative text; 100 characters each, no control characters. Existing account names reused only when a field is absent, never when deliberately blank. | `patientFirstName`, `patientLastName` | Not copied into assessment storage. Partner legal-name/identity-match requirements required. |
| Account email | Authenticated, verified account email, ignoring any client-supplied email | `patientEmail` | Existing account only. Partner create/lookup/matching fields required. |
| Phone | Required; existing member-contact format and 50-character limit | `patientPhone` | Not separately stored here. Partner contact-verification/channel requirements required. |
| Address lines, town, postcode | Line 1, town and postcode required; line 2 optional; exact bounded text, no truncation | `patientAddress1`, `patientAddress2`, `patientTown`, `patientPostcode` | Contact details can be reused after authentication through an explicit member request; GP details retain their separate confirmation. Delivery-versus-patient-address, country and partner address schema require confirmation. |
| Date of birth | Required real calendar date; existing UK adult boundary retained | `dateOfBirth` | Transient only. Partner identity matching and evidence remain separate. |
| Height and weight | Required, finite; existing service ranges/BMI logic retained | `heightCm`, `weightKg` | Transient only. Independent verification method must be approved by provider. |
| Diagnosed weight-related condition | Required explicit yes/no; contradictory/unknown values rejected even at higher BMI | `weightRelatedCondition` | Transient only. Which conditions qualify is for the prescriber. |
| Conditions | Required nonempty text; over 1,000 characters rejected before transmission, without cutting it | `conditions` | Transient only. Structured partner history and sufficient answer size remain gaps. |
| Medicines | Required nonempty text; same no-truncation rule | `medicines` | Transient only. Reconciliation of names/doses/frequency, OTC/supplements and interactions requires partner questions. |
| Current insulin use | Existing injection-service exclusion and explicit current yes/no retained | `insulinUse` for injections | Transient only; not a new clinical rule. |
| Previous weight-loss medicine? | Required yes/no | `previousTreatment` | New/switch/repeat classification needs provider-approved definitions. |
| Previous medicine, dose, last dose date | Required when yes; real non-future UK date; hidden old values removed when no | `previousMedicine`, `previousDose`, `lastDoseDate` | Transient only. Prior-supply evidence, gaps and permitted continuity require partner policy. |
| GP name, practice, address, postcode | All required; 1,000-character transport boundary; actual GP component provides assisted/manual entry and explicit saved-profile confirmation | `gpName`, `gpPractice`, `gpAddress`, `gpPostcode` | No verified registration/contact inferred. No-GP/refused-sharing pathway needs provider decision. |
| Optional existing API fields | Same length protection; not newly displayed | `gpPhone`, `nhsNumber` | Decide whether needed, verify purpose and actual provider field. |
| Image sharing, GP contact, accuracy confirmations | All three explicit checks required; never restored checked from profile | `imageConsent`, `gpContactConsent`, `answersConfirmed`, `consentVersion`, `consentRecordedAt` | Consent version/time retained. Exact provider wording, purposes, roles and lawful processing arrangements remain required. |
| Photo ID; clothed front and side images | Each required; existing declared JPEG/PNG/HEIC/HEIF and 8 MB boundary retained | `photoId`, `bodyFront`, `bodySide`; manifest `evidenceReceipts` | Bytes/MIME/SHA-256 receipt retained, not files. Actual image decoding, identity/BMI verification and partner attachment receipts remain unproved. |
| Submission/reference | UUID operation identity; unknown or duplicated form keys reject before forwarding | `clientReference`, `Idempotency-Key`, `contractVersion` | One member/variant/payload hash operation, provider assessment and explicit provider patient reference. Internal member ID alone cannot unlock payment. |

### Precise questionnaire and workflow gaps for partner review

These are **reviewable proposed prompts**, not displayed additions, approved clinical wording or eligibility rules. The partner must supply its final questions, answer types, conditional branches, requiredness, validation, code/value lists and new/switch/repeat variants. Do not add auto-approval, a dose recommendation or a clinical threshold from this table.

| Gap | Proposed question for review | Exact partner input needed |
| --- | --- | --- |
| Allergies | “Do you have any allergies or previous reactions to medicines? Please give the substance and what happened.” | Approved choices, required detail, severe-reaction follow-up and destination fields. |
| Structured medical history | “Which diagnosed health conditions or previous operations does your clinician need to know about?” | Full approved history/risk question set; condition-specific branches and escalation decisions. |
| Medicine reconciliation | “Which prescribed medicines, non-prescription medicines and supplements do you currently use? Include doses and how often.” | Required coding/detail, verification and interaction-review workflow. |
| Current symptoms | “Are you currently experiencing symptoms your clinician should review before considering treatment?” | Specific symptom questions, urgency/escalation wording and staffed response route. |
| Tolerability and response | “Since starting or changing treatment, what side effects or difficulties have you had, and how have you been getting on?” | Approved side-effect/severity/response questions, clinical review and advice; no automated dose change. |
| Switching and supply evidence | “Who supplied your previous treatment, which medicine and dose, and when was your last dose?” | Accepted prior-prescription/supply evidence, treatment-gap and switching protocol; dates/reference schema. |
| Repeat monitoring | “What has changed in your health, medicines, treatment use or side effects since your last assessment?” | Approved repeat assessment, required measurements/evidence, monitoring intervals, clinician contact and reorder authorisation. Lifestyle check-ins are not this assessment. |
| GP exceptions | “Are you registered with a GP, and can relevant treatment information be shared with them?” | Approved no-GP/refused-sharing flow, wording and clinical outcome; current mandatory consent is not silently bypassed. |
| Independent verification | “What information or evidence can your pharmacy team use to independently verify these details?” | The actual accepted identity and measurement-verification methods and when contact is required. Photo upload alone is not verification. |
| Safeguarding/contact | Provider-approved contact/communication preferences and private safe-contact question, if required | Safeguarding protocol, timely two-way clinical route, named owners, hours/escalation and accessibility requirements. |

### Reliability and same-assessment recovery

- Intake uses bounded 15-second server transport, HTTPS-only configured endpoints, no redirects with credentials, bounded JSON responses and exact reference validation. Provider free-text errors are not reflected into diagnostic logs or the member page.
- An operation is claimed before transmission. The operation and payload hashes are bound to the authenticated member and variant. Concurrent/repeated submission sends once. A changed payload under the same reference rejects. Provider-level idempotency remains a real contract/sandbox requirement.
- A timeout, unreadable response or upstream error is **delivery unconfirmed**, not evidence of non-delivery. The same operation is not automatically resent. A provider callback can reconcile it with its original `clientReference`; consent version/time and file hashes are retained. A provider lookup/reconciliation API is still required for cases where no callback arrives.
- `GET /v1/commerce/medicine-clinical-intake-status?variant=…` finds the same owned submitted assessment after refresh/reopen. Supplying another member's reference, an expired session or a revoked session cannot expose it. Health answers are never stored in local/session storage. Unsubmitted answers still need either an approved provider draft API or a specifically reviewed retention design for durable pre-submit drafts; the page warns before leaving instead of claiming those answers are saved.
- `POST /v1/commerce/medicine-clinical-intake-resume` creates a short-lived provider session for the same owned assessment or linked order. It requires `PHARMACY_CLINICAL_RESUME_URL`, `PHARMACY_PORTAL_ORIGIN`, matching provider case/patient references, allowed HTTPS origin and a future expiry no more than five minutes away. Members use the provider's secure questions/response/resubmission route. It is not a SHIFT email or ordinary messaging thread. No functioning partner portal is claimed without actual configuration and a genuine test.
- The older abbreviated verification endpoint cannot replace the complete intake. Pharmacy verification and payment do not imply prescribing approval. Intake callbacks reject backwards transitions and mismatched patient/case references; duplicate decisions are no-ops before audit/notification work.
- New order records link the precise verified intake. Repeat checkout must also use current verification; a fulfilled order and a real partner-provided eligibility date remain required. Tracking and provider questions use that same linked assessment. Historical paid orders without a recoverable intake/provider reference need an explicit provider reconciliation; none is invented.
- Saved contact details are read only after the member chooses their reuse control. Saved GP details use the existing separate request, preview and confirmation controls. Contacts do not silently populate GP fields; consents and health-history answers are not pre-ticked/copied. Late account responses and verification redirects are fenced to the current assessment view, including pagehide/pageshow and account changes. Existing extra checkout eligibility entry is not claimed eliminated: removing it needs the approved verification-data reuse contract while retaining current service safeguards.

### Exact activation inputs still required

1. Matt's chosen legal prescriber/pharmacy/service model and version-specific approved new/switch/repeat questionnaires, independent verification, monitoring and exception workflows.
2. Actual OpenAPI/schema version and sandbox base URLs, authentication/scopes, patient create/lookup identifiers, product/dose IDs, attachment API/receipts, response/status semantics and case/order linkage.
3. Callback authentication/signing, event identity/order/replay rules, provider idempotency contract and reconciliation lookup by `clientReference`; actual timeouts/rate limits and retry guidance.
4. Secure hosted clarification/draft/resume API, allowlisted portal origin and return/session expiry requirements; actual staffed communication and escalation service.
5. Consent wording/version and processing/data-role/retention decisions, including any desired durable pre-submit draft handling and attachment retention/deletion.
6. Successful genuine partner sandbox tests with returned patient/case/attachment/consent/treatment references, followed by the unchanged pre-sale/live-payment and activation gates. No real partner calls, payment or email is authorised by synthetic proof.

### Engineering evidence and release state

| Stage | Evidence | Limit |
| --- | --- | --- |
| Original preparation | 29/29 rerun before extension, zero failure/skip; original commit preserved | Original local behaviour only. |
| Extended server/commerce regression | 98/98 passed, zero failure/cancellation/skip; includes the original checkout command/assertions and four real isolated SQLite journeys for persisted receipts, claims, callbacks, lost-response recovery and account/session isolation | Provider/Stripe HTTP remains synthetic; SQLite queries and constraints are real. No genuine external acceptance. |
| Joined GP/assessment browser journeys | 24/24 passed using the actual GP runtime, Chromium 380/1440 and WebKit 380; terminal 2026-10-16T22:26:27.942Z. Explicit contact reuse and saved-GP request/confirmation, directory/manual selection, separate unticked consent, conditional answers, one submission, refresh, real browser Back, secure same-case clarification, stock closure and stale cross-account contact-response suppression. Earlier 15-case receipt and insecure-fixture failure remain retained for their original source. | Synthetic routes/responses; page lifecycle/account-change simulation is labelled. No physical device, live account or real partner acceptance. |
| Required release checks / merge / production | Standard source admission rejected the unregistered paths as expected; original failure retained. A bounded direct registration against accepted GP code has a genuine native Git admission PASS (private 4c77dc30/89b5b83c, 5.044 seconds); nine release-safety and 14 privacy checks pass. The later explicit-GP-reuse changes still need final source registration and qualification. | No deployed or live questionnaire claim; prior-source proofs do not qualify a changed candidate automatically. |
| Genuine partner test | Not run; required provider contract/access absent | Questionnaire completeness and full integration readiness remain unproved. |

