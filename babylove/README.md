# BabyLoveGrowth draft intake

Contract checked against https://www.babylovegrowth.ai/docs/integrations/webhook on 19 September 2026.

This candidate adds POST `/v1/integrations/babylovegrowth` to the existing Worker.
It is not a deployed or verified live endpoint. Do not enter it in the vendor wizard yet.

Configure a dedicated `BABYLOVE_WEBHOOK_TOKEN` Worker secret (at least 32 characters).
The receiver accepts the documented Bearer header, with X-API-Key fallback only
when Authorization is absent. Never reuse an HQ, Cloudflare or member credential.

Articles enter `knowledge_articles` as drafts. Source ID, original payload,
image and JSON-LD are retained in `babylove_receipts`. No image URL is fetched,
no submitted HTML/schema is rendered and no public URL is claimed. Exact retries
are acknowledged without another article; content/slug conflicts return 409 for
review. The existing editorial approval route remains responsible for publication.

Verification: `node --test babylove/*.test.mjs tests/knowledge-editorial-*.test.mjs`
passed 15 tests locally. These are SQLite-backed handler and existing editorial
tests, not a real vendor delivery, deployed D1 test or visual article acceptance.

Remaining release work: verify isolated Worker/D1 deployment, set the dedicated
secret through the authorised deployment mechanism, test one vendor delivery and
its retry, validate article rendering/image/schema and listing/sitemap behaviour
before allowing public publication. Keep BabyLoveGrowth automatic publishing off.
