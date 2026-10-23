-- Additive only. Apply explicitly before enabling WHATSAPP_INBOUND_ENABLED.
CREATE TABLE IF NOT EXISTS whatsapp_link_requests (
 user_id INTEGER PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
 candidate_sender TEXT, expires_at TEXT NOT NULL, memory_enabled INTEGER NOT NULL DEFAULT 0,
 notice_version TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS whatsapp_links (
 user_id INTEGER PRIMARY KEY, sender TEXT NOT NULL UNIQUE, generation TEXT NOT NULL UNIQUE,
 memory_enabled INTEGER NOT NULL DEFAULT 0, notice_version TEXT NOT NULL,
 linked_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS whatsapp_messages (
 message_id TEXT PRIMARY KEY, sender TEXT NOT NULL, user_id INTEGER,
 link_generation TEXT, body TEXT NOT NULL, kind TEXT NOT NULL,
 received_at TEXT NOT NULL, provider_at TEXT NOT NULL,
 draft TEXT, draft_model TEXT, drafted_at TEXT, draft_actor_id INTEGER
);
CREATE INDEX IF NOT EXISTS whatsapp_messages_received ON whatsapp_messages(received_at);
CREATE INDEX IF NOT EXISTS whatsapp_messages_member ON whatsapp_messages(user_id,link_generation,received_at);
CREATE TABLE IF NOT EXISTS whatsapp_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, actor_id INTEGER,
 message_id TEXT, user_id INTEGER, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS whatsapp_ai_slots (
 day TEXT NOT NULL, slot INTEGER NOT NULL, PRIMARY KEY(day,slot)
);
