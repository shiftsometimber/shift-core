# Recovery and commissioning gates

Current stage: preview candidate, not production or public-launch acceptance.

Technical repair owner: Codex. Business/commissioning decision owner: Matt. Named operating delegates and acknowledged coverage are not inferred from those assignments. Existing Tap Room documentation names Matt with Linda as backup for moderation only; it does not establish privacy, refund or clinical staffing.

## Payment recovery

Existing HQ `commerce_read` permission gates `GET /v1/hq/orders/recovery`. It lists the oldest 100 outstanding entries per queue; the existing Watchtower separately counts the complete queues. No payloads, customer emails or credentials appear in the new summary. Check callback completion, checkout attempts and each customer/operator receipt independently. `accepted` means provider acceptance, not Inbox receipt or human acknowledgement.

For pending receipts only, the existing `commerce_write` permission gates `POST /v1/hq/orders/{id}/retry-pending-receipts`. The retry claims one pending delivery; it never resends `sending`, `uncertain` or `accepted`. Missing binding leaves pending. Reconcile provider acceptance before manually resolving uncertain deliveries. No historical paid order is automatically backfilled or replayed.

If checkout creation times out, the customer can retry the same selection with the same identity and stored parameters. Unknown attempts older than 23 hours stop rather than risk replay after the provider's 24-hour idempotency retention minimum. An operator must reconcile the original reference/session in Stripe before abandoning the attempt. Changing products while an attempt is unresolved is blocked, with support guidance. A clear provider rejection remains a separate recorded state, requiring review rather than another order. No real provider recovery or refund drill has yet been proved by this candidate.

Expiry is evidence from Stripe or a signed expiry event, never elapsed time alone. `reconcileExpiredReservations` is now an explicit bounded recovery routine, not an expensive provider call on public catalogue reads. Run only with the correct mode and after reviewing outstanding references. Do not release unknown-session reservations or change commercial flags to clear the queue.

## Required commissioning evidence before transactional launch

* WR03: name privacy owner/backup; process one fictional deletion request through receipt, review, appropriate erasure/retention and completion. Existing request queue/session-revocation tests are not proof of human fulfilment. Historical real requests require separately scoped review.
* WR06/14/26: pharmacy/prescriber/diagnostics operating agreements, home-test fulfilment, secure adapter contract, clinical review/results/escalation ownership, refund rules and acknowledged sandbox outcomes. Issues #645/#646/#647 remain open. All existing partner/stock gates remain closed. No competing hypothetical adapter is added.
* WR11/13: name support and payment owner/backup, response coverage and approved alert destination; acknowledge a harmless end-to-end alert and support-delivery drill. Dashboard detection is not human receipt. No new external messages have been sent by this work.
* WR12: the isolated data-export/restore proof covers its stated data only. Full-service recovery still needs managed D1 restoration, separate stores, object/media/configuration/secrets inventory and reconciliation of post-backup payment/email effects. Never roll back successful password changes or replay consumed reset tokens.
* WR10: use the existing NICE/GPhC access threads; no duplicate messages, infrastructure rotation or fabricated import. Review the exact changed Asda source fingerprint before closing #741. Public web readability alone does not establish supported automated access.
* WR15: hosted Chromium/WebKit desktop/mobile coverage does not prove a physical iPhone, Android or screen-reader session. Record device/AT versions and successful key tasks before claiming that coverage.

## Source evidence checked 21 September 2026

Authoritative main 2d5931d; retained source includes `docs/privacy-account-deletion.md`, `docs/LAUNCH-COMMISSIONING-CLOSEOUT-2026-09-16.md`, existing Watchtower and source-access issues. Fresh issue reads confirm #741/#743 remain open for exact-source review/access. Issue #760 already records the deployed engineering repair; this candidate reruns its connected browser journey rather than rebuilding it.

UK authorisation: [MHRA notice, 10 August 2026](https://www.gov.uk/government/news/uk-first-in-europe-to-authorise-orforglipron-for-weight-management-and-type-2-diabetes), rechecked 21 September. Foundayo is not appropriately grouped solely under clinical trials/research. This evidence does not establish SHIFT stock, partner readiness or NHS access. Public medicinal claims still require appropriate review before promotion; no blanket regulatory sign-off is asserted.

Provider behaviour: [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests) and [Checkout expiry](https://docs.stripe.com/api/checkout/sessions/expire), checked 21 September. Stored request bodies and stable keys protect retries within the provider window; expiry must be confirmed before releasing stock.

## Protected release and rollback

No production deployment during this task before approval. Keep exact stock wording, prices, intended services, home-test-only model and current feature flags. Keep the current Pages artifact. Release only the reviewed Worker candidate after hosted gates and preservation checks. Roll back code to the captured previous Worker if needed; preserve accepted payments, saved records, receipt claims and auth-token/session changes. New additive recovery tables are retained on rollback for reconciliation; the old application cannot be assumed to understand them.


LR-N06 session recovery: expired/invalid reads reject access without clearing a cookie that a newer login may have issued. Explicit logout/account deletion still clear cookies; server expiry/revocation remain authoritative. The final browser matrix must replay actual stale responses after new login. No password, email-delivery or reset-token algorithm is changed.

Include checkout_attempts.form_body and commerce_receipt_delivery in the existing account-data/retention inventory before transactional commissioning. Stored provider parameters can contain email/purchase metadata and must not appear in public diagnostics. Privacy/merchant owners must define appropriate retention and request handling alongside existing order/provider records.
