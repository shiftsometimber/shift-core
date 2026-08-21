# Adaptive Today — Phase 1 and Phase 2 contract

## One source of truth

Shift Core owns identity, member preferences, the stable daily plan and its append-only action events. The website and HQ are clients. They do not create local shadow records.

## Privacy and permissions

- Member routes require the existing authenticated member session and every read/write is constrained by `user_id`.
- Setup stores practical personalisation preferences under consent scope `personalisation_v1`; it does not infer diagnoses or change clinical records.
- HQ visibility uses the existing HQ session and `audit_read` permission boundary.
- Clinical and safety boundaries always override optimisation; Today actions are explicitly non-clinical.

## API

- `GET /v1/shift/setup` — setup completeness and saved practical preferences.
- `PATCH /v1/shift/setup` — validated short setup.
- `GET /v1/shift/today` — exactly three stable actions for the supplied local date: Eat, Move, Life Back.
- `POST /v1/shift/today/actions/:id/decision` — `complete`, `swap`, or `skip`, with an idempotency key.
- `GET /v1/hq/adaptive-today` — authorised operational view; optional `memberId` and `limit` filters.

## Behaviour contract

The first request for a member/date snapshots One Shift Brain context and creates one plan. Further requests return that plan and its current statuses. Complete, swap and skip are persisted. Recent completed/skipped domains are included when the next date is generated, and each action exposes a plain-English `why` object.

## Failure contract

- Invalid input returns 400 without changing state.
- Another member cannot address an action they do not own (404).
- Retrying the same idempotency key returns the saved result without a duplicate event.
- The browser leaves the current card unchanged if a write fails and tells the member to retry.
- A failed refresh states that saved Shift state has not been lost.

## Acceptance evidence

`tests/adaptive-today-v1.test.mjs` proves the balanced three-domain contract and behaviour explanations. `tests/adaptive-today-source-gate.mjs` guards persistence, idempotency and all three controls. Full source syntax and repository checks run before publication.
