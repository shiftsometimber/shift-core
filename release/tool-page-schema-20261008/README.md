# Nine-page tool markup repair
Production repair published on 8 October 2026. This directory contains the exact nine repaired HTML snapshots, manifests, scope proof and deployment/live verification receipts. Public HTTP and structured data were independently rechecked on 9 October.

## Run the current read-only check
Use Node 20 or later:
```sh
node scripts/verify-tool-page-schema.cjs
```
Success requires every URL to return 200, parse all JSON-LD, contain one canonical free-access WebPage with its expected identifier, and contain no software/application item. A failed URL returns an error and makes the command exit non-zero. The command does not change production.

## Release procedure
`scripts/tool-page-schema-release.cjs` separates prepare, publish and verify. Preparation captures the serving production manifest, limits edits to the nine named pages, proves visible HTML and calculator scripts unchanged, and preserves all unrelated assets. Publication requires a passing preview and refuses a changed production baseline. Verification records success only after origin-byte and public-schema checks pass. It needs the authorised Mac's existing Wrangler OAuth configuration and the blake3-wasm dependency. Never reuse this historical directory for a new prepare or publish; capture a fresh production baseline in a new directory.

## Completion boundaries
The repair does not request Google software rich results and does not invent reviews. The serving runtime's three pre-existing Article-logo omissions are recorded explicitly. The historical byte comparisons preserve calculator code; they do not claim interactive calculator tests. No ranking or AI-citation uplift has been measured. A fresh Semrush audit remains unconfirmed. This is an executable release and verification workflow, not a persistent autonomous agent team. This branch is a source/evidence archive; it is not a merge to main or a new deployment.
