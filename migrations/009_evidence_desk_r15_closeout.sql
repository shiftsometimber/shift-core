-- R1.5/Wave 2 closeout controls. Records copy integrity or an honest lock reason.
-- Creates no events or packages and grants no review or publication authority.
CREATE TABLE IF NOT EXISTS evidence_desk_copy_controls (
  claim_id TEXT PRIMARY KEY, package_id INTEGER, revision_id TEXT,
  page_path TEXT NOT NULL, content_key TEXT NOT NULL, proposed_text TEXT, copy_sha256 TEXT,
  state TEXT NOT NULL, locked_reason TEXT, source_url TEXT NOT NULL,
  qualified_review_required INTEGER NOT NULL DEFAULT 1,
  communications_review_required INTEGER NOT NULL DEFAULT 1,
  baseline_rollback_required INTEGER NOT NULL DEFAULT 1,
  publication_authority INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_evidence_copy_controls_package ON evidence_desk_copy_controls(package_id);
