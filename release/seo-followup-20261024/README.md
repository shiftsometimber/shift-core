# Approved SEO follow-up, 24 October 2026

Five confirmed 404 aliases receive exact-path permanent redirects (including trailing slash). `/blog` resolves to `/explore-knowledge`, verified rendered article library, rather than Newsroom. Query strings retained. No nested routes redirected.

User explicitly approved public SHIFT for Work indexability and sitemap submission. The scoped Worker delegates to the CURRENT live Work presentation and blog sitemap services, adjusts only crawler metadata and adds one Work URL to the composed sitemap. Preview HTTP header remains noindex. No page copy, homepage, purchase routes, member data or shared assets change.

Guarded commands: `node release/seo-followup-20261024/release.cjs stage`, `verify-stage`, `promote`, `verify-live`, `rollback`. Requires clean pushed source, targeted tests, existing production promotion interlock, stage acceptance, unchanged full route map and dependency deployments before activation. Evidence and before-images saved externally in website-review-evidence-20261023/seo-followup. Rollback restores prior exact route owners and removes only created routes.

Two duplicate guide pairs remain unidentified. No canonical consolidation guessed. Search Console submission occurs only after verified production sitemap and Work metadata.
