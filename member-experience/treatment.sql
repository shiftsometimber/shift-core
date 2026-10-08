CREATE TABLE IF NOT EXISTS member_treatment_records (
 id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 medicine TEXT NOT NULL, prescription_details TEXT NOT NULL, status TEXT NOT NULL,
 supply INTEGER NOT NULL, next_at TEXT, reminder_enabled INTEGER NOT NULL DEFAULT 0,
 revision INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS member_treatment_owner ON member_treatment_records(user_id);
CREATE TABLE IF NOT EXISTS member_treatment_events (
 id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 treatment_id TEXT NOT NULL REFERENCES member_treatment_records(id) ON DELETE CASCADE,
 kind TEXT NOT NULL, body_json TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'member',
 occurred_at TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS member_treatment_event_owner ON member_treatment_events(user_id, occurred_at);
CREATE TABLE IF NOT EXISTS member_medical_disclosures (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 revision INTEGER NOT NULL, body_json TEXT NOT NULL, confirmed_at TEXT NOT NULL,
 PRIMARY KEY(user_id,revision)
);
