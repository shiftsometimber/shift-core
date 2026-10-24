# Three-channel source handoff

This branch does not replace the shared core worker. Its deployed HQ/member workers record care events and prepare review-only drafts. Nothing here approves, schedules, publishes or sends a message.

## Reconciled contract

The independent source owner added canonical channel support in hq-event-delivery-eligibility.mjs at commit be44a1cc8470a8fe9526c439fb04257489dffc46. This branch now matches that actual prepared contract:

- Each email/app draft has a clinical_case_outbox row with id and event_id both channel:<event-id>:<email|app>.
- The intent key is clinical:<outbox-id>, source is clinical_case_outbox and source_id is that outbox ID.
- The canonical clinical_notification_channels row binds the same immutable event, channel and draft ID. The old member event row is channel_review, not a second send source.
- The central observer sees the existing prepared intent and cannot prepare a duplicate. Its successor suppresses a legacy partner notification if the canonical care event exists.
- Consent/record ownership, current verified recipient, channel status, draft binding and current question state are rechecked immediately before transport. An answered query supersedes both channel rows and unattempted channel outboxes.

The previous proposed dedicated-source adapter in notification-delivery-eligibility.mjs is retained as superseded history. Do not add that import to the central worker: the shared owner's canonical implementation supersedes it.

Tests use an exact read-only snapshot of the shared source in partner-proof/contracts/central-delivery-eligibility-be44a.mjs. This is test evidence, not a replacement deployment. The snapshot and owning source SHA are retained with the release receipt. Cross-member/changed-email/unverified/withdrawn-sharing/stale-query/source-revocation cases fail closed. Partial channel preparation and retry create no duplicate drafts. The existing app-feed SQL contract is exercised with fixture-only approval/publication; it is not a production app/device receipt.

## Release boundary

The central source owner must release their own combined Communications successor through the existing controls. Main release 40113641714, candidate 200ff3dd, remained separately owned when this work resumed. No main merge, core overwrite, new sender or schedule is part of this branch's release. The portal continues to say that central delivery release is outstanding. Local compatibility is not production delivery acceptance.

The canonical migration migrations/clinical-casework-v1.sql supplies the reference/state tables used by the prepared checker. Applying this additive schema does not activate clinical review, grant any staff scope or issue a prescription. Existing real-clinical, professional onboarding, supply and private Test-account cohort controls are unchanged.

No WhatsApp transport was added. It still requires the selected provider, approved template, verified number, channel opt-in and exact communication sign-off. The app feed uses payload channel notification and only exposes approved published recipient rows. Device push needs permission/registered devices and separate receipt acceptance. Existing email transport remains plain text; branded HTML delivery is not claimed.
