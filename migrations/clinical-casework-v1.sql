-- Additive; does not enable review, prescribing, notifications or dispensing.
CREATE TABLE IF NOT EXISTS clinical_case_state (
 record_id TEXT PRIMARY KEY REFERENCES clinical_member_records(id),
 version INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'awaiting_review',
 assessment_version INTEGER NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS clinical_hq_staff (
 user_id INTEGER PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('clinician','operations')),
 active INTEGER NOT NULL DEFAULT 0, verified_by TEXT NOT NULL,
 registration_body TEXT, registration_number TEXT, expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS clinical_case_events (
 id TEXT PRIMARY KEY, record_id TEXT NOT NULL, version INTEGER NOT NULL,
 assessment_version INTEGER NOT NULL, actor_user_id INTEGER NOT NULL, actor_kind TEXT NOT NULL,
 kind TEXT NOT NULL, public_json TEXT NOT NULL, private_json TEXT NOT NULL,
 created_at TEXT NOT NULL, UNIQUE(record_id,version)
);
CREATE TABLE IF NOT EXISTS clinical_case_outbox (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL, recipient_user_id INTEGER NOT NULL, recipient_kind TEXT NOT NULL,
 template TEXT NOT NULL, link TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
 created_at TEXT NOT NULL, UNIQUE(event_id,recipient_user_id,recipient_kind)
);
CREATE TRIGGER IF NOT EXISTS clinical_case_events_no_update BEFORE UPDATE ON clinical_case_events BEGIN SELECT RAISE(ABORT,'immutable_event'); END;
CREATE TRIGGER IF NOT EXISTS clinical_case_events_no_delete BEFORE DELETE ON clinical_case_events BEGIN SELECT RAISE(ABORT,'immutable_event'); END;

CREATE TABLE IF NOT EXISTS clinical_case_assignments (
 record_id TEXT NOT NULL REFERENCES clinical_member_records(id), hq_user_id INTEGER NOT NULL,
 active INTEGER NOT NULL DEFAULT 1, expires_at TEXT NOT NULL, PRIMARY KEY(record_id,hq_user_id)
);
