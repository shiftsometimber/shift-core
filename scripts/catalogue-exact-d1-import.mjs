import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {CATALOGUE_PUBLICATION_RELEASE as fixedRelease} from '../catalogue-publication-release-v1.mjs';
import {validateCatalogueRelease,validateCatalogueSnapshot} from '../catalogue-publication-core.mjs';
import {CATALOGUE_COLUMNS,canonicalCatalogueRows,catalogueRowsSha256} from '../catalogue-publication-shared.mjs';

const quote=value=>`'${String(value).replaceAll("'","''")}'`;
const scope="content_type IN ('recipe','exercise')";
const equal=CATALOGUE_COLUMNS.map(key=>`s.${key} IS json_extract(e.value,'$.${key}')`).join(' AND ');
function chunks(rows){
  const output=[];let part=[],bytes=2;
  for(const row of rows){
    const size=Buffer.byteLength(quote(JSON.stringify(row)))+1;
    if(size>60000)throw Error('catalogue_row_exceeds_import_statement_budget');
    if(bytes+size>60000){output.push(part);part=[];bytes=2}
    part.push(row);bytes+=size;
  }
  if(part.length)output.push(part);return output;
}
export function readSnapshot(file){
  const data=JSON.parse(fs.readFileSync(file,'utf8'));
  if(!Array.isArray(data)||data.length!==1||data[0]?.success!==true||!Array.isArray(data[0].results))throw Error('catalogue_snapshot_query_invalid');
  return data[0].results;
}
export async function buildCatalogueImport(rows,release=fixedRelease){
  if(release.status!=='approved')throw Error('catalogue_release_not_approved');
  const additions=await validateCatalogueRelease(release);
  const snapshot=await validateCatalogueSnapshot(release,rows);
  const sql=[`SELECT CASE WHEN (SELECT COUNT(*) FROM structured_content WHERE ${scope})=${snapshot.length} THEN 1 ELSE json('catalogue_snapshot_count_drift') END;`];
  for(const part of chunks(snapshot))sql.push(`SELECT CASE WHEN (SELECT COUNT(*) FROM json_each(${quote(JSON.stringify(part))}) e JOIN structured_content s ON s.id=json_extract(e.value,'$.id') WHERE ${equal})=${part.length} THEN 1 ELSE json('catalogue_snapshot_drift') END;`);
  const id=`CASE WHEN EXISTS(SELECT 1 FROM structured_content s WHERE s.id=json_extract(e.value,'$.id') AND NOT (${equal})) THEN json('catalogue_addition_collision') ELSE json_extract(e.value,'$.id') END`;
  const columns=[id,...CATALOGUE_COLUMNS.slice(1).map(key=>`json_extract(e.value,'$.${key}')`)];
  for(const part of chunks(additions))sql.push(`INSERT INTO structured_content (${CATALOGUE_COLUMNS.join(',')}) SELECT ${columns.join(',')} FROM json_each(${quote(JSON.stringify(part))}) e WHERE true ON CONFLICT(id) DO NOTHING;`);
  if(sql.some(statement=>Buffer.byteLength(statement)>=90000))throw Error('catalogue_import_statement_too_large');
  // Remote Wrangler file imports provide rollback; explicit BEGIN is forbidden by D1.
  return sql;
}
export async function verifyCatalogueImport(beforeRows,afterRows,release=fixedRelease){
  const additions=await validateCatalogueRelease(release);
  const before=await validateCatalogueSnapshot(release,beforeRows);
  const after=await validateCatalogueSnapshot(release,afterRows);
  const expected=new Map(before.map(row=>[row.id,row]));
  let inserted=0;
  for(const row of additions){if(!expected.has(row.id))inserted++;expected.set(row.id,row)}
  if(JSON.stringify(after)!==JSON.stringify(canonicalCatalogueRows([...expected.values()])))throw Error('catalogue_exact_post_import_mismatch');
  const protectedIds=new Set(release.protected_originals.map(row=>row.id));
  const originalHash=await catalogueRowsSha256(before.filter(row=>protectedIds.has(row.id)));
  if(originalHash!==await catalogueRowsSha256(after.filter(row=>protectedIds.has(row.id))))throw Error('catalogue_original_bytes_changed');
  return {ok:true,proof:'CATALOGUE_PUBLICATION_RESULT_V1',release_id:release.release_id,rows_sha256:release.rows_sha256,inserted,already_present:additions.length-inserted,protected_originals:protectedIds.size,original_rows_unchanged:true,all_existing_rows_unchanged:true,exact_additions_verified:true,transactional:true,before_count:before.length,after_count:after.length,before_sha256:await catalogueRowsSha256(before),after_sha256:await catalogueRowsSha256(after),protected_originals_sha256:originalHash,workflow_sha:process.env.GITHUB_SHA||null,verified_via:'wrangler_snapshot_exact_comparison',completed_at:new Date().toISOString()};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [mode,beforeFile,afterFile]=process.argv.slice(2);
  if(mode==='--sql')process.stdout.write((await buildCatalogueImport(readSnapshot(beforeFile))).join('\n')+'\n');
  else if(mode==='--verify'){
    const report=await verifyCatalogueImport(readSnapshot(beforeFile),readSnapshot(afterFile));
    if(process.env.CATALOGUE_PUBLICATION_REPORT)fs.writeFileSync(process.env.CATALOGUE_PUBLICATION_REPORT,JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report,null,2));
  }else throw Error('usage: catalogue-exact-d1-import.mjs --sql before.json | --verify before.json after.json');
}
