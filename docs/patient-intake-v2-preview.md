# SHIFT patient intake v2 — preview handover

Branch: preview/shift-patient-intake-20260913. Base: ef72fc99f6bf827d3dc161e90976c17c8617e17b.
Scope: Matt's pay-first, SHIFT-managed patient assessment and subsequent clarification requiring physical and mental health questions. Production remains unchanged. The colleague's Fit/Grub changes are in another worktree/branch.

## Implemented candidate

Choose requested medication/strength → confirm assessment terms → Stripe payment → webhook-confirmed paid order → saved patient assessment → encrypted evidence → pharmacy receipt → clinician decision → mandatory Journey → dispensing/dispatch.

- Versioned saved drafts, account names/email prefill, separate home/delivery address.
- KG / stone+lb and cm / metres / feet+inches with metric conversion and server validation.
- Address and GP search with manual fallback; configurable server adapter contract below.
- New / switching / returning treatment; previous medicine, administered mg, last dose date, interruptions, effects and supporting image/PDF.
- ID and clothed front/side upload. Photos described as supporting evidence, not BMI proof.
- Structured physical health, mental health, eating-disorder and body-image draft questions; conditional follow-ups, no automated prescribing decision. Urgent safety answers interrupt routine submission with emergency guidance.
- Answers encrypted with AES-256-GCM and order-bound associated data. Evidence encrypted in a private R2 binding with object-bound associated data; authenticated owner-only downloads. Database stores metadata, not public URLs. No clinical content in audit events.
- Submission locks draft and queues idempotent transfer. No partner connection or failure means `queued`, not `submitted`. Pharmacy must return reference. Retries reuse the same key.
- Pharmacy status updates for v2 require paid order and matching accepted intake reference. Dispensing blocked before Journey completion.
- Cancellation before clinical receipt (or after decline), full refund request to original Stripe payment, stable idempotency, pending vs succeeded distinction. No automatic refund claim from pharmacy callbacks. Refund failure/pending visible for retry/support. Refund does not automatically return stock to sale: pharmacy/HQ must confirm sellable inventory.
- Checkout request key prevents replay creating another payment session. Legacy verification-first behaviour stays the default with feature disabled.

## Clinical approval is a real release gate

`patient-questionnaire-v2.js` is an ORIGINAL DRAFT for review, not a validated clinical instrument or signed prescribing protocol. Draft topic sources: current UK Mounjaro and Wegovy injection PILs on emc; GPhC patient FAQ/weight management guidance. No PHQ diagnostic scoring, automatic mental-health exclusion or inferred eligibility.

The new checkout refuses payment unless `PATIENT_CLINICAL_POLICY_JSON` has an approved version, reviewer, date and supported medication. A pharmacy must provide/approve the final questions, decision/escalation process, independent measurement verification, consent wording, identity/evidence standards and additional questions. Never mark the draft approved to bypass commissioning. Automated tests use an explicitly synthetic approved policy fixture.

Source links checked 13 Sep 2026:
- https://www.medicines.org.uk/emc/product/15481/pil
- https://www.medicines.org.uk/emc/product/13799/pil
- https://www.pharmacyregulation.org/patients-and-public/standards-you-can-expect-using-pharmacy-services/weight-loss-medications-faq
- https://www.pharmacyregulation.org/about-us/news-and-updates/online-pharmacies-strengthen-safeguards-prevent-unsafe-supply-medicines

## Configuration required before a real rollout

No production configuration, key, binding, migration, DNS or deployment was changed.

1. Private `PATIENT_EVIDENCE` R2 binding and 64-hex-character `PATIENT_DATA_KEY` secret; establish key rotation/backup, retention/deletion, access review and DPIA. This candidate uses one current encryption key; a versioned key ring and retention automation remain commissioning work.
2. Agreed privacy notice and controller/processor/data-sharing responsibilities for SHIFT retaining clinical records and evidence. The existing live notice must be reviewed before enabling collection.
3. Pharmacy-approved `PATIENT_CLINICAL_POLICY_JSON`; includes version, status=approved, approvedBy, approvedAt, medicines[], questions[{id,group,label,options[],detailsFor[]}]. Actual partner policy is not available in this session.
4. `PATIENT_ADDRESS_LOOKUP_URL`, `PATIENT_GP_LOOKUP_URL`, optional `PATIENT_LOOKUP_SECRET`: GET HTTPS `?q=...`; return `{results:[{id,label,line1,line2,town,postcode,practice}]}`. Endpoints must be trusted server adapters to a licensed address source / approved GP directory. No paid address account was opened. Live lookups are NOT yet connected; demo results are labelled samples. Confirm GP coverage for all UK nations.
5. `PHARMACY_PATIENT_INTAKE_V2_URL` and existing integration secret: POST JSON schema `shift-patient-intake/v2`; stable Idempotency-Key; order/member/variant, requested medicine/strength, assessment, questionnaire version and base64 evidence. Return `{reference}` only after durable receipt. Partner must honour idempotency; their API schema remains unverified. Configure two-way clinical communications and escalation/monitoring before commissioning.
6. Partner callbacks `/v1/integrations/pharmacy/treatment-status`: Bearer secret, orderNumber, matching partnerReference, valid status transition. Real carrier tracking payload/UI not added in this scope.
7. Enable `MEDICINE_INTAKE_V2_ENABLED=true` only after clinical/data/partner gates and Matt's production approval. Merge shared public navigation/checkout source through the authoritative production release process; do not publish the synthetic demo as the real service.

## Evidence and boundaries

`node --test tests/patient-intake-v2.test.mjs tests/medicine-purchase-e2e.test.mjs tests/medicine-commerce-v1.test.mjs tests/medicine-stripe-retry-v1.test.mjs`

29 tests pass locally: real SQLite-backed D1 interface with mocked Stripe/pharmacy transport and R2 memory binding. Includes encrypted persistence, missing evidence, required question follow-ups, urgent response, cross-account/origin denial, retry idempotency, partner reference, Journey gate, refund pending/completed and legacy retry regression. Not a real Stripe payment, real pharmacy acceptance, external lookup test or clinical sign-off.

Public preview is a separate, read-only Worker with no DB/R2/Stripe/pharmacy bindings. CSP blocks outbound connections. The same form runs on synthetic in-tab data; reload resets it. Public preview demonstrates UI and branching; backend persistence evidence is the automated integration tests.

## Browser verification

Preview: https://shift-patient-intake-preview.matobrien.workers.dev/patient-intake?demo=1

Rendered browser checks and production main fingerprint: `docs/evidence/patient-intake-v2/browser-proof.json`. The attached desktop and mental-health screenshots show the form; later changes were mobile spacing and checkout retry/copy fixes. Public demo cannot prove live persistence; the SQLite integration test does test encrypted save/resume.
