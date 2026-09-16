import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';

// Intentionally standalone: this audit branch need not contain a publication
// release module. These are the exact CATALOGUE_COLUMNS, in canonical order.
export const CATALOGUE_COLUMNS = Object.freeze(['id','content_type','title','version','status','data_json','review_json','created_at','updated_at']);
export const EXPECTED_MAIN_SHA = '222b1adeafab7d2cc128d9032cc0638664e51048';
export const SELECTED_RADAR_IDS = Object.freeze([276,279,281,284,286,288,290,292,294]);
export const CATALOGUE_SQL = `SELECT ${CATALOGUE_COLUMNS.join(',')} FROM structured_content WHERE content_type IN ('recipe','exercise') ORDER BY id;\n`;
const RADAR_SOURCE = fileURLToPath(new URL('../evidence/newsroom-backlog-closeout-2026-09-16/owner-publication-readonly-snapshot.sql', import.meta.url));
const sha256 = value => createHash('sha256').update(value).digest('hex');

export function readRadarSql() {
  const sql = fs.readFileSync(RADAR_SOURCE, 'utf8');
  const statement = sql.replace(/--[^\n]*/g, '').trim().replace(/;$/, '');
  if (!/^WITH\s+selected\s+AS\s*\(/i.test(statement) || statement.includes(';') || /\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|REPLACE|PRAGMA|ATTACH|DETACH|VACUUM|REINDEX|ANALYZE|BEGIN|COMMIT|ROLLBACK)\b/i.test(statement)) {
    throw new Error('radar_snapshot_must_be_one_read_only_select');
  }
  return statement + ';\n';
}

function resultRows(bytes, label) {
  let raw;
  try { raw = JSON.parse(bytes.toString('utf8')); }
  catch { throw new Error(`${label}_snapshot_invalid_json`); }
  if (!Array.isArray(raw) || raw.length !== 1 || raw[0]?.success !== true || !Array.isArray(raw[0].results)) throw new Error(`${label}_snapshot_query_invalid`);
  return raw[0].results;
}

export function canonicalCatalogueRows(rows) {
  const ids = new Set();
  return rows.map(row => {
    if (typeof row?.id !== 'string' || !row.id || ids.has(row.id)) throw new Error('catalogue_duplicate_or_invalid_id');
    if (Object.keys(row).length !== CATALOGUE_COLUMNS.length || CATALOGUE_COLUMNS.some(key => !Object.hasOwn(row, key) || row[key] === undefined)) throw new Error('catalogue_columns_mismatch');
    if (!['recipe','exercise'].includes(row.content_type)) throw new Error('catalogue_unexpected_type');
    ids.add(row.id);
    return Object.fromEntries(CATALOGUE_COLUMNS.map(key => [key, row[key]]));
  }).sort((a,b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export function writeSnapshotProof(catalogueInput, radarInput, out, env = process.env) {
  if (env.EXPECTED_MAIN_SHA && env.EXPECTED_MAIN_SHA !== EXPECTED_MAIN_SHA) throw new Error('snapshot_main_pin_mismatch');
  if (env.GITHUB_SHA && !/^[a-f0-9]{40}$/.test(env.GITHUB_SHA)) throw new Error('snapshot_workflow_sha_invalid');
  const catalogueBytes = fs.readFileSync(catalogueInput), radarBytes = fs.readFileSync(radarInput);
  const rows = canonicalCatalogueRows(resultRows(catalogueBytes, 'catalogue'));
  const sections = resultRows(radarBytes, 'radar'), radar = {};
  const names = ['events','source_audit','publication_history','publication_jobs'];
  if (sections.length !== names.length) throw new Error('radar_sections_incomplete');
  for (const section of sections) {
    if (!names.includes(section.section) || Object.hasOwn(radar, section.section) || typeof section.payload !== 'string') throw new Error('radar_section_invalid');
    const records = JSON.parse(section.payload);
    if (!Array.isArray(records)) throw new Error('radar_section_records_invalid');
    radar[section.section] = records;
  }
  const counts = {recipe:0, exercise:0};
  for (const row of rows) counts[row.content_type]++;
  const selected = new Set(SELECTED_RADAR_IDS);
  const selectedEvents = radar.events.filter(row => selected.has(Number(row.id)));
  const seen = new Set();
  for (const row of radar.events) {
    if (!Number.isSafeInteger(Number(row.id)) || seen.has(Number(row.id))) throw new Error('radar_duplicate_or_invalid_event');
    seen.add(Number(row.id));
  }
  const missing = SELECTED_RADAR_IDS.filter(id => !seen.has(id));
  const radarSql = readRadarSql();
  const proof = {
    proof:'PREPARED_CONTENT_READ_ONLY_SNAPSHOT_V1',
    status:missing.length ? 'selected_events_missing' : 'pass',
    captured_at:new Date().toISOString(),
    expected_main_sha:EXPECTED_MAIN_SHA,
    source_sha:env.GITHUB_SHA || null,
    workflow_ref:env.GITHUB_WORKFLOW_REF || null,
    workflow_run_id:env.GITHUB_RUN_ID || null,
    workflow_run_attempt:env.GITHUB_RUN_ATTEMPT || null,
    database_writes:false,
    deployment_performed:false,
    approval_performed:false,
    publication_performed:false,
    snapshot_consistency:'Two separate read-only queries; no cross-query transaction or freeze is claimed.',
    catalogue:{columns:CATALOGUE_COLUMNS, counts, total:rows.length, raw_sha256:sha256(catalogueBytes), canonical_rows_sha256:sha256(JSON.stringify(rows)), sql_sha256:sha256(CATALOGUE_SQL)},
    radar:{selected_ids:SELECTED_RADAR_IDS, missing_selected_ids:missing, selected_statuses:selectedEvents.map(row => ({id:Number(row.id),status:row.status})), section_counts:Object.fromEntries(names.map(name => [name,radar[name].length])), raw_sha256:sha256(radarBytes), sql_sha256:sha256(radarSql)}
  };
  fs.mkdirSync(out, {recursive:true});
  for (const [name, bytes] of [['catalogue-raw.json', catalogueBytes], ['radar-raw.json', radarBytes]]) fs.writeFileSync(path.join(out,name), bytes);
  fs.writeFileSync(path.join(out,'catalogue-query.sql'), CATALOGUE_SQL);
  fs.writeFileSync(path.join(out,'radar-query.sql'), radarSql);
  fs.writeFileSync(path.join(out,'catalogue-snapshot.json'), JSON.stringify(rows,null,2)+'\n');
  fs.writeFileSync(path.join(out,'radar-snapshot.json'), JSON.stringify(radar,null,2)+'\n');
  fs.writeFileSync(path.join(out,'snapshot-proof.json'), JSON.stringify(proof,null,2)+'\n');
  return proof;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [mode,catalogue,radar,out] = process.argv.slice(2);
    if (mode === '--catalogue-sql') process.stdout.write(CATALOGUE_SQL);
    else if (mode === '--radar-sql') process.stdout.write(readRadarSql());
    else if (mode === '--proof' && catalogue && radar && out) {
      const proof = writeSnapshotProof(catalogue,radar,out);
      console.log(JSON.stringify(proof,null,2));
      if (proof.status !== 'pass') process.exitCode = 1;
    } else throw new Error('usage: --catalogue-sql | --radar-sql | --proof <catalogue-raw.json> <radar-raw.json> <output-directory>');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
