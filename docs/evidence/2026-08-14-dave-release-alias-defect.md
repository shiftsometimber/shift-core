# Dave production release gate — commissioning alias defect

Fresh main run `31797697341` failed closed in the authenticated isolation leg after the production commissioning allowlist correctly rejected the synthetic addresses used by `finish-authenticated-production.mjs`.

Observed failure: `register A failed: 403 {"ok":false,"error":"commissioning_identity_email_rejected"}`.

This is a commissioning-harness defect, not authority to broaden production authentication. The onboarding proof in the same estate already uses the accepted `shiftsometimber+structured-...@gmail.com` family successfully.

Repair: keep production security unchanged and move the two synthetic A/B isolation identities into that existing narrow structured alias family. Add a source gate so the broad rejected form cannot silently return.

No PASS is claimed by this document. The unchanged fresh Dave production release gate must run green after merge/deployment before the release evidence can be reconciled.
