-- Account contact data is deliberately separate from AI/member preferences.
-- Additive only. Apply to isolated preview first; production requires a reviewed release.
CREATE TABLE IF NOT EXISTS member_account_details (
  user_id INTEGER PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0,
  body_json TEXT NOT NULL DEFAULT '{}',
  last_operation TEXT,
  write_nonce TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
