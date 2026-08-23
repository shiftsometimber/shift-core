-- R3 My Timber preference memory, visible learning and weekly insight evidence.
CREATE TABLE IF NOT EXISTS shift_today_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  local_date TEXT NOT NULL,
  domain TEXT NOT NULL,
  recommendation_key TEXT NOT NULL,
  recommendation_label TEXT NOT NULL,
  feedback_key TEXT NOT NULL CHECK(feedback_key IN ('love_this','not_again','too_much_effort','too_expensive','wrong_today')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shift_today_feedback_member ON shift_today_feedback(user_id,created_at);
