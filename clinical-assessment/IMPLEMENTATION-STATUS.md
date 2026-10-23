# Clinical assessment update — 23 October 2026

Authority: Matt approved detailed competitor coverage, SHIFT-held evidence/profile access and requested live deployment. Stock/service activation is not authorised by this request. Preserve existing stock and prescribing controls, privacy and communications restrictions.

## Implemented in this branch

- Versioned draft questionnaire preserving the private v0.3 pack and adding the named condition, medicine-group and other-allergy coverage from supplied New Health screenshots.
- Conditional follow-ups for yes/uncertain answers; inactive answers excluded from the resulting payload.
- Full answer handling with explicit oversize rejection rather than truncation.
- Proposed evidence rules for ID/front/scales and prior prescription on switching/restarting/repeat paths; side photo policy configurable.
- Six focused local behavioural checks passed. No clinical approval inferred.

## Not implemented / not released

- No routes import this module. Current public/member assessment is unchanged.
- No private production image store or member document UI has been created or configured.
- No post-payment questionnaire orchestration has been connected to production Stripe.
- No partner-specific API changes, clinical approval, clinical rules or independent-verification acceptance.
- No live deployment, real records, payments, partner messages or emails.

## Verified source constraints

Current main inspected: 567c566. medicine-commerce-v1.js requires pharmacy verification before checkout. Clinical intake forwards ID/front/side files and records manifest/receipts. Current frontend states SHIFT does not store files. No R2 binding was found in wrangler.jsonc. Latest saved private workspace is Library libfile_7d5df2174f6c819192de5a4a2d4ebc9d version 5, named SHIFT-Private-Clinical-Workspace-Customer-Journey-v0.3.zip. It is fictional-only, localhost, and collects the assessment and evidence before hosted test Checkout.

Existing integration contract docs/PHARMACY-MY-TIMBER-INTEGRATION-V1.md explicitly retains the out-of-stock hold pending chosen-pharmacy and live Stripe acceptance. Prior release authority is bounded to nonclinical engineering and preserves clinical/sales/privacy controls.

## Next independent engineering work

Implement private object storage with per-request account checks; file validation and quarantine; metadata/version/audit records; member documents UI with extra ID-document authentication; retention and deletion workflow; order-linked drafts and verified-webhook questionnaire creation; notification drafts only until approved; migration/rollback and synthetic account isolation/duplicate/refund/browser tests. Preserve current live flow until replacement passes.

## External acceptance required for real service

Prescriber approval of the question pack and treatment-specific rules, measurement-verification process, supporting evidence/reuse/recency, actual API schema, payment-before-assessment/refund workflow. Confirm data-controller/processor roles, lawful basis/Article 9 condition, retention, DPIA and partner access. NHS record access must not be claimed without actual entitlement. Competitor prompts are collection coverage, not contraindications.

Run: node --test tests/clinical-assessment-v3.test.mjs
