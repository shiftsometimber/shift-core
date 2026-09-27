-- Evidence Desk operational runtime. This migration creates the durable control,
-- draft, baseline and publication-ledger tables only. It deliberately grants no
-- clinical, medicines-communications, editorial or publication authority.

CREATE TABLE IF NOT EXISTS evidence_desk_operational_control (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  monitoring_enabled INTEGER NOT NULL DEFAULT 0 CHECK (monitoring_enabled IN (0, 1)),
  drafting_enabled INTEGER NOT NULL DEFAULT 0 CHECK (drafting_enabled IN (0, 1)),
  website_enabled INTEGER NOT NULL DEFAULT 0 CHECK (website_enabled IN (0, 1)),
  newsletter_enabled INTEGER NOT NULL DEFAULT 0 CHECK (newsletter_enabled IN (0, 1)),
  social_enabled INTEGER NOT NULL DEFAULT 0 CHECK (social_enabled IN (0, 1)),
  staging_publication_enabled INTEGER NOT NULL DEFAULT 0 CHECK (staging_publication_enabled IN (0, 1)),
  production_authority_enabled INTEGER NOT NULL DEFAULT 0 CHECK (production_authority_enabled IN (0, 1)),
  control_epoch INTEGER NOT NULL DEFAULT 0,
  shutdown_reason TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO evidence_desk_operational_control (id) VALUES (1);

CREATE TABLE IF NOT EXISTS evidence_desk_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id INTEGER NOT NULL,
  revision INTEGER NOT NULL,
  page_path TEXT NOT NULL,
  content_key TEXT NOT NULL,
  proposed_text TEXT NOT NULL,
  copy_sha256 TEXT NOT NULL CHECK (length(copy_sha256) = 64),
  source_trace_json TEXT NOT NULL,
  model_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'copy_required',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (package_id, revision)
);

CREATE INDEX IF NOT EXISTS idx_evidence_drafts_package
  ON evidence_desk_drafts (package_id, revision DESC);

CREATE TABLE IF NOT EXISTS evidence_desk_page_baselines (
  package_id INTEGER PRIMARY KEY,
  page_path TEXT NOT NULL,
  baseline_sha256 TEXT NOT NULL CHECK (length(baseline_sha256) = 64),
  rollback_locator TEXT NOT NULL,
  captured_by TEXT NOT NULL,
  verified_by_connector INTEGER NOT NULL DEFAULT 0 CHECK (verified_by_connector IN (0, 1)),
  control_epoch INTEGER NOT NULL DEFAULT 0,
  captured_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_desk_publication_authority (
  package_id INTEGER PRIMARY KEY,
  authority_ref TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  exact_copy_sha256 TEXT NOT NULL CHECK (length(exact_copy_sha256) = 64),
  granted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_desk_specialist_review_locks (
  package_id INTEGER NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('clinical', 'communications')),
  copy_sha256 TEXT NOT NULL CHECK (length(copy_sha256) = 64),
  authority_ref TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  reviewed_at TEXT NOT NULL,
  PRIMARY KEY (package_id, review_type)
);

CREATE TABLE IF NOT EXISTS evidence_desk_publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id INTEGER NOT NULL,
  destination TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  remote_ref TEXT,
  payload_sha256 TEXT NOT NULL CHECK (length(payload_sha256) = 64),
  error_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_evidence_publications_package
  ON evidence_desk_publications (package_id, destination, status);

CREATE TABLE IF NOT EXISTS evidence_desk_distribution_approvals (
  package_id INTEGER NOT NULL,
  destination TEXT NOT NULL,
  copy_sha256 TEXT NOT NULL CHECK (length(copy_sha256) = 64),
  authority_ref TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  PRIMARY KEY (package_id, destination)
);

CREATE TABLE IF NOT EXISTS evidence_desk_distribution_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_id INTEGER NOT NULL,
  destination TEXT NOT NULL,
  copy_sha256 TEXT NOT NULL CHECK (length(copy_sha256) = 64),
  payload_json TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL CHECK (length(payload_sha256) = 64),
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'awaiting_approval',
  model_name TEXT NOT NULL,
  remote_ref TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at TEXT,
  completed_at TEXT,
  UNIQUE (package_id, destination, copy_sha256, payload_sha256)
);

CREATE TABLE IF NOT EXISTS evidence_desk_distribution_job_approvals (
  job_id INTEGER PRIMARY KEY,
  package_id INTEGER NOT NULL,
  destination TEXT NOT NULL,
  copy_sha256 TEXT NOT NULL CHECK (length(copy_sha256) = 64),
  payload_sha256 TEXT NOT NULL CHECK (length(payload_sha256) = 64),
  authority_ref TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  approved_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_evidence_distribution_jobs_status
  ON evidence_desk_distribution_jobs (status, destination, created_at);
