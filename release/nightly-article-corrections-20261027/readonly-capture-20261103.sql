-- Read-only capture. Run each statement through the retained authenticated D1 executor.
-- No member, clinical, identity, inbox or payment tables.
SELECT id,slug,title,status,author,summary,body,seo_title,publish_at,updated_at
FROM knowledge_articles WHERE slug='wegovy-injection-sites';

SELECT a.id,a.slug,a.title,a.status,a.author,a.publish_at,a.updated_at,
       b.source_id,b.created_at AS receipt_created_at
FROM knowledge_articles a LEFT JOIN babylove_receipts b ON b.slug=a.slug
WHERE (julianday(a.publish_at)>=julianday('2026-11-02T00:00:00Z')
       AND julianday(a.publish_at)<julianday('2026-11-03T00:00:00Z'))
   OR (julianday(b.created_at)>=julianday('2026-11-02T00:00:00Z')
       AND julianday(b.created_at)<julianday('2026-11-03T00:00:00Z'))
ORDER BY a.publish_at,a.id;

-- Discover the existing job/receipt table names before any optional follow-up.
SELECT name FROM sqlite_master WHERE type='table'
AND (name LIKE '%editorial%' OR name LIKE '%content%run%' OR name LIKE '%contribut%')
ORDER BY name;
