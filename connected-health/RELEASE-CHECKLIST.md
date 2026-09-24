# Connected health release checklist

Scope: optional read-only Apple Health / Android Health Connect import of weight, height, steps and sleep into the existing My Timber account.

## Already automated
Core/model/privacy/browser tests; complete iOS simulator composition; complete Android debug composition; Shift Master Integration Gate; Shift Whole-Estate Route Sweep. Production feature flag remains absent.

## Physical-device acceptance — required before enabling
Use fictional/test accounts only. On a signed iPhone candidate and a supported physical Android candidate: test all-four and partial permissions, deny-all, revoke later, empty store, existing readings, interrupted network and account switch. Verify source/date values in Settings/Progress and website/PWA read-back. Verify stop sync, withdraw personalisation and delete persist after refresh without changing Apple Health or Health Connect.

## Store/account gates
Apple identifier uk.co.shiftsometimber.mytimber: enable HealthKit capability, regenerate release profile, and prove the signed entitlement. Complete App Store privacy/review disclosures. Complete Google Play Health apps/Data safety declarations for the four read permissions and rationale.

## Data protection / operations
Review privacy notice and DPIA for purpose, lawful basis/special-category condition, retention, deletion and backup handling. Record rate-limit/abuse handling and support ownership. Rehearse production migration separately from code deployment.

## Release sequence
One signed candidate -> physical-device matrix -> evidence/checksum -> merge -> production schema migration -> enable feature -> smoke-test app plus website/PWA read-back. If a gate fails, keep the flag off and fix the same candidate.
