# G3-006 — Knowledge Hub editorial commissioning breakpoint

Date: 2026-08-14

## Status

**AMBER. Do not promote to PASS yet.**

The previously missing editorial/reviewer implementation is now finished in source and exercised through the real HQ authentication/article contracts, but the final production HQ operator/rendered journey is not yet demonstrated because the Shift HQ Cloudflare Git deployment is failing independently of the application integration gate.

## What is now implemented

### Shift Core

- PR #267 merged the bounded `knowledge-editorial-v1.js` layer into the existing HQ article/CMS contract rather than creating a second Knowledge system.
- Article review state is retained in `knowledge_article_reviews` with decision, reviewer id/name/email, notes and timestamp.
- Existing HQ authentication and content-write role boundaries remain authoritative.
- Direct article publication and the explicit HQ `/v1/hq/articles/:id/publish` action both reject publication until a retained approval exists.
- Approved/changes-requested remain reversible editorial decisions; approved draft becomes review-ready, changes requested returns content to draft.
- The production worker routes the governed editorial contract before the legacy HQ fallback.

### Exact commissioned journey

PR #270 strengthened the gate so it exercises the same explicit Publish action used by Shift HQ instead of inferring it from the legacy write path.

GitHub Actions run `31777562609`, job `94696108291` completed GREEN and demonstrated:

1. anonymous Knowledge editorial access is denied;
2. a named HQ owner (`Commissioning Editor`) authenticates;
3. a draft article is created;
4. explicit HQ Publish is rejected with `editorial_review_required` before review;
5. the legacy publish path is also rejected before review;
6. a named approval with note is retained;
7. a fresh list request simulating leave/return retains decision, reviewer name/email, note and timestamp;
8. the explicit HQ Publish action then succeeds;
9. the final published article still carries the retained named review provenance.

Expected operator outcome proved by the gate: **an HQ editor can see who reviewed an article, leave and return without losing that approval, and the visible Publish action cannot bypass retained review.**

### Shift HQ presentation

Shift HQ PR #2 merged as `48f28b2d7cd069622e6361d2565576ad7e32ae7e` after the Shift HQ integration gate was GREEN (`31777465344`). The protected V1.11 runtime remains unchanged; the additive Knowledge Hub layer adds:

- premium forest/cream editorial hierarchy consistent with the homepage design constitution;
- explicit Draft → Review → Publish framing;
- reviewer identity, decision, review time and note in the article list;
- Approve, Request changes and Publish actions using the governed Core routes;
- responsive table containment and reduced-motion handling;
- preserved Radar and existing HQ navigation/runtime contracts.

## Why this is not PASS

The Cloudflare Workers Git deployment reported **Deployment failed** for the Shift HQ PR head (`ecdefdfa`) even though the repository integration gate was GREEN. This deployment failure is also consistent with the pre-existing Shift HQ Git deployment problem seen on the earlier Radar PR, so it is not evidence that the G3-006 application journey failed; equally, a green Git merge cannot be treated as production success.

No privileged production HQ credential/bypass is created for commissioning. The remaining closure is deliberately the real thing:

- restore/complete the Shift HQ deployment path;
- authenticate through the deployed HQ as a real authorised operator;
- visibly demonstrate draft → blocked premature Publish → named review → leave/return retained review → Publish;
- retain desktop and narrow/mobile rendered evidence showing reviewer metadata/actions and homepage-grade premium hierarchy with no broken/blank/overflow state.

Until that exists, **G3-006 stays AMBER** and all non-blocked work continues.