const quote = value => value === null ? 'NULL'
  : typeof value === 'number' ? String(value)
    : "'" + String(value).replaceAll("'", "''") + "'";

/** Seed missing or replaced sources without overwriting scheduler observations. */
export function observationInsert(row) {
  const keys = Object.keys(row);
  // Existing observations belong to the scheduler. A failed CI retrieval must
  // never erase a previous success, changed fingerprint or withdrawal flag.
  return 'INSERT INTO medicines_watch_checks (' + keys.join(',') + ') VALUES (' +
    keys.map(key => quote(row[key])).join(',') + ') ON CONFLICT(source_id) DO UPDATE SET ' +
    keys.filter(key => key !== 'source_id').map(key => key + '=excluded.' + key).join(',') +
    ' WHERE medicines_watch_checks.source_url<>excluded.source_url OR medicines_watch_checks.check_url<>excluded.check_url;';
}
