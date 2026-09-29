-- My Timber v1.1 connected health. Additive; no v1 release tables changed.
CREATE TABLE IF NOT EXISTS device_health_connections (
  user_id INTEGER NOT NULL,
  platform TEXT NOT NULL CHECK(platform IN ('apple_health','health_connect')),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
  last_sync_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY(user_id,platform),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS device_health_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  platform TEXT NOT NULL CHECK(platform IN ('apple_health','health_connect')),
  type TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  source_record_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(user_id,platform,type,source_record_hash),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_device_health_user_time ON device_health_readings(user_id,observed_at DESC);
