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

-- Reject legacy contact saves that would discard a separate delivery preference.
-- Current handlers retain this object; rollback must fail closed, not erase it.
CREATE TRIGGER IF NOT EXISTS member_account_details_preserve_delivery
BEFORE UPDATE OF body_json ON member_account_details
WHEN json_valid(OLD.body_json) AND json_valid(NEW.body_json)
 AND json_type(OLD.body_json, '$.delivery') = 'object'
 AND json_type(NEW.body_json, '$.delivery') IS NULL
BEGIN
 SELECT RAISE(ABORT, 'delivery preference requires compatible account runtime');
END;
