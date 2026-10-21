# My Timber: verify at the end

User authorised completing the questionnaire before email verification. Full SST footer is already live.

This candidate delays registration until the final step and atomically saves approved onboarding fields with user_auth and the session. Health data requires explicit consent. New onboarding accounts always require email verification. Database errors return 503 without the legacy fallback creating an account without answers. Password stays in memory and is cleared after submission; no browser persistence. Existing authenticated setup remains supported.

Release Core through the existing production pipeline first, then deploy the bundled static assets using the full-manifest-preserving Pages release. Do not publish the static change without the corresponding Core change. No homepage changes, migrations, real accounts or outbound emails performed.

Validation: six tests using an in-memory SQLite database exercise persisted data, transaction rollback, retry, consent filtering, preservation, validation and duplicate protection. Real signup and email verification acceptance remains outstanding.
