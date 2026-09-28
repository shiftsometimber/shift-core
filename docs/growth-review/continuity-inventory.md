# Continuity capability inventory
Source baseline: 33c1b98cbb39dfd6154af3c673d9ee784371260e; 28 September 2026.

| Capability | Evidence | Honest statement / gap |
|---|---|---|
| Keep goals and routines while provider changes | public-continuity.mjs and provider-switch public text | Existing practical support remains separate from prescribing; receiving-provider acceptance is not promised |
| Save own history with consent | health-passport/production-browser.mjs, successful production run 36421915759 | Synthetic consent/save/reload and personal-history tests passed, without creating orders |
| Account isolation | Same production script and successful run | Logout and second-account rejection tested; no private-data review in this inventory |
| Export Passport records | health-passport/routes.mjs adds own records to POST /v1/privacy/export; production test expects two records | Export established for synthetic fixture, not proof every member's data is complete |
| Export Programme | programme/routes.mjs and programme/export.mjs | Private authenticated JSON attachment, strips operations/serviceEvents; this inspection does not establish a enabled live route or readable PDF |
| Erase optional health history | Production test DELETE /v1/privacy/health-tracking | Separate from whole-account deletion; consent false and Passport records empty asserted |
| Whole-account deletion | docs/privacy-account-deletion.md | Request queued to HQ and sessions revoked. Operator completion and processor coverage remain operational work |
| Human-readable continuity summary | Not established by files inspected | Verify actual existing exports before adding another implementation |

## Draft internal capability statement
My Timber keeps practical goals, saved food/movement plans and optional personal history in the member's account. Existing controls provide account data export and optional health-history erasure. Whole-account deletion requests require operator handling. These records are not prescriptions, a clinical endorsement, an automatically accepted transfer record or a monitored clinical service.

## Member-readable summary: acceptance contract if missing
Use existing authenticated account/export authority. Include generated date, member-selected sections, goals, current saved food/movement plans, recent self-reported check-ins and source/date for optional history. Label missing fields as not recorded; distinguish self-reported facts from clinician records. Do not infer doses, diagnoses or treatment advice.
Preview selected content before download. Default to minimum necessary details; exclude internal operations, tokens, marketing data, other accounts and device credentials. No automatic sharing to provider or employer.
Check: own-account access; wrong-account rejection; consent; optional field omission; erasure reflected in subsequent exports; correction timestamps; long-text layout; readable phone preview and printed document. A PDF is not required if a usable current summary already exists.
Done means a synthetic member can find, read and use the existing/exported record and all privacy checks pass—not merely a new button.
