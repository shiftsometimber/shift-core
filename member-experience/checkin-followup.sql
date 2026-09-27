-- Additive optional tracking store. Existing check-ins and Life Back are unchanged.
CREATE TABLE IF NOT EXISTS daily_checkin_actions (
 id TEXT PRIMARY KEY,
 checkin_id INTEGER NOT NULL UNIQUE REFERENCES check_ins(id) ON DELETE CASCADE,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 action_json TEXT NOT NULL CHECK(json_valid(action_json)),
 created_at TEXT NOT NULL,
 feedback TEXT CHECK(feedback IN ('helped','not-fit','not-tried','skip')),
 revision INTEGER NOT NULL DEFAULT 0,
 reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_daily_checkin_actions_user ON daily_checkin_actions(user_id,checkin_id DESC);
