-- Apply explicitly to the intended database. Does not enable clinical sales or prescribing.
CREATE TABLE IF NOT EXISTS clinical_member_records (
 id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, order_number TEXT,
 revision INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'draft',
 schema_version TEXT NOT NULL, review_sharing INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS clinical_record_order_once ON clinical_member_records(user_id,order_number) WHERE order_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS clinical_records_member ON clinical_member_records(user_id,created_at);
CREATE TABLE IF NOT EXISTS clinical_member_versions (
 record_id TEXT NOT NULL, version INTEGER NOT NULL, schema_version TEXT NOT NULL,
 answers_json TEXT NOT NULL, evidence_json TEXT NOT NULL, declarations_json TEXT NOT NULL, digest TEXT NOT NULL,
 submitted INTEGER NOT NULL, created_at TEXT NOT NULL,
 PRIMARY KEY(record_id,version), FOREIGN KEY(record_id) REFERENCES clinical_member_records(id)
);
CREATE TABLE IF NOT EXISTS clinical_member_evidence (
 id TEXT PRIMARY KEY, record_id TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE,
 kind TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, digest TEXT NOT NULL,
 uploaded_at TEXT NOT NULL, FOREIGN KEY(record_id) REFERENCES clinical_member_records(id)
);
CREATE TABLE IF NOT EXISTS clinical_reviewer_assignments (
 record_id TEXT NOT NULL, reviewer_user_id INTEGER NOT NULL,
 active INTEGER NOT NULL DEFAULT 1, expires_at TEXT NOT NULL,
 PRIMARY KEY(record_id,reviewer_user_id)
);
CREATE TABLE IF NOT EXISTS clinical_member_audit (
 id TEXT PRIMARY KEY, record_id TEXT NOT NULL, actor_user_id INTEGER NOT NULL,
 action TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS clinical_versions_no_update BEFORE UPDATE ON clinical_member_versions BEGIN SELECT RAISE(ABORT,'immutable_version'); END;
CREATE TRIGGER IF NOT EXISTS clinical_versions_no_delete BEFORE DELETE ON clinical_member_versions BEGIN SELECT RAISE(ABORT,'immutable_version'); END;
CREATE TRIGGER IF NOT EXISTS clinical_audit_no_update BEFORE UPDATE ON clinical_member_audit BEGIN SELECT RAISE(ABORT,'immutable_audit'); END;
CREATE TRIGGER IF NOT EXISTS clinical_audit_no_delete BEFORE DELETE ON clinical_member_audit BEGIN SELECT RAISE(ABORT,'immutable_audit'); END;
