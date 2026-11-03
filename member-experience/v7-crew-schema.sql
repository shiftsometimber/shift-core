-- Explicit release migration. Never run from a screen-open request.
CREATE TABLE IF NOT EXISTS mt_v7_crews (
 id TEXT PRIMARY KEY, created_by INTEGER REFERENCES users(id) ON DELETE SET NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS mt_v7_crew_members (
 crew_id TEXT NOT NULL REFERENCES mt_v7_crews(id) ON DELETE CASCADE,
 user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 alias TEXT NOT NULL, joined_at TEXT NOT NULL, PRIMARY KEY(crew_id,user_id)
);
CREATE TABLE IF NOT EXISTS mt_v7_crew_invites (
 digest TEXT PRIMARY KEY, crew_id TEXT NOT NULL REFERENCES mt_v7_crews(id) ON DELETE CASCADE,
 creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS mt_v7_effort (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, week TEXT NOT NULL,
 logs INTEGER NOT NULL CHECK(logs BETWEEN 0 AND 7), updated_at TEXT NOT NULL, PRIMARY KEY(user_id,week)
);
