-- The Timber Shed forum: PRIVATE / DEFAULT OFF / NO REAL MEMBER ACCESS.
-- Apply only to a controlled test database after safeguarding and privacy review.
-- No reference to My Timber health, weight, treatment, mood or tracking tables.
CREATE TABLE IF NOT EXISTS timber_shed_forum_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS timber_shed_forum_moderators (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  active INTEGER NOT NULL DEFAULT 0 CHECK(active IN (0,1)),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS timber_shed_forum_posts (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL CHECK(room_id IN ('main-shed','shifting-timber','grub-fit','good-to-talk','small-wins','after-treatment')),
  parent_id TEXT REFERENCES timber_shed_forum_posts(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','removed')),
  created_at TEXT NOT NULL,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_timber_shed_posts_room_status ON timber_shed_forum_posts(room_id,status,created_at);
CREATE INDEX IF NOT EXISTS idx_timber_shed_posts_author ON timber_shed_forum_posts(user_id,created_at);
CREATE TABLE IF NOT EXISTS timber_shed_forum_reports (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES timber_shed_forum_posts(id) ON DELETE CASCADE,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK(reason IN ('privacy','unsafe-health-advice','harassment','self-harm-risk','spam','other')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','closed')),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_timber_shed_reports_status ON timber_shed_forum_reports(status,created_at);
CREATE TABLE IF NOT EXISTS timber_shed_forum_audit (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES timber_shed_forum_posts(id) ON DELETE CASCADE,
  moderator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK(action IN ('approve','reject','remove','dismiss')),
  created_at TEXT NOT NULL
);
