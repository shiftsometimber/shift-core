import {CATALOGUE_COLUMNS,CATALOGUE_COUNTS,canonicalCatalogueRows,catalogueRowsSha256,catalogueSha256,countCatalogueTypes,sameCatalogueCounts} from './catalogue-publication-shared.mjs';
import {originalContent} from './grub-expansion-authority-v1.mjs';
import {fitOriginalContent} from './fit-publication-contract-v1.mjs';

const fail=message=>{throw new Error(message)};
const hash=/^[a-f0-9]{64}$/;
export async function validateCatalogueRelease(release) {
  if(release?.proof!=='CATALOGUE_PUBLICATION_RELEASE_V1' || !['prepared','approved'].includes(release.status) || !hash.test(release.release_id||'') || !hash.test(release.rows_sha256||'')) fail('catalogue_release_not_armed');
  const owner=release.owner_instruction;
  if(owner?.proof!=='SHIFT_OWNER_PUBLICATION_INSTRUCTION_V1' || owner.status!=='authorised' || owner.instruction!=='Publish them all !!!!!!' || owner.actor?.id!=='Matt O’Brien' || owner.actor?.kind!=='human' || owner.actor?.role!=='owner' || owner.recorded_at!=='2026-09-16T18:50:04Z' || owner.human_editorial_review_claimed!==false || owner.trainer_review_claimed!==false || owner.clinical_review_claimed!==false) fail('catalogue_owner_instruction_missing');
  const additions=canonicalCatalogueRows(release.additions);
  if(!sameCatalogueCounts(countCatalogueTypes(additions),CATALOGUE_COUNTS.additions) || !sameCatalogueCounts(release.addition_counts,CATALOGUE_COUNTS.additions) || !sameCatalogueCounts(release.protected_counts,CATALOGUE_COUNTS.originals)) fail('catalogue_release_count_mismatch');
  for(const row of additions) {
    if(row.status!=='published' || !Number.isInteger(row.version) || row.version<1 || typeof row.title!=='string' || !row.title.trim() || row.created_at!==owner.recorded_at || row.updated_at!==owner.recorded_at || typeof row.data_json!=='string' || typeof row.review_json!=='string') fail('catalogue_addition_invalid');
    const data=JSON.parse(row.data_json),review=JSON.parse(row.review_json);
    if(!data || typeof data!=='object' || Array.isArray(data) || review?.status!=='approved' || data.provenance?.final_v1_acceptance) fail('catalogue_addition_authority_invalid');
  }
  if(await catalogueRowsSha256(additions)!==release.rows_sha256) fail('catalogue_release_rows_changed');
  const originals=release.protected_originals;
  if(!Array.isArray(originals) || new Set(originals.map(row=>row.id)).size!==originals.length || !sameCatalogueCounts(countCatalogueTypes(originals),CATALOGUE_COUNTS.originals)) fail('catalogue_original_bindings_invalid');
  const ids=new Set(additions.map(row=>row.id));
  for(const row of originals) if(ids.has(row.id) || !hash.test(row.content_hash||'') || row.content_hash_algorithm!==(row.content_type==='recipe'?'grub_original_v1':'fit_v1_content_v1')) fail('catalogue_original_binding_invalid');
  return additions;
}

export async function validateCatalogueSnapshot(release,rows) {
  const snapshot=canonicalCatalogueRows(rows),byId=new Map(snapshot.map(row=>[row.id,row]));
  countCatalogueTypes(snapshot);
  let accepted=0;
  for(const row of snapshot) if(JSON.parse(row.data_json)?.provenance?.final_v1_acceptance?.accepted===true) accepted++;
  if(accepted!==2124) fail('catalogue_original_cohort_changed');
  await Promise.all(release.protected_originals.map(async binding=>{
    const row=byId.get(binding.id);
    if(!row || row.content_type!==binding.content_type || row.status!=='published') fail('catalogue_original_missing');
    const data=JSON.parse(row.data_json),review=JSON.parse(row.review_json);
    if(data.provenance?.final_v1_acceptance?.accepted!==true || review.status!=='approved') fail('catalogue_original_authority_changed');
    const projection=binding.content_type==='recipe'?originalContent({data,title:row.title}):fitOriginalContent(data,row.title);
    if(await catalogueSha256(JSON.stringify(projection))!==binding.content_hash) fail('catalogue_original_content_changed');
  }));
  const additions=new Map(release.additions.map(row=>[row.id,row]));
  for(const row of snapshot) if(additions.has(row.id) && JSON.stringify(row)!==JSON.stringify(canonicalCatalogueRows([additions.get(row.id)])[0])) fail('catalogue_addition_collision');
  return snapshot;
}

export async function readCatalogueSnapshot(DB) {
  const rows=[];let after='';
  for(;;) {
    const result=await DB.prepare(`SELECT ${CATALOGUE_COLUMNS.join(',')} FROM structured_content WHERE content_type IN ('recipe','exercise') AND id > ? ORDER BY id LIMIT 250`).bind(after).all();
    if(result.success===false || !Array.isArray(result.results)) fail('catalogue_snapshot_unavailable');
    const page=result.results;
    if(!page.length) break;
    if(page.some((row,index)=>typeof row.id!=='string' || row.id<=(index?page[index-1].id:after))) fail('catalogue_snapshot_paging_invalid');
    rows.push(...page); if(rows.length>10000) fail('catalogue_snapshot_count_unexpected');
    after=page.at(-1).id;
    if(page.length<250) break;
  }
  return rows;
}

// Each bounded JSON bind is far below D1's 2 MB value limit. Every statement
// runs in one D1 batch transaction; malformed JSON is deliberately an abort.
function chunks(rows) {
  const out=[];let part=[],bytes=2;
  for(const row of rows) {
    const size=new TextEncoder().encode(JSON.stringify(row)).length+1;
    if(size>900000) fail('catalogue_row_too_large');
    if(part.length && (part.length===40 || bytes+size>900000)) {out.push(part);part=[];bytes=2;}
    part.push(row);bytes+=size;
  }
  if(part.length)out.push(part);return out;
}
function exactRowsGuard(DB,rows) {
  const equal=CATALOGUE_COLUMNS.map(key=>`s.${key} IS json_extract(e.value,'$.${key}')`).join(' AND ');
  return DB.prepare(`SELECT CASE WHEN (SELECT COUNT(*) FROM json_each(?) e JOIN structured_content s ON s.id=json_extract(e.value,'$.id') WHERE ${equal})=? THEN 1 ELSE json('catalogue_snapshot_drift') END AS verified`).bind(JSON.stringify(rows),rows.length);
}
export async function publishFixedCatalogue(DB,release) {
  const additions=await validateCatalogueRelease(release);
  if(typeof DB?.batch!=='function') fail('catalogue_atomic_batch_required');
  const db=typeof DB.withSession==='function'?DB.withSession('first-primary'):DB;
  const snapshot=await validateCatalogueSnapshot(release,await readCatalogueSnapshot(db));
  const statements=[db.prepare("SELECT CASE WHEN (SELECT COUNT(*) FROM structured_content WHERE content_type IN ('recipe','exercise'))=? THEN 1 ELSE json('catalogue_snapshot_count_drift') END AS verified").bind(snapshot.length)];
  for(const part of chunks(snapshot)) statements.push(exactRowsGuard(db,part));
  const insertionIndexes=[];
  for(const part of chunks(additions)) {
    insertionIndexes.push(statements.length);
    // Reject a conflicting row inside the INSERT, even when it appeared after
    // the snapshot. Exact retries use DO NOTHING: no UPDATE or original write.
    const same=CATALOGUE_COLUMNS.map(key=>`s.${key} IS json_extract(e.value,'$.${key}')`).join(' AND ');
    const id=`CASE WHEN EXISTS(SELECT 1 FROM structured_content s WHERE s.id=json_extract(e.value,'$.id') AND NOT (${same})) THEN json('catalogue_addition_collision') ELSE json_extract(e.value,'$.id') END`;
    statements.push(db.prepare(`INSERT INTO structured_content (${CATALOGUE_COLUMNS.join(',')}) SELECT ${[id,...CATALOGUE_COLUMNS.slice(1).map(key=>`json_extract(e.value,'$.${key}')`)].join(',')} FROM json_each(?) e WHERE true ON CONFLICT(id) DO NOTHING`).bind(JSON.stringify(part)));
  }
  if(statements.length>450) fail('catalogue_batch_too_large');
  const results=await db.batch(statements);
  if(!Array.isArray(results) || results.length!==statements.length || results.some(result=>result.success===false)) fail('catalogue_atomic_batch_failed');
  const inserted=insertionIndexes.reduce((n,index)=>n+Number(results[index]?.meta?.changes||0),0);
  const completedAt=new Date().toISOString();
  return {ok:true,proof:'CATALOGUE_PUBLICATION_RESULT_V1',release_id:release.release_id,rows_sha256:release.rows_sha256,inserted,already_present:additions.length-inserted,protected_originals:release.protected_originals.length,original_rows_unchanged:true,transactional:true,completed_at:completedAt,published_at:inserted?completedAt:null};
}

export async function verifyFixedCataloguePublication(DB,release) {
  if(release?.proof!=='CATALOGUE_PUBLICATION_RELEASE_V1' || !hash.test(release.release_id||'') || !hash.test(release.rows_sha256||'')) fail('catalogue_release_not_armed');
  const additions=Number(release.addition_counts?.recipe||0)+Number(release.addition_counts?.exercise||0);
  const originals=Number(release.protected_counts?.recipe||0)+Number(release.protected_counts?.exercise||0);
  if(additions!==3427 || originals!==2124) fail('catalogue_release_count_mismatch');
  const owner=release.owner_instruction;
  if(owner?.status!=='authorised' || owner.instruction!=='Publish them all !!!!!!' || owner.actor?.id!=='Matt O’Brien' || owner.recorded_at!=='2026-09-16T18:50:04Z') fail('catalogue_owner_instruction_missing');
  const db=typeof DB.withSession==='function'?DB.withSession('first-primary'):DB;
  const stamp=owner.recorded_at;
  const result=await db.prepare(`SELECT COUNT(*) AS total, SUM(CASE WHEN created_at=? AND updated_at=? AND json_extract(review_json,'$.authority_kind')='owner_publication_instruction' AND json_extract(review_json,'$.instruction.quote')=? THEN 1 ELSE 0 END) AS authorised FROM structured_content WHERE content_type IN ('recipe','exercise')`).bind(stamp,stamp,owner.instruction).first();
  if(Number(result?.total)!==originals+additions || Number(result?.authorised)!==additions) fail('catalogue_publication_incomplete');
  return {ok:true,proof:'CATALOGUE_PUBLICATION_RESULT_V1',release_id:release.release_id,rows_sha256:release.rows_sha256,inserted:0,already_present:additions,protected_originals:originals,original_rows_unchanged:true,transactional:true,completed_at:new Date().toISOString(),published_at:null};
}
