CREATE TABLE IF NOT EXISTS hq_seo_content_records (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('opportunity', 'inventory', 'release')),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  area TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'recommended', 'blocked', 'unverified', 'previewed', 'approved', 'deployed', 'live')),
  revision INTEGER NOT NULL CHECK (revision >= 1),
  priority REAL,
  next_action TEXT NOT NULL,
  has_proposal INTEGER NOT NULL CHECK (has_proposal IN (0, 1)),
  record_json TEXT NOT NULL,
  import_hash TEXT
);

CREATE INDEX IF NOT EXISTS hq_seo_content_register
  ON hq_seo_content_records (kind, status, priority DESC, title COLLATE NOCASE, id);

CREATE TABLE IF NOT EXISTS hq_seo_content_history (
  record_id TEXT NOT NULL REFERENCES hq_seo_content_records(id),
  revision INTEGER NOT NULL,
  event_json TEXT NOT NULL,
  PRIMARY KEY (record_id, revision)
);
