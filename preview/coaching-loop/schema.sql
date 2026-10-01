CREATE TABLE IF NOT EXISTS coaching_test_memory (
  member_id TEXT PRIMARY KEY CHECK(member_id LIKE 'synthetic-%'),
  revision INTEGER NOT NULL DEFAULT 0,
  body TEXT NOT NULL CHECK(json_valid(body)),
  mutation_id TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS coaching_test_audit_events (
  id TEXT PRIMARY KEY, member_id TEXT NOT NULL,
  at INTEGER NOT NULL, type TEXT NOT NULL, outcome TEXT NOT NULL,
  data_used TEXT NOT NULL CHECK(json_valid(data_used)),
  reason TEXT NOT NULL, channel TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS coaching_test_audit_member ON coaching_test_audit_events(member_id,at);
CREATE TABLE IF NOT EXISTS coaching_test_call_costs (
  id TEXT PRIMARY KEY, member_id TEXT NOT NULL,
  at INTEGER NOT NULL, reserved_micro_usd INTEGER NOT NULL CHECK(reserved_micro_usd>=0),
  actual_micro_usd INTEGER CHECK(actual_micro_usd>=0 AND actual_micro_usd<=reserved_micro_usd),
  status TEXT NOT NULL, measurement TEXT NOT NULL CHECK(measurement='synthetic'), model TEXT
);
CREATE TRIGGER IF NOT EXISTS coaching_test_cost_cap BEFORE INSERT ON coaching_test_call_costs
BEGIN
 SELECT CASE WHEN NEW.reserved_micro_usd + COALESCE((SELECT SUM(COALESCE(actual_micro_usd,reserved_micro_usd)) FROM coaching_test_call_costs WHERE member_id=NEW.member_id AND at>NEW.at-86400000),0)>50000 THEN RAISE(ABORT,'member_cost_cap') END;
 SELECT CASE WHEN NEW.reserved_micro_usd + COALESCE((SELECT SUM(COALESCE(actual_micro_usd,reserved_micro_usd)) FROM coaching_test_call_costs WHERE at>NEW.at-86400000),0)>2000000 THEN RAISE(ABORT,'shared_cost_cap') END;
END;
CREATE TABLE IF NOT EXISTS coaching_test_control (id INTEGER PRIMARY KEY CHECK(id=1), proactive_enabled INTEGER NOT NULL DEFAULT 0);
INSERT OR IGNORE INTO coaching_test_control VALUES(1,0);
