-- Apply only to a separately provisioned WORK_DB. Never to the member DB.
CREATE TABLE IF NOT EXISTS work_employers (
 id TEXT PRIMARY KEY,
 revision INTEGER NOT NULL DEFAULT 0,
 state_json TEXT NOT NULL CHECK(json_valid(state_json)),
 updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS work_rate_limits (
 user_id INTEGER PRIMARY KEY,
 window INTEGER NOT NULL,
 attempts INTEGER NOT NULL
);
