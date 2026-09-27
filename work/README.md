# SHIFT for Work implementation candidate

Matt authorised the full build on 12 September 2026, including company invitation codes and SHIFT-only membership administration. This implements the workplace layer in the existing account/Worker project. My Timber remains free. Employer delivery fees stay private and unconfirmed until agreed. The proposition PDF is already approved and is not changed by this build.

## Implemented

- HQ employer/cohort records: a twelve-week shared start, end date, 1–150 seats per cohort, scoped deliverables, written human support limits, private agreed fee or explicit waiver, proposed testing allowance and employer reporting contacts. Multiple records are supported; the first version intentionally bounds each cohort.
- Existing member sign-in followed by a voluntary company-code claim. No work email or manager-enrolled account required. A flag-gated card in the existing My Timber dashboard links to the form. Signed-out visits return through the existing dashboard sign-in with the workplace destination.
- Cryptographically random codes, SHA-256 storage, one-time display, expiry, revocation, rate limiting and atomic seat claims. A shared code is a bearer invitation, not proof of employment. Distribute privately; use an agreed eligibility check if a contract requires it. It never replaces account authentication.
- Joining before the common start reserves a seat; the twelve weekly reviews open against the shared calendar. They link to existing Journey, Grub, Fit and check-in tools. The workplace code does not enable the separate Programme feature or bypass its content/commissioning gates.
- Employee membership view, review completion, own-data download and withdrawal. Withdrawal deletes that workplace link and its review history, leaving the free account intact.
- HQ-only company membership lookup with account ID/first name and access status. Every lookup is audited. No health answers or individual review completion are returned in this operational view. Individual entitlement revocation blocks rejoining and removes workplace review history; restoring permission requires another voluntary claim.
- Existing HQ sessions/roles (owner, admin, operations) operate the service. Employer reporting contacts use separate ordinary member sessions scoped to explicitly granted organisations. Reporting grants can be revoked without reopening a contract. An employee enrolled in a cohort cannot become its employer reporting contact.
- Employer dashboard with one immutable, manually reviewed closing report. It reports participation, not health outcomes. Generic codes do not prove invitations delivered; no invented invitation count is shown. Wellbeing changes are marked not collected. Small or inferable groups are suppressed, potentially leaving no numeric report.
- Testing allowance metadata and a fail-closed ordering boundary. No supplier API, kit reservation, order, payment, result storage, named redemption report or clinical advice is created. There is deliberately no flag that makes a test order succeed. Supplier integration requires an explicitly reviewed later change.

## Entry points

| Audience | Page | API |
| --- | --- | --- |
| Employee | `/member/work` | `/v1/work`, `/join`, `/review`, `/withdraw`, `/export` beneath `/v1/work` |
| Employer contact | `/employer/work` | `/v1/employer/work` |
| SHIFT operator | `/hq/work` | `/v1/hq/work` |

Employer setup is the authenticated HQ onboarding form; it is not a public manager self-enrolment flow. Invitations are issued and distributed manually. No email has been sent by this work.

The public employer proposition remains `/shift-for-work` with the approved PDF and existing enquiry route. The separate `/shift-work-preview` views are fictional UI review material only, not an employee invitation or launch link. Do not use them for outreach.

## Data and responsibility boundary

`WORK_DB` is a separate D1 binding. `work/migration.sql` must never be applied to the consumer/clinical `DB`. The original member/HQ stores are used for their existing session verification and a bounded account-name lookup only; existing session last-used timestamps continue to update. The new HQ adapter reuses the existing verifier without invoking legacy automatic schema creation or bootstrap credentials.

Each employer record stores contract configuration, member account links, joining date, accepted notice version, weekly completion numbers, blocked account IDs, hashed invitations, bounded operator audit and the fixed released report. It stores no diagnosis, message, weight, waist, blood result or free-text health answer. A separate rate-limit table stores account ID, minute bucket and attempt count. No workplace data is put in browser storage, analytics, URLs, public Pages assets or third-party requests.

The joining checkbox records a voluntary programme choice and notice version. It is not a determination of the UK GDPR lawful basis or explicit clinical consent. Controller/processor roles, legal basis, notices, retention periods and the DPIA remain commissioning decisions. No software flag or readiness-reference string constitutes approval.

SHIFT membership administration is personal data accessible to authorised SHIFT staff. It is separate from the employer report. Any authorised test provider would receive information through a separate individual clinical pathway, once commissioned. Testing can be declined without losing programme access. A lifestyle Health MOT is a questionnaire, not a blood test or medical examination. This service does not discharge occupational health or statutory surveillance obligations.

## Reporting rules in this candidate

- No report before the cohort end. A SHIFT operator previews the candidate and records a contextual review reference before releasing it once.
- Activation count requires at least 20 participating accounts and a complement of at least 10 against the recorded cohort seat allocation. Numeric values round down to five.
- Engagement/completion require at least 20 participating accounts, at least 10 in the reported category and at least 10 outside it.
- No arbitrary slices, team/site filters, live participation list, personal outcomes or report refresh. Repeated access returns the same released snapshot. Revoking a contact ends API access; it cannot recall a previously downloaded report.
- Seat capacity is not proof of the actual eligible population. The contextual review must consider actual workforce size, known participation, overlapping cohorts, previous disclosures and invoices. Withhold the entire report if necessary. Thresholds do not establish legal anonymity by themselves.
- Testing invoice frequency, quantities and amounts must be reviewed for identification risk. The implementation does not promise at-cost, redemption-only billing, no minimums or any unconfirmed supplier terms.

## Commissioning and release

1. Review the contract, data map, roles, lawful basis, notices, DPIA, support limits and safeguarding/clinical boundaries. Set approved retention/deletion procedures and reporting parameters. Confirm actual partner terms before enabling any new testing integration.
2. Complete the existing Programme/content gates wherever those services are included in the employer contract. This workplace calendar is not a substitute for reviewed content or a delivery team.
3. Provision isolated staging D1 first; apply `work/migration.sql` only there. Bind `WORK_DB`. Leave production configuration untouched. `WORK_V1_ENABLED=true` exposes the new routes; without it they return 404. `WORK_PILOT_COMMISSIONED` must remain absent/false until employee onboarding has genuinely been commissioned.
4. Test with existing separate staging member/HQ accounts, grant employer reporting access manually and verify revocation. Confirm the actual sign-in return journey, mobile, keyboard, bfcache and sign-out behaviour in supported browsers before release.
5. Confirm the reviewed deployment source and Pages/Worker compatibility, back up relevant stores, and obtain production release approval. There are no work flags or work bindings in the production Wrangler configuration in this candidate.
6. Only after approval set `WORK_PILOT_COMMISSIONED=true`, record the reviewed contract/readiness reference and agreed fee (zero means an explicit waiver), activate the cohort and issue codes. Pausing a cohort prevents new claims/reviews. Turning commissioning off blocks all employee claims/reviews. Turning the feature off removes every workplace route and the additive dashboard card; it does not delete data.

Retention is not silently guessed. Employees can withdraw/delete their own workplace link now; existing account deletion/export procedures must include WORK_DB before launch. Operator revocation leaves a blocked account ID until the approved retention/deletion procedure removes it. Existing released anonymous reports cannot be recomputed to remove an identified person. No scheduled purge job has been commissioned, and no retention compliance claim is made. Record how D1 backups and rate-limit rows are handled in the approved procedure.

## Verification

See `VERIFICATION.md` and committed test output. The build is an isolated candidate, not a statement that a live employer, supplier or production database has been commissioned.
