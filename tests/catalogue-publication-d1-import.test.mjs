import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {buildCatalogueImport,verifyCatalogueImport} from '../scripts/catalogue-exact-d1-import.mjs';
import {CATALOGUE_PUBLICATION_RELEASE as release} from '../catalogue-publication-release-v1.mjs';
import {CATALOGUE_COLUMNS} from '../catalogue-publication-shared.mjs';

test('direct D1 import preserves 2128 existing rows and proves exact additions and safe retry',async t=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'catalogue-d1-import-'));
  const db=new DatabaseSync(':memory:');
  t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true})});
  if(process.env.CATALOGUE_AUDIT_SNAPSHOT){
    db.exec('CREATE TABLE structured_content(id TEXT PRIMARY KEY,content_type TEXT,title TEXT,version INTEGER,status TEXT,data_json TEXT,review_json TEXT,created_at TEXT,updated_at TEXT)');
    const insert=db.prepare('INSERT INTO structured_content VALUES(?,?,?,?,?,?,?,?,?)');
    for(const row of JSON.parse(fs.readFileSync(process.env.CATALOGUE_AUDIT_SNAPSHOT,'utf8')))insert.run(...CATALOGUE_COLUMNS.map(k=>row[k]));
  }else{
    execFileSync(process.execPath,['grub-v1-publication-pack.mjs'],{stdio:'pipe',env:{...process.env,COFID_INDEX:path.resolve('tests/fixtures/grub-cofid-2021-governed-subset.json'),GRUB_PUBLICATION_DIR:dir,GRUB_DECISIONS_FILE:path.resolve('evidence/grub-v1-final-decisions-2026-08-14.json')}});
    execFileSync(process.execPath,['final-v1-production-publication.mjs'],{stdio:'pipe',env:{...process.env,GRUB_PUBLISHABLE_FILE:path.join(dir,'grub-v1-publishable.json'),FINAL_V1_PUBLICATION_DIR:dir}});
    db.exec(fs.readFileSync(path.join(dir,'final-v1-production-publication.sql'),'utf8'));
    const insert=db.prepare('INSERT INTO structured_content VALUES(?,?,?,?,?,?,?,?,?)');
    for(let i=0;i<4;i++)insert.run('existing-extra-'+i,i?'exercise':'recipe',"Existing member's content",1,'draft','{}','{}','2026-08-01','2026-08-01');
  }
  const dump=()=>db.prepare(`SELECT ${CATALOGUE_COLUMNS.join(',')} FROM structured_content WHERE content_type IN ('recipe','exercise') ORDER BY id`).all();
  const before=dump();assert.equal(before.length,2128);
  const statements=await buildCatalogueImport(before);
  assert.ok(statements.every(sql=>Buffer.byteLength(sql)<90000),'D1 statement limit');
  const sql=statements.join('\n');
  assert.doesNotMatch(sql,/^(BEGIN|COMMIT|SAVEPOINT|UPDATE|DELETE)/m);
  db.exec("CREATE TRIGGER reject_catalogue_update BEFORE UPDATE ON structured_content BEGIN SELECT RAISE(ABORT,'original_update_forbidden'); END");
  function importFile(){db.exec('BEGIN');try{db.exec(sql);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}}
  importFile();const after=dump();assert.equal(after.length,5555);
  const report=await verifyCatalogueImport(before,after);
  assert.equal(report.inserted,3427);assert.equal(report.all_existing_rows_unchanged,true);assert.equal(report.exact_additions_verified,true);
  assert.equal(report.protected_originals,2124);
  const retry=await buildCatalogueImport(after);
  assert.deepEqual(retry,[],'an exact published release must not start another D1 file import');
  const completeFile=path.join(dir,'complete.json');
  fs.writeFileSync(completeFile,JSON.stringify([{success:true,results:after}]));
  assert.equal(execFileSync(process.execPath,['scripts/catalogue-exact-d1-import.mjs','--sql',completeFile]).length,0,'no-op CLI output must be truly empty for the workflow size guard');
  const partial=after.filter(row=>row.id!==release.additions.at(-1).id);
  assert.ok((await buildCatalogueImport(partial)).length>0,'a missing approved row still requires guarded import');
  assert.equal((await verifyCatalogueImport(after,dump())).already_present,3427);
  const corrupt=structuredClone(after);corrupt.find(r=>r.id===release.additions[0].id).data_json='{}';
  await assert.rejects(verifyCatalogueImport(before,corrupt),/collision|mismatch/);
  await assert.rejects(buildCatalogueImport(corrupt),/collision/,'no-op must not hide changed existing additions');
  const changedExisting=structuredClone(after);changedExisting[0].updated_at='changed-after-snapshot';
  await assert.rejects(verifyCatalogueImport(after,changedExisting),/collision|mismatch/,'read-only retry must still reject snapshot drift');
  const old=structuredClone(before);old.find(r=>r.id===release.protected_originals[0].id).title='Changed';
  await assert.rejects(buildCatalogueImport(old),/original_content_changed/);
  await assert.rejects(buildCatalogueImport(before,{...release,status:'prepared'}),/not_approved/);
  // Restore baseline in this disposable database, then simulate snapshot drift.
  db.exec('DROP TRIGGER reject_catalogue_update');
  const remove=db.prepare('DELETE FROM structured_content WHERE id=?');
  for(const row of release.additions)remove.run(row.id);
  db.prepare('UPDATE structured_content SET updated_at=? WHERE id=?').run('drift',before[0].id);
  assert.throws(importFile,/malformed JSON/);assert.equal(dump().length,2128);
  db.prepare('UPDATE structured_content SET updated_at=? WHERE id=?').run(before[0].updated_at,before[0].id);
  // A conflicting non-catalogue ID must roll back earlier insertion chunks.
  const last=release.additions.at(-1);
  db.prepare('INSERT INTO structured_content VALUES(?,?,?,?,?,?,?,?,?)').run(last.id,'article','Existing unrelated article',1,'draft','{}','{}','before','before');
  assert.throws(importFile,/malformed JSON/);assert.equal(dump().length,2128);
  console.log(JSON.stringify({snapshot_rows:before.length,final_rows:after.length,statements:statements.length,max_statement_bytes:Math.max(...statements.map(s=>Buffer.byteLength(s))),exact_proof:report}));
});

test('Grub-only import adds exactly the approved 1885 recipe rows and cannot publish Fit',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'grub-only-import-')),db=new DatabaseSync(':memory:');t.after(()=>{db.close();fs.rmSync(dir,{recursive:true,force:true})});
 execFileSync(process.execPath,['grub-v1-publication-pack.mjs'],{stdio:'pipe',env:{...process.env,COFID_INDEX:path.resolve('tests/fixtures/grub-cofid-2021-governed-subset.json'),GRUB_PUBLICATION_DIR:dir,GRUB_DECISIONS_FILE:path.resolve('evidence/grub-v1-final-decisions-2026-08-14.json')}});
 execFileSync(process.execPath,['final-v1-production-publication.mjs'],{stdio:'pipe',env:{...process.env,GRUB_PUBLISHABLE_FILE:path.join(dir,'grub-v1-publishable.json'),FINAL_V1_PUBLICATION_DIR:dir}});
 db.exec(fs.readFileSync(path.join(dir,'final-v1-production-publication.sql'),'utf8'));
 const dump=()=>db.prepare('SELECT * FROM structured_content ORDER BY id').all();const before=dump();
 const sql=(await buildCatalogueImport(before,release,'recipe')).join('\n');
 db.exec('BEGIN');try{db.exec(sql);db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}
 const after=dump(),report=await verifyCatalogueImport(before,after,release,'recipe');
 assert.equal(report.inserted,1885);assert.equal(report.selection,'recipe');assert.equal(report.after_count-report.before_count,1885);assert.equal(report.all_existing_rows_unchanged,true);
 assert.deepEqual(after.filter(r=>r.content_type==='exercise'),before.filter(r=>r.content_type==='exercise'));
 assert.equal(after.filter(r=>r.content_type==='recipe').length,2683);assert.deepEqual(await buildCatalogueImport(after,release,'recipe'),[]);
 const changed=structuredClone(after);changed.find(r=>r.content_type==='exercise').title='Unexpected Fit change';await assert.rejects(verifyCatalogueImport(before,changed,release,'recipe'));
 await assert.rejects(buildCatalogueImport(before,release,'exercise'),/selection/);
 const onlyRecipes=before.filter(r=>r.content_type==='recipe');await assert.rejects(buildCatalogueImport(onlyRecipes,release,'recipe'),/original/);
 console.log(JSON.stringify({proof:'EXACT_GRUB_ONLY_IMPORT',...report}));
});
