# Account completion — bounded continuation, 23 September 2026

Owner request: full postcode-to-address lookup, site-wide GP assistance, secure self-service sign-in email changes and separate delivery-address editing must not remain repeatedly deferred.

## Current owner decision — manual address entry

On 23 September the owner rejected paid postcode lookup and instructed its removal. Home and delivery addresses are now typed manually. Both free Photon and the proposed paid replacement are superseded; no provider signup/key/activation is required. Free NHS GP suggestions remain, with manual GP entry. Existing saved addresses, separate delivery preference, validation, and explicit save/reload behaviour are preserved. New hosted evidence is required for this changed candidate. See `docs/decisions/2026-09-23-manual-addresses.md`.

## Source and release boundary

The account candidate began at released main `4c014edce24bd9a37645dfbd6bad204ed3270091`; it is now reconciled with the newer released Reta source `323f2409c0bd7f719abb05969fe9aeb2a827261b`. Preserve both histories, not the retired PR790 branch or GOLD application. One new isolated preview. Production remains untouched until the complete candidate has passed relevant acceptance and the retained production gates. Keep current design/navigation, medicine products/variants/prices/stock, clinical/commercial holds, existing account histories and the PR790 repairs. No paid signup, credit purchase, real-user identity change, production export/restore or speculative provider activation.

## Completion contract

1. Address entry: manual home and delivery fields only. No find/search button, suggestion list, provider attribution or "not connected" message. The retired endpoint cannot call a provider, even with stale flags or keys. Preserve validation, saved records, separate delivery, refresh and fresh-sign-in behaviour. No subscription or trial.
2. GP assistance: inventory all current required forms and their real stored field contracts. Reuse shared search/selection code. Selected name, postcode, directory code and address only populate the intended fields, with human overrides preserved; no silent clinical submission or sharing. Actual territorial coverage must be named; England/Wales does not imply the whole UK.
3. Email change: authenticated re-entry of current password; proposed new address stays pending. Verify the new mailbox, protect/notify the existing mailbox, expire and consume tokens once, reject reuse/cross-account/CSRF/racing changes, invalidate obsolete recovery/session state as appropriate, preserve immutable user ownership and historical orders. Real mailbox receipt and subsequent sign-in/reset acceptance remain necessary before live completion. Never simply make the email input editable.
4. Delivery address: home versus delivery clearly separated; explicit same-as-home choice; saved address survives refresh and fresh sign-in; old client saves cannot silently erase it. Existing/historical order addresses never rewritten. New-order selection must remain explicit; no change to clinical or payment flow. Include data export/isolation/deletion lifecycle and failure/retry/concurrency evidence.

## Evidence rule

Track separately: inspected source, code implemented, unit/database evidence, hosted browser evidence, real provider/mail evidence, production delivery. A green build is not a declaration that all six exist. Retain failures; repair only demonstrated defects; do not repeatedly redeploy production or reopen unrelated signed-off work.

## Current checkpoint — 23 September continuation

- Exact account/access candidate `2afcd65015ab8ca7334d8c69a9f4bb3ce4707cd3` passed workflow `35849691581`: 260 source/database tests, 28 hosted browser cases and 28 bounded assurance checks. This supersedes the earlier 60c50c1-only status.
- This continuation reconciles that candidate with released main `323f2409c0bd7f719abb05969fe9aeb2a827261b`. The source gate requires both ancestors and exact blob preservation for all account application files and all newer Reta files. At that earlier reconciliation checkpoint account route and UI code remained byte-identical; the later rollback guard adds one reviewed schema trigger and regression tests. The proposed release also adds only `MEMBER_ADDRESS_PROVIDER=photon` to runtime configuration, updates the exact release scope, and corrects the stale GET-only live probe. These changes are prepared on the draft branch, not applied to production. Secure email change remains disabled and its new tables are not commissioned.
- The workflow no longer creates application-source commits during verification. It deploys and tests the already-committed candidate in the existing isolated preview, records its identity, and retains all raw results. The result of this new run must be recorded separately; earlier success is not a claim that it passed.
- Real email delivery remains unproved: the preview has fictional `@example.invalid` accounts and simulated inboxes, no real mail binding. No real-account email change or test-mail sending is authorised by this file.
- Commerce inspection confirms apparel Checkout collects its shipping address in Stripe (`commerce-stripe-v1.js`). The saved My Timber delivery preference is not wired to that hosted shipping form. Do not describe the editor as checkout-prefill completion, silently replace a confirmed shipping address, or enable held medicine transactions. This remains a separate integration item.
- Secure email changes require the existing explicit feature flag and working mail binding. The additive email schema, retention, real two-mailbox receipt/sign-in/reset test and release verification remain open.
- Phone-sized Chromium/WebKit evidence is not a physical iPhone/Android or screen-reader observation.
- No production merge, deployment or data migration is performed by this continuation. Production promotion follows the retained owner preview/release decision and evidence gate.

### Prepared release boundary

The current source candidate removes address lookup and retains manual addresses, the separate delivery editor and GP forms. Configuration matches released main exactly. It does not integrate the saved delivery preference with Stripe Checkout and does not enable real email changes. The retained contact table and its exact delivery-preservation trigger are the only permitted additive schema; current data and historical orders are preserved, and rollback restores runtime only. Owner preview/release acceptance remains necessary before production promotion.

### Rollback compatibility repair

Inspection of the actual released account route found that a post-rollback home-address save replaced contact JSON and discarded a separate delivery preference. The additive, exactly checked trigger rejects a legacy update that omits an existing delivery object, before any account fields are changed. Affected home edits fail safely while rolled back and can resume on the compatible runtime. Explicit current delivery edits still work. Regression evidence exercises the actual released route from commit `323f2409c0bd7f719abb05969fe9aeb2a827261b`, including safe rejection, retry after recovery, stale edits and account deletion. This is a prepared preview repair; no production schema has been applied.
