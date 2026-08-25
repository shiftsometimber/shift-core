# Shift AI R4 pilot data protection impact assessment

Status: pre-processing approval candidate. This DPIA must be completed and signed before any member is activated.

## Processing assessed

A maximum of five invited members for seven days, followed by a maximum of ten members for a further seven days only after a separate review. The feature reads live My Timber context and retained approved Grub/Fit records, proposes a same-day rebuild, and writes the confirmed change to Today. The model remains off.

## Purpose and necessity

The pilot tests whether a governed same-day rebuild is useful, understandable and trusted when real life disrupts a member's plan. Live context is necessary because relevance, suitability and canonical write behaviour cannot be evaluated with static demonstrations alone.

The pilot is limited to current-day support. It excludes Learning persistence, multi-day planning, catalogue editing, clinical or prescribing decisions, eligibility, pricing, HQ and wider production access.

## Data minimisation and controls

- Invite-only, per-member and time-bounded access.
- Five-member Phase 1 and ten-member absolute Phase 2 limits.
- Separate versioned explicit consent evidence.
- Model forced off.
- Deterministic clinical and urgent classification before planning.
- Approved catalogue IDs only, with suitability checks before proposal and confirmation.
- Incomplete context fails closed.
- Explicit confirmation before any Today write.
- One-action global kill-switch plus independent Worker master flag.
- Full proposal, confirmation, write and fail-closed audit.
- No persistent AI learning.
- Proposed 90-day pilot-record retention followed by deletion or irreversible anonymisation.

## Main risks and mitigations

| Risk | Potential harm | Control | Residual risk |
| --- | --- | --- | --- |
| Cross-member data exposure | Disclosure of health or preference data | Authenticated member scope, per-member queries, isolation tests, immediate stop | Low if candidate proof passes |
| Unsuitable food or movement | Allergy, dietary or physical suitability harm | Suitability metadata required; checks before proposal and confirmation; fail closed | Low to medium; depends on source data accuracy |
| Clinical language reaches planning | Member mistakes practical support for medical advice | Deterministic pre-planner classification and immediate stop criterion | Low if deployed gate matches tested candidate |
| Unconfirmed or contradictory write | Loss of trust or incorrect Today state | Literal confirmation, revalidation, canonical Today test and audit | Low |
| Participant feels judged or misled | Distress, disengagement or reputational harm | No-Guilt rules, ordinary-language copy, daily feedback review and immediate stop | Medium because perception requires human review |
| Excessive data use | Unnecessary intrusion | Narrow purpose, no model learning, no multi-day scope, short cohort and retention | Low |
| Consent is not freely given | Invalid processing and loss of trust | Optional invitation, no detriment for refusal, separate unticked agreement, easy withdrawal | Low if invitation practice follows the wording |
| Audit records retained too long | Unnecessary exposure | Approved 90-day deletion/anonymisation schedule and documented incident exception | Low after operational proof |
| Candidate accidentally reaches wider traffic | Unauthorised processing | Separate candidate environment, dual dark-by-default flags, per-member row and kill-switch | Low only after exact environment proof |

## Consultation and participant information

Participants receive the pilot information, pilot-specific privacy notice and explicit agreement before activation. Feedback is reviewed daily. A participant can withdraw using the invitation channel or `hello@shiftsometimber.co.uk`.

## Residual-risk decision

The pilot must not start if the candidate environment, operator access, consent process, retention deletion process or kill-switch has not been proved. Any high residual risk requires further mitigation or consultation with the ICO before processing.

## Sign-off

Commercial owner:

Safety owner:

Privacy owner:

Technical/deployment owner:

Residual risk accepted by:

Decision reference:

Decision date/time (UTC):

Review date:
