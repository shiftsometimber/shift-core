# Shift AI R4 pilot launch control

## Current decision

**HOLD — do not activate a member yet.**

Engineering evidence is green. Activation is permitted only when every item in the signed launch record below is complete. A blank field is a failed gate, not an invitation to make a reasonable guess.

Authorised product baseline: `1785d57b7bb840b491213347b6bebf5d7e218897`.

Pilot-readiness commit: recorded in the readiness report for the deployed candidate.

Consent version: `shift-ai-r4-pilot-consent-v1`.

## Named authority record

Complete before deployment or member invitation:

| Responsibility | Named person | Backup | Confirmation/date |
| --- | --- | --- | --- |
| Pilot commercial owner | Matt O'Brien (proposed) | Required | Awaiting Matt's confirmation |
| Daily audit owner | Matt O'Brien (proposed) | Required | Awaiting Matt's confirmation |
| Safety incident owner | Matt O'Brien (proposed) | Required | Awaiting Matt's confirmation |
| Privacy/withdrawal owner | Matt O'Brien (proposed) | Required | Awaiting Matt's confirmation |
| Deployment operator | Matt O'Brien (proposed) | Required | Awaiting Matt's confirmation |

The privacy/withdrawal owner must monitor `hello@shiftsometimber.co.uk` every day of the pilot.

## Legal and privacy release record

- [ ] Appropriate UK GDPR lawful basis recorded.
- [ ] Appropriate Article 9 special-category condition recorded.
- [ ] Pilot-specific privacy notice approved and attached to the consent statement.
- [ ] Pilot DPIA reviewed, completed and approved before processing begins.
- [ ] Audit-record retention period approved and stated.
- [ ] Withdrawal handling and any retained-audit explanation approved.
- [ ] Consent wording version `shift-ai-r4-pilot-consent-v1` approved without amendment, or a new version has been created and the code gate updated and retested.
- [ ] Legal/privacy approver, decision reference and date recorded below.

Approver:

Decision reference:

Decision date/time (UTC):

## Candidate-environment proof

Record evidence from the exact deployed candidate, not local tests:

| Check | Required result | Evidence reference | Operator/date |
| --- | --- | --- | --- |
| Exact deployed commit | Pilot-readiness commit |  |  |
| Model binding | Off |  |  |
| Worker pilot master flag | Off before configuration |  |  |
| D1 pilot control | `enabled=0` before configuration |  |  |
| One-action D1 kill | All three existing pilot endpoints blocked; pending confirmation writes nothing |  |  |
| Worker master kill | All three existing pilot endpoints blocked |  |  |
| Audit query | Returns expected gate and test evidence |  |  |
| Locked-surface diff | No prohibited surface changed |  |  |

Any failed or missing result keeps the pilot off.

Current deployment finding: the repository's candidate configuration template still contains an unresolved preview D1 database identifier. This workspace has no authenticated Cloudflare deployment capability. Do not substitute the production configuration or production D1 database. The secure candidate database and authenticated deployment operator must be supplied before this section can pass.

## Phase-one participant control

Use internal member IDs and minimised consent evidence references only. Do not put names, email addresses or health information in this record.

| Slot | Member ID | Consent evidence ref | Consented UTC | Member start UTC | Member end UTC | Activated by | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 |  |  |  |  |  |  | Not invited |
| 2 |  |  |  |  |  |  | Not invited |
| 3 |  |  |  |  |  |  | Not invited |
| 4 |  |  |  |  |  |  | Not invited |
| 5 |  |  |  |  |  |  | Not invited |

No sixth member is permitted. A member remains `invited` until their exact consent evidence has been verified.

## Final go/no-go

All signatories confirm that:

- the exact candidate and both kill paths were tested in the candidate environment;
- the model is off;
- all five or fewer members have separately evidenced consent;
- the daily review rota covers every pilot day;
- the immediate-stop criteria are understood; and
- enabling the pilot does not authorise Phase 2.

Commercial owner sign-off/date:

Safety owner sign-off/date:

Privacy owner sign-off/date:

Deployment operator sign-off/date:

**Decision: GO / NO-GO**

Planned Phase 1 start/end (UTC):

## Immediate-stop card

Stop first; investigate second. Run the single D1 kill statement in the operator runbook immediately if any one occurs:

- clinical or urgent language reaches the planner;
- an unsuitable item reaches a proposal;
- an unconfirmed write occurs;
- confirmed Today contradicts the proposal;
- any privacy or cross-member anomaly occurs; or
- a member reports feeling clinically advised, judged or materially misled.

Then verify all three pilot endpoints are blocked, preserve the audit evidence, notify the incident owner and do not re-enable without a fresh explicit decision.

## Daily commercial review

Record daily counts and concise evidence, not impressions dressed up as data.

| Pilot day | Invited active | Proposals | Confirmations | Repeat users | Fail-closed events | Withdrawals | Stop triggered? | Review owner |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 1 |  |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |  |  |
| 7 |  |  |  |  |  |  |  |  |
| 8 |  |  |  |  |  |  |  |  |
| 9 |  |  |  |  |  |  |  |  |
| 10 |  |  |  |  |  |  |  |  |
| 11 |  |  |  |  |  |  |  |  |
| 12 |  |  |  |  |  |  |  |  |
| 13 |  |  |  |  |  |  |  |  |
| 14 |  |  |  |  |  |  |  |  |

Ask participants in ordinary language:

1. Did the rebuild fit the day that actually happened?
2. Was it obvious what would change before you confirmed?
3. Did anything feel judgemental, medical or misleading?
4. Did the Life Back explanation add anything useful?
5. What stopped you using it when you wanted to?
6. Did you choose to use it again?
7. Would you be disappointed if it disappeared?

## Day-seven and day-fourteen decisions

Phase 2 requires a separate written decision after Day 7 and is prohibited if any stop condition was triggered.

At Day 14 choose one only:

1. Stop.
2. Harden a demonstrated defect.
3. Authorise a slightly larger cohort.

Do not create a speculative feature backlog, activate the model, enable Learning persistence or widen production access from this review.
