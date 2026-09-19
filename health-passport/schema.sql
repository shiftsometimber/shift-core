-- Apply to an isolated preview first. No clinical or commercial tables are changed.
CREATE TABLE IF NOT EXISTS health_passport_records (
 id TEXT PRIMARY KEY,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 record_type TEXT NOT NULL CHECK(record_type IN ('start_here','treatment')),
 request_key TEXT NOT NULL,
 payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 UNIQUE(user_id, record_type, request_key)
);
CREATE INDEX IF NOT EXISTS idx_health_passport_member ON health_passport_records(user_id,created_at DESC);
