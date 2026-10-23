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
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','removed','withdrawn')),
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
  action TEXT NOT NULL CHECK(action IN ('approve','reject','remove','dismiss','withdraw')),
  created_at TEXT NOT NULL
);


-- Only rule IDs, categories, severity and priority; no duplicate text or health records.
-- The submitted post remains private until human review.
CREATE TABLE IF NOT EXISTS timber_shed_bouncer_screenings (
  post_id TEXT PRIMARY KEY REFERENCES timber_shed_forum_posts(id) ON DELETE CASCADE,
  policy_version TEXT NOT NULL,
  model_name TEXT,
  severity TEXT NOT NULL CHECK(severity IN ('routine','review','high','critical')),
  priority INTEGER NOT NULL CHECK(priority BETWEEN 0 AND 3),
  categories_json TEXT NOT NULL DEFAULT '[]',
  screened_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_timber_shed_bouncer_priority
 ON timber_shed_bouncer_screenings(priority,screened_at);
-- Private, in-app-only notifications. No email, SMS, push or external delivery.
-- No post text, treatment data, real names or recipient contact details stored.
CREATE TABLE IF NOT EXISTS timber_shed_forum_notifications (
 id TEXT PRIMARY KEY,
 recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 post_id TEXT NOT NULL REFERENCES timber_shed_forum_posts(id) ON DELETE CASCADE,
 thread_id TEXT NOT NULL REFERENCES timber_shed_forum_posts(id) ON DELETE CASCADE,
 room_id TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('approved','rejected','removed','reply')),
 created_at TEXT NOT NULL,
 read_at TEXT,
 UNIQUE(recipient_id,post_id,kind)
);
CREATE INDEX IF NOT EXISTS idx_timber_shed_notifications_recipient
 ON timber_shed_forum_notifications(recipient_id,read_at,created_at);

CREATE INDEX IF NOT EXISTS idx_timber_shed_topics_paged ON timber_shed_forum_posts(room_id,status,parent_id,reviewed_at,id);

-- Private moderation appeals; no free text or duplicate copy of submitted content.
CREATE TABLE IF NOT EXISTS timber_shed_forum_appeals (
 id TEXT PRIMARY KEY,
 post_id TEXT NOT NULL REFERENCES timber_shed_forum_posts(id) ON DELETE CASCADE,
 reason TEXT NOT NULL CHECK(reason IN ('missed-context','incorrect-rule','other')),
 status TEXT NOT NULL CHECK(status IN ('open','upheld','reconsider','withdrawn')),
 decision_status TEXT NOT NULL CHECK(decision_status IN ('rejected','removed')),
 decision_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
 decision_at TEXT NOT NULL,
 created_at TEXT NOT NULL,
 resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
 resolved_at TEXT,
 UNIQUE(post_id,decision_at)
);
CREATE INDEX IF NOT EXISTS idx_timber_shed_appeals_open ON timber_shed_forum_appeals(status,created_at);
CREATE TABLE IF NOT EXISTS timber_shed_forum_appeal_audit (
 id TEXT PRIMARY KEY,
 appeal_id TEXT NOT NULL REFERENCES timber_shed_forum_appeals(id) ON DELETE CASCADE,
 actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
 action TEXT NOT NULL CHECK(action IN ('submitted','upheld','reconsider','returned','withdrawn')),
 created_at TEXT NOT NULL
);

-- Member-controlled hiding and human-only community access restrictions.
CREATE TABLE IF NOT EXISTS timber_shed_forum_blocks (
 id TEXT PRIMARY KEY,
 blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at TEXT NOT NULL,
 CHECK(blocker_id<>blocked_id),
 UNIQUE(blocker_id,blocked_id)
);
CREATE INDEX IF NOT EXISTS idx_timber_shed_blocked ON timber_shed_forum_blocks(blocked_id,blocker_id);
CREATE TABLE IF NOT EXISTS timber_shed_forum_restrictions (
 id TEXT PRIMARY KEY,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 source_post_id TEXT REFERENCES timber_shed_forum_posts(id) ON DELETE SET NULL,
 kind TEXT NOT NULL CHECK(kind IN ('suspended','banned')),
 reason TEXT NOT NULL CHECK(reason IN ('medication-trading','harassment','privacy','unsafe-content','spam','other')),
 created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
 created_at TEXT NOT NULL,
 expires_at TEXT,
 lifted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
 lifted_at TEXT,
 CHECK((kind='banned' AND expires_at IS NULL) OR (kind='suspended' AND expires_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_timber_shed_one_restriction ON timber_shed_forum_restrictions(user_id) WHERE lifted_at IS NULL;
CREATE TABLE IF NOT EXISTS timber_shed_restriction_appeals (
 id TEXT PRIMARY KEY,
 restriction_id TEXT NOT NULL UNIQUE REFERENCES timber_shed_forum_restrictions(id) ON DELETE CASCADE,
 reason TEXT NOT NULL CHECK(reason IN ('missed-context','incorrect-rule','other')),
 status TEXT NOT NULL CHECK(status IN ('open','upheld','reinstated')),
 created_at TEXT NOT NULL,
 resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
 resolved_at TEXT
);
CREATE TABLE IF NOT EXISTS timber_shed_access_audit (
 id TEXT PRIMARY KEY,
 restriction_id TEXT NOT NULL REFERENCES timber_shed_forum_restrictions(id) ON DELETE CASCADE,
 actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
 action TEXT NOT NULL CHECK(action IN ('suspended','banned','lifted','appealed','upheld','reinstated','expired')),
 created_at TEXT NOT NULL
);
