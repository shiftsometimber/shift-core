-- Keep one governed Radar event for each exact normalised headline.
-- Preserve published/approved events first, then the strongest verified draft.
-- Duplicate records remain recoverable in the audit trail; they are not deleted.
CREATE TABLE IF NOT EXISTS radar_duplicate_cleanup (
  duplicate_event_id INTEGER PRIMARY KEY,
  canonical_event_id INTEGER NOT NULL,
  cleaned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO radar_duplicate_cleanup(duplicate_event_id,canonical_event_id)
WITH ranked AS (
  SELECT
    id,
    FIRST_VALUE(id) OVER (
      PARTITION BY lower(trim(headline))
      ORDER BY
        CASE status WHEN 'published' THEN 0 WHEN 'approved' THEN 1 WHEN 'ready_for_review' THEN 2 WHEN 'verified' THEN 3 WHEN 'needs_more_evidence' THEN 4 WHEN 'hold' THEN 5 ELSE 9 END,
        confidence_score DESC,
        urgency_score DESC,
        relevance_score DESC,
        id ASC
    ) AS canonical_id,
    ROW_NUMBER() OVER (
      PARTITION BY lower(trim(headline))
      ORDER BY
        CASE status WHEN 'published' THEN 0 WHEN 'approved' THEN 1 WHEN 'ready_for_review' THEN 2 WHEN 'verified' THEN 3 WHEN 'needs_more_evidence' THEN 4 WHEN 'hold' THEN 5 ELSE 9 END,
        confidence_score DESC,
        urgency_score DESC,
        relevance_score DESC,
        id ASC
    ) AS duplicate_rank
  FROM radar_events
  WHERE status IN ('published','approved','ready_for_review','verified','needs_more_evidence','hold')
)
SELECT id,canonical_id FROM ranked WHERE duplicate_rank>1;

UPDATE radar_events
SET
  status='reject',
  review_note='Duplicate of governed Radar event #' || (
    SELECT canonical_event_id FROM radar_duplicate_cleanup WHERE duplicate_event_id=radar_events.id
  ),
  reviewed_by='system:radar-deduplicate-v1',
  reviewed_at=CURRENT_TIMESTAMP,
  updated_at=CURRENT_TIMESTAMP
WHERE id IN (SELECT duplicate_event_id FROM radar_duplicate_cleanup)
  AND status NOT IN ('published','approved');

INSERT INTO radar_audit(event_id,action,actor,detail_json,created_at)
SELECT
  duplicate_event_id,
  'duplicate_rejected',
  'system:radar-deduplicate-v1',
  json_object('canonical_event_id',canonical_event_id,'hard_deleted',0),
  CURRENT_TIMESTAMP
FROM radar_duplicate_cleanup d
WHERE NOT EXISTS (
  SELECT 1 FROM radar_audit a
  WHERE a.event_id=d.duplicate_event_id
    AND a.action='duplicate_rejected'
    AND a.actor='system:radar-deduplicate-v1'
);
