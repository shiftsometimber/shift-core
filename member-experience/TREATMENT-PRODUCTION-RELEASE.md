# My Treatment production release candidate

Prepared against main `afe0b80d3e7d7f813c53a659c619ba13b86f6ae4`. Feature remains disabled in production until the guarded release is reconciled and its exact additive schema is applied. No direct Worker deployment or production database mutation was performed.

Candidate includes the verified treatment model, API, PDF endpoint, phone notification subscription and scheduled dispatcher. It adds the existing account export and optional-health erasure connections, member ownership tests, production labels and a link from Saved & Records. Stored treatments are optional member-reported tracking, not prescriptions or clinically sourced partner records. No partner feed is implied.

The production `MY_TREATMENT_ENABLED` switch must be activated only after schema creation, exact source-scope adoption and the existing repository production workflow. Retain all current homepage, source, consent, current-main, rollback and live-preservation checks. Production cron currently runs every 15 minutes; browser push timing may be delayed accordingly. Native local reminders are refreshed on app entry with a 24-hour/session-expiry bound.

Release closure still requires:

1. Pin this exact candidate and successful integration proof into the current approved-runtime composition, without replacing another pending release or relaxing unrelated guards.
2. Apply `treatment.sql` additively with schema-definition verification and a runtime-only rollback receipt; preserve existing users, orders and data.
3. Enable the feature and verify signed-in create/edit/log/history/PDF/export/erasure and fresh-browser account separation on live traffic.
4. Run native iPhone/Android notification and PDF save/share acceptance. Build 4 compiles on both CI platforms; physical acceptance is not established by those builds.
5. Sign Android release bundle with the existing Play upload identity; upload and verify processing. Apple build4 signed archive/export is prepared on SST Mac.
6. Show any changed store review notes, reviewer messages or public release notes to Matt for approval before sending them. Preserve the existing build3 review unless an approved replacement submission is made.
