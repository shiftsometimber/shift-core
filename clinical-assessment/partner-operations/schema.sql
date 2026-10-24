-- Additive partner onboarding/fulfilment. Does not activate clinical services.
CREATE TABLE IF NOT EXISTS partner_staff (
 id TEXT PRIMARY KEY, hq_user_id INTEGER UNIQUE, username TEXT UNIQUE COLLATE NOCASE,
 kind TEXT NOT NULL CHECK(kind IN ('clinician','dispensing')), org_id TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 0, state_json TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS partner_organisations (
 id TEXT PRIMARY KEY, version INTEGER NOT NULL DEFAULT 0, state_json TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS partner_access_tokens (
 token_hash TEXT PRIMARY KEY, staff_id TEXT NOT NULL REFERENCES partner_staff(id),
 kind TEXT NOT NULL CHECK(kind IN ('application','activation')), expires_at TEXT NOT NULL,
 used_at TEXT, issued_by INTEGER NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS partner_fulfilment (
 order_number TEXT PRIMARY KEY, partner_id TEXT NOT NULL, member_id INTEGER NOT NULL,
 version INTEGER NOT NULL DEFAULT 0, state_json TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS partner_fulfilment_prescription_once ON partner_fulfilment(json_extract(state_json,'$.prescriptionId'));
CREATE TABLE IF NOT EXISTS partner_audit (
 id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, version INTEGER NOT NULL,
 actor_id TEXT NOT NULL, action TEXT NOT NULL, details_json TEXT NOT NULL, created_at TEXT NOT NULL,
 UNIQUE(entity_type,entity_id,version)
);
CREATE TABLE IF NOT EXISTS partner_notification_outbox (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL UNIQUE REFERENCES partner_audit(id), order_number TEXT NOT NULL,
 member_id INTEGER NOT NULL, template TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS partner_audit_no_update BEFORE UPDATE ON partner_audit BEGIN SELECT RAISE(ABORT,'immutable_partner_audit'); END;
CREATE TRIGGER IF NOT EXISTS partner_audit_no_delete BEFORE DELETE ON partner_audit BEGIN SELECT RAISE(ABORT,'immutable_partner_audit'); END;
