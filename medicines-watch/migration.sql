-- Separate from Radar: this table records retrieval checks, never claim approval.
CREATE TABLE IF NOT EXISTS medicines_watch_checks (
  source_id TEXT PRIMARY KEY,
  source_url TEXT NOT NULL,
  check_url TEXT NOT NULL,
  last_attempt_at TEXT,
  last_success_at TEXT,
  last_failure_at TEXT,
  attempt_status TEXT NOT NULL DEFAULT 'never',
  next_check_at TEXT,
  last_http_status INTEGER,
  last_error TEXT,
  last_fingerprint TEXT,
  last_withdrawn INTEGER NOT NULL DEFAULT 0 CHECK (last_withdrawn IN (0, 1))
);
CREATE INDEX IF NOT EXISTS medicines_watch_checks_due
  ON medicines_watch_checks(next_check_at);
