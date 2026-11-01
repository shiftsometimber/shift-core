# Referrers and public six-week sample

New public routes: `/refer-to-shift`, `/programme/sample`, and their three assets. Existing `/programme` and `/partner-with-us` gain focused discovery links. No homepage, member, clinical, commerce or contact backend is replaced.

The public sample reproduces the six exact approved weekly texts captured from the existing serving `programme-first-six-weeks.mjs`; its source hash is in `source-receipt.json`. It uses fictional example entries and memory-only feedback. The original private journey and its existing sample remain untouched. There is no sample-to-member record copying or automatic completion.

The enquiry form uses the current Turnstile action `contact_enquiry` and `/v1/contact` with `type: partnership`. The existing handler selects `partners@shiftsometimber.co.uk`; it sends no automatic Matt copy. No real-email acceptance test is authorised by this change. Existing delivery tests use fictional data and mocked transport.

Affiliate enquiries do not create agreements or promise commission. Professional/community signposting and paid non-clinical audience partnerships are separate. Clinical referral payments and prescription-medicine promotion are not offered.

Prepare and qualify:

```sh
node referral-programme/prepare-assets.mjs
node --test referral-programme/referral-programme.test.mjs tests/contact-delivery-contract.test.mjs tests/contact-success-analytics.test.mjs tests/independent-presentation-preservation.test.mjs tests/runtime-rollback-guard.test.mjs
```

The workflow runs source checks and a read-only provider capture on the task branch. Production release is separately selected with `workflow_dispatch`, `action: release`, and the exact final public-version fingerprint from the capture receipt, after Matt's sign-off. Any copy changes require a fresh fingerprint and sign-off. A push never deploys this feature automatically.

The release adds an outer wrapper to the freshly captured provider package, preserving each original module byte, all bindings and current settings. It shares the existing production release lock. It changes no Cloudflare routes, migrations, real member records, supplier or payment activation. Verification checks the existing private journey, six-week assets, shared protected pages and independent member presentation. Rollback requires an owned deployment receipt and refuses to overwrite a newer release.

Local review pages can be generated with `preview.mjs OUTPUT CAPTURED_PARTNER_HTML CAPTURED_PROGRAMME_HTML`. The generated form transport is deliberately simulated and must never be used as a production asset.
