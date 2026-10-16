-- Apply explicitly during an approved release, never from a web request.
CREATE TABLE IF NOT EXISTS gp_directory_versions (
 version TEXT PRIMARY KEY, imported_at TEXT NOT NULL, counts_json TEXT NOT NULL,
 sources_json TEXT NOT NULL, complete INTEGER NOT NULL CHECK(complete IN (0,1))
);
CREATE TABLE IF NOT EXISTS gp_directory_active (
 singleton INTEGER PRIMARY KEY CHECK(singleton=1), version TEXT NOT NULL REFERENCES gp_directory_versions(version)
);
CREATE TABLE IF NOT EXISTS gp_directory_practices (
 version TEXT NOT NULL REFERENCES gp_directory_versions(version), code TEXT NOT NULL,
 nation TEXT NOT NULL CHECK(nation IN ('England','Wales','Scotland','Northern Ireland')),
 name TEXT NOT NULL, search_text TEXT NOT NULL, address_json TEXT NOT NULL,
 postcode TEXT NOT NULL, status TEXT NOT NULL, source TEXT NOT NULL,
 east INTEGER, north INTEGER, parent_code TEXT, entry_kind TEXT NOT NULL DEFAULT 'practice', PRIMARY KEY(version,code)
);
CREATE INDEX IF NOT EXISTS gp_directory_search ON gp_directory_practices(version,status,nation);
CREATE TABLE IF NOT EXISTS gp_directory_postcodes (
 version TEXT NOT NULL REFERENCES gp_directory_versions(version), postcode TEXT NOT NULL,
 east INTEGER NOT NULL, north INTEGER NOT NULL, PRIMARY KEY(version,postcode)
);
