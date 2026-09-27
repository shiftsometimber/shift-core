# Dave fresh onboarding — production evidence

## Scope

This evidence reconciles the previously unproven automatable Dave `onboard` leg only. It does not promote real inbox registration/verification/recovery or partner-dependent treatment support.

## Demonstrated journey

PR #163 added a fresh production onboarding acceptance to the existing serious authenticated member-product commissioning path and merged to `main` as `49e703f6c8e4687213a9d4b55cb74ad7739a8b3d`.

The acceptance creates a fresh synthetic member with no existing profile, confirms the initial empty member state, saves the actual onboarding profile through the production member-state route, then opens a new authenticated session and proves the saved profile is retained. The retained profile includes target-weight and safety/preferences data, including pelvic-health / safer-alternatives context, and the rendered My Shift surface must show the personalised `Your Shift starts here` outcome plus the retained member preferences.

The unchanged post-merge **Shift Production Commissioning** run `31716018423` on `main` completed GREEN. Its production job `94498698730` completed GREEN, including the serious authenticated journey step that imports and executes the fresh onboarding acceptance.

This is therefore not a source-only or merge-green claim: the production journey executed after merge, retained state across a new authenticated session, and demonstrated the expected member-facing outcome.

## Reconciliation

- Dave `onboard`: **AMBER -> PROVEN**.
- Dave reconciled coverage: **15/20 -> 16/20** non-duplicated legs (**80%**).
- Remaining human-only legs: `register`, `verify`, `account_recovery`.
- Remaining external BLOCKED leg: `treatment_support`.
- No adjacent audit row is promoted by association.
- `G5-013` remains **AMBER** until the complete Dave acceptance boundary is satisfied.
