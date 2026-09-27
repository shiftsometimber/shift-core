CREATE TABLE IF NOT EXISTS member_pen_day_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  local_date TEXT NOT NULL,
  status TEXT NOT NULL,
  feel TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, local_date)
);

CREATE INDEX IF NOT EXISTS idx_pen_day_member_date
  ON member_pen_day_notes(user_id, local_date DESC);
