# My Treatment production release

Owner-authorised prescribed medicine tracking only. No peptides or research compounds.

Integrated against main `92a5b8d280b090e609b8f14ed5adf5393bc355f0`, preserving Today, navigation, homepage and Start Here. Adds My Treatment to Saved & Records. Includes account-owned treatment and repeat history, other treatment records, member-disclosed medical history, check-ins, chosen PDF export, privacy export and optional tracking erasure.

The existing guarded main production workflow remains the sole deployment route. Exact additive schema migration preserves existing schema and customer rows; incompatible definitions fail closed. A single MY_TREATMENT_ENABLED flag activates the feature. The workflow retains all existing tests, live checks and owned rollback and adds exact treatment delivery and unauthenticated API checks.

Release status: candidate; not yet merged, deployed or live verified. Native Apple build 4 uploaded, processing/TestFlight availability unverified. Google upload-key discovery and signed build remain outstanding. Native notification receipt and PDF sharing require physical devices. Browser reminders use the existing 15-minute production cron, so delivery can be delayed. Local native notifications use a bounded 24-hour authenticated lease, refresh on reopening and require permission. No automatic prescription, dose or next schedule decisions.

Evidence: prior candidate CI 37845442250 had 345 passing tests and one skip. This rebased candidate must obtain fresh passing release-scope and full member checks before merge. Actual signed-in production save/reload/account isolation/PDF/export/erasure acceptance remains required after deployment. No partner clinical feeds or verified clinical records are claimed.
