CREATE TABLE IF NOT EXISTS testing_fulfilment_mail (
 batch_id TEXT PRIMARY KEY REFERENCES testing_fulfilment_batches(id),
 revision INTEGER NOT NULL DEFAULT 1,
 status TEXT NOT NULL CHECK(status IN ('queued','scheduled','sending','sent','blocked','failed','uncertain','cancelled')),
 request_key TEXT NOT NULL UNIQUE,
 request_hash TEXT NOT NULL,
 review_hash TEXT NOT NULL,
 envelope_json TEXT NOT NULL,
 send_at TEXT NOT NULL,
 scheduled_local TEXT,
 time_zone TEXT NOT NULL DEFAULT 'Europe/London',
 approved_by TEXT NOT NULL,
 approved_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 attempt_count INTEGER NOT NULL DEFAULT 0,
 lease_id TEXT,
 sending_started_at TEXT,
 provider_id TEXT,
 accepted_at TEXT,
 failure_code TEXT,
 failure_message TEXT
);
CREATE INDEX IF NOT EXISTS testing_fulfilment_mail_due ON testing_fulfilment_mail(status,send_at);
