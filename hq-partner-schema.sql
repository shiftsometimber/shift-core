PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS hq_partners (
 id TEXT PRIMARY KEY,name TEXT NOT NULL,service TEXT NOT NULL CHECK(service IN ('pharmacy','trt','diagnostics','devices','nutrition','apparel','other')),
 model TEXT NOT NULL CHECK(model IN ('referral','shift_sale','undecided')),status TEXT NOT NULL CHECK(status IN ('exploring','discussion','agreed','active','paused','archived')),
 contact_name TEXT NOT NULL DEFAULT '',contact_email TEXT NOT NULL DEFAULT '',owner_name TEXT NOT NULL DEFAULT '',next_action TEXT NOT NULL DEFAULT '',due_date TEXT,
 shift_responsibility TEXT NOT NULL DEFAULT '',partner_responsibility TEXT NOT NULL DEFAULT '',integration_status TEXT NOT NULL DEFAULT 'not_started' CHECK(integration_status IN ('not_started','mapping','testing','ready','active')),commercial_notes TEXT NOT NULL DEFAULT '',version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS hq_partner_handovers (
 id TEXT PRIMARY KEY,partner_id TEXT NOT NULL REFERENCES hq_partners(id),reference TEXT NOT NULL,service TEXT NOT NULL,
 status TEXT NOT NULL CHECK(status IN ('draft','review','blocked','closed')),owner_name TEXT NOT NULL DEFAULT '',next_action TEXT NOT NULL DEFAULT '',due_date TEXT,
 disclosure_status TEXT NOT NULL DEFAULT 'not_shared' CHECK(disclosure_status IN ('not_shared','approved','withdrawn')),
 sharing_reference TEXT,sharing_expires_at TEXT,partner_task TEXT NOT NULL DEFAULT '',version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS hq_partner_handovers_partner ON hq_partner_handovers(partner_id,status);
CREATE TABLE IF NOT EXISTS hq_partner_memberships (
 id TEXT PRIMARY KEY,partner_id TEXT NOT NULL REFERENCES hq_partners(id),principal_id TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('partner_admin','partner_operator','partner_readonly')),status TEXT NOT NULL CHECK(status IN ('pending','active','disabled')),
 created_at TEXT NOT NULL,UNIQUE(partner_id,principal_id)
);
