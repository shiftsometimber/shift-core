-- Shift Evidence Desk foundation: evidence spine, claim map and governed decisions.
-- Every publication destination is deliberately dark by default.

CREATE TABLE IF NOT EXISTS evidence_desk_control (
  id INTEGER PRIMARY KEY CHECK(id=1), enabled INTEGER NOT NULL DEFAULT 0, ingestion_enabled INTEGER NOT NULL DEFAULT 0,
  decision_email_enabled INTEGER NOT NULL DEFAULT 0, website_publish_enabled INTEGER NOT NULL DEFAULT 0,
  newsletter_enabled INTEGER NOT NULL DEFAULT 0, social_enabled INTEGER NOT NULL DEFAULT 0,
  stopped_at TEXT, stop_reason TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO evidence_desk_control(id,enabled,ingestion_enabled,decision_email_enabled,website_publish_enabled,newsletter_enabled,social_enabled)
VALUES(1,0,0,0,0,0,0);

CREATE TABLE IF NOT EXISTS evidence_desk_sources (
  id TEXT PRIMARY KEY, family TEXT NOT NULL, name TEXT NOT NULL, canonical_url TEXT NOT NULL, authority_name TEXT NOT NULL,
  extraction_method TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', trust_tier INTEGER NOT NULL DEFAULT 1,
  cadence_minutes INTEGER NOT NULL DEFAULT 1440, allowed_hosts_json TEXT NOT NULL DEFAULT '[]', config_json TEXT NOT NULL DEFAULT '{}',
  last_checked_at TEXT, last_material_change_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS evidence_desk_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT, source_id TEXT NOT NULL, fetched_at TEXT NOT NULL, http_status INTEGER,
  content_hash TEXT NOT NULL, structured_hash TEXT NOT NULL, facts_json TEXT NOT NULL, source_published_at TEXT,
  raw_locator TEXT, material_state TEXT NOT NULL, change_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS evidence_desk_facts (
  id INTEGER PRIMARY KEY AUTOINCREMENT, source_id TEXT NOT NULL, fact_key TEXT NOT NULL, value_json TEXT NOT NULL,
  value_hash TEXT NOT NULL, snapshot_id INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'current', source_published_at TEXT,
  first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL, UNIQUE(source_id,fact_key)
);
CREATE TABLE IF NOT EXISTS evidence_desk_claims (
  id TEXT PRIMARY KEY, claim_text TEXT NOT NULL, claim_type TEXT NOT NULL DEFAULT 'factual', risk_lane TEXT NOT NULL,
  communication_class TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', owner TEXT, freshness_days INTEGER NOT NULL DEFAULT 90,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS evidence_desk_claim_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT, claim_id TEXT NOT NULL, source_id TEXT NOT NULL, fact_key TEXT NOT NULL,
  relation TEXT NOT NULL DEFAULT 'supports', required INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(claim_id,source_id,fact_key)
);
CREATE TABLE IF NOT EXISTS evidence_desk_page_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT, claim_id TEXT NOT NULL, page_path TEXT NOT NULL, content_key TEXT NOT NULL,
  placement_type TEXT NOT NULL DEFAULT 'body', channel TEXT NOT NULL DEFAULT 'web', status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(claim_id,page_path,content_key,channel)
);
CREATE TABLE IF NOT EXISTS evidence_desk_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, source_id TEXT NOT NULL, snapshot_id INTEGER NOT NULL, status TEXT NOT NULL,
  materiality TEXT NOT NULL, risk_lane TEXT NOT NULL, headline TEXT NOT NULL, change_json TEXT NOT NULL,
  impacted_claims_json TEXT NOT NULL DEFAULT '[]', assigned_to TEXT, due_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS evidence_desk_packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL UNIQUE, status TEXT NOT NULL DEFAULT 'draft', title TEXT NOT NULL,
  summary TEXT NOT NULL, proposed_changes_json TEXT NOT NULL DEFAULT '[]', evidence_json TEXT NOT NULL DEFAULT '[]',
  risk_lane TEXT NOT NULL, communication_class TEXT NOT NULL, web_eligible INTEGER NOT NULL DEFAULT 0,
  newsletter_eligible INTEGER NOT NULL DEFAULT 0, social_eligible INTEGER NOT NULL DEFAULT 0,
  qualified_review_required INTEGER NOT NULL DEFAULT 0, qualified_reviewer TEXT, qualified_review_ref TEXT, qualified_reviewed_at TEXT,
  communications_review_required INTEGER NOT NULL DEFAULT 0, communications_reviewer TEXT, communications_review_ref TEXT,
  communications_reviewed_at TEXT, editorial_reviewer TEXT, editorial_reviewed_at TEXT, decision_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS evidence_desk_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, package_id INTEGER, event_id INTEGER, decision TEXT NOT NULL, actor_id INTEGER,
  actor_name TEXT NOT NULL, actor_email TEXT, actor_role TEXT NOT NULL, note TEXT, authority_ref TEXT,
  detail_json TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS evidence_desk_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT, package_id INTEGER, event_id INTEGER, notification_type TEXT NOT NULL,
  recipient TEXT, status TEXT NOT NULL DEFAULT 'queued', dedupe_key TEXT NOT NULL UNIQUE, provider_id TEXT,
  error_code TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, sent_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_evidence_sources_status ON evidence_desk_sources(status,family);
CREATE INDEX IF NOT EXISTS idx_evidence_snapshots_source ON evidence_desk_snapshots(source_id,id DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_facts_source ON evidence_desk_facts(source_id,fact_key);
CREATE INDEX IF NOT EXISTS idx_evidence_claim_source ON evidence_desk_claim_dependencies(source_id,fact_key,claim_id);
CREATE INDEX IF NOT EXISTS idx_evidence_page_claim ON evidence_desk_page_dependencies(claim_id,status);
CREATE INDEX IF NOT EXISTS idx_evidence_events_queue ON evidence_desk_events(status,risk_lane,id DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_packages_queue ON evidence_desk_packages(status,risk_lane,id DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_notifications_queue ON evidence_desk_notifications(status,id);
