CREATE TABLE IF NOT EXISTS programme_v1_accounts (user_id INTEGER PRIMARY KEY, revision INTEGER NOT NULL DEFAULT 0, state_json TEXT NOT NULL, updated_at TEXT NOT NULL);
