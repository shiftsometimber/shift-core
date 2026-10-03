-- Run ONLY in a newly-created, separate health-test database.
CREATE TABLE health_test_environment(name TEXT PRIMARY KEY,value TEXT NOT NULL);
INSERT INTO health_test_environment VALUES('environment','isolated-health-test');
CREATE TABLE users(id INTEGER PRIMARY KEY);
INSERT INTO users(id) VALUES(101),(102);
CREATE TABLE user_sessions(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,token_hash TEXT UNIQUE NOT NULL,expires_at TEXT NOT NULL,revoked_at TEXT,last_used_at TEXT,FOREIGN KEY(user_id) REFERENCES users(id));
CREATE TABLE consents(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,consent_type TEXT NOT NULL,granted INTEGER NOT NULL CHECK(granted IN (0,1)),FOREIGN KEY(user_id) REFERENCES users(id));
-- Apply migrations/021_device_health_sync.sql to the same isolated database.
