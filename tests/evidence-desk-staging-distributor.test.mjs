import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import worker from '../evidence-desk-staging-distributor-entry.js';

class Stmt{constructor(db,sql,args=[]){this.db=db;this.sql=sql;this.args=args}bind(...args){return new Stmt(this.db,this.sql,args)}async first(){return this.db.prepare(this.sql).get(...this.args)||null}async run(){return this.db.prepare(this.sql).run(...this.args)}}
class D1{constructor(){this.db=new DatabaseSync(':memory:')}prepare(sql){return new Stmt(this.db,sql)}async exec(sql){this.db.exec(sql)}}
const token='d'.repeat(64),payload=JSON.stringify({destination:'facebook',sourceCopySha256:'a'.repeat(64),text:'Neutral proof post.',hashtags:['#ShiftSomeTimber']});
const hash=createHash('sha256').update(payload).digest('hex');
function request(auth=token){return new Request('https://distribution.example/v1/facebook',{method:'POST',headers:{authorization:`Bearer ${auth}`,'content-type':'application/json','idempotency-key':'proof:facebook:1','x-payload-sha256':hash},body:payload})}

test('staging distributor is credentialled, hash-bound, idempotent and previewable',async()=>{
  const env={DB:new D1(),STAGING_DISTRIBUTION_TOKEN:token};let response=await worker.fetch(request('wrong'),env);assert.equal(response.status,401);
  response=await worker.fetch(request(),env);let result=await response.json();assert.equal(result.published,true);assert.equal(result.payloadSha256,hash);const url=result.url;
  response=await worker.fetch(request(),env);result=await response.json();assert.equal(result.idempotent,true);
  response=await worker.fetch(new Request(url),env);assert.equal(response.status,200);assert.match(await response.text(),/NON-PRODUCTION facebook PREVIEW/);
  assert.equal(env.DB.db.prepare('SELECT COUNT(*) n FROM evidence_desk_staging_deliveries').get().n,1);
});
