CREATE TABLE IF NOT EXISTS commerce_discount_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE COLLATE NOCASE,
  label TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('percent','fixed')),
  discount_value INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT,
  ends_at TEXT,
  usage_limit INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  minimum_subtotal_pence INTEGER NOT NULL DEFAULT 0,
  eligible_products_json TEXT NOT NULL DEFAULT '[]',
  created_by INTEGER,
  updated_by INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_discount_active_dates ON commerce_discount_codes(active,starts_at,ends_at);

INSERT OR IGNORE INTO commerce_discount_codes
  (code,label,discount_type,discount_value,active,minimum_subtotal_pence,eligible_products_json)
VALUES ('NEWSHIFT25','New Shift launch offer','percent',25,1,0,'[]');

CREATE TABLE IF NOT EXISTS site_content_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_path TEXT NOT NULL,
  content_key TEXT NOT NULL UNIQUE,
  css_selector TEXT NOT NULL,
  label TEXT NOT NULL,
  draft_text TEXT NOT NULL,
  published_text TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','paused')),
  version INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER,
  updated_by INTEGER,
  published_by INTEGER,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_site_content_page_status ON site_content_overrides(page_path,status);

CREATE TABLE IF NOT EXISTS site_content_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_override_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  text_value TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(content_override_id) REFERENCES site_content_overrides(id)
);
