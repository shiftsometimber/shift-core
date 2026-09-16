# Evidence Inbox connection closeout — 16 September 2026

HQ's read-only Evidence Inbox requested `/v1/hq/evidence-desk/{overview,sources,claims,events,packages}` from Core. Core never dispatched these paths, so authenticated requests returned `admin_route_not_found`. The operational Evidence Desk is intentionally a separate non-production Worker and database; mounting its full router against Core's production database would breach that separation and display the wrong records.

The repaired Core dispatcher uses the existing HQ session verifier and a read-only adapter. It has no commissioning, drafting, ingestion, review, publication, distribution or scheduling action. Every non-GET request is rejected. Without an explicit staging connection it returns HTTP 503, `evidence_inbox_not_connected`, and a human-readable explanation already displayed by HQ's existing error handler. It does not return invented zero counts or initialize an evidence schema. Existing HQ CORS handling is retained.

The candidate now binds the existing isolated database as `EVIDENCE_DESK_READ_DB` with `EVIDENCE_DESK_READ_ENV=non-production`. Deployment and ordinary authenticated HQ verification remain required. Its identity was verified from retained account-side commissioning output:

| Identity | Verified value |
| --- | --- |
| Isolated D1 name | `shift-evidence-desk-r12-nonprod-db` |
| Isolated D1 ID | `8cbbd1f2-86bb-47a3-9b1a-e4735c3252c3` |
| Cloudflare account | `9e5386dcf455be34c582d93f8bfc79e6` |
| Separate production D1 ID | `88f40aed-cb23-4372-8c94-8a73f48bc847` |
| Successful commissioning run | `33024036411`, job `98361039068` |

The [successful operational commissioning job](https://github.com/shiftsometimber/shift-core/actions/runs/33024036411/job/98361039068) records the `wrangler d1 list` result at `2026-08-26T23:37:56Z` with the exact isolated UUID/name and a passed account-side identity check. Its account matches the current production promotion workflow. The successful earlier R1.5 closeout run `33014060229` independently retains the same configured separation. This is existing-resource evidence; it does not assert that the connection has already been deployed or that current controls were read.

Before deployment, recheck the actual account-side identity, existing schema and control row using the read-only verifier. The deployment job already supplies the verified `CLOUDFLARE_ACCOUNT_ID` and its existing provider credentials:

```bash
npx wrangler d1 list --json > "$RUNNER_TEMP/evidence-inbox-databases.json"
node scripts/verify-evidence-inbox-connection.mjs --sql > "$RUNNER_TEMP/evidence-inbox-read.sql"
npx wrangler d1 execute EVIDENCE_DESK_READ_DB --remote --config wrangler.jsonc --json --command "$(cat "$RUNNER_TEMP/evidence-inbox-read.sql")" > "$RUNNER_TEMP/evidence-inbox-read.json"
node scripts/verify-evidence-inbox-connection.mjs "$RUNNER_TEMP/evidence-inbox-databases.json" "$RUNNER_TEMP/evidence-inbox-read.json"
```

The verifier refuses a different account, database identity, production DB alias, missing tables, missing control row or failed query wrapper. It reads table names and control flags only; no article bodies or package content are logged. It does not modify or require any particular enabled/disabled state: the existing isolated service's actual controls are preserved.

After deployment, use an ordinary authorized HQ session to confirm the five responses and displayed staging controls. The separate service retains its own shutdown, review and destination authorities. Showing its state enables no operational action. The current HQ UI displays an explanatory error on connection failure but retains its initial loading labels until the connection succeeds.

Validation: `node --test tests/evidence-desk-hq-read.test.mjs` exercises the actual production Worker dispatcher, session rejection, exact UI response shapes, read-only SQL, no production database fallback, missing-schema failure, rejected mutations and hostile-origin CORS.
