-- Optional app sharing is separate from the submitted assessment declaration.
CREATE TABLE IF NOT EXISTS clinical_context_sharing (
 record_id TEXT NOT NULL REFERENCES clinical_member_records(id),
 revision INTEGER NOT NULL, user_id INTEGER NOT NULL,
 scopes_json TEXT NOT NULL CHECK(json_valid(scopes_json)),
 notice_version TEXT NOT NULL, created_at TEXT NOT NULL,
 PRIMARY KEY(record_id,revision)
);
CREATE TRIGGER IF NOT EXISTS clinical_context_sharing_no_update BEFORE UPDATE ON clinical_context_sharing BEGIN SELECT RAISE(ABORT,'immutable_sharing'); END;
CREATE TRIGGER IF NOT EXISTS clinical_context_sharing_no_delete BEFORE DELETE ON clinical_context_sharing BEGIN SELECT RAISE(ABORT,'immutable_sharing'); END;
