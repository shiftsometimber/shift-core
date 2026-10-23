# Approved SEO follow-up, 24 October 2026

Five confirmed 404 aliases receive exact-path permanent redirects (including trailing slash and query strings). `/blog` resolves to `/explore-knowledge`, verified rendered article library, rather than Newsroom. Query strings retained. No nested routes redirected.

User explicitly approved public SHIFT for Work indexability and sitemap submission. The scoped Worker delegates to the CURRENT live Work presentation and blog sitemap services, adjusts only crawler metadata and adds one Work URL to the composed sitemap. Preview HTTP header remains noindex. No page copy, homepage, purchase routes, member data or shared assets change.

Guarded commands: `node release/seo-followup-20261024/release.cjs stage`, `verify-stage`, `promote`, `verify-live`, `rollback`. Requires clean pushed source, targeted tests, existing production promotion interlock, stage acceptance, unchanged full route map and dependency deployments before activation. Evidence and before-images saved externally in website-review-evidence-20261023/seo-followup-v2. Rollback restores prior exact route owners and removes only created routes.

Two duplicate guide pairs remain unidentified. No canonical consolidation guessed. Search Console submission occurs only after verified production sitemap and Work metadata.

First production acceptance caught Cloudflare exact patterns excluding query strings; restored all 26 original route before-images before correction. V2 uses prefix route patterns plus exact path guards, preserving existing Work, sitemap and Help service handlers for all unmatched paths/methods. Longer existing treatment and waiting-list-journey routes retain priority. Both plain URLs and query strings are verified.

The established common.phase uses anonymous GitHub reads. Its 60-request quota was exhausted before V2 activation, which stopped safely with no route mutations. production-phase.cjs preserves the identical active-run/job/step interlock using existing Git authentication in memory. It neither changes permissions nor stores/displays credentials.

Production acceptance: canonical-host aliases resolve in one 301. www aliases encounter an existing canonical-host redirect before the scoped Worker, then resolve in a second 301. Verified finite chain, no loop; removing the extra hop remains blocked because the existing Cloudflare credential cannot read zone dynamic redirect rules (API 10000). The acceptance verifier records this limitation explicitly rather than claiming single-hop www redirects. Work indexability and canonical sitemap submission are independent and remain authorised.

## Final verified status

Deployment 93de4dc3-bd5d-40c6-ad39-4ff237b1231c, 40 scoped routes. Six targeted tests, 80 production URL/method checks, valid XML with 420 unique URLs, Work canonical/robots and unchanged approved presentation verified. Homepage response SHA unchanged; cart/checkout remain 404. Google accepted sitemap resubmission at 2026-10-23T23:17:06.793Z; download pending, indexing unconfirmed. Sanitised receipts in evidence/. Existing separate clinical route ID refresh reconciled only after proving complete route semantics and all dependent deployments unchanged. First attempt rolled back, all before-images preserved externally. Owned workers.dev previews disabled after acceptance.

Open: www extra canonical hop (zone redirect-rule read access unavailable), exact two duplicate-guide pairs, Google subsequent fetch/indexing. Earlier mobile/Safari and homepage ticker restrictions from the main review remain in STATUS.md.
