# Notification receipt closeout — 16 September 2026

Source baseline: released `0b0a8ae0cb652f6b2f74a3d25363c324143f13b0` / [PR #699](https://github.com/shiftsometimber/shift-core/pull/699). This audit reads notification code, committed non-secret configuration and narrowly filtered recent Shift email search results. It sends no messages and does not create an account, change a preference, read production member records or retrieve credentials.

## Actual transport and scheduler

- `wrangler.jsonc` configures the native Cloudflare `send_email` binding named `EMAIL`, with `AUTH_EMAIL_FROM=hello@shiftsometimber.co.uk`, `ADMIN_EMAIL_FROM=hq@shiftsometimber.co.uk` and `ADMIN_NOTIFICATION_EMAIL=hq@shiftsometimber.co.uk`.
- `fit-reminders-v1.js` sends through `env.EMAIL.send(...)`. Reminder sender precedence is `FIT_EMAIL_FROM`, then `AUTH_EMAIL_FROM`, then `hello@shiftsometimber.co.uk`; the configured source does not set a separate Fit sender.
- The structured `{from,to,subject,html,text}` payload is supported by the current [Cloudflare Workers Email API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/), checked 16 September. There is no evidence here requiring a MIME adapter or a new email provider.
- The committed scheduler runs every 15 minutes. `worker-entry-v6.js` calls `runFitMorningReminders(env)` from its scheduled handler. That function handles morning, optional evening and Sunday weekly channels; it reads existing opt-ins and applies timing/suppression/deduplication rules. The released repair's tests establish those code behaviors, not inbox receipt.
- Production provider/account/domain configuration was not independently inspected. A configured binding and a resolved send promise are not a mailbox receipt.

## Existing operator test facility

| Item | Exact existing behavior |
| --- | --- |
| Operator route | `/hq/admin-email-test`, implemented in `hq-commerce-content-v1.js`. Requires an existing authenticated HQ **owner or admin**. |
| Read step | GET displays the configured administrator recipient and a `Send dummy admin email` button. It does not send a message. |
| Send step | POST sends one explicitly labelled non-customer message through the same real `env.EMAIL` binding. No customer order or account registration is needed. |
| Recipient | Fixed from `ADMIN_NOTIFICATION_EMAIL`, currently `hq@shiftsometimber.co.uk` in committed configuration. The endpoint accepts no arbitrary recipient override. Confirm that this actual address reaches Matt's intended inbox before using it as a Matt receipt test. |
| Subject | `ST INTERNAL — TEST — HQ: Admin email route` |
| Recorded result | Page displays SENT/FAILED and a timestamp; `hq_audit` records `communications.admin_email_test` or `communications.admin_email_test_failed`. The helper catches audit-write errors, so an audit record should be confirmed separately if needed. The current test does not retain the returned provider message ID. |
| What success closes | A matching received inbox message plus the server test time closes **that transport/admin-address receipt**. It does not by itself prove scheduled member timing or device push. |

No separate send-now route for an individual Fit reminder or push test was found in the checked dispatch paths. Calling the full scheduled function is not a bounded one-recipient test: it scans opted-in members. Do not use that as an operator test or change a member's preferences just to manufacture a result.

## Narrow recent-inbox check

On 16 September, read-only Outlook searches used `received>=2026-09-16`, an exact Shift sender and the subject filters below. Every query returned **zero results, `has_more=false`**. No general inbox search or email body fetch was performed.

| Sender | Subject filter | Results |
| --- | --- | ---: |
| `hello@shiftsometimber.co.uk` | `Your Shift for today` | 0 |
| `hello@shiftsometimber.co.uk` | `Let Shift rebuild what remains` | 0 |
| `hello@shiftsometimber.co.uk` | `Your Shift Fit week` | 0 |
| `hello@shiftsometimber.co.uk` | `Verify your My Shift email` | 0 |
| `hq@shiftsometimber.co.uk` | `ST INTERNAL` | 0 |
| `hq@shiftsometimber.co.uk` | `admin email test` | 0 |

This is **no matching receipt found in the connected Outlook mailbox for those filters**. It is not proof that an opted-in reminder was due, that a send was attempted, that every mailbox was searched, or that delivery failed. Earlier Gmail authentication receipts retained in commissioning documents are a different date/mailbox and do not close today's reminder receipt.

## Telemetry available, with its limits

| Source | What it records | What it does not prove |
| --- | --- | --- |
| `fit_reminder_deliveries` | Member/date/channel claim, sending/sent/suppressed status, mode/time/suppression reason and `sent_at`. Successful channels are separate and failed channels can retry without repeating a successful one. | No provider message ID, inbox acknowledgement, push display acknowledgement or read event. A retained sending claim may represent provider acceptance followed by failed receipt persistence; do not blindly retry it. |
| Scheduled log `shift_scheduled_intelligence` | Aggregate scheduled job outcomes including reminder counters. | A recipient saw a message. No aggregate was fetched from production during this audit. |
| `auth_delivery_events`; `authDeliveryHealth` | Event/status totals and latest time, with provider ID when supplied; Watchtower presents aggregate results under `platform.email`. | These are authentication-mail send events, not Fit reminder receipt. The health helper also ensures its table exists, so do not describe it as a guaranteed mutation-free database call. |
| `hq_audit` admin test action | Intended test address, subject/time or send error, if audit persistence succeeds. | Inbox arrival; the send result and actual receipt remain separate. |

`GET /v1/fit/reminders` is not a strictly read-only diagnostic: it ensures tables and may initialise VAPID keys before returning preferences/capabilities. It was not called. `capabilities.email=true` in that response is a static capability field, not a fresh transport test.

## Device push requires actual device receipt

`frontend/member/member-fit-programme-v1.js` registers `/shift-push-sw-v1.js`, explicitly requests browser notification permission and stores the resulting authenticated PushManager subscription. Its iPhone flow requires the installed Home Screen web app before it offers device notifications. These are existing implementation requirements; this audit did not change browser permission or create a subscription.

`sendPushToMember` counts the channel successful if at least one stored endpoint accepts the encrypted push request, and revokes endpoints returning 404/410. That acceptance does not establish display on every device. The service worker calls `showNotification` and handles a tap by opening/focusing the intended page; it sends no receipt callback to the Worker.

The remaining device proof therefore needs a consenting test device with a real subscription: observe a notification on that device and its tap destination, recording device/browser/time. Email evidence, a configured VAPID public key, or a push endpoint's successful HTTP response cannot replace this observation.

## Concrete remaining closeout

1. Through an existing named HQ owner/admin session, inspect the administrator test page and verify the fixed recipient is the intended controlled inbox. An explicitly authorised one-message test can then use the existing button without adding code or sending customer content.
2. Match the exact subject/timestamp to a received email. Retain a redacted receipt and the operator result, keeping email receipt separate from scheduler behavior.
3. For actual member reminders, use a specifically authorised test account and its normal opt-in/due-time path, then match the resulting receipt. No direct database preference changes or all-member forced scheduler run.
4. Complete device push with a consenting real test device and visible arrival/tap evidence. Until that observation exists, retain **push receipt unproved**.

No send action or new notification configuration was performed. Existing code tests remain green; recent actual email/push receipt remains unproved by this audit.
