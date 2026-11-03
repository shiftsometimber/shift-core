-- Applied once during the combined release, never from a screen-open handler.
-- Public food sources stay separate from private intake and account data.
CREATE TABLE IF NOT EXISTS member_food_catalogue (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, source TEXT NOT NULL,
 body_json TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_member_food_source_name ON member_food_catalogue(source,name);
CREATE TABLE IF NOT EXISTS member_food_provider_quota (
 provider TEXT PRIMARY KEY, minute TEXT NOT NULL, requests INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS member_food_entries (
 id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,recorded_on TEXT NOT NULL,
 body_json TEXT NOT NULL,created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_food_entries_user ON member_food_entries(user_id,recorded_on);
