-- Isolated non-production staging publisher ledger. This schema is never bound
-- to the production D1 and carries no production publication authority.

CREATE TABLE IF NOT EXISTS evidence_desk_staging_pages (
  page_path TEXT PRIMARY KEY,
  current_html TEXT NOT NULL DEFAULT '',
  current_sha256 TEXT NOT NULL CHECK (length(current_sha256) = 64),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence_desk_staging_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id INTEGER NOT NULL,
  page_path TEXT NOT NULL,
  content_key TEXT NOT NULL,
  copy_sha256 TEXT NOT NULL CHECK (length(copy_sha256) = 64),
  payload_sha256 TEXT NOT NULL CHECK (length(payload_sha256) = 64),
  baseline_sha256 TEXT NOT NULL CHECK (length(baseline_sha256) = 64),
  rollback_locator TEXT NOT NULL,
  candidate_html TEXT NOT NULL,
  candidate_sha256 TEXT NOT NULL CHECK (length(candidate_sha256) = 64),
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('published', 'rolled_back')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rolled_back_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_evidence_staging_versions_package
  ON evidence_desk_staging_versions (package_id, status, id DESC);
