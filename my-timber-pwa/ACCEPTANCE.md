# My Timber PWA — preview acceptance, 21 September 2026

Authorised scope: an easily installed My Timber PWA and optional check-in device
reminders. Not an App Store submission or a production-release approval.

Source: `shiftsometimber/shift-core`, remote main
`058b204d900bc9e95f8093e506958dffc240aeec`, checked through GitHub before editing.
Pages remains the recorded authoritative deployment
`0da69833-83f7-4c70-9c7a-bceab7de1660`; no Pages republish or archive source.
Separate branch `feat/my-timber-pwa-20260921`. Grub PR782 merged while this work
was in progress. Reconciled with main `d61ff3f21e264377ec97f5a2bd4bed04daf64aff`,
retaining both its nutrition response wrapper and the new PWA wrapper. Refresh
main again before any production release.

The isolated device preview uses a deliberately small test shell, not a copy of
the complete dashboard. The actual production integration is compiled/tested but
not deployed. Preview scheduling is disabled; only a consenting device's explicit
test button can send. Its DB and VAPID identity are separate from production.

## Acceptance gates

1. My Timber owns one valid, same-origin manifest, the approved **S in a circle**
   icon (Matt's explicit choice; not the wordmark or a redrawn logo), and standalone
   launch into `/member/dashboard#today`. iPhone gets accurate manual installation
   instructions; supported Android browsers get their native install prompt.
2. Install controls do not obscure Today or change protected navigation. Login,
   reset, return destinations and existing member saves retain their contracts.
3. Never cache member responses, API data, prices, clinical forms or reset URLs.
   Offline navigation explains that a connection is required; never imply a save.
4. No automatic notification prompt. Permission comes from an explicit tap;
   unsupported, denied, dismissed and failed subscription/save cases are truthful
   and retryable. New preferences default off. No email consent is implied.
5. Daily check-in reminders are opt-in per device, at a member-selected UK hour,
   with a switch-off control. No sensitive content appears in the notification.
   A notification tap resolves only to approved same-origin My Timber pages.
6. Scheduler suppresses a saved daily check-in, respects session revocation,
   deduplicates concurrent runs, retries rejected transport without duplicating
   accepted sends, and removes expired endpoints. Existing Fit reminders stay
   unchanged. No all-member forced send or real-user fixture is permitted.
7. Automated tests establish code/SQL/service-worker behavior, not phone delivery.
   Installation, actual lock-screen receipt while the app is closed, badge and tap
   behavior on a consenting physical iPhone/Android remain separate evidence gates.
8. One isolated preview, no production/customer bindings, no production deploy.
   Evidence must identify the exact tested commit and clearly state limitations.

Protected: OOS wording, theoretical-stock testing, prices/services, header/menu,
Ask Timber repairs, Grub/Fit, article publication and current account-recovery work.
