import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {correctionSql,prepareCorrections,STAMP} from './build.mjs';
const items=JSON.parse(readFileSync(new URL('./corrections.json',import.meta.url),'utf8'));
function fixture(){
 const db=new DatabaseSync(':memory:'),columns=Object.keys(items[0].before);db.exec('CREATE TABLE radar_events('+columns.map(k=>k+' '+(k==='id'?'INTEGER PRIMARY KEY':'TEXT')).join(',')+');CREATE TABLE radar_audit(id INTEGER PRIMARY KEY,event_id INTEGER,action TEXT,actor TEXT,detail_json TEXT,created_at TEXT)');
 const insert=db.prepare('INSERT INTO radar_events('+columns.join(',')+') VALUES('+columns.map(()=>'?').join(',')+')');for(const a of items)insert.run(...columns.map(k=>a.before[k]));insert.run(...columns.map(k=>k==='id'?999:a(items[0].before[k])));
 function a(v){return v;}
 return db;
}
test('all 19 source-bound corrections retain dates, identity and protected clinical/source state',()=>{
 const db=fixture(),{sql,params,audits,prepared}=correctionSql(items),other=db.prepare('SELECT * FROM radar_events WHERE id=999').get();
 assert(Buffer.byteLength(sql)<100000);assert.equal(params.length,1);
 assert.equal(db.prepare(sql).all(...params).length,19);db.exec(audits);
 for(const p of prepared){assert.deepEqual({...db.prepare('SELECT * FROM radar_events WHERE id=?').get(p.id)},p.after);assert.equal(JSON.parse(p.after.content_package_json).seo.datePublished,JSON.parse(p.before.content_package_json).seo.datePublished);}
 assert.deepEqual(db.prepare('SELECT * FROM radar_events WHERE id=999').get(),other);assert.equal(db.prepare('SELECT COUNT(*) n FROM radar_audit').get().n,19);
 db.exec(audits);assert.equal(db.prepare('SELECT COUNT(*) n FROM radar_audit').get().n,19);db.close();
});
for(const mutation of ['content_package_json','source_evidence_json','headline','status','updated_at','missing'])test('any '+mutation+' drift aborts the complete 19-row update',()=>{
 const db=fixture(),id=items[3].id;if(mutation==='missing')db.prepare('DELETE FROM radar_events WHERE id=?').run(id);else db.prepare('UPDATE radar_events SET '+mutation+'=? WHERE id=?').run('concurrent change',id);
 const before=db.prepare('SELECT * FROM radar_events ORDER BY id').all(),{sql,params}=correctionSql(items);assert.throws(()=>db.prepare(sql).run(...params),/malformed JSON/);assert.deepEqual(db.prepare('SELECT * FROM radar_events ORDER BY id').all(),before);assert.equal(db.prepare('SELECT COUNT(*) n FROM radar_audit').get().n,0);db.close();
});
test('prepared provenance refuses fabricated clinical/full-paper review or changed source/date',()=>{
 for(const mutate of [a=>a[0].after_content.source_correction.clinical_review=true,a=>a[0].after_content.source_correction.full_paper_reviewed=true,a=>a[0].after_content.seo.datePublished=STAMP,a=>a[0].after_sources[0].url='https://example.org']){const changed=structuredClone(items);mutate(changed);assert.throws(()=>prepareCorrections(changed));}
});
