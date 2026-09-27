# Owner-requested signup and order alerts

Matt requested an email to hello@shiftsometimber.co.uk for every new member signup, and orders@shiftsometimber.co.uk for every newly placed order.

The existing paid shop-order webhook already sends one operator receipt to orders@ and a separate customer receipt. Its durable per-order claim prevents duplicate callbacks from resending either receipt. Medicine order confirmations already include orders@; the existing clinical/payment/stock holds stay intact. No new order notification is sent for an abandoned checkout, failed payment, or an internal draft order.

This change adds the missing signup alert after a successful public account creation, before email verification completes. It covers fast and legacy registration responses and does not alter passwords, verification, cookies, consent or customer welcome emails. The established commissioning path bypasses this public notification hook. No historical accounts are scanned or backfilled.

The alert contains the member's name, email, member reference and signup timestamp, with verification status explicitly pending/unknown. No password, verification link, health information, address, date of birth or consent details are included. The recipient is fixed in code, not supplied by the request.

A dedicated additive table records the delivery claim by user ID; account deletion cascades to this table. Missing email binding leaves a pending record for the existing quarter-hour scheduled job. Concurrent retries can claim it only once. Ambiguous provider acceptance is retained as uncertain and is not automatically resent. Provider acceptance does not prove inbox receipt. A queue-storage failure is logged without failing an already-created account; this failure requires operational investigation, not an unsupported exactly-once guarantee.

The preview uses fictional records, a separate Worker, the existing isolated preview database and two explicitly labelled test emails to the requested owner aliases. Its sender endpoint requires an expiring random bearer token, allows only the two exact prebuilt messages, and records one send per source/recipient. Neither payment nor customer records are created in production. Preview test emails are not evidence that production signup alerts have already been enabled.

Release remains subject to the owner's standing preview-before-live sign-off. Preserve the current manual-address release, newer Reta/Medicines Watch changes, protected catalogue and existing production gates. The only proposed configuration addition enables signup alerts. The only proposed schema addition is member_signup_alerts; the production release prepares and verifies it before deployment. Rollback restores runtime only.
