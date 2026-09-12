# My Timber member experience

User-authorised follow-through from the approved workplace member screen. This is an additive presentation layer on the isolated SHIFT for Work branch. Production configuration and the canonical Pages payload are unchanged.

## Integration

`MEMBER_EXPERIENCE_V1_ENABLED=true` opts into revised member navigation, scoped styles and accessibility helpers. With the flag absent, existing responses and routes pass through unchanged. The Worker wraps the existing Pages member response after the existing Programme/workplace dashboard entries. It preserves the original scripts, form IDs, authentication, data handlers and consent. Public pages are outside the scope.

`/member/journey` and its HTML alias redirect to the functioning `/member/dashboard#journey`. The previous page described future clinical workflow states. Saved now links to account-backed food, Journey, check-ins and privacy controls, replacing obsolete placeholder claims. Grub supports a direct `#saved` landing and check-in supports `#history`.

No data model, employer permissions, reporting thresholds, medical advice, recipe approval, exercise approval, treatment availability, pricing or consent notice has changed. The enhancement client makes no requests and stores no data.

## Isolated review

The existing separate workplace staging Worker serves `/staging/member/{dashboard,grub,fit,check-in,saved,settings}` and `/staging/member/review`. The review uses pinned Pages templates and the exact Worker-owned CSS/scripts for routes overridden by `gitMemberAsset`. The homepage image is the user's approved asset.

The design review contains fictional values, uses a local API façade, rejects saves, disables network connections with CSP, and excludes authentication, analytics, service workers and unrelated public widgets. Check-in runs the exact canonical account-backed mood block extracted from the pinned `app.js`, with its normal consent dialog. These screens verify layout and interaction; they are not a new authenticated production acceptance test.

`work/staging/prepare.mjs` checks SHA-256 before copying sources into ignored generated staging assets. Staging keeps its existing expiry and isolated database restrictions. No production data is read.

## Verification

Run `node --test member-experience/tests/*.test.mjs` plus the existing Journey/check-in/Fit contract checks specified in the isolated workflow. Run the workplace and Programme regressions before release. Browser evidence is recorded after staging review.

Production promotion remains a separate release: review the complete branch dependencies, enable the flag only with the tested Worker bundle, and confirm authenticated returning/new-account states on the target origin. The visual layer does not commission the Programme or workplace testing service.
