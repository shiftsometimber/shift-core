-- Three-channel intents only. No transport, schedule or automatic approval.
-- Established observer contract, matching migrations/clinical-casework-v1.sql.
CREATE TABLE IF NOT EXISTS clinical_case_outbox (
 id TEXT PRIMARY KEY,event_id TEXT NOT NULL,recipient_user_id INTEGER NOT NULL,
 recipient_kind TEXT NOT NULL,template TEXT NOT NULL,link TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL,
 UNIQUE(event_id,recipient_user_id,recipient_kind)
);
CREATE TABLE IF NOT EXISTS clinical_notification_events (
 id TEXT PRIMARY KEY, member_id INTEGER NOT NULL, record_id TEXT NOT NULL,
 order_number TEXT, kind TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
 link TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(id,member_id)
);
CREATE TABLE IF NOT EXISTS clinical_notification_channels (
 event_id TEXT NOT NULL REFERENCES clinical_notification_events(id),
 channel TEXT NOT NULL CHECK(channel IN ('email','whatsapp','app')),
 status TEXT NOT NULL DEFAULT 'awaiting_approval', draft_id TEXT,
 provider_reference TEXT, updated_at TEXT NOT NULL,
 PRIMARY KEY(event_id,channel)
);
CREATE TRIGGER IF NOT EXISTS clinical_notification_events_immutable_update BEFORE UPDATE ON clinical_notification_events BEGIN SELECT RAISE(ABORT,'immutable_notification_event'); END;
CREATE TRIGGER IF NOT EXISTS clinical_notification_events_immutable_delete BEFORE DELETE ON clinical_notification_events BEGIN SELECT RAISE(ABORT,'immutable_notification_event'); END;
