-- Public editorial records only; no private member/health/payment data.
SELECT a.id,a.slug,a.title,a.author,a.status,a.summary,a.body,a.seo_title,a.publish_at,a.updated_at,b.source_id,b.payload_hash FROM knowledge_articles a LEFT JOIN babylove_receipts b ON b.slug=a.slug WHERE a.slug='glp-1-nhs-eligibility';
-- Classify route using the retained production articleSource logic. Capture the exact raw row and body SHA256; delivered HTML hashes and the reconstructed test fixture are NOT mutation guards.
