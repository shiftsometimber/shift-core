# Approved app presentation and website inline tools

Owner approval on 28 September 2026: publish approved app layout while protecting main website. Follow-up: website should also use the same switching panels.

Base main 8c6902c8e0c6a53863282c6c4378f82ec1a70f6f, verified production run 36470775860, runtime 8581c02b-1c70-40d1-8ab7-e3a7682e69c2. Approved app payload 7cc35d6fbeb489446f1b1c84dbb55b77ab0f27c9, preview run 36488479110.

The production response adapter retains the exact three reviewed presentation modules, removes the review toolbar, serves a production asset, and confines styling to explicit app view or its member-only cookie. Installed standalone launches select app view. Website Today gets the same persistent tool controller with existing website content and styling. Public website routes and original APIs, account/session logic, database schemas, PWA manifest and Worker configuration are unchanged.

Production uses the existing Cloudflare promotion pipeline with all previous tests and public-content preservation retained, plus exact source scope, integrated Chromium/WebKit phone/desktop preview, production asset/isolation probes and synthetic signed-in app/website tab verification. Capture current deployment before release; existing post-deploy failure rollback retains member data. Native Apple Health/Health Connect remain unimplemented and their prototype is not published.
