# BabyLoveGrowth draft intake

Contract checked against https://www.babylovegrowth.ai/docs/integrations/webhook on 19 September 2026.

This candidate adds POST `/v1/integrations/babylovegrowth` to the existing Worker.
It is not a deployed or verified live endpoint. Do not enter it in the vendor wizard yet.

The deployment stores `BABYLOVE_WEBHOOK_TOKEN_SHA256`, a SHA-256 verifier for a
private random 256-bit token. The actual token is delivered only to the owner,
never committed. A legacy `BABYLOVE_WEBHOOK_TOKEN` secret is also supported.
The receiver accepts the documented Bearer header, with X-API-Key fallback only
when Authorization is absent. Never reuse an HQ, Cloudflare or member credential.

Authenticated BabyLoveGrowth articles enter `knowledge_articles`; vendor deliveries marked `published` (or omitting status) publish automatically, while an explicit `draft` remains private. Source ID, original payload,
image and JSON-LD are retained in `babylove_receipts`. No image URL is fetched,
no submitted HTML/schema is rendered and no public URL is claimed. Exact retries
are acknowledged without another article; content/slug conflicts return 409 for
review. Manual HQ editorial approval remains available for non-BabyLove editorial content and explicit drafts; trusted BabyLoveGrowth publication no longer requires a second manual publish step.

Verification: `node --test babylove/*.test.mjs tests/knowledge-editorial-*.test.mjs`
passed 17 tests locally. These are SQLite-backed handler and existing editorial
tests, not a real vendor delivery, deployed D1 test or visual article acceptance.

Remaining release work: verify isolated Worker/D1 deployment, set the dedicated
secret through the authorised deployment mechanism, test one vendor delivery and
its retry, validate article rendering/image/schema and listing/sitemap behaviour
before allowing public publication. Automatic publication is enabled only for the authenticated BabyLoveGrowth receiver; conflicts still fail closed and never overwrite existing editorial changes.
