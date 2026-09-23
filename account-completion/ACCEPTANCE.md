# Account completion — bounded continuation, 23 September 2026

Owner request: full postcode-to-address lookup, site-wide GP assistance, secure self-service sign-in email changes and separate delivery-address editing must not remain repeatedly deferred.

## Source and release boundary

Start from the actual released main `4c014edce24bd9a37645dfbd6bad204ed3270091`, not the retired PR790 branch or GOLD application. One new isolated preview. Production remains untouched until the complete candidate has passed relevant acceptance and the retained production gates. Keep current design/navigation, medicine products/variants/prices/stock, clinical/commercial holds, existing account histories and the PR790 repairs. No paid signup, credit purchase, real-user identity change, production export/restore or speculative provider activation.

## Completion contract

1. Postcode lookup: actual full address results from the configured licensed provider; explicit keyboard selection; manual fallback; stale/out-of-order request protection; no key in browser/logs; controlled credit use; coverage matrix of actual supported forms. A test key or mock response is not provider commissioning. Any required account/key/credits are an explicit dependency, not a reason to hold unrelated repairs.
2. GP assistance: inventory all current required forms and their real stored field contracts. Reuse shared search/selection code. Selected name, postcode, directory code and address only populate the intended fields, with human overrides preserved; no silent clinical submission or sharing. Actual territorial coverage must be named; England/Wales does not imply the whole UK.
3. Email change: authenticated re-entry of current password; proposed new address stays pending. Verify the new mailbox, protect/notify the existing mailbox, expire and consume tokens once, reject reuse/cross-account/CSRF/racing changes, invalidate obsolete recovery/session state as appropriate, preserve immutable user ownership and historical orders. Real mailbox receipt and subsequent sign-in/reset acceptance remain necessary before live completion. Never simply make the email input editable.
4. Delivery address: home versus delivery clearly separated; explicit same-as-home choice; saved address survives refresh and fresh sign-in; old client saves cannot silently erase it. Existing/historical order addresses never rewritten. New-order selection must remain explicit; no change to clinical or payment flow. Include data export/isolation/deletion lifecycle and failure/retry/concurrency evidence.

## Evidence rule

Track separately: inspected source, code implemented, unit/database evidence, hosted browser evidence, real provider/mail evidence, production delivery. A green build is not a declaration that all six exist. Retain failures; repair only demonstrated defects; do not repeatedly redeploy production or reopen unrelated signed-off work.

## Current checkpoint

Inspection workflow only at this checkpoint; no account feature completion claimed yet. It reads candidate source and a narrow allow-list of provider-binding names/types (never their values). It makes no production writes and runs the retained member regression suite.
