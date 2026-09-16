-- Read-only production preflight. No statement in this file writes any record.
-- Capture the nine selected events plus historical/source/headline/slug duplicates.
WITH selected AS (
 SELECT * FROM radar_events WHERE id IN (276,279,281,284,286,288,290,292,294)
), relevant AS (
 SELECT e.* FROM radar_events e WHERE e.id IN (23,35,276,279,281,284,286,288,290,292,294)
 OR EXISTS (SELECT 1 FROM selected s WHERE lower(trim(e.headline))=lower(trim(s.headline)))
 OR EXISTS (SELECT 1 FROM selected s, json_each(s.source_evidence_json) ss, json_each(e.source_evidence_json) es WHERE rtrim(json_extract(ss.value,'$.url'),'/')=rtrim(json_extract(es.value,'$.url'),'/'))
 OR json_extract(e.content_package_json,'$.seo.slug') IN ('medicine-news/domperidone-phaeochromocytoma-mhra-warning-2026','medicine-news/ixchiq-2025-pause-superseded-2026-review','medicine-news/ixchiq-uk-restrictions-safety-review-2026','medicine-news/isotretinoin-prescribing-safeguards-january-2026','medicine-news/mesalazine-intracranial-hypertension-mhra-warning','medicine-news/isotretinoin-october-2025-survey-later-guidance','medicine-news/rsv-vaccines-small-gbs-risk-mhra-context','medicine-news/asthma-reliever-overuse-mhra-reminder','medicine-news/bromocriptine-postpartum-blood-pressure-mhra')
)
SELECT 'events' section,json_group_array(json_object('id',id,'event_key',event_key,'status',status,'headline',headline,'region',region,'regulator',regulator,'clinical',clinical,'requires_review',requires_review,'source_evidence_json',source_evidence_json,'verification_json',verification_json,'medicine_patch_json',medicine_patch_json,'content_package_json',content_package_json,'reviewed_at',reviewed_at,'created_at',created_at,'updated_at',updated_at)) payload FROM (SELECT * FROM relevant ORDER BY id)
UNION ALL
SELECT 'source_audit' section,json_group_array(json_object('id',id,'event_id',event_id,'action',action,'actor',actor,'detail_json',detail_json,'created_at',created_at)) payload FROM (SELECT * FROM radar_audit WHERE event_id IN (276,279,281,284,286,288,290,292,294) AND action IN ('source_changed_review_required','source_change_review_started','approved','approved_bulk','published','withdrawn','correction_prepared') ORDER BY id)
UNION ALL
SELECT 'publication_history' section,json_group_array(json_object('id',id,'event_id',event_id,'job_id',job_id,'version',version,'action',action,'destinations_json',destinations_json,'snapshot_json',snapshot_json,'actor',actor,'created_at',created_at)) payload FROM (SELECT * FROM radar_publication_history WHERE event_id IN (276,279,281,284,286,288,290,292,294) ORDER BY event_id,version)
UNION ALL
SELECT 'publication_jobs' section,json_group_array(json_object('id',id,'event_id',event_id,'status',status,'site_payload_json',site_payload_json,'brain_payload_json',brain_payload_json,'search_payload_json',search_payload_json,'error_text',error_text,'created_at',created_at,'started_at',started_at,'completed_at',completed_at)) payload FROM (SELECT * FROM radar_publication_jobs WHERE event_id IN (276,279,281,284,286,288,290,292,294) ORDER BY event_id,id);
