# Shift AI Live Today — controlled candidate R1

## Candidate boundary

- Source baseline: `shift-core:main` at `9dbff64bf8fbd3cc2cb6047c3d75c5cfe2647269`.
- Candidate branch: `agent/controlled-live-shift-ai-r1`.
- No production deployment or model activation is part of this candidate.

## Member journey

1. The authenticated My Timber Today surface presents five recognition-first starts.
2. The server classifies urgent, clinical, injection and ambiguous language deterministically before any model call.
3. For a practical route, the server reads live My Timber context, retained Grub/Fit plans and the live published, final-V1 human-accepted catalogues.
4. A pending day rebuild is proposed. My Timber is unchanged.
5. The member sees the draft and must select **Confirm and change My Timber**. Leaving the sheet makes no change.
6. Confirmation re-queries every selected catalogue ID. Missing, unpublished or no-longer-approved records fail closed.
7. A successful confirmation atomically records the `ai_rebuild` Today choice and audit evidence. The joined Today response exposes that confirmed rebuild.

## Controls

- Model gate: `SHIFT_TODAY_MODEL_ENABLED === 'true'`; absent/off by default.
- Model output cannot create member-facing catalogue content. A valid model response may select only supplied IDs; member copy is materialised from deterministic templates and exact governed titles.
- No learning-memory read or write exists in the new route.
- Proposals expire after 24 hours and are valid only for the member and local date that created them.
- Literal JSON `confirmed: true` is required.
- Confirmation is single-use and concurrency guarded.
- Proposal, rejection, bootstrap and confirmation events are recorded in `shift_ai_today_audit`.
- Proposal context snapshots are labelled `audit_only_not_learning` and are never queried for future recommendations.

## Evaluation evidence

- `node --test tests/*.test.mjs`: **36/36 pass**.
- `node tests/shift-ai-live-today-source-gate.mjs`: **PASS**.
- Request-level D1-compatible journey: authenticated bootstrap → governed proposal → zero pre-confirmation My Timber writes → explicit confirmation → one My Timber write → audit evidence: **PASS**.
- Enabled-model urgent-language test proves zero model calls: **PASS**.
- Catalogue withdrawal between proposal and confirmation fails closed with zero My Timber writes: **PASS**.
- Existing Daily Shift, My Timber 9/10, My Timber 75/75 and master integration source gates: **PASS**.
- Existing full repository test set, including commerce, Grub publication/localisation and adaptive Today: **PASS**.

## Locked-surface proof

The candidate does not modify:

- `hq-ai-v2.js` or any HQ route/tool.
- `shift-ai-v7.js` clinical/Ask Timber safety behavior.
- `commerce-stripe-v1.js` or pricing/eligibility/commercial gates.
- `member-product-v7.js` Grub/Fit generation or catalogue records.
- `structured-content-v1.js` publication/edit behavior.
- `wrangler.jsonc` feature flags, bindings or deployment configuration.

The new live module contains no `INSERT` or `UPDATE` against `structured_content`, no `shift_ai_memory` access, and no HQ route.

## Genuine blocker

The existing production-only G2-012 proof returned HTTP 404 for the undeployed candidate client. That is expected until this branch is deliberately deployed to a controlled non-production/flagged environment. No production deployment was attempted.
