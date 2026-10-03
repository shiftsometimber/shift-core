# Connected-health development follow-up — 2 October 2026

**36 software tests passed locally. Native builds and compiler checks passed.**

The native implementation is commit `72d1cc866779f48786b304aeec79b761bf512f33`:
[Android and iOS build receipt](https://github.com/shiftsometimber/shift-core/actions/runs/37039153371).
Android development APK and unsigned release bundle compiled successfully.
iOS Debug and Release simulator apps compiled successfully. The compiled Java
and Swift navigation/sleep checks passed **53 cases each**. None of these is a
physical-device HealthKit/Health Connect permission or sync result.

[Health API, private-harness and feedback CI receipt](https://github.com/shiftsometimber/shift-core/actions/runs/37039153202)
passed on the same implementation commit. A final API validation correction
rejects null/blank/boolean measurements and inherited type names; two additional
regressions pass, bringing the local total to 36. That final correction does not
change native files. [Final validation CI](https://github.com/shiftsometimber/shift-core/actions/runs/37039793777)
also passed on source commit `a60d2492e73be6c5026b3b8662a3690158bfea69`.
Subsequent evidence-only updates do not change the tested code.

## Delivered in the separate v1.1 draft

- A private two-member acceptance harness using the actual health routes, SQL,
  authentication, consent and connected-health UI; no treatment, payment, email
  or AI handlers. It requires a separate database and private access code.
- Build-time test origins with production domains and database IDs blocked.
  Health uploads remain disabled in release builds and unconfigured debug builds.
- Native preflight verifies the test-service marker and health consent before
  opening OS permissions. Uploads refuse redirects and account changes.
- Honest empty/denied/unavailable/error/saved outcomes that persist on screen.
- Consent withdrawal clears displayed readings; observation times are shown;
  old daily totals are not presented as today's values.
- Actual-asleep durations from the latest episode, with overlap removed and
  awake gaps excluded; missing Android sleep stages are omitted.
- Strict numeric reading validation. Missing measurements cannot become zeros,
  and malformed inherited type names cannot throw out of the normaliser.

## Still pending

No separate hosted test Worker/D1 database was provisioned. Both connected Macs
remain offline. A signed iPhone build and Android device/emulator acceptance are
not run. Real OS permission, revocation, read integrity, disconnect, session and
account-change behaviour must pass before activation for members.

[Private service setup and device checklist](../../my-timber-app/health-test/README.md).
This note supersedes the earlier starting-state findings in the app evidence
report. Production and the v1.0 store-review build were not changed, and no
health data was imported from a real device.
