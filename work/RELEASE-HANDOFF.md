# SHIFT for Work — controlled release handoff

Status: built and exercised on isolated staging. No production promotion or real pilot commissioning has occurred. This record describes the existing implementation; it does not approve a contract, DPIA, clinical service or retention schedule.

## Release contents and destinations

| Component | Reviewed source / destination | Current state |
| --- | --- | --- |
| Workplace Worker | `feature/shift-for-work-20260912`, `work/` plus two additive Worker entry changes | Isolated candidate |
| Commercial Pages payload | `recovery/pages-access-20260911`, commit `2002cc69fc4f399171a60ca039b59a56fd5f6bbd` | Approved preview; recheck branch before promotion |
| Pages fingerprint | `6d31ed83d4915f958c25bbd002393661ba03b31f7968a60c91a70b331f04aa52` | Exact existing payload; do not rebuild from an older ZIP |
| Hosted workplace staging | `shift-core-work-staging.matobrien.workers.dev` | Separate Worker and two separate D1 databases; 48-hour route expiry |
| Public proposition | `/shift-for-work`, `/downloads/SHIFT-for-Work-Proposition.pdf` | Approved content; numeric prices removed |
| Production bindings | `WORK_DB`, `WORK_V1_ENABLED`, `WORK_PILOT_COMMISSIONED` | Not configured by this work |

The homepage, ticker, shared navigation, approved image, Treatment Centre correction and PDF are outside this change. Do not merge the Pages recovery branch wholesale into the Worker candidate. Review the deployment-source relationship before promoting either component.

## Commissioning records needed before employee invitations

| Record | Must establish | Responsible role to assign |
| --- | --- | --- |
| Employer agreement | Cohort dates, actual eligible group, seats, fee or explicit waiver, deliverables and human support limits | SHIFT commercial owner |
| Privacy review | Data map, controller/processor decisions, lawful basis, appropriate notices, DPIA and contextual reporting decision | Accountable privacy owner/reviewer |
| Data lifecycle | Account export/deletion includes WORK_DB, retention/deletion schedule, revoked IDs, rate-limit rows, audit and D1 backup handling | Privacy owner and operator |
| Delivery readiness | Approved content, response times, complaints/escalation and safeguarding boundaries | Delivery owner |
| Browser acceptance | Physical iPhone/Safari and Android verification, keyboard and assistive-technology needs | Release reviewer |
| Production release | Exact Worker/Pages candidates, existing production version and rollback target, scoped database/binding configuration | Release owner |

These roles and decisions are not assumed to have been assigned or approved. A reference entered in HQ is a pointer to an actual reviewed record, not a substitute for one. Partner testing terms remain outside this release: ordering is hard-disabled.

## First real cohort procedure

1. Finish the records above and preserve the approved contract/readiness reference. Keep personal health information out of workplace configuration and employer reporting.
2. Capture the current production Worker version, exact Pages deployment and relevant backup/restore information before any production change. Provision a separate workplace database; verify its ID differs from the consumer/clinical DB. Apply only `work/migration.sql` to that workplace database.
3. Deploy the reviewed Worker with the feature off. Confirm normal public pages and free My Timber entry still work. Then bind WORK_DB and expose the feature only for the reviewed release; leave commissioning off until the agreed pilot is ready. Do not copy the staging flags, test users, public fictional invitation, layout routes or relaxed fictional fixture policy into production.
4. Use the existing HQ owner/admin/operations session to create the employer/cohort draft. Confirm dates cover exactly 84 days. Leave unconfirmed pricing blank; enter zero only for an agreed waiver. Set actual support limits. Grant reporting access only to verified existing employer-contact accounts, separate from employees in that cohort.
5. When commissioned, enable the commissioning flag, activate against the real readiness reference, issue an expiring code, and distribute it through the agreed private general invitation. A shared code grants a bounded entitlement after ordinary sign-in; it does not prove employment. Employees choose whether to claim it.
6. Confirm the employee can return through My Timber, see the shared start and save a weekly review. Confirm the employer contact cannot access named memberships or health answers. SHIFT-only membership lookups are audited. Testing remains unavailable.
7. At the end of the cohort, review the fixed candidate report against the real group, known participation, other disclosures and invoicing. Withhold all figures if needed. Release once only; never treat seat capacity or thresholds alone as proof of anonymity.

## Stop and rollback controls

| Situation | Control | Effect / limit |
| --- | --- | --- |
| One cohort needs to stop | Pause it in HQ | Blocks new claims and review updates; records remain |
| All pilots must stop accepting participation | Set `WORK_PILOT_COMMISSIONED` absent/false | Blocks all claims/reviews and activation; routes/data remain |
| Workplace feature must disappear | Set `WORK_V1_ENABLED` absent/false | Workplace routes return 404 and the My Timber card is absent; data remains |
| Worker deployment regression | Roll back to the production version captured before release | Does not reverse D1 writes or delete records |
| Public employer page regression | Restore the captured exact Pages deployment | Preserve the Treatment Centre correction and other current content |
| Leaked invitation | Revoke that code; issue a replacement if appropriate | Existing valid memberships are not automatically removed |
| Wrong report contact | Revoke reporting grant in HQ | Stops future access; cannot recall already viewed/downloaded reports |

Never delete a database as rollback. Account deletion and scheduled retention are separate approved procedures. No production command is included with guessed database IDs, secrets or rollback versions.

## My Timber entry evidence

The authoritative Pages dashboard has SHA-256 `e030aee40a5d72441c7060a540ca8c1702b76ff76ff6bca94b4db53ded8a7d78`, matching the pinned dashboard return-function contract. The workplace routes send signed-out employees and employer contacts through `/member/dashboard?returnTo=...`; a test passes those actual redirects through the existing destination function. The new card is injected only for an authenticated account when the feature flag is enabled. Existing HTML preservation is tested. This is source/runtime compatibility evidence, separate from the already completed staging browser journey; it is not a new production sign-in UI acceptance claim.
