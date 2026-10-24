# Three-channel source handoff

This branch does not replace the frozen/shared core worker. Its HQ and member
workers record patient-facing events and prepare review-only drafts. Nothing in
this module approves, schedules, publishes or sends a message.

The saved central delivery successor now checks actual clinical case-event
relationships. Do not pretend upload/pharmacy acknowledgements are clinical
case events. The new intents therefore use the explicit source
`clinical_notification_channels`, with `source_id` equal to the immutable care
event ID and a separately bound draft per email/app channel.

In the central worker's `hq-event-delivery-eligibility.mjs`, the source owner
needs these additive changes after the held release is reconciled:

1. Import `careChannelEligibility` and `careIntentEligibility` from
   `./clinical-assessment/partner-operations/notification-delivery-eligibility.mjs`.
2. In `checkEvent`, after the prepared intent is selected and before the source
   branches, return `careChannelEligibility(DB,item,payload,draftId,recipient)`
   when `item.source === 'clinical_notification_channels'`.
3. In `intentSourceEligibility`, before its other source branches, return
   `careIntentEligibility(DB,item)` for that same source.
4. Run the saved delivery eligibility/communications tests plus the care-event
   tests on the combined candidate. Do not bypass the main release hold.

Until that exact adapter is in the central release, its current source
allowlist fails closed for these new drafts. The HQ review page explicitly
reports this dependency. Draft preparation is not delivery acceptance.

No WhatsApp transport was added. That still needs the selected provider,
approved service template, verified number, opt-in and receipt acceptance.
The existing app feed uses the `notification` payload channel and only exposes
approved, scheduled/published recipient rows. Device push is separate and
requires permission/device registration. No native push receipt is claimed.
