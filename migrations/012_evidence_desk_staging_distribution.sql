CREATE TABLE IF NOT EXISTS evidence_desk_staging_deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  destination TEXT NOT NULL,
  copy_sha256 TEXT NOT NULL CHECK (length(copy_sha256) = 64),
  payload_sha256 TEXT NOT NULL CHECK (length(payload_sha256) = 64),
  payload_json TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
