# Good to Talk practical support pathway

Owner approved the service scope and instructed “Lets go with the improvements”, 23 October 2026.

Adds free next-step navigation, official UK nation service routes, ephemeral appointment preparation notes, and waiting/review guidance. Adds a free support link alongside the existing wellbeing check-in. Does not provide assessment, triage scoring, treatment, appointment booking, a crisis inbox, automated referrals, account storage or monitoring. My Timber account persistence and reminders require separate implementation against its consent, privacy and account-isolation contracts; neither is represented as available here.

The dedicated presentation Worker delegates to the exact existing Good to Talk and feeling presentation services, preserving their current shell, guides, assets and Core functionality. Only existing routes for these two page families change owner. No Core deployment, database access, clinical configuration, homepage change, emails, payments or stock changes. Service bindings only: no secrets or member database bindings.

Editable panel.html/style.css/client.js generate content.mjs with `node mental-health-pathway/build.mjs`. Verify with `node --test tests/mental-health-pathway.test.mjs`.

The deployment helper runs on the authorised SST Mac using its existing Wrangler authentication in memory. Stage, verify, write acceptance for the exact committed source, then activate. Route snapshot and partial activation records support exact owned rollback. Never overwrite a changed route owner. No credentials are stored in this repository.

Notes use no network, browser storage, account records or AI. Empty fields are optional. User-controlled copying/printing creates external copies. The client clears text on pagehide and back/forward cache restoration. Do not add analytics to the notes tool.

Official routes checked on 23 October 2026: NHS Talking Therapies England; NHS inform psychological therapy Scotland; NHS 111 Wales counselling; NI Direct mental health services. Existing urgent-support guide remains directly accessible. No charity or treatment partnership is claimed.
