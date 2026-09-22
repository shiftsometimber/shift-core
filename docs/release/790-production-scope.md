# PR790 approved release scope - 22 September 2026

Matt requests promotion of completed green/amber work without regressing the website. This is a single exact-source release, not activation of unfinished work.

## Included
Member Details (name, DOB, phone, manual home address, GP contact); the tested GP assistant in Member Details and the assessment form; one-dispatch analytics; stable Programme/sign-in startup. Existing green functionality remains unchanged.

## Explicitly excluded
No full-address provider key or completed site-wide address lookup. No secure email-change workflow, separate delivery address, order rewrite, checkout prefill, clinical/pharmacy activation, prices or stock changes. Broader physical-device, complete data-retention, real GA receipt and full-service recovery criteria remain open.

## Contact-data retention and recovery
`member_account_details` belongs to the authenticated account and holds necessary contact/address and user-supplied GP practice data only. It is outside AI preferences and analytics. Full account export includes it. Optional-health erasure preserves necessary contact information. The appointed deletion operator must include it in full account erasure: its user foreign key cascades on actual user deletion. Do not claim that request acknowledgement is completed erasure or that this note establishes every retention policy.

Only CREATE TABLE IF NOT EXISTS for that exact reviewed schema is authorised, with before/after existing-schema comparison. No data import/export, broad migration, backfill, seed, publication or reactivation. Capture the current D1 Time Travel bookmark and Worker version before promotion. This is not an indefinite backup.

Code rollback restores the just-captured active Worker version; leave the additive table and all current user/order/payment/password/consent records intact. No Durable Object migrations, Pages replacement or binding identity changes are included. A post-deploy gate failure leaves the release failed and triggers code-only recovery. No promise of universal zero defects or physical-device certification is made.
