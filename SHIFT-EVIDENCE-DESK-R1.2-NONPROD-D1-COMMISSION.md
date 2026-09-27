# Shift Evidence Desk — R1.2 Non-Production D1 Commission

## Inherited proof

R1.1 proved the first controlled source path in code and in a bounded live-source replay:

- the official GOV.UK Content API response is validated against the exact MHRA content ID and schema;
- the documented 29 January 2026 state changes to the official 5 February 2026 state;
- the structured `latest_update` fact hits `mhra-glp1-latest-safety-guidance`;
- the claim hits `/glp1-knowledge-centre.html` at `mhra-glp1-latest-safety-update`;
- the result is a red clinical-safety decision package;
- website, newsletter and social publishing remain locked;
- no model is called;
- the one-action stop prevents a subsequent fetch.

That proof ran against an in-memory database. It proves the adapter and governance path. It does **not** prove the deployed non-production persistence boundary.

## Honest gap

The repository currently contains `wrangler.my-timber-preview.template.jsonc` with the placeholder database ID `__PREVIEW_D1_DATABASE_ID__`.

R1.2 does not award credit for that template, a local SQLite database, an in-memory D1 substitute, a dry-run bundle, or a claimed deployment without a real D1 identifier and persisted query evidence.

The remaining job is narrow: bind one real, isolated, non-production Cloudflare D1 database and prove that the already-governed R1.1 path survives deployment and persistence.

## Commissioning boundary

R1.2 may:

- deploy the exact Evidence Desk candidate to the existing isolated preview Worker;
- bind a real D1 database created solely for non-production Evidence Desk commissioning;
- apply the existing Evidence Desk schema to that database;
- set `EVIDENCE_DESK_ENV=non-production` in that environment;
- commission the single `mhra-glp1-guidance-r11` adapter;
- replay the documented 29 January → 5 February 2026 MHRA change;
- expose a read-only Evidence Inbox in HQ for the persisted record;
- test and record the one-action shutdown.

R1.2 may not:

- bind or query the production D1 database;
- deploy Evidence Desk routes to production;
- call a model;
- draft or rewrite website copy;
- publish or roll back a website page;
- enable decision email;
- configure OAuth;
- connect newsletters or social channels;
- commission a second source;
- create a composer, approval control or distribution action in Evidence Inbox.

## Required environment proof

Before the replay starts, the commissioning record must capture:

- Worker name and preview URL;
- exact deployed commit;
- real non-production D1 database name;
- real non-production D1 database ID;
- proof the ID is not `__PREVIEW_D1_DATABASE_ID__` and does not equal the production database ID;
- applied migration/version record;
- `EVIDENCE_DESK_ENV=non-production` present in the deployed environment;
- website, newsletter, social and decision-email controls all equal to `0`;
- Evidence Desk and ingestion controls initially equal to `0` before the recorded commission action.

Any missing, placeholder, production-equal or unverified database binding is a hard failure. Do not continue to replay.

## Required persisted replay

The replay must use the non-production Worker and bound D1—not a direct function call or local test harness.

### First state — 29 January 2026

Record the documented official prior state:

- `latest_update.publicTimestamp`: `2026-01-29T14:20:34Z`
- source: `mhra-glp1-guidance-r11`
- claim: `mhra-glp1-latest-safety-guidance`

This establishes the persisted baseline. It must create one snapshot and no material-change event or package.

### Changed state — 5 February 2026

Run the commissioned adapter against the official GOV.UK Content API response. The persisted outcome must contain:

- a second timestamped snapshot;
- `material_state=material_change`;
- exactly one mapped event;
- the exact claim `mhra-glp1-latest-safety-guidance`;
- the exact page dependency `/glp1-knowledge-centre.html`;
- the exact content key `mhra-glp1-latest-safety-update`;
- exactly one decision package;
- `risk_lane=red`;
- `communication_class=clinical_safety`;
- qualified review required;
- medicines-communications review required;
- `web_eligible=0`;
- `newsletter_eligible=0`;
- `social_eligible=0`;
- one queued decision notification;
- auditable source, commissioning, observation and package records.

No content may be written to the website.

## Idempotency proof

Run the same 5 February official state again after the first package exists.

The second replay must:

- persist either a no-material-change observation or a documented not-due outcome;
- create no additional material event;
- create no additional decision package;
- create no duplicate notification;
- leave the original red package unchanged and open;
- retain all publication locks.

The acceptance query must show exactly one live package for the commissioned event. A duplicate package, even if both are locked, is a failure.

## Shutdown proof after persistence

After the baseline, event and package exist in D1:

1. execute the one-action Evidence Desk shutdown with a recorded reason;
2. verify `enabled=0` and `ingestion_enabled=0` in the persisted control row;
3. invoke the scheduled path again;
4. prove `sourcesChecked=0`;
5. prove no HTTP fetch reached the MHRA adapter;
6. prove snapshot, event, package and notification counts did not change;
7. prove the stop decision and reason were added to the audit trail.

Restart is out of scope for R1.2. The environment remains stopped after the proof.

## Evidence Inbox

HQ may show a read-only Evidence Inbox backed by the non-production D1 records.

It may display:

- source and authoritative URL;
- fetched and source-published timestamps;
- structured fact change;
- affected claim;
- exact page and content key;
- risk lane and communications class;
- required review gates;
- package state;
- publication locks;
- audit chronology;
- stopped/running control state.

It must not contain:

- a text composer;
- generated draft copy;
- **Approve** or **Publish** controls;
- social or newsletter actions;
- OAuth connection controls;
- model controls;
- editable evidence, claim or page mappings.

The Inbox is a window into persisted evidence, not a publishing desk.

## Exit table

| Gate | Required proof | Pass condition | Failure condition |
|---|---|---|---|
| Candidate identity | Deployment metadata | Exact R1.2 commit recorded | Different or unrecorded commit |
| D1 binding | Wrangler/deployment metadata and D1 query | Real isolated non-production ID | Placeholder, missing, production-equal or local-only database |
| Schema | D1 schema/version query | All Evidence Desk tables and indexes present | Missing or partial schema |
| Initial locks | Persisted control row | All controls off before commission | Any publishing or email control on |
| Commission | Persisted source, claim and audit rows | One active MHRA source and one exact claim map | Extra source, missing mapping or unaudited activation |
| Baseline | D1 snapshot/event/package counts | One snapshot; zero event; zero package | Baseline manufactures a change |
| Genuine delta | D1 records after official fetch | One mapped red event and one red package | Missing, unmapped, wrong lane or wrong page |
| Clinical gates | Persisted package | Both qualified and communications reviews required | Either gate absent |
| Publication locks | Persisted package and control | Web/newsletter/social all locked | Any eligible or enabled destination |
| Idempotency | Counts after second replay | Still one event, package and notification | Any duplicate live work |
| Inbox | HQ walkthrough | Persisted record readable and read-only | Composer, approval, edit or distribution action present |
| Shutdown | Control, audit and post-stop run | No fetch and no count changes | Any fetch or mutation after stop |
| Production isolation | Binding/deployment comparison | Production Worker and D1 untouched | Any production deployment, query or write |

Every row must be green. Partial completion is not R1.2.

## Stop conditions

Stop the commission immediately if any one occurs:

- the candidate database ID is missing, templated or matches production;
- the deployed commit cannot be proven;
- the environment is not explicitly marked non-production;
- a response fails identity, schema, size, content-type or redirect validation;
- the baseline creates a material event;
- the genuine delta maps to the wrong claim, page, content key or risk lane;
- the red package lacks either mandatory review gate;
- a second replay creates duplicate live work;
- any publication, model, email, OAuth, newsletter or social path becomes enabled;
- Evidence Inbox exposes a composer, approval or mutation action;
- shutdown fails to prevent the next fetch;
- any production resource is touched.

On stop, keep all records, record the reason, disable Evidence Desk and ingestion, and do not attempt an improvised workaround.

## Evidence bundle

The R1.2 checkpoint must contain:

- deployment metadata and exact commit;
- non-production Worker name and URL;
- non-production D1 name and ID, with production comparison recorded safely;
- migration output;
- commissioning response;
- persisted SQL results for source, claim, dependencies, snapshots, event, package, notification, audit and controls;
- first replay output;
- idempotency replay output;
- shutdown action and post-stop output;
- read-only Evidence Inbox screenshots or render proof;
- regression and source-gate results;
- a statement that production received no deployment, query or write.

Secrets, session material, private member data and production identifiers must not be placed in public logs or screenshots.

## Acceptance line

Use this sentence only when every exit-table row is evidenced green:

> R1.2 is in. Non-production D1 is bound. The R1.1 MHRA replay now persists one red clinical-safety package for `/glp1-knowledge-centre.html`. Inbox can read it. Publishing remains locked. Shutdown still prevents fetch. No model. No publication. Production untouched.

## R2 gate

R2 remains shut until the acceptance line is factually true and supported by the complete evidence bundle. A template ID, local database, in-memory replay or green unit test is useful engineering evidence; none of them is R1.2 commissioning proof.
