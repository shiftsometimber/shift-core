# G1-008 — post-merge production recheck

Date: 2026-08-13
Status: **AMBER — live frontend deployment mismatch proven; no PASS claimed.**

## Why this recheck exists

The canonical recovered member adapter is now in Git on `main` with the bounded Fit-only client repair: ordinary member API calls remain on the 15-second default while `generateFit` receives a finite 60-second generation budget. A merge or source-green state is not acceptance. G1-008 requires the actual production member journey to use that source and render the successful outcome.

## Fresh unchanged rendered production evidence

The exact Gate 1 rendered-state job from PR #161 was rerun against current production as workflow run `31736139032`, attempt 2, rendered-state-system job `94578404388`.

The rerun retained authenticated member state and proved substantial parts of the state system:

- fresh fixture authentication succeeded;
- desktop and 390px empty Grub, Fit and Progress states rendered;
- 390px Grub showed explicit in-flight loading state, locked the generating action, returned HTTP 200, rendered the returned recipe (`Bacon & egg breakfast butty`), settled to completion and retained zero document-root overflow;
- public rendered-browser and public accessibility/performance jobs remained green.

Fit did **not** close. The focused browser diagnostic showed:

- authenticated login HTTP 200 and member-state HTTP 200;
- retained `sst_session` cookie;
- member navigated to Fit and selected `Build my session`;
- the button was disabled while the UI showed `Building your Fit plan…`;
- the browser emitted `POST /v1/fit/plan`;
- the browser request failed with `net::ERR_ABORTED` before the successful product result could render;
- replaying the same captured request body with the same retained authenticated session directly to the same production endpoint returned HTTP 200 in approximately 29.4 seconds, with three sessions and no quality issues.

Evidence artifact from the rerun: `gate1-state-system-production-evidence`, artifact ID `9196584899`, SHA-256 digest `f9de8cb18d0be0daf009ddff8cc00e74ba4e58f9b45f38a7aabb38829023f551`.

## Fresh live-source recapture

The existing live-source capture job was rerun after the Git repair to interrogate the currently deployed public asset rather than infer deployment from repository state.

Workflow run `31730934118`, rerun capture job `94581166135`, downloaded the live `/api-adapter-v33d.js` on 2026-08-13 and proved production is still serving the **old 7,217-byte adapter**:

- `DEFAULT_TIMEOUT=15000` is present;
- there is no `GENERATION_TIMEOUT=60000`;
- `generateFit` still calls `/fit/plan` with no operation-specific timeout and therefore inherits the 15-second default.

Retained recapture artifact: `g1-live-api-source`, artifact ID `9196708563`, digest `d1344b8a5f8a49defe2475f4b3118ff1dd9d30b0c47271ad0d4719e54ca1104f`.

This proves the remaining failure is currently a deployment mismatch: Git contains the bounded Fit-only repair, but the live member estate has not received that adapter.

## Commissioning judgement

G1-008 remains **AMBER**. The next legitimate closure step is not more Playwright relaxation and not a broader timeout increase. It is to publish `frontend/member/api-adapter-v33d.js` unchanged to production root `/api-adapter-v33d.js`, verify the live source matches Git, then rerun the unchanged rendered state-system acceptance.

PASS still requires, at desktop and 390px:

1. retained authenticated state;
2. explicit Fit loading state;
3. generating action locked against duplicate submission;
4. request remains alive for a legitimate production generation;
5. HTTP-successful response;
6. returned Fit sessions visibly rendered;
7. controlled settled completion state; and
8. zero document-root horizontal overflow.

The homepage-level premium aesthetic remains the estate-wide design constitution; this repair changes request lifetime policy only and must not alter the member presentation.
