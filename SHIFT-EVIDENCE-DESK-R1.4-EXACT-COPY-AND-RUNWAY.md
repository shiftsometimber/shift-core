# Shift Evidence Desk R1.4 — Exact Copy and Sealed Runway

## Position inherited

R1.3 is sealed on `amend` / `changes_required`. The persisted package correctly failed `exact_proposed_page_copy`. Qualified clinical review, medicines-communications review and every publication destination remain locked. Production is untouched and R2 remains shut.

## Exact proposed page copy

**Target:** `/glp1-knowledge-centre.html`

**Content key:** `mhra-glp1-latest-safety-update`

**Placement:** after the medication comparison table in section 07

**Revision:** `R1.4-MHRA-NAION-2026-02-05-V1`

### Safety update: changes to eyesight

> The MHRA says semaglutide (Wegovy, Ozempic and Rybelsus) has, in very rare reports, been linked to a serious eye condition called non-arteritic anterior ischaemic optic neuropathy (NAION), which can affect vision. If you are taking semaglutide and notice a change in your eyesight — including sudden blindness or a rapid deterioration — urgently contact a doctor. Call NHS 111, attend eye casualty if one is available in your area, or go to A&E if you cannot reach your GP or GLP-1 prescriber. This warning is specific to semaglutide; the MHRA says it is reviewing evidence about other GLP-1 agonists.

This is proposed wording only. It is not clinically approved, communications-approved or publishable.

## Evidence trace

- Authority: Medicines and Healthcare products Regulatory Agency (MHRA)
- Source update: 5 February 2026
- Recorded change: new information on non-arteritic anterior ischaemic optic neuropathy (NAION)
- Direct source: `https://www.gov.uk/government/publications/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know`
- Copy integrity: SHA-256 stored with the proposed revision
- Claim: `mhra-glp1-latest-safety-guidance`

## Six-step controlled runway

| Step | Deliverable | Current position | Stop condition |
|---|---|---|---|
| R1.4 | Attach exact evidenced copy to the existing package | Built and locally proven | Copy, source, claim or placement integrity differs |
| R1.5 | Qualified clinician reviews this exact revision | External authority required | Reviewer is not qualified, revision hash differs, or decision is not explicit |
| R1.6 | Medicines-communications reviewer decides permitted destination and wording | External authority required | Web placement is not expressly permitted or promotional reuse is attempted |
| R1.7 | Capture the exact page baseline and build a reversible patch | Prepared as a mandatory preflight blocker | Page hash/anchor differs or rollback cannot be reproduced |
| R1.8 | Non-production render, accessibility, link, citation and exact-copy verification | Remains unavailable until R1.5–R1.7 pass | Render differs from approved revision or any destination unlocks |
| R1.9 | Controlled web-only publication commission and immediate rollback drill | Not authorised | Production authority absent, either specialist gate absent, or rollback proof fails |

R2 does not open merely because R1.4 is complete. It requires explicit authority after the whole R1.4–R1.9 chain is green.

## R1.4 exit criteria

| Proof | Required result |
|---|---|
| Existing package | Same persisted red package and event |
| Exact wording | One immutable revision with exact page, content key and copy hash |
| Evidence | Direct MHRA document, update date and change note attached |
| Checklist | `exact_proposed_page_copy` changes from fail to pass |
| State | Package and event both `awaiting_specialist_review` |
| Idempotency | Reattachment does not duplicate the revision or audit decision |
| Specialist gates | Both remain required, absent and unavailable through the commission route |
| Preflight | Explicitly blocked on both specialist reviews, baseline/rollback capture and publication authority |
| Destinations | Web, newsletter and social remain locked |
| Model | Off |
| Production | Untouched |

## Acceptance line — use only after real non-production D1 proof

> R1.4 is in. Exact evidenced replacement wording for the 5 February 2026 MHRA NAION update is attached to the existing red package and mapped to `/glp1-knowledge-centre.html`. The revision is hash-locked and the review packet is ready. Qualified clinical and medicines-communications approvals remain absent and locked. Page baseline, rollback and publication authority remain explicit blockers. No model. No publication. Production untouched. R2 stays shut.
