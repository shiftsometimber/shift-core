# Shift Evidence Desk — R1.1 MHRA Commission

## Single commissioned source

R1.1 adds one adapter only: the official GOV.UK Content API representation of the MHRA publication **GLP-1 medicines for weight loss and diabetes: what you need to know**.

- Canonical page: `https://www.gov.uk/government/publications/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know`
- Structured endpoint: `https://www.gov.uk/api/content/government/publications/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know`
- GOV.UK content ID: `2c9b4641-74ac-43e6-bbd6-7b1a34c13bc9`
- Shift dependency: `/glp1-knowledge-centre.html` → `mhra-glp1-latest-safety-update`
- Lane: red / clinical safety

## Proven path

The adapter validates the exact GOV.UK content identity and schema, reads a bounded JSON response, and extracts the guidance summary and latest official change-history entry. A changed `latest_update` fact creates:

1. a timestamped evidence snapshot;
2. an exact hit on `mhra-glp1-latest-safety-guidance`;
3. an exact dependency hit on `/glp1-knowledge-centre.html`;
4. a red decision package requiring qualified and medicines-communications review;
5. a queued decision and complete audit record.

The live commissioning proof replays the documented 29 January 2026 official state against the current official GOV.UK response, whose latest change is dated 5 February 2026. It therefore proves a genuine historical source transition rather than a made-up text mutation.

## Failure posture

- Redirects, non-JSON responses, oversized bodies, HTTP errors, missing facts, content-ID drift and schema drift fail closed.
- Adapter failure creates an audited failure record and no evidence snapshot or package.
- Commissioning is rejected unless `EVIDENCE_DESK_ENV=non-production`.
- The global stop prevents any adapter fetch.
- Website, newsletter and social publishing remain off.
- No model is called.

## Next decision

Review the R1.1 proof. Do not commission a second source and do not implement website publishing until this exact change-to-package path is accepted.
