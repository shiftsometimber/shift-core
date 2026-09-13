# REC-040 — Medicine Stripe retry repair

Matt explicitly requested “Fix stripe retry” and asked whether Fit and Grub integrate properly. SHIFT remains the Stripe payment recipient; no pharmacy payment redirection, live-mode switch or stock activation.

The previous handler inserted an event before processing it and acknowledged every later delivery as a duplicate, even if the first attempt failed. Order/inventory changes and event completion were also separate commits.

The repair only acknowledges previously completed events. Order, inventory, order-reference status and event completion now commit in one D1 transactional batch. SQL conditions evaluated within that transaction ensure multiple event IDs and concurrent deliveries settle an order once. Late failed/expired notifications cannot downgrade paid/refunded orders or release unrelated stock reservations. A late confirmed payment after a failure does not release that reservation twice. Missing orders return 503 for retry. Existing email delivery runs after a first successful transition; this repair does not add a durable email outbox or claim exactly-once email delivery across process crashes.

Validation uses signed synthetic Stripe notifications with real in-memory SQLite transactions, forced failure at all four settlement statements, redelivery, separate success IDs, concurrent delivery, failure-before-success, late failure and refunded-order preservation. No real payments, customer messages, production records or secrets are used in these tests.

Fit/Grub review: 34 existing source/behaviour tests passed across Grub programme, Fit daily session, adaptive daily recommendations and Journey setup/check-ins/observations. Code connects food tastes/exclusions/time/repeat handling with recipe choices and swaps; Fit completion uses its server endpoint and Progress. These tests include source assertions and are not a fresh authenticated browser/end-to-end member acceptance. Existing approved UI and assets remain unchanged. A “best possible” quality claim is not supported by this review.

Sources: https://docs.stripe.com/webhooks (redelivery, duplicates and unordered events); https://developers.cloudflare.com/d1/worker-api/d1-database/ (batch transaction rollback). Read 13 September 2026.

Baseline: main bee0a1d18cde7113a4aaa66897b4b5f64431e7b4; Worker dc3b60dd-f158-4a97-9d09-1d9984e86969. Release guard captures locked website/newsroom/member asset baselines and checks preservation after deployment. Production unsigned webhook probe must reject before database access. No signed production event replay is performed.
