# Shift AI Live Today — connected pressure checkpoint R3

## Authority and boundary

- Parent connected baseline: `c714794cd734111116448ef237748d27e584d194`.
- Candidate branch: `agent/controlled-live-shift-ai-r3`.
- The expansion stays inside the existing bootstrap, propose and confirm endpoints.
- No production request, deployment or model activation occurred.

## Connected member journey

1. Bootstrap reads complete live My Timber context and only the approved records retained in the member's active Grub and Fit plans.
2. All five recognition starts show an actual governed meal and movement draft from those retained plans before the member chooses one.
3. Proposal revalidates food and movement suitability, applies No-Guilt and Monday Amnesty rules, and shows route-relevant Life Back evidence.
4. The confirmation view names the exact meal and movement that will change and states what remains unchanged.
5. Literal confirmation re-reads all live context and revalidates every selected catalogue ID and suitability rule.
6. The confirmed record becomes canonical Today state and exposes the same change summary, Life Back evidence and audit reference used by the confirmation banner.

## Product-truth controls

- Food suitability covers dietary flags, allergies, intolerances, dislikes and exclusions.
- Movement suitability covers recorded avoid/limitation terms, location and equipment constraints.
- Suitability is applied to every selectable retained record and repeated at confirmation.
- Missing tables return 503; missing, empty, unresolved, partial or incompatible context returns 409. Neither path writes a proposal or My Timber choice.
- Sparse/new retained plans are identified explicitly. A one-item compatible plan can be used honestly; an incomplete plan receives setup-required actions and no generic substitution.
- Model punishment, restart or compensation output is rejected and replaced by the deterministic governed draft.
- Monday Amnesty appears only on Monday after recorded disruption and a member request.
- Life Back outcomes come from live recorded priorities or evidence and are filtered for relevance to the selected route. If no relevant evidence exists, the product makes no claim.
- Weight is present only as labelled supporting context and never as the Life Back headline or score.
- Confirmation audit records the exact change, approved IDs, Life Back evidence, Amnesty state, No-Guilt result and canonical-write result.

## Expanded evaluation

- Repository tests: **87/87 pass**.
- The live-path matrix covers dietary conflicts, movement location/equipment conflicts, preference changes between proposal and confirmation, withdrawn catalogue approval, partial catalogue, absent plans, empty check-in, missing required table, contradictory pre-write Today state, unsafe model copy and repeated confirmation.
- Ordinary-language matrix: 24 practical phrases verified not to become clinical false positives.
- Safety-language matrix: 12 urgent/clinical phrases verified to remain blocked before planning.
- Shift AI live source gate: **PASS**.
- Adaptive Today, Daily Shift front door, master integration, frontend member and fast member-state source gates: **PASS**.
- Gate 2 product and learning source gates: **PASS**.
- My Timber contract and 75/75 gates: **PASS**.
- Shift Fit UK programme and reminder gates: **PASS**.
- Plan analytics determinism and analytics latency gates: **PASS**.

Production-proof scripts were deliberately not run because the directive keeps production traffic locked.

## Locked-surface proof

- Model remains gated by `SHIFT_TODAY_MODEL_ENABLED === 'true'` and is off by default.
- No route was added; the existing bootstrap, propose and confirm routes are unchanged.
- No Worker entry, deployment configuration or production binding changed.
- No Learning table, write or persistence was added.
- No multi-day planning was added.
- No structured-content insert or update exists in the live flow.
- No HQ, clinical, prescribing, eligibility, pricing, claims or commercial code changed.
- No production deployment or traffic occurred.

## Blockers

None found in the authorised connected scope. Production evidence remains intentionally unavailable until production traffic is explicitly authorised.
