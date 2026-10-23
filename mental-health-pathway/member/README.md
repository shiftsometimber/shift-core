# My Timber saved support follow-through

Owner instruction: “We need to sort this bit; My Timber saved follow-through/reminders.” Continues the already approved Good to Talk pathway.

A private member can explicitly consent to save one structured next step, one progress status and an optional reminder time. No appointment notes, symptoms, diagnostic scores, conversations or AI content are saved or sent. The support record is separate from programme recommendations. No referrals, charity sharing, clinical assessment or clinical monitoring are created.

The member can update progress, mark a step complete, remove a reminder, disable device notifications or delete the saved step and device subscriptions. Consent/change records retain a minimal tombstone to reject stale cross-tab saves after deletion. Privacy export includes the structured record and neutral delivery history, excluding notification endpoints and keys. Existing optional-health erasure, account-deletion requests and withdrawal of optional health tracking clear the new support data via narrow wrappers; account deletion also retains the existing human review/clinical-retention process.

Reminders: in-app saved date; optional neutral private .ics file, which must be imported and managed in the member’s calendar; optional explicit device subscription using the existing VAPID identity and service worker. A dedicated five-minute cron delivers at most once per reminder/device, including after ambiguous transport failures. Reuses valid authenticated sessions, respects logout/expiry, email verification, opt-out, completion and consent withdrawal. Delivery can be up to five minutes after the selected time, subject to device/provider availability. It is not a guaranteed or emergency alert. No emails or SMS are sent. No test notifications to real members.

Deployment is a separate presentation/API service, not a Core deployment. It delegates the existing dashboard, Good to Talk and privacy handlers to their current owning services. All exact previous route owners are retained for owned rollback, and no stock/clinical/homepage settings change. Three new narrowly named tables are created in the existing account DB; no new database/service subscription or third-party account is provisioned. The Worker has no email binding or API secrets.

Build: `node mental-health-pathway/member/build.mjs`; `node --test tests/support-followthrough.test.mjs tests/mental-health-pathway.test.mjs`; `node node_modules/wrangler/bin/wrangler.js deploy --dry-run --config mental-health-pathway/member/wrangler.jsonc --outdir PATH`.

Deployment helper uses the existing authorised SST Mac Wrangler session without exporting credentials. Stage does not configure cron or public routes. Activate requires the exact source/bundle acceptance record. Rollback first disables the schedule, then restores only owned routes and preserves saved data.
