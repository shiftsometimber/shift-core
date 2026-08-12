import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {seedIndustrialFactoryV2} from './industrial-factory-seed-v2.js';

class D1Statement{constructor(db,sql,params=[]){this.db=db;this.sql=sql;this.params=params}bind(...p){return new D1Statement(this.db,this.sql,p.map(v=>v===undefined?null:v))}async run(){const r=this.db.prepare(this.sql).run(...this.params);return{success:true,meta:{changes:Number(r.changes||0),last_row_id:Number(r.lastInsertRowid||0)}}}async first(){return this.db.prepare(this.sql).get(...this.params)||null}async all(){return{results:this.db.prepare(this.sql).all(...this.params)}}}
class D1Database{constructor(){this.sqlite=new DatabaseSync(':memory:')}prepare(sql){return new D1Statement(this.sqlite,sql)}async exec(sql){this.sqlite.exec(sql);return{success:true}}}

const DB=new D1Database();
const result=await seedIndustrialFactoryV2(DB);
assert.equal(result.grubDraftsSeeded,2468);
assert.equal(result.fitDraftsSeeded,2468);
assert.equal(result.totalSeeded,4936);
const counts=(await DB.prepare("SELECT content_type,status,COUNT(*) c FROM structured_content GROUP BY content_type,status ORDER BY content_type,status").all()).results;
assert.equal(Number(counts.find(x=>x.content_type==='recipe'&&x.status==='draft')?.c||0),2468);
assert.equal(Number(counts.find(x=>x.content_type==='exercise'&&x.status==='draft')?.c||0),2468);
assert.equal(Number((await DB.prepare("SELECT COUNT(*) c FROM structured_content WHERE status='published'").first()).c),0);
const samples=(await DB.prepare("SELECT id,content_type,status,data_json FROM structured_content ORDER BY id LIMIT 100").all()).results;
for(const x of samples){const d=JSON.parse(x.data_json);assert.equal(x.status,'draft');if(x.content_type==='recipe')assert.equal(d.nutrition.status,'pending_validation');if(x.content_type==='exercise')assert.equal(d.visual.status,'pending')}
console.log(JSON.stringify({factorySeed:result,d1State:counts,rule:'4,936 industrial objects ingest independently as quarantined drafts; the existing 32+32 base catalogue makes the authored universe 2,500 each, but volume alone promotes nothing'},null,2));
console.log('PASS scale-2500 staging ingest: 2,468 industrial Grub + 2,468 industrial Fit objects entered structured D1 as quarantined drafts without any publication shortcut.');
