# My Timber v1.1 — Connected Health declaration pack

Status: implementation candidate only. Do not alter the Google v1.0.0 release
currently under review. v1.1 requires fresh store declarations and signed-device
acceptance before submission.

## Product purpose

My Timber is a men's health and weight-management member app. Connected Health
removes repeated manual entry and lets a member choose to bring supported
measurements already held on their phone into their private My Timber account.

The integration is read-only. My Timber v1.1 does not write measurements back to
Apple Health or Health Connect and does not request clinical records. The server
schema also reserves a `shift_device` source so future SHIFT-branded BP/heart-rate
hardware can use the same validated member data contract once its BLE/vendor
protocol is selected and separately permission-tested.

## Requested categories and product use

- Weight — progress and weight-management journey.
- Body fat — optional body-composition progress.
- Blood pressure — BP monitoring and heart-health journeys.
- Heart rate / resting heart rate — heart-health and activity context.
- Oxygen saturation / respiratory rate / body temperature — supported vitals view.
- Steps / active energy / walking-running distance / exercise duration — Fit and Today.
- Sleep duration — sleep/energy context.

Do not add a permission merely because the platform supports it.

## Apple Health

Read-only HealthKit entitlement. NSHealthShareUsageDescription explains the
specific My Timber use. No Health Records entitlement. No background-delivery
entitlement in this candidate.

## Android Health Connect

Read permissions only:
- READ_WEIGHT
- READ_BODY_FAT
- READ_BLOOD_PRESSURE
- READ_HEART_RATE
- READ_RESTING_HEART_RATE
- READ_OXYGEN_SATURATION
- READ_RESPIRATORY_RATE
- READ_BODY_TEMPERATURE
- READ_STEPS
- READ_ACTIVE_CALORIES_BURNED
- READ_DISTANCE
- READ_SLEEP
- READ_EXERCISE

No write permission, background-read permission, historical-data permission,
exercise-route permission or location permission.

The Health Connect privacy-rationale activity displays the same My Timber privacy
URL used for the store listing.

## SHIFT-side controls

- Existing optional-health-tracking consent is required before server ingestion.
- The authenticated member ID is derived server-side; the client cannot select an account.
- Source record identifiers are hashed before storage.
- Input type, range, timestamp, batch size and payload size are bounded.
- Duplicate source records update the same stored record rather than multiplying data.
- Connected-health data is included in the member privacy export.
- Existing optional health-tracking erasure also removes connected-health readings/connections.
- Disconnecting a source stops the connection but does not silently erase historical readings.
- No health values are written to analytics/audit metadata.

## Release gate

Before v1.1 submission:
1. Apply migration 021 to an isolated preview database and prove schema.
2. Run API/auth/consent/erasure/export tests.
3. Sign an iPhone candidate with HealthKit capability and physically prove permission grant/deny/revoke and sync.
4. Sign an Android candidate and physically prove Health Connect availability, partial grant/deny/revoke and sync.
5. Confirm Settings and Today remain useful when permissions are denied.
6. Update Apple App Privacy and Google Data Safety/Health Apps/Health Connect declarations to match the exact permissions above.
7. Capture evidence from the exact signed candidate; then submit one v1.1 release.
