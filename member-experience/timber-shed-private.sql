-- Private opt-in activity ticks only; no health data, community posts or public member data.
CREATE TABLE IF NOT EXISTS timber_shed_private_progress (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
  revision INTEGER NOT NULL DEFAULT 0,
  activities_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
