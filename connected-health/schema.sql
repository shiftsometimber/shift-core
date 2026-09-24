-- Apply explicitly to the existing member DB only after isolated acceptance.
-- Not placed in auto-applied migrations; no production schema is changed by this PR.
CREATE TABLE IF NOT EXISTS connected_health_connections (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 provider TEXT NOT NULL CHECK(provider IN ('apple_health','health_connect')),
 connection_id TEXT NOT NULL UNIQUE,
 session_id TEXT NOT NULL,
 scopes_json TEXT NOT NULL CHECK(json_valid(scopes_json)),
 consent_version TEXT NOT NULL,
 revision INTEGER NOT NULL CHECK(revision>0),
 sync_revision INTEGER NOT NULL DEFAULT 0 CHECK(sync_revision>=0),
 can_sync INTEGER NOT NULL CHECK(can_sync IN (0,1)),
 can_personalise INTEGER NOT NULL CHECK(can_personalise IN (0,1)),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 last_import_at TEXT,
 PRIMARY KEY(user_id,provider)
);
CREATE TABLE IF NOT EXISTS connected_health_observations (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 provider TEXT NOT NULL CHECK(provider IN ('apple_health','health_connect')),
 metric TEXT NOT NULL CHECK(metric IN ('weight','height','steps','sleep')),
 external_id TEXT NOT NULL,
 value REAL NOT NULL,
 unit TEXT NOT NULL,
 start_at TEXT NOT NULL,
 end_at TEXT NOT NULL,
 sources_json TEXT NOT NULL CHECK(json_valid(sources_json)),
 basis TEXT NOT NULL,
 time_zone TEXT,
 imported_at TEXT NOT NULL,
 confirmed_at TEXT,
 PRIMARY KEY(user_id,provider,metric,external_id)
);
CREATE INDEX IF NOT EXISTS connected_health_timeline ON connected_health_observations(user_id,provider,end_at DESC);
CREATE TABLE IF NOT EXISTS connected_health_batches (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 provider TEXT NOT NULL,
 connection_id TEXT NOT NULL,
 batch_id TEXT NOT NULL,
 digest TEXT NOT NULL,
 applied INTEGER NOT NULL DEFAULT 0 CHECK(applied IN (0,1)),
 result_revision INTEGER NOT NULL,
 imported_count INTEGER NOT NULL,
 deleted_count INTEGER NOT NULL,
 created_at TEXT NOT NULL,
 PRIMARY KEY(user_id,provider,connection_id,batch_id)
);
CREATE TABLE IF NOT EXISTS connected_health_consent_events (
 event_id TEXT PRIMARY KEY,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 provider TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN ('grant','stop','withdraw','delete')),
 consent_version TEXT NOT NULL,
 scopes_json TEXT NOT NULL CHECK(json_valid(scopes_json)),
 created_at TEXT NOT NULL
);
