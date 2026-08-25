# Shift AI Live Today — narrow hardening checkpoint R2

## Authority and boundary

- Parent connected baseline: `a298cbee10bf0c79ad8b889a82b03e88210ee14a`.
- Hardening branch: `agent/controlled-live-shift-ai-r2`.
- Scope is limited to member compatibility, canonical Today application and complete-context fail-closed behavior.
- No production traffic, deployment or model activation occurred.

## Product-truth fixes

### 1. Member compatibility

- Only catalogue IDs already retained in the member’s active Grub and Fit plans are eligible.
- Global approved-catalogue fallback has been removed from the live rebuild path.
- Grub candidates are checked against saved dislikes, allergies, intolerances, exclusions, vegetarian, vegan, gluten-free and coeliac flags.
- A conflict is excluded before proposal. If no compatible retained Grub item remains, the request fails closed.
- Compatibility and retained-plan membership are checked again at confirmation, protecting against preferences or catalogue status changing after proposal.

### 2. Canonical Today

- A confirmed `ai_rebuild` now overrides the canonical `daily_output` meal, workout, next action, headline, explanation and adjustment.
- The confirmation banner and primary Today cards are derived from the same confirmed record.
- Deliberate mismatch evaluation proves a confirmed quick meal replaces the previously rendered slow meal.

### 3. Complete context or no rebuild

- Required My Timber reads no longer silently collapse database errors into empty values.
- Member profile, stage, targets, preferences, personal profile, recent progress, today’s check-in, active Grub plan, active Fit plan and retained Grub/Fit items are required.
- Both retained plan catalogues must resolve to current published, final-V1 human-approved records.
- Missing plans, empty retained sets, unresolved IDs, incompatible Grub or unavailable Fit return a controlled 409 with zero proposal writes.
- Missing required tables/read failures return a controlled 503 with zero proposal writes.

## Deliberate imperfect-data evidence

- Vegetarian member + chicken recipe: 409, no proposal.
- Recorded chicken dislike: 409, no proposal.
- Free-text chicken allergy: 409, no proposal.
- Vegan or gluten-free flag without a compatible retained meal: 409, no proposal.
- Preferences changed after proposal: confirmation blocked, zero My Timber writes.
- Missing retained Grub plan: 409, no global fallback.
- Missing retained Fit plan: 409, no partial rebuild.
- Published record withdrawn after proposal: confirmation blocked, zero My Timber writes.
- Missing `progress_entries` table: 503, zero proposal writes.
- Confirmed quick meal versus old slow Today card: canonical Today renders the confirmed quick meal and movement.

## Verification

- Full local repository test suite: **45/45 pass**.
- Shift AI live source gate: **PASS**.
- Daily Shift front-door gate: **PASS**.
- Gate 2 product and learning source gates: **PASS**.
- Frontend member source gate: **PASS**.
- Master integration source gate: **PASS**.
- Fast member-state source gate: **PASS**.
- My Timber 9/10 contract: **PASS**.
- My Timber 75/75: **10/10 green**.
- Shift Fit UK programme and reminder source gates: **PASS**.
- Plan analytics determinism and analytics latency source gates: **PASS**.

Legacy gates that invoke production proofs were deliberately excluded to honour the no-production-traffic instruction.

## Locks unchanged

- Model remains off by default.
- No learning persistence.
- No multi-day planning.
- No Grub/Fit catalogue creation or editing.
- No HQ, clinical, prescribing, eligibility, pricing, claims or commercial changes.
- No production deployment or traffic.
