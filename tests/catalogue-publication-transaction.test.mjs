import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {publishFixedCatalogue,validateCatalogueRelease} from '../catalogue-publication-core.mjs';
import {CATALOGUE_COLUMNS,canonicalCatalogueRows,catalogueRowsSha256,catalogueSha256} from '../catalogue-publication-shared.mjs';
import {originalContent} from '../grub-expansion-authority-v1.mjs';
import {fitOriginalContent} from '../fit-publication-contract-v1.mjs';

const stamp='2026-09-16T18:50:04Z';
const owner={proof:'SHIFT_OWNER_PUBLICATION_INSTRUCTION_V1',status:'authorised',instruction:'Publish them all !!!!!!',actor:{id:'Matt O’Brien',kind:'human',role:'owner'},recorded_at:stamp,human_editorial_review_claimed:false,trainer_review_claimed:false,clinical_review_claimed:false};
function row(id,content_type,original=false){return{id,content_type,title:id,version:1,status:'published',data_json:JSON.stringify({instructions:['Specific retained guidance'],provenance:original?{final_v1_acceptance:{accepted:true}}:{owner_release:true}}),review_json:JSON.stringify({status:'approved',specialist:'pending'}),created_at:original?'2026-08-01T00:00:00Z':stamp,updated_at:original?'2026-08-03T00:00:00Z':stamp}}
const originals=[...Array.from({length:798},(_,i)=>row(`original-recipe-${i}`,'recipe',true)),...Array.from({length:1326},(_,i)=>row(`original-exercise-${i}`,'exercise',true))];
const additions=[...Array.from({length:1885},(_,i)=>row(`new-recipe-${i}`,'recipe')),...Array.from({length:1542},(_,i)=>row(`new-exercise-${i}`,'exercise'))];
const release={proof:'CATALOGUE_PUBLICATION_RELEASE_V1',status:'prepared',release_id:'a'.repeat(64),rows_sha256:await catalogueRowsSha256(additions),owner_instruction:owner,additions,protected_counts:{recipe:798,exercise:1326},addition_counts:{recipe:1885,exercise:1542},protected_originals:await Promise.all(originals.map(async r=>({id:r.id,content_type:r.content_type,content_hash_algorithm:r.content_type==='recipe'?'grub_original_v1':'fit_v1_content_v1',content_hash:await catalogueSha256(JSON.stringify(r.content_type==='recipe'?originalContent({data:JSON.parse(r.data_json),title:r.title}):fitOriginalContent(JSON.parse(r.data_json),r.title)))})))};
function database(t){
  const sqlite=new DatabaseSync(':memory:');t.after(()=>sqlite.close());
  sqlite.exec('CREATE TABLE structured_content(id TEXT PRIMARY KEY,content_type TEXT NOT NULL,title TEXT NOT NULL,version INTEGER NOT NULL,status TEXT NOT NULL,data_json TEXT NOT NULL,review_json TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL)');
  const insert=sqlite.prepare(`INSERT INTO structured_content VALUES(${CATALOGUE_COLUMNS.map(()=>'?').join(',')})`);
  sqlite.exec('BEGIN');for(const r of originals)insert.run(...CATALOGUE_COLUMNS.map(k=>r[k]));sqlite.exec('COMMIT');
  // Even an UPDATE setting the same value would violate insertion-only policy.
  sqlite.exec("CREATE TRIGGER reject_updates BEFORE UPDATE ON structured_content BEGIN SELECT RAISE(ABORT,'catalogue_update_forbidden'); END");
  const db={sqlite,batches:0,beforeBatch:null,prepare(sql){let args=[];return{bind(...v){args=v;return this},async all(){return{success:true,results:sqlite.prepare(sql).all(...args)}},async run(){if(sql.startsWith('SELECT'))return{success:true,results:sqlite.prepare(sql).all(...args),meta:{changes:0}};const r=sqlite.prepare(sql).run(...args);return{success:true,meta:{changes:Number(r.changes)}}}}},async batch(statements){this.batches++;if(this.beforeBatch)this.beforeBatch();sqlite.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sqlite.exec('COMMIT');return results}catch(error){sqlite.exec('ROLLBACK');throw error}}};
  return db;
}
const dump=db=>canonicalCatalogueRows(db.sqlite.prepare('SELECT * FROM structured_content').all());

test('fixed release inserts all 3427 in one transaction, preserves every original byte and retries without any UPDATE',async t=>{
  const db=database(t),before=dump(db),report=await publishFixedCatalogue(db,release);
  assert.equal(report.inserted,3427);assert.equal(report.already_present,0);assert.equal(report.protected_originals,2124);assert.equal(db.batches,1);
  assert.deepEqual(dump(db).filter(r=>r.id.startsWith('original-')),before);
  assert.deepEqual(dump(db).filter(r=>r.id.startsWith('new-')),canonicalCatalogueRows(additions));
  const repeated=await publishFixedCatalogue(db,{...release,status:'approved'});assert.equal(repeated.inserted,0);assert.equal(repeated.already_present,3427);assert.equal(db.batches,2);
});
test('source metadata drift after the preflight aborts the whole transaction',async t=>{
  const db=database(t);db.beforeBatch=()=>{db.sqlite.exec('DROP TRIGGER reject_updates');db.sqlite.prepare("UPDATE structured_content SET review_json=? WHERE id=?").run('{"status":"approved","changed":true}',originals[0].id)};
  await assert.rejects(publishFixedCatalogue(db,release),/malformed JSON/);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM structured_content').get().n,2124);
});
test('unexpected new catalogue row after preflight rejects before additions',async t=>{
  const db=database(t);db.beforeBatch=()=>db.sqlite.prepare('INSERT INTO structured_content VALUES(?,?,?,?,?,?,?,?,?)').run(...CATALOGUE_COLUMNS.map(k=>row('concurrent','recipe')[k]));
  await assert.rejects(publishFixedCatalogue(db,release),/malformed JSON/);assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM structured_content WHERE id LIKE ?').get('new-%').n,0);
});
test('late ID collision outside the catalogue rolls back earlier insertion chunks',async t=>{
  const db=database(t),last=canonicalCatalogueRows(additions).at(-1);
  db.beforeBatch=()=>db.sqlite.prepare('INSERT INTO structured_content VALUES(?,?,?,?,?,?,?,?,?)').run(...CATALOGUE_COLUMNS.map(k=>({...last,content_type:'article',title:'Existing unrelated content'})[k]));
  await assert.rejects(publishFixedCatalogue(db,release),/malformed JSON/);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM structured_content').get().n,2125);
  assert.equal(db.sqlite.prepare('SELECT title FROM structured_content WHERE id=?').get(last.id).title,'Existing unrelated content');
});
test('original member content changed before preflight fails without a batch',async t=>{
  const db=database(t);db.sqlite.exec('DROP TRIGGER reject_updates');db.sqlite.prepare('UPDATE structured_content SET title=? WHERE id=?').run('Changed',originals[0].id);
  await assert.rejects(publishFixedCatalogue(db,release),/original_content_changed/);assert.equal(db.batches,0);
});
test('different prepared addition with an existing ID fails without overwrite',async t=>{
  const db=database(t),collision={...additions[0],title:'Changed addition'};db.sqlite.prepare('INSERT INTO structured_content VALUES(?,?,?,?,?,?,?,?,?)').run(...CATALOGUE_COLUMNS.map(k=>collision[k]));
  await assert.rejects(publishFixedCatalogue(db,release),/addition_collision/);assert.equal(db.batches,0);
});
test('missing owner authority, wrong cohort, changed row hash and original-ID additions fail closed',async()=>{
  for(const invalid of [{...release,status:'pending'},{...release,owner_instruction:{...owner,human_editorial_review_claimed:true}},{...release,addition_counts:{recipe:1884,exercise:1542}},{...release,rows_sha256:'b'.repeat(64)},{...release,protected_originals:release.protected_originals.slice(1)}])await assert.rejects(validateCatalogueRelease(invalid),/catalogue_/);
  const changed=structuredClone(release);changed.additions[0].id=originals[0].id;changed.rows_sha256=await catalogueRowsSha256(changed.additions);await assert.rejects(validateCatalogueRelease(changed),/original_binding_invalid/);
});
test('invalid pagination and lack of transactional batch fail closed',async()=>{
  await assert.rejects(publishFixedCatalogue({prepare(){}},release),/atomic_batch_required/);
  const db={async batch(){throw new Error('must not write')},prepare(){return{bind(){return this},async all(){return{success:true,results:[originals[0],originals[0]]}}}}};
  await assert.rejects(publishFixedCatalogue(db,release),/snapshot_paging_invalid/);
});
