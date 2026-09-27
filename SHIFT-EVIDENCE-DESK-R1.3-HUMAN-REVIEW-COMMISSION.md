# Shift Evidence Desk R1.3 — Human Review Commission

## Inherited proof

R1.2 bound the dedicated non-production D1, persisted the documented MHRA delta, mapped it to the exact Shift claim and `/glp1-knowledge-centre.html`, opened one red clinical-safety package, proved replay idempotency, exposed a read-only Inbox and sealed ingestion and every destination.

## Honest gap

The red package is traceable and correctly governed, but it contains an instruction to draft the smallest evidenced correction rather than the exact proposed page wording. It is therefore not ready for qualified clinical or medicines-communications review. Treating the package as review-ready would be theatre.

## Commission

R1.3 must:

1. Read the existing persisted R1.2 package from the same dedicated non-production D1.
2. Produce a deterministic review checklist covering authority, material delta, claim/page dependency, risk lane, evidence trace, specialist gates, destination locks and exact proposed page copy.
3. Record Matt O'Brien's ordinary editorial outcome as `amend` because exact proposed page copy is absent.
4. Keep qualified clinical approval and medicines-communications approval unavailable.
5. Keep model, composer, website publish, newsletter and social unavailable.
6. Keep the package and event states consistent (`changes_required`).
7. Prove a repeated review call is idempotent.
8. Prove the R1.2 shutdown still prevents fetch after the review is persisted.

## Exit table

| Proof | Required result |
|---|---|
| Existing package | One red `clinical_safety` package for `/glp1-knowledge-centre.html` |
| Mechanical checklist | Seven controls pass; `exact_proposed_page_copy` fails honestly |
| Human editorial record | `amend`, Matt O'Brien, authority ref `R1.3-EDITORIAL-REVIEW` |
| State consistency | Package and event both `changes_required` |
| Replay | No second checklist decision or amend decision |
| Specialist gates | No qualified or medicines-communications approval recorded |
| Destinations | Web, newsletter and social remain ineligible and disabled |
| Model/composer | Unavailable |
| Shutdown | Post-review fetch checks zero sources |
| Production | Untouched |

## Stop conditions

- Any review path can approve web, qualified clinical review or medicines communications.
- Any destination becomes eligible or enabled.
- Any model, composer, email or social capability is introduced.
- A repeated review creates duplicate decisions.
- Package and event states contradict one another.
- The package is described as complete while exact proposed page copy is absent.
- The production D1 or production Worker is referenced as a deployment target.

## Does not count as done

- A checklist evaluated only in memory.
- A review written to a template or local database.
- An automated record falsely described as specialist clinical review.
- Drafting or publishing page copy.
- Opening R2, a second source, email, newsletter, social, OAuth or model work.

## Acceptance line

> R1.3 is in. The persisted red MHRA package has been reviewed honestly and returned for amendment because exact proposed page copy is absent. The checklist and Matt O'Brien's editorial decision are stored in non-production D1. Package and event agree. Replay is idempotent. Specialist approvals, model, composer and every publication destination remain locked. Shutdown still prevents fetch. Production untouched.
