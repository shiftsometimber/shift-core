# Shift Evidence Desk — Foundation R1

## Delivered

- Allowlisted authoritative-source registry for MHRA, NICE, NHS, eMC, manufacturers, clinical trials and verified UK providers.
- Timestamped snapshots with structured fact extraction as the material-change authority. Raw page hashes are retained as evidence but cannot create a publishable event by themselves.
- Claim library and exact claim-to-page dependencies.
- Governed evidence events and review packages with green, amber and red lanes.
- Separate qualified-clinical and medicines-communications gates.
- Recorded decisions including **Approve web only**, hold, return, reject and **No publication justified**.
- Decision-only email queue. A missing email binding leaves work queued for safe retry.
- HQ decision surface, audit history and a one-action global stop control.

## Deliberately locked

- Evidence-source polling adapters are not activated.
- Website publication and rollback are not implemented in this checkpoint.
- Newsletter and social distribution are locked.
- No social OAuth or channel connectors exist.
- No model generates or changes evidence, claims, decisions or publication state.
- No clinical-review authority is implied; an exact package requires a recorded qualified reviewer where the red lane applies.

## Control posture

The migration creates the desk disabled, with ingestion, decision email, website publication, newsletter and social controls all off. Mutating API routes are role-restricted. Observations, package creation and decisions fail closed while the desk is sealed. The kill action disables the desk and every downstream control in one recorded operation.

## Verification

- Evidence Desk unit tests: 11/11 passing.
- Full repository tests: 130/130 passing.
- Evidence Desk backend and HQ source gates passing.
- Existing M04 route, commissioning, production-independence and master-integration gates passing.

## Next explicit decision

Activate one structured primary-source adapter in a non-production environment and prove one real source change maps to one correct claim and page. Do not open website publication until that evidence can be reviewed, approved and rolled back deterministically.
