# Dave alias repair recovery checkpoint

- Defect source: fresh main Dave release run `31797697341`.
- Failure: authenticated A/B synthetic registrations rejected by the deliberately narrow production commissioning identity allowlist.
- Security decision: do **not** widen the allowlist.
- Repair branch: `fix/dave-release-commissioning-aliases`.
- Repair: A/B aliases now use the already-proven `shiftsometimber+structured-...@gmail.com` commissioning family.
- Added regression gate: `tests/dave-commissioning-alias-source-gate.mjs` + workflow.
- Next: PR -> CI -> merge if green -> fresh main Dave production release gate -> reconcile only from fresh retained evidence.
