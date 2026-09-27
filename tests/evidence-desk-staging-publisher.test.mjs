import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import worker from '../evidence-desk-staging-publisher-entry.js';

class Stmt{constructor(db,sql,args=[]){this.db=db;this.sql=sql;this.args=args}bind(...args){return new Stmt(this.db,this.sql,args)}async first(){return this.db.prepare(this.sql).get(...this.args)||null}async all(){return{results:this.db.prepare(this.sql).all(...this.args)}}async run(){const r=this.db.prepare(this.sql).run(...this.args);return{...r,lastInsertRowid:r.lastInsertRowid}}}
class D1{constructor(){this.db=new DatabaseSync(':memory:')}prepare(sql){return new Stmt(this.db,sql)}async exec(sql){this.db.exec(sql)}async batch(statements){this.db.exec('BEGIN');try{const out=[];for(const statement of statements)out.push(await statement.run());this.db.exec('COMMIT');return out}catch(error){this.db.exec('ROLLBACK');throw error}}}
const sha=value=>createHash('sha256').update(String(value)).digest('hex');
const token='s'.repeat(64),text='Neutral staging proof copy.',baseline=sha('');
const env=()=>{const DB=new D1();DB.db.exec(`CREATE TABLE evidence_desk_operational_control(id INTEGER PRIMARY KEY,monitoring_enabled INTEGER,website_enabled INTEGER,staging_publication_enabled INTEGER,production_authority_enabled INTEGER,control_epoch INTEGER);INSERT INTO evidence_desk_operational_control VALUES(1,1,1,1,0,7);CREATE TABLE evidence_desk_control(id INTEGER PRIMARY KEY,enabled INTEGER,website_publish_enabled INTEGER);INSERT INTO evidence_desk_control VALUES(1,1,1);`);return{DB,STAGING_PUBLISH_TOKEN:token}};
function publishRequest(overrides={}){
  const body={packageId:9,pagePath:'/proof',contentKey:'body',proposedText:text,copySha256:sha(text),baselineSha256:baseline,rollbackLocator:'staging://baseline/proof',...overrides};
  const serialized=JSON.stringify(body);
  return new Request('https://stage.example/v1/publish',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json','idempotency-key':'web:9:proof','x-payload-sha256':sha(serialized),'x-control-epoch':'7'},body:serialized});
}

test('staging publisher requires its separate credential',async()=>{
  const e=env(),request=publishRequest();request.headers.set('authorization','Bearer wrong');
  const response=await worker.fetch(request,e);assert.equal(response.status,401);
});

test('staging publish is SHA-bound, previewable, idempotent and reversible',async()=>{
  const e=env();let response=await worker.fetch(publishRequest(),e),result=await response.json();
  assert.equal(result.published,true);assert.equal(result.copySha256,sha(text));assert.equal(result.baselineSha256,baseline);
  const versionId=result.versionId;
  response=await worker.fetch(publishRequest(),e);result=await response.json();assert.equal(result.idempotent,true);assert.equal(result.versionId,versionId);
  response=await worker.fetch(new Request(`https://stage.example/preview/${versionId}`),e);assert.equal(response.status,200);assert.match(await response.text(),/NON-PRODUCTION STAGING/);
  response=await worker.fetch(new Request('https://stage.example/v1/rollback',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({versionId,copySha256:sha(text)})}),e);result=await response.json();assert.equal(result.rolledBack,true);assert.equal(result.baselineSha256,baseline);
  response=await worker.fetch(new Request(`https://stage.example/preview/${versionId}`),e);assert.equal(response.status,410);
  const page=e.DB.db.prepare(`SELECT current_sha256 FROM evidence_desk_staging_pages WHERE page_path='/proof'`).get();assert.equal(page.current_sha256,baseline);
});

test('staging publisher rejects stale baseline and copy drift',async()=>{
  const e=env();let response=await worker.fetch(publishRequest({copySha256:'a'.repeat(64)}),e);assert.equal(response.status,400);
  response=await worker.fetch(publishRequest({baselineSha256:'b'.repeat(64)}),e);assert.equal(response.status,409);assert.equal((await response.json()).error,'stale_baseline');
});

test('staging publisher rechecks the shared kill switch immediately before write',async()=>{
  const e=env();e.DB.db.prepare(`UPDATE evidence_desk_operational_control SET control_epoch=8,website_enabled=0`).run();
  const response=await worker.fetch(publishRequest(),e);assert.equal(response.status,409);assert.equal((await response.json()).error,'publisher_control_closed');
  assert.equal(e.DB.db.prepare(`SELECT COUNT(*) n FROM evidence_desk_staging_versions`).get()?.n||0,0);
});
