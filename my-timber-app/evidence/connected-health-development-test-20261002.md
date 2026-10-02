# Connected-health development test — 2 October 2026

## Follow-up implementation, 2 October

The private development setup and sync-feedback fixes are now prepared in the
same v1.1 draft. **34 software tests pass locally**, including five two-account
harness tests and five rendered-state/feedback tests in addition to the original
24. Native compilation and 53 policy/sleep checks per platform are required on
the follow-up commit before a device-ready build is claimed.

- Release health uploads are disabled. Debug requires a non-production HTTPS
  build setting, a verified test-service marker and optional tracking consent.
- A separate private Worker/D1 harness is prepared, with fixtures 101 and 102,
  an access-code gate and a production-database-ID check. It is **not provisioned**.
- Both clients refuse redirects and check for an account change before upload.
- iOS empty results no longer claim that read access was granted. Android returns
  explicit denied/unavailable/empty/error/saved results.
- Sync messages persist; consent withdrawal clears rendered readings; each
  reading shows its observation time. Old daily totals are not labelled today.
- Sleep uses the latest actual-asleep episode, merging overlap and excluding
  awake gaps. Pure Java/Swift calculations require the CI checks; OS/source
  semantics and all physical-device scenarios remain unproven.

See [private test setup](../health-test/README.md). The older findings below
record the starting state; they do not imply those source defects remain open.
Both connected Macs remain offline. No hosted database/service, real health-data
import, production deployment or store submission was performed in the follow-up.

## Verdict

Development testing can happen before either app is publicly released. The
current v1.0 app does not contain these native bridges. This evidence concerns
the separate, unreleased v1.1 candidate in draft PR849, tested at source commit
`305711749279496e18b892f262efd660711dc25f`.

**24 software tests passed locally; physical-device health sync is unproven.**
No production request, real health-data import, permission grant, purchase,
store submission, backend activation or deployment was performed.

## Evidence

Run with Node 24.19.0 in an isolated workspace:

```sh
node --test member-experience/tests/device-health-sync.test.mjs \
  member-experience/tests/device-health-route.integration.test.mjs \
  my-timber-app/tests/source.test.mjs
```

The new 15 route tests import the candidate's actual authentication, consent,
route implementation and database migration. They use synthetic members and
readings in an in-memory SQLite database with a D1-compatible test adapter.
This validates SQL and API behaviour locally, rather than production Cloudflare
D1, native HealthKit/Health Connect calls or signed-device entitlements.

| Check | Result |
| --- | --- |
| Schema unavailable fails closed | Passed |
| Missing, expired or revoked session rejected | Passed |
| Explicit health consent and withdrawal | Passed |
| Foreign/missing request origin rejected | Passed |
| Apple/Android import, canonical units, source-ID hashing | Passed |
| Retrying the same source reading avoids duplication | Passed |
| Same source ID in separate accounts remains separate | Passed |
| Latest value chosen by observation time | Passed |
| Invalid mixed batch, request size and record-count bounds | Passed |
| Save failure reports failure, rather than success | Passed |
| Disconnect limited to member/platform, retains history | Passed |
| Privacy export scoped to member, excludes source hashes | Passed |
| Account deletion removes connected-health data | Passed |
| Private, non-cacheable, non-indexable API responses | Passed |
| Existing reading validation (3 tests) | Passed |
| Existing native-shell/source checks (6 tests) | Passed |

The candidate also has historical native compilation evidence on 29 September:
[native build run 36576060680](https://github.com/shiftsometimber/shift-core/actions/runs/36576060680).
At the exact tested source commit, its Android development APK and unsigned
release bundle passed compilation; iOS Debug and Release **simulator** builds
passed. This is not an iPhone IPA or device permission/sync result.

## Issues found before device acceptance

1. **Test isolation:** both native import clients hard-code the production
   service. The contract explicitly says the backend is not an isolated test
   database. A debug package identifier alone does not isolate health data.
   Provision an isolated backend/database with the migration and consent flow,
   and configure a matching native development origin before device imports.
2. **iOS connection messaging:** an empty HealthKit result says Apple Health is
   connected. Empty results cannot prove that read access was granted. Use
   neutral wording and test denial, partial access, no data and revoked access.
   The native completion event also needs visible, persistent feedback in the
   settings screen rather than being lost during reload.
3. **Android failure feedback:** unavailable Health Connect, denied permissions,
   empty results and caught sync errors currently finish the activity without a
   useful result message. Add an explicit outcome and retry guidance.
4. **Reading integrity still needs device proof:** verify imported timestamps,
   daily boundaries, percentages, paired blood pressure, overlapping sleep
   records, same-source retries, and multiple source devices against the OS
   health store. The iOS sleep implementation sums two days of samples; the
   Android implementation takes the latest session. These are not equivalent
   and overlapping sources may distort totals. Do not treat the existing
   software checks as proof that displayed health values are correct.

## Device acceptance still pending

Both connected Macs were reported **offline** during this check. No currently
connected Android device was evidenced.

| Scenario | iPhone / HealthKit | Android / Health Connect |
| --- | --- | --- |
| Development build installed, isolated destination confirmed | Not run | Not run |
| Grant all, grant selected types, deny all | Not run | Not run |
| Known synthetic weight, steps, sleep, BP and heart-rate values | Not run | Not run |
| Freshness, units and repeated sync | Not run | Not run |
| OS permission revoked; missing/empty health store | Not run | Not run |
| Logged out, expired session, offline/rejected save | Not run | Not run |
| Switch account; health data stays with the intended account | Not run | Not run |
| Disconnect; no further import without explicit reconnection | Not run | Not run |
| Confirm no writes back to OS health store | Not run | Not run |

Next physical prerequisite: reconnect the development Mac, attach/unlock the
iPhone, and use a separately signed development build with HealthKit capability.
The tester must make the OS permission choices. Android test data can be seeded
with the official [Health Connect Toolbox](https://developer.android.com/health-and-fitness/health-connect/test/health-connect-toolbox).
Public store release is not the testing gate; test isolation, native signing,
available hardware and actual consent are.

This candidate remains a draft. No claim that connected health is live, device
proven or ready for members is supported by this report.
