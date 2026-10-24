# Blog contributor connection

Implementation status, 22 October 2026: **the standalone blog service is deployed on the live SHIFT API and blog routes**. The private hosted new-post and approved-refresh tests pass all six actual HTTP receipts. All 101 current automated tests pass. A genuine Matt O'Brien HQ owner session opened the live blog console and uploaded a real MP4. Live key creation is enabled. A live contributor has authenticated and submitted private drafts; no key material is stored in this repository. Update, 24 October: the real contributor alcohol-free beer article published through the API and all six production receipts pass. The real 25 October clock-change slot remains future; its scheduling regression passes.

## Contributor access

The dedicated bearer key can create new blog submissions, propose revisions to published blogs, add checked internal links, upload bounded blog images/video and read only its own submissions, upload receipts and publication receipts. It cannot approve a revision, use HQ/owner routes, edit other pages or the homepage, read member/payment/order data, change settings, unpublish/delete, change redirects, provision keys or perform rollbacks. Keys are separately revocable and are stored only as SHA-256 verifiers. Revocation also stops pending publication. Private existing CMS drafts are never disclosed to a contributor probing their slugs.

Submit with `POST https://api.shiftsometimber.co.uk/v1/integrations/blog-articles`, `Authorization: Bearer <dedicated key>`, `Content-Type: application/json` and a stable `Idempotency-Key` of up to 128 letters, numbers, underscores or hyphens. An exact retry returns the original submission. Reusing the idempotency key with different content returns 409. Do not put credentials in URLs or article fields. A key allows at most ten fresh submissions per hour.

Example JSON:

```json
{
  "title": "A useful, distinct reader question",
  "body": "Complete Markdown copy with headings, relevant internal links and visible primary-source links.",
  "heroImage": {
    "url": "https://shiftsometimber.co.uk/assets/approved-blog-image.png",
    "alt": "A useful description of the image",
    "caption": "The accurate image caption and credit"
  },
  "metaDescription": "An accurate description of the actual article.",
  "url": "/articles/a-useful-distinct-question",
  "keywords": ["primary intent", "supporting topic"],
  "sources": [{"title": "Primary source title", "url": "https://www.nhs.uk/tests-and-treatments/nhs-health-check/"}],
  "author": "Matt O'Brien",
  "editorialCheck": {"result": "pass", "reviewer": "Matt O'Brien"},
  "releaseDate": "2026-10-26"
}
```

Submit ahead of the intended 11:00 Europe/London slot so independent checks can finish. With no requested date, submission after the slot selects the next local day. A requested slot already in the past is held rather than backdated. The standalone publisher has one 15-minute Cloudflare trigger and processes the 11:00 slot using Europe/London. Core is unchanged and does not run this contributor queue. Disable this trigger before any future migration of the contributor queue into Core. Matt has instructed that the separate 14:00 website-native editorial service be paused for this 45-day series; preserve the shared cron and do not resume editorial generation/publication until the pause is reviewed. The existing publishing observer is paused. A durable owner pause has been saved and read back in the existing production database; the same-source scheduler reader is prepared and must be admitted before any website-native editorial activation. The old runtime has no native editorial tables/publications. A provider version guard blocked the separate live flag change, so the old true flags are not claimed false. An enabled schedule is not proof of a successful future unattended publication.

Only new full-article submissions can publish automatically after all checks; the separate bounded internal-link operation below is also pre-authorised. An existing published CMS article becomes `revision_awaiting_owner`; the live article stays unchanged. A non-CMS/static existing URL is held for its original source owner instead of being overwritten. Exact-title collisions at another URL are held. New contributor article submissions must use the author `Matt O'Brien`. Link-only maintenance preserves the existing author and all other existing metadata. Raw HTML, unsafe links, incomplete copy and contributor `fail` declarations are held as private drafts, with reasons.

Images must be HTTPS raster images on the existing SHIFT assets/blog-upload paths or the existing organisation-specific BabyLoveGrowth image stores. Arbitrary server fetches, redirects and SVG/script content are rejected. Primary source hosts are explicitly allowlisted: NHS, NHS England, GOV.UK, NICE, eMC, ClinicalTrials.gov, PubMed/PMC, Samaritans, Mind and the existing UK National Screening Committee government hosts. Source accessibility, visibility and factual support are still checked. Sources must be readable and visible in the article. Internal links and image bytes are checked before publication. The site builds its own Article schema and escapes content through the existing Markdown renderer; supplied executable HTML/schema is never rendered.

The contributor's pass is a declaration, not site approval. The existing capped editorial gateway performs an independent source-backed review, with at most one imported-article model attempt per local day, logging off and no alternate provider. A capacity wait is queued automatically; unchanged passed reviews can be reused without another model call. Missing gateway/budget verification, failed source checks or uncertain review hold the draft. Changed source text invalidates the saved review before publication. This is AI editorial verification, not clinical sign-off.

## Internal links without individual approval

Use `POST /v1/integrations/blog-articles/internal-links` with the same bearer key and a new stable `Idempotency-Key`. Example:

```json
{
  "url": "/articles/an-existing-article",
  "links": [{"text": "existing words in a plain paragraph", "url": "/articles/relevant-published-article"}],
  "related": [{"text": "Exact title of the linked article", "url": "/articles/another-published-article"}]
}
```

Either `links` or `related` may be omitted. At most five additions and one short Related line per request are accepted. Ordinary links from a new article never require this separate operation. This operation wraps an exact, unambiguous existing phrase, or appends the server-generated `Related: [destination title](URL)` line. It accepts no replacement body, title, metadata, image or author. Existing links cannot be removed or retargeted. Automatic wrapping is limited to plain paragraph lines; headings, captions, code, tables and ambiguous matches hold rather than guessing. The linked page must already be public, resolve directly, have the correct canonical and pass a basic anchor/title relevance check; Related text must match its actual title. Submit backlinks after the new destination has published and verified.

These maintenance edits apply immediately after deterministic checks. They do not consume the daily new-article AI review allowance or add a publication schedule. All existing text and page fields are retained, original date preserved, genuine modified time recorded, history saved atomically and live checks returned as `links_verified` or `links_verification_failed`. A missing image is honestly `not_applicable`. Source/base drift, key revocation or uncertain writes hold for reconciliation. Full existing-article submissions, including copy/image/metadata changes, still require exact owner approval. Link history is marked as the approved policy, never as a fabricated personal approval. Legacy rollback without full metadata retains its existing hold.

## Images and video in the blog section

The owner blog console includes a file upload control. Contributors use `POST /v1/integrations/blog-articles/media` with the same bearer key, `Idempotency-Key`, exact image/video `Content-Type`, and raw file bytes (not JSON/base64). PNG/JPEG/WebP/GIF images have an 8,000,000-byte limit; MP4/WebM videos have a 20,000,000-byte limit. SVG, HTML, unsupported types, mismatched signatures/containers, excess quotas and revoked keys are rejected. Limits are 20 upload reservations and 100,000,000 bytes per identity per rolling 24 hours. There is no listing of other users' media, overwrite or delete operation. The response returns an immutable `/uploads/blog/<id>.<extension>` URL; `GET /v1/integrations/blog-articles/media/<id>` reads only that identity's upload receipt.

Use the returned image URL in `heroImage`, with accurate alt text and caption. A post may additionally include:

```json
"video": {
  "url": "https://shiftsometimber.co.uk/uploads/blog/<video-id>.mp4",
  "poster": "https://shiftsometimber.co.uk/uploads/blog/<image-id>.png",
  "caption": "Accurate video description and credit",
  "transcript": "Accurate transcript of any spoken content."
}
```

The site renders a native player with controls, no autoplay, poster, caption and escaped transcript. Independent text review sees this metadata/transcript; it is not proof that the audio or video matches the transcript. Container tests do not prove real playback. Uploaded public URLs are unguessable, noindex and not a place for private/member/clinical material. Video range requests are supported.

**Storage release requirement:** `BLOG_MEDIA_UPLOAD_ENABLED=true` and the `BLOG_MEDIA` R2 binding are required. Dedicated `shift-blog-media` storage is created and real image/video uploads, byte-exact readback, deduplication and video range delivery pass on the protected test service. The hash-matched PNG and MP4 decode successfully. The prepared existing Core configuration includes this binding, contributor/media enablement and the native 14:00 flags set false, with live-key creation still held false. The separate blog publisher now connects the live DB and this R2 bucket without releasing Core. Genuine HQ-owner console and video upload acceptance pass. Browser playback and first real contributor publication remain open; no paid plan or billing agreement was accepted.

## Receipts

Read `GET /v1/integrations/blog-articles/<submission id>` using the same contributor key. The initial response is normally 202 with the submission identifier, version hashes, state, reasons, proposed content and private receipt. Publishing is not claimed at acceptance. Before publication, the six checks are `pending`. After publication they contain dated actual pass/fail results for page live, image loads, internal links resolve, canonical correct, blog listing and sitemap. Google indexing is a separate observation and is never implied.

Possible states include `draft_failed`, `revision_awaiting_owner`, `review_pending`, `scheduled`, `published_unverified`, `verified`, `verification_failed` and explicit held/uncertain states. Interrupted publication is never blindly replayed. Do not replace the email fallback based only on `scheduled` or `published_unverified`.

## Owner controls

The owner-only console is `/v1/hq/blog-contributors/console`. It uses the existing authenticated HQ session and exposes the contributor list, revocation, full proposal previews and before/after comparisons. Its pages are private, no-store, noindex and protected by a restrictive CSP. No contributor token can authenticate as the owner.

Owner-only JSON routes:

- `POST /v1/hq/blog-contributors/keys` with `{ "label": "Contributor name" }`: creates a key only after backend acceptance is explicitly enabled; displays the token once and sends no invitation.
- `POST /v1/hq/blog-contributors/keys/<id>/revoke`: revokes access.
- `GET /v1/hq/blog-contributors/submissions`: review inventory.
- `GET /v1/hq/blog-contributors/submissions/<id>/preview`: full HTML preview for a browser, or JSON including the complete proposal and comparison.
- `POST /v1/hq/blog-contributors/submissions/<id>/approve` with the exact `payloadHash` and `baseHash` from that preview: approves only that revision and unchanged live base. Any changed base needs a new proposal/review. Approval does not skip factual checks or scheduling.
- `GET /v1/hq/blog-contributors/submissions/<id>/history`: private previous-version history.
- `POST /v1/hq/blog-contributors/submissions/<id>/rollback` with `{ "versionId": "..." }`: prepares an owner-reviewed rollback revision. It never immediately changes a live page. Rollback for versions created through this connection preserves full prior metadata. Legacy CMS versions without retained image/source metadata return a hold for complete owner preparation rather than inventing that metadata.

The original publication date remains unchanged on a refresh; only an actual successful write updates the modified time. Full CMS row guards, an active-key condition and an atomic SQL batch prevent stale/concurrent writes; private version history is committed in the same transaction. The existing CMS remains the source of article content. The standalone Worker serves contributor articles and media; delegates other articles to Core; and merges contributor discovery into the current Knowledge presentation and sitemap. The homepage, member routes and specifically owned answer-page routes remain with their existing Workers.

## Release and handover

The live standalone service has `BLOG_CONTRIBUTOR_ENABLED=true`, `BLOG_MEDIA_UPLOAD_ENABLED=true` and `BLOG_ACCESS_ACCEPTED=true` after hosted and real-owner console acceptance; the separate owner-authorised native editorial pause is recorded as described above. Live key creation also requires `BLOG_ACCESS_ACCEPTED=true`, after exact-source qualification, actual hosted Worker/D1 and HQ-owner acceptance, live endpoint checks and the approved handover. Preserve the existing editorial gateway and budget bindings; do not raise spend; preserve Matt's explicit 45-day-series pause for the 14:00 service. Provisioning a credential does not authorise sending it to anyone. Confirm the exact recipient and approved secure method before delivery. Social publishing remains separately approved.

Private local evidence includes policy/SQL/receiver/renderer/sitemap regressions and an isolated HTTP/SQLite flow covering scheduling across the 25 October clock change. Separate protected hosted acceptance uses actual Worker HTTP, isolated D1, dedicated R2 and the existing capped real editorial model. A complete new article and exact approved refresh both pass all six hosted receipts; original publication date is preserved. Related-line maintenance, owner-held rewrite, private rollback preparation, cross-key receipt/media isolation, upload retries and key revocation pass. The hosted owner identity and test clock are explicit fixtures; genuine HQ login, browser playback, production publication and future unattended delivery remain unverified. Two actual edge defects were corrected: unsupported error-mode redirects now use manual redirects with unchanged non-2xx rejection, and the preview has the same strictly-public fetch flag already present in production configuration. Original failed receipts are retained; no unsafe source/redirect rule was weakened.

Standalone release: `blog-publisher/wrangler.jsonc`, `worker.mjs` and focused tests. The current Knowledge presentation is pinned to `20261022-knowledge-live-v1`; a different live version is preserved and a missing blog discovery receipt must be reconciled before use. Route ownership and rollback are recorded by `activate.py` / `rollback.py`. Future Core releases must preserve the two sitemap routes now owned by this service. The current independent Core repair is not deployed or waived by this change.

Owner-approved refreshes, 22 October 2026: `/male-obesity`, `/guides/mens-health-mot-guide` and `/articles/testosterone-weight-men` were applied directly from the supplied packs. Their original dates are 2026-10-10, 2026-05-04 and 2026-08-26 respectively; all have modified date 2026-10-22. These three remain source-managed pages, not CMS migrations. Future full revisions to them are still held for an owner-controlled source release; do not retry different page IDs or claim contributor write authority. The approved additive backlinks, packaged images, schema, Knowledge discovery and sitemap are covered by `blog-publisher/approved-refreshes`; the original presentation Workers remain bound upstream and unchanged. The finite release receipt and scoped rollback are stored alongside that module.


## Retry and scheduling repair — 24 October 2026

The existing one-model-attempt-per-London-day spend guard is unchanged. Exhaustion now returns `review_waiting_budget`, with `receipt.retryAt`, and the same submission automatically resumes on the next London day. It is not an editorial rejection. A delayed review retains an honest current publication date. Successful reviews are reused without another model call when reviewed content and sources match; changing only transport dates does not invalidate them. New reviews use the readable source main content, excluding navigation/header/footer changes, and retain source snapshots. Existing proofs still use their original full-page hash; they are not silently upgraded or treated as valid after a source change.

Contributor retry: `POST /v1/integrations/blog-articles/<id>/retry`, same bearer key, JSON `{ "publishMode": "when_ready" }`. This retries an owned held submission without creating another draft or replacing its content. It never bypasses changed-base or owner revision approval. The normal default remains 11:00 Europe/London; `publishMode: "when_ready"` on a new submission or retry requests the next successful queue cycle (normally within 15 minutes), subject to review capacity and all checks. A retry can alternatively request `releaseDate` for a future 11am slot.

Source holds now include the exact changed source URL and previous/current hashes under `receipt.detail.sourceChanges`. Site failures name the source URL under `receipt.detail.checks`; independent editorial holds expose the model's actual issues under `receipt.detail.issues`. Old proofs have no source snapshot, so their exact historical text changes cannot be reconstructed from a checksum alone.

Read-only connection test: `GET /v1/integrations/blog-articles/capabilities` with the bearer key returns 200 with the scope, supported scheduling modes and review capacity, without creating any article. The base collection GET remains unavailable.

When-ready timing correction, 24 October: an explicit retry mode is retained through budget waiting and London-day rollover. Once capacity is available and the review passes, a when-ready post can publish on that queue cycle rather than reverting to the next 11am slot. Normal scheduled posts retain 11am. The dedicated regression includes the 25 October clock-change date.
