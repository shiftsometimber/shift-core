# Shift Evidence Desk R1.5–R1.6 — held specialist review packet

This packet asks for two independent human decisions on one immutable revision. It grants no publication authority.

## Exact revision under review

- Revision: `R1.4-MHRA-NAION-2026-02-05-V1`
- Page: `/glp1-knowledge-centre.html`
- Placement: immediately after the medication comparison table in section 07
- Candidate page SHA-256: `a00ff939edddb532a671562a86cf2b647445e216e13f6a8693f8cfa132be4475`
- Baseline/rollback SHA-256: `773b67fed65c5ef4f13be58248118c9abc6f7792acf35b84752a9e7d0da035d7`
- Source: https://www.gov.uk/government/publications/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know/glp-1-medicines-for-weight-loss-and-diabetes-what-you-need-to-know
- Source update: 5 February 2026

### Proposed page copy

> **Safety update: changes to eyesight**
>
> The MHRA says semaglutide (Wegovy, Ozempic and Rybelsus) has, in very rare reports, been linked to a serious eye condition called non-arteritic anterior ischaemic optic neuropathy (NAION), which can affect vision. If you are taking semaglutide and notice a change in your eyesight — including sudden blindness or a rapid deterioration — urgently contact a doctor. Call NHS 111, attend eye casualty if one is available in your area, or go to A&E if you cannot reach your GP or GLP-1 prescriber. This warning is specific to semaglutide; the MHRA says it is reviewing evidence about other GLP-1 agonists.

Visible boundary immediately below the copy:

> **General information, not individual medical advice.** Speak to a healthcare professional about your own treatment.

## R1.5 — qualified clinical review

The reviewer must be appropriately qualified and must inspect the exact revision above.

Required recorded fields:

- Reviewer name
- Professional role and registration/authority reference
- Exact revision ID and candidate SHA-256
- Decision: `approve_exact_copy`, `changes_required`, or `reject`
- Clinical rationale
- Date and time

Approval must confirm all of the following:

- NAION is presented as a semaglutide-specific warning, not a class-wide GLP-1 conclusion.
- The wording does not diagnose, determine causation for an individual, or replace urgent professional assessment.
- The urgency language and destinations are clinically appropriate.
- The reviewer assessed this exact copy and hash.

## R1.6 — medicines-communications review

This is a separate decision. Clinical approval does not satisfy it.

Required recorded fields:

- Reviewer name
- Communications authority/role and authority reference
- Exact revision ID and candidate SHA-256
- Decision: `permit_web_information_only`, `changes_required`, or `reject`
- Permitted destination and placement
- Required wording changes, if any
- Date and time

Any permission must expressly confirm:

- Web information placement only, on the mapped knowledge page.
- No newsletter, social, advert, acquisition creative or promotional reuse.
- No implication that semaglutide, Wegovy, Ozempic or Rybelsus is available to buy from Shift.
- No named-POM promotion or treatment recommendation.
- The reviewer assessed this exact copy and hash.

## Held-gate state

Until both decisions are supplied and bind to the exact revision/hash:

- R1.5: **HELD — qualified clinical authority required**
- R1.6: **HELD — medicines-communications authority required**
- R1.7: baseline and byte-exact rollback proof complete, but not publishable
- R1.8: shut
- R1.9: shut
- Website, newsletter and social: locked
- Model: off
- Production: untouched
- R2: shut

Changing the copy or candidate hash invalidates both specialist decisions and returns the package to review.
