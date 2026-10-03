# My Timber health integration — build 3 candidate

Matt authorised both bridges on 3 October 2026 and specified heart rate, blood pressure and weight. Build 2 remains the previously uploaded app; build 3 must pass exact native/device acceptance before replacing it. This document does not claim store availability or device acceptance.

## Implemented boundary

Apple HealthKit and Android Health Connect read the latest available 50 records of each supported type from the last 30 days. The app first obtains explicit SHIFT import consent, then shows a native explanation and requests only read permissions. Every import is initiated in signed-in Settings; there is no background collection. A preview lets the member choose what to save. Native access is restricted to the exact owned HTTPS origin, main frame and Settings path. Navigation invalidates pending native responses. Each response and import is bound to the reviewed signed-in account.

The existing member account stores imported copies with type, units, source, measurement time and import time. Device readings do not replace manual Journey weights or treat ordinary heart-rate samples as resting heart rate. The server validates all fields, checks consent inside the database write, refuses concurrent overwrites and prevents duplicate source records. Imported history is capped at 500 readings; reaching the cap requires export/removal, not silent deletion.

Disconnect disables new imports; deleting imported copies also disconnects that platform. Both controls leave original phone health data intact. Existing export includes imported copies. Whole health-tracking erasure clears imported copies and withdraws both platform import consents. Readings are excluded from employer reports, advertising, prescribing and automatic clinical decisions. The app neither measures blood pressure nor monitors emergencies: a compatible cuff or existing recorded measurement is needed.

## Metrics to incorporate next

| Metric | Value in My Timber | Integration decision |
|---|---|---|
| Weight | See change over time, including readings from connected scales | Included now, normalised to kg; preserve manual entries and dates |
| Heart rate | A dated personal record of readings from an existing device | Included now; no resting label or clinical score inferred |
| Blood pressure | A dated paired cuff reading and provenance | Included now; paired systolic/diastolic in mmHg, not a watch estimate |
| Resting heart rate | More useful for longer-term personal trends than comparing arbitrary pulse samples | Next priority; use the platform's explicit resting-heart-rate type |
| Daily steps | Supports small movement goals and realistic progress | Next priority; platform daily aggregates and source reconciliation, never add overlapping devices |
| Sleep duration | Adds context to tired days and difficult weeks | Next priority; merge overlapping sessions/stages and distinguish missing data from zero |
| Waist | Useful alongside weight and existing Journey measures | Retain manual entry first; don't infer it from weight |
| Workout duration / walking distance | Can support Fit activity progress | Later, after source/deduplication and member-benefit review |
| Body-fat percentage / calories burned / HRV | Consumer estimates vary by device; easy to overinterpret | Defer; no automatic health or treatment conclusions |

Do not request extra metric permissions merely because the platform supports them. Each additional type needs a clear member benefit, consent wording, units/provenance tests and store disclosure.

## Store and physical acceptance still required

- Apple App ID/provisioning profile must include HealthKit; build 3 must be signed with the correct entitlement. Update App Privacy and HealthKit review notes truthfully.
- Play Health apps / Health Connect declaration: only READ_HEART_RATE, READ_BLOOD_PRESSURE and READ_WEIGHT; personal health/progress record use. Update Data Safety and review notes before distribution.
- Test denied access, partial access, no records, revoked access, paired BP, kg/lb conversion, repeat import, another account, navigation/logout while a preview is pending, offline save, disconnect, individual platform erasure and full privacy export/erasure on exact signed iPhone and Android candidates.
- Test with fictional entries in device health stores and consenting test accounts; no real-member data or production load exercise.
- Source/fixture/compile evidence is distinct from an observed device PASS. No bridge is advertised as available in build 2.

Primary implementation references checked 3 October 2026: Apple HealthKit setup and HKHealthStore documentation; Android Health Connect get-started, raw-data reads, HealthPermission, stable connect-client 1.1.0 and AndroidX WebViewCompat origin-scoped message listeners.
