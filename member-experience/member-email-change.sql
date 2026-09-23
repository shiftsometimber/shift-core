-- Preview-first additive schema. No production migration is authorised by this file.
CREATE TABLE IF NOT EXISTS member_email_changes (
 user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 request_id TEXT NOT NULL UNIQUE,
 old_email TEXT NOT NULL,
 new_email TEXT NOT NULL,
 password_fingerprint TEXT NOT NULL,
 old_token_hash TEXT UNIQUE,
 new_token_hash TEXT UNIQUE,
 cancel_token_hash TEXT UNIQUE,
 old_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(old_confirmed IN (0,1)),
 new_confirmed INTEGER NOT NULL DEFAULT 0 CHECK(new_confirmed IN (0,1)),
 status TEXT NOT NULL CHECK(status IN ('sending','pending','completed','cancelled')),
 expires_at TEXT NOT NULL,
 write_nonce TEXT NOT NULL,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS member_email_change_limits (
 user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 window_started_at TEXT NOT NULL,
 attempts INTEGER NOT NULL CHECK(attempts>=1)
);
