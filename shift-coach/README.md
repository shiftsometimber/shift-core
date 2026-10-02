# Shift AI coaching integration candidate

This branch is a real-account integration candidate, not a live release or evidence that the complete Shift AI v2 work order has passed. It starts from recorded `shift-core` main `7a02f42a58a7992ce4728d9fd91808f2654f7cdf`. The synthetic prototype is commit `8e775b08d41b604b5f93449b497648eb33e3b72c`.

## Implemented

The scoped wrapper preserves the original Worker, named Durable Object exports, routes and scheduled jobs. Only the dashboard Today panel receives the new component. The separate candidate Wrangler configuration changes only its entrypoint; the existing production configuration and deployment workflow are unchanged. Merging these additions alone does not switch the feature on.

`/v1/shift-coach` uses existing member session authentication, current optional health-tracking consent, same-origin writes and optimistic revision checks. Member identity cannot be supplied in a request. Coaching lives at `member_state.preferences.lifeBack.progress.shiftAI`, within the existing protected Life Back object. Full-profile and Journey saves preserve it; existing health erasure removes it; member-state export includes it. It introduces no database, migration, provider, secret or paid service.

Members confirm a goal, their working week and one focus. Today reads a previously prepared action. Accepted actions can receive an optional in-app follow-up; outcomes select a smaller step or another approach. Confirmed memory is editable and deletable; rejected action types require explicit restoration. A weekly personal rating, chosen components and a prepared weekly plan are available. Other-prescriber and stopped-medication modes retain history and never generate medicine instructions.

The opt-in scheduled review is paged, repeat-safe, rule-based and makes zero model calls. External notifications, calendar writes and device imports are disabled. `SHIFT_COACH_OFF=true` stops background preparation and automatic in-app follow-up presentation while leaving Today readable. Quiet hours, three follow-up presentations per seven days and one presentation per day are enforced. Two unanswered prompts pause follow-ups; explicit restoration is required. This is within My Timber only.

There are six fixed everyday action types. This is not an internet-trained or self-improving model, and the action library has not passed independent voice/relevance review. New text never trains a model. Finite input boundary checks decline matched medical, safeguarding or under-age text; they are not validated triage or a guarantee of detection. Official help is always visible and nobody is represented as monitoring messages. Existing Ask Timber remains a separate unchanged service.

## Privacy and concurrency

Consent is rechecked during writes. A consent event ID binds the snapshot; withdrawal and regrant cannot resurrect old memory. Coaching changes share Life Back's parent revision, so stale tabs and concurrent Life Back writes cannot overwrite one another. Whole-coach deletion increments that revision to prevent an in-flight old snapshot returning. Removing a fact also removes derived actions, queued follow-ups, plans and dependent references. No content is copied to a separate audit store.

History older than 90 days is pruned on the next mutation, not by a guaranteed daily deletion job. Confirmed facts remain until deletion. This proposed retention and the existing consent purpose still need the retained privacy assessment; code placement is not proof that consent is legally sufficient. Snapshot size is bounded and returns a recoverable conflict when full.

## Evidence and limits

- `node --test shift-coach/integration.test.mjs`: real session-table authentication and native SQLite checks, synthetic accounts only.
- Preserved-route regression suite: member experience, auth, Journey, promise, app layout and footer checks.
- `browser-proof.mjs`: rendered mobile/desktop component on a synthetic shell, not the full production My Timber route. Records browser interactions, persistence and isolation. Timings are local simulated-network measurements.
- `workerd-proof.cjs`: the complete compiled Worker with actual local workerd/D1, synthetic users and the original session implementation. No production resources or fixture login endpoint are exposed.
- `scope.mjs`: exact new-file list and zero modifications to existing tracked source.

Formal acceptance remains BLOCKED for independent review and unimplemented requirements. Calendar read/write/undo, automatic device import/conflict handling, push, per-source live integration controls, full My Journey-only onboarding and validated pattern thresholds are not completed. No launch or competitor superiority is claimed.

## Promotion requirements

The user requested real use on 2 October. The saved no-partner amendment still retains privacy assessment, intended-purpose classification and independent evidence before real use. That request does not invent those decisions. A bounded coaching launch would also amend the approved one-complete-v2 launch scope; it cannot be silently labelled full v2.

Existing production checks must pass before a new entrypoint is promoted through the authorised release path. Run 36974740617 on the recorded main failed waiting for the mobile Fit setup summary, with the four Progress/My Plans checks successful. This is an observed existing acceptance failure, not evidence of its cause or of a coaching regression. No live data was used by this candidate's tests, no release guards were altered and no deployment occurred.
