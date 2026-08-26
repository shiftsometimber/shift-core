-- Dedicated non-production R1.2 database only.
-- Re-establishes an empty commissioning state for a deterministic rerun.
DELETE FROM evidence_desk_notifications;
DELETE FROM evidence_desk_decisions;
DELETE FROM evidence_desk_packages;
DELETE FROM evidence_desk_events;
DELETE FROM evidence_desk_page_dependencies;
DELETE FROM evidence_desk_claim_dependencies;
DELETE FROM evidence_desk_claims;
DELETE FROM evidence_desk_facts;
DELETE FROM evidence_desk_snapshots;
DELETE FROM evidence_desk_sources;
UPDATE evidence_desk_control
SET enabled=0,ingestion_enabled=0,decision_email_enabled=0,website_publish_enabled=0,
    newsletter_enabled=0,social_enabled=0,stopped_at=NULL,stop_reason=NULL,updated_at=CURRENT_TIMESTAMP
WHERE id=1;
