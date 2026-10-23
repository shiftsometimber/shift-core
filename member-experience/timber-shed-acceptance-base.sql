-- SYNTHETIC ACCEPTANCE DATABASE ONLY. Never apply to an existing account database.
-- The initial CREATE deliberately fails if users already exists. No DROP or DELETE.
CREATE TABLE users(id INTEGER PRIMARY KEY,date_of_birth TEXT);
CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER);
CREATE TABLE user_sessions(id TEXT PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);
INSERT INTO users VALUES(1,'1980-01-01');
INSERT INTO user_auth VALUES(1,1);
INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES('synthetic-session-1',1,'f9aaf05b1fa083f44942d485877e8bab478410b228036ef623ef0b069cf124c3',strftime('%Y-%m-%dT%H:%M:%fZ','now','+2 hours'));
INSERT INTO users VALUES(2,'1980-01-01');
INSERT INTO user_auth VALUES(2,1);
INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES('synthetic-session-2',2,'efa1ea1db15aa5e952291d63147852f28468bdb8982b80f7cd051f86e9a98e33',strftime('%Y-%m-%dT%H:%M:%fZ','now','+2 hours'));
INSERT INTO users VALUES(3,'1980-01-01');
INSERT INTO user_auth VALUES(3,1);
INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES('synthetic-session-3',3,'493324a54cb7068656d8912886189fd50dedb57529cbc4e1d04e9badc2536195',strftime('%Y-%m-%dT%H:%M:%fZ','now','+2 hours'));
INSERT INTO users VALUES(6,'1980-01-01');
INSERT INTO user_auth VALUES(6,1);
INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES('synthetic-session-6',6,'33161e2ef7afe92906ed31eafca0dcd69837c6db0e00bb7d5d48acb65be6af72',strftime('%Y-%m-%dT%H:%M:%fZ','now','+2 hours'));
