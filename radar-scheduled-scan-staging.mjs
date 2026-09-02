import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readRadarFreshness} from './radar-freshness-v2.js';
import {ensureRadarSchema} from './radar-integration-v1.js';
import {runRadarScheduledScan} from './radar-scheduled-scan-v1.js';

class S {
  constructor(db,sql,p=[]){this.db=db;this.sql=sql;this.p=p;}
  bind(...p){return new S(this.db,this.sql,p.map(v=>v===undefined?null:v));}
  async run(){const r=this.db.prepare(this.sql).run(...this.p);return{success:true,meta:{last_row_id:Number(r.lastInsertRowid||0),changes:Number(r.changes||0)}};}
  async first(){return this.db.prepare(this.sql).get(...this.p)||null;}
  async all(){return{results:this.db.prepare(this.sql).all(...this.p)};}
}
class D {
  constructor(){this.sqlite=new DatabaseSync(':memory:');}
  prepare(sql){return new S(this.sqlite,sql);}
  async batch(statements){const out=[];this.sqlite.exec('BEGIN');try{for(const s of statements)out.push(await s.run());this.sqlite.exec('COMMIT');return out;}catch(e){this.sqlite.exec('ROLLBACK');throw e;}}
  async exec(sql){this.sqlite.exec(sql);}
}

const DB=new D();
await ensureRadarSchema(DB);
const before=await readRadarFreshness(DB);
assert.equal(before.status,'AMBER');
assert.equal(before.current,false);
assert.equal(before.ages.scan,null);
assert.ok(before.reasons.some(x=>x.code==='scan_stale'));

const oldFetch=globalThis.fetch;
globalThis.fetch=async url=>{const value=String(url);if(value.includes('esearch.fcgi'))return Response.json({esearchresult:{idlist:['42673585']}});if(value.includes('esummary.fcgi'))return Response.json({result:{'42673585':{uid:'42673585',title:'Peer-reviewed GLP-1 and retatrutide weight-loss review',pubdate:'2026 Sep 1',sorttitle:'GLP-1 weight loss',fulljournalname:'Annals of Internal Medicine'}}});return new Response(`<?xml version="1.0"?><feed><entry><title>Authoritative GLP-1 weight-management medicine update</title><link href="${url}/item-1"/><updated>2026-08-12T17:00:00Z</updated><summary>Regulatory update concerning obesity treatment.</summary></entry></feed>`,{status:200})};
try {
  const result=await runRadarScheduledScan({DB});
  assert.equal(result.scan.ok,true);
  assert.equal(result.scan.sources.length,4);
  assert.equal(result.scan.newEvents,4);
  assert.equal(result.freshness.freshnessDue,0);

  const scan=await DB.prepare(`SELECT * FROM radar_audit WHERE action='scan' ORDER BY id DESC LIMIT 1`).first();
  assert.ok(scan);
  assert.equal(scan.actor,'radar_scanner');
  const detail=JSON.parse(scan.detail_json);
  assert.equal(detail.authoritative,true);
  assert.equal(detail.sources.length,4);

  const events=await DB.prepare(`SELECT COUNT(*) c FROM radar_events`).first();
  assert.equal(Number(events.c),4);
  const after=await readRadarFreshness(DB);
  assert.equal(after.status,'GREEN');
  assert.equal(after.current,true);
  assert.ok(after.ages.scan<=after.sloHours.scanHours);

  console.log(JSON.stringify({before:before.status,scan:result.scan,events:Number(events.c),after:after.status},null,2));
  console.log('PASS M03 scheduled Radar performs authoritative-source retrieval, provenance ingestion, scan audit and freshness transition');
} finally {
  globalThis.fetch=oldFetch;
}
