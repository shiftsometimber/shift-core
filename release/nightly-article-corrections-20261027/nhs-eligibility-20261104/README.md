# NHS eligibility correction — 4 November 2026

Status: implemented in isolation and locally tested. Not merged, deployed, clinically reviewed or verified in production. Matt's current “Act as our SEO expert and resolve” authorises this preparation; retained exact-copy/clinical gates and release-manager ownership remain.

## Scope and ownership
Existing owner: /articles/glp-1-nhs-eligibility. Keep /male-obesity as pillar. No new page, title, slug, source-label, first-publication date, homepage, analytics, service launch, pricing or communication is changed.
Current main checked: 60ecf85d61848d64ab2ea5ba9037176721171131. No running GitHub deployment was returned at the pre-mutation check. PR1520 owns article modified-date/sitemap delivery in babylove/dynamic-public.mjs; this candidate does not edit that module. Existing PR1443 remains the correction/history handover. Do not merge its historical branch wholesale.

## Reviewable result
review-copy.md contains every exact public-copy replacement. preview.html contains the complete proposed page using current markup, with all executable scripts removed. The original publication/schema date remains explicitly labelled as old live metadata, not a new publication. Four FAQs are regenerated from the changed visible answers with the retained schema enhancer. The packet corrects the broad NHS/semaglutide setting claims, separates TA1152, corrects the tirzepatide continuation decision, changes NICE “authorises” to “recommends”, removes unsupported experience/personal-signature claims and fixes the Programme destination. Original imagery, medicine instructions and unrelated body content survive.

## Recurrence prevention implementation
Only babylove/webhook.mjs, babylove/webhook.test.mjs and new babylove/article-review.mjs affect runtime source. A narrow set of observed service/medical/experience faults sends a NEW authenticated delivery into the existing private draft route. Exact incoming copy and original receipt are retained; no automatic rewrite, delete or clinical approval. Clean auto-publication, authenticated retry, collision and existing-row preservation retain their tests. No new workflow, monitor, table, notification or external message is introduced. Existing arrival notification behaviour is unchanged and was tested only with a local mock, never sent.

## Evidence
17 Node 24 tests pass in the actual candidate directory layout. Real in-memory SQLite checks verify optimistic source matching, preserved fields, one-write/idempotence behaviour and refusal to roll back another owner's newer copy. Handler tests retain authentication, receipt transactions and publication semantics. Eighteen markup targets match once, the signature is removed and four generated FAQ answers match the proposed visible copy. See evidence.json. This is not a raw-row dry run or production proof.
The fixture is reconstructed from public delivered markup; it is NOT an authenticated database Markdown body or guard. Capture the actual row/id/source receipt and hash before applying. HTML hashes must never substitute for that hash.

## Remaining gates and exact next action
1. Qualified reviewer: inspect the factual correction against full current NICE TA1026, TA875, TA1152 and TA664. Source retrieval alone is not clinical approval.
2. Matt: exact review-copy.md/preview version sign-off, including new medical wording. This candidate is not an approval of future unseen posts.
3. Release manager: capture readonly-capture.sql through the retained authenticated CMS/D1 route. Confirm original publication 2026-11-03T04:00:15.349Z, SHIFT Team, BabyLoveGrowth route, exactly one current row and each target once. Run prepareCorrection on actual captured raw Markdown. Retain raw before/after plus hash, execute only the guarded body/modified update and use owned rollback if verification fails. The preparation module performs no network/database mutations.
4. Release manager: separately qualify and deploy the intake safeguard via the retained current-source guarded Worker route, keeping the same source-specific safety and rollback checks. Do not use the content correction as authority to deploy unrelated main.
5. Verify actual production text, no stale FAQ answers, source header, original publication and substantive modification, correct canonical/indexing/security, images and contextual links. Record CMS published/Worker deployed/production verified separately. No repetitive sitemap or indexing requests.

Active deployment: none started by this worker. No deployment job ID or accepted handover is claimed. Any newly discovered active release must retain priority and the current-source guard.
