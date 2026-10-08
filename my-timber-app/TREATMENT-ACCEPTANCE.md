# My Treatment native candidate — build 4

Adds opt-in local treatment reminders and a PDF share/save sheet to the existing hosted shells. No APNs/FCM provisioning or store upload. The treatment feature remains gated and isolated in the website preview; production wiring is a separate release step.

Reminders contain generic wording only, are capped at 32, and are scheduled at most 24 hours ahead and never beyond the authenticated session expiry. They refresh after treatment saves and when member pages open. Paused/finished courses and already-logged doses are excluded. Notification permission and device opt-in are separate from the per-treatment switch. A different account resets device opt-in. Logout or failed authentication clears pending reminders. Android uses inexact alarms and may delay delivery; reboot/force-stop requires reopening the app. Edits, logout or consent withdrawal performed elsewhere refresh on reopening, rather than remotely cancelling a local notification.

PDFs are fetched with the existing signed-in web session, same origin only, bounded to 2 MB, and passed to a native share sheet only after the member chooses Download PDF. Apple uses protected temporary files cleaned on share completion; Android uses a non-exported FileProvider limited to the PDF cache directory, with read grants only. Android PDF cache is cleared when the app starts. No PDF is automatically sent.

## Required device acceptance before release

- iPhone and Android: deny/allow/revoke notifications, schedule one fictional reminder, close app and verify receipt; tap returns to My Treatment.
- Confirm a dose, pause/finish, change date, disable reminders, log out, switch accounts and withdraw consent: verify refreshed device state clears the corresponding reminder.
- Test session expiry; no reminder scheduled after expiry. Test offline, timezone change, Android battery saver, reboot and force-stop.
- Download a fictional PDF with and without medical disclosures; verify Files/Drive save, selected recipient sharing, cancellation and denied/unavailable targets. Inspect temporary file cleanup.
- Verify hosted treatment production route and consent integration before signing release builds.

The CI artifacts are development-signed Android APK, unsigned release AAB, and unsigned iOS simulator apps. They are not signed iPhone IPAs or store submissions. Device receipt and native share-sheet behaviour must not be claimed from compilation alone.
