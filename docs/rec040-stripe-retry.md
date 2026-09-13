# REC-040 — Medicine Stripe retry repair

Matt explicitly requested “Fix stripe retry” and asked whether Fit and Grub integrate properly. SHIFT remains the Stripe payment recipient; no pharmacy payment redirection, live-mode switch or stock activation.

The previous handler inserted an event before processing it and acknowledged every later delivery as a duplicate, even if the first attempt failed. Order/inventory changes and event completion were also separate commits.

The repair only acknowledges previously completed events. Order, inventory, order-reference status and event completion now commit in one D1 transactional batch. SQL conditions evaluated within that transaction ensure multiple event IDs and concurrent deliveries settle an order once. Late failed/expired notifications cannot downgrade paid/refunded orders or release unrelated stock reservations. A late confirmed payment after a failure does not release that reservation twice. Missing orders return 503 for retry. Existing email delivery runs after a first successful transition; this repair does not add a durable email outbox or claim exactly-once email delivery across process crashes.

Validation uses signed synthetic Stripe notifications with real in-memory SQLite transactions, forced failure at all four settlement statements, redelivery, separate success IDs, concurrent delivery, failure-before-success, late failure and refunded-order preservation. No real payments, customer messages, production records or secrets are used in these tests.

Fit/Grub review: 34 existing source/behaviour tests passed across Grub programme, Fit daily session, adaptive daily recommendations and Journey setup/check-ins/observations. Code connects food tastes/exclusions/time/repeat handling with recipe choices and swaps; Fit completion uses its server endpoint and Progress. These tests include source assertions and are not a fresh authenticated browser/end-to-end member acceptance. Existing approved UI and assets remain unchanged. A “best possible” quality claim is not supported by this review.

Sources: https://docs.stripe.com/webhooks (redelivery, duplicates and unordered events); https://developers.cloudflare.com/d1/worker-api/d1-database/ (batch transaction rollback). Read 13 September 2026.

Baseline: main bee0a1d18cde7113a4aaa66897b4b5f64431e7b4; Worker dc3b60dd-f158-4a97-9d09-1d9984e86969. Release guard captures locked website/newsroom/member asset baselines and checks preservation after deployment. Production unsigned webhook probe must reject before database access. No signed production event replay is performed.

## Fit and Grub assessment limits

Fit’s `fallbackFitPlan(profile)` currently ignores the supplied profile and offers a fixed 20-minute session. It must not be described as individualised for all saved limitations. Grub’s prep guidance is a simple recipe-based checklist. These are concrete depth limitations, not evidence that the main saved-plan integration is broken. No Fit/Grub runtime code was changed in this payment repair.

## Verified release

Source `2631ee9a56088493387d6b0e8ab3a3c4f8b2a3fa`; tree `05e3cf185e90f9c8c55fa659ef90ab82eed27eb6`; Worker `72a42683-5e05-45d1-9661-780f8b414223`. Release run [34765379980](https://github.com/shiftsometimber/shift-core/actions/runs/34765379980), job 103745302222, succeeded. 29 payment tests (including 10 new transactional retry cases), 34 Fit/Grub/Journey checks and existing source gates passed. Locked public pages and 51 UK newsroom links passed before/after; Fit, Grub and member-shell asset hashes were identical. Production rejected the unsigned synthetic webhook before database processing. No real Stripe charge, production signed event, customer message, live-mode switch or stock activation.

Main promotion uses a documentation-only child of this verified source, [skip ci]. Existing act2b-one-shot workflow validation failure remains unrelated. No fresh authenticated Fit/Grub browser acceptance is claimed. Future releases must guard the new main/Worker; this release workflow is now stale.
