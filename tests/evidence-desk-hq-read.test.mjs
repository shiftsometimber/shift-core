import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from '../worker-entry-v6.js';
import {identity,tables,query,verifyConfig,verifyRemote} from '../scripts/verify-evidence-inbox-connection.mjs';

const origin='https://hq.shiftsometimber.co.uk';
function fixture(t,{connected=false,expired=false}={}){
  const mainQueries=[],reads=[];
  const DB={prepare(sql){
    mainQueries.push(sql);
    assert.match(sql,/^(SELECT h\.\*,s\.id session_id|UPDATE hq_sessions SET last_used_at=)/,'main DB is only used for existing HQ authentication');
    return {bind(){return this},async first(){return expired?null:{id:1,name:'Fictional owner',email:'owner@example.test',role:'owner',status:'active',session_id:1,expires_at:'2099-01-01T00:00:00Z'}},async run(){return{success:true}}};
  }};
  const env={DB};
  let sqlite;
  if(connected){
    sqlite=new DatabaseSync(':memory:');t.after(()=>sqlite.close());
    sqlite.exec(readFileSync(new URL('../migrations/007_shift_evidence_desk.sql',import.meta.url),'utf8'));
    sqlite.exec("INSERT INTO evidence_desk_sources(id,family,name,canonical_url,authority_name,extraction_method) VALUES('fixture','mhra','Fictional source','https://example.test/source','Fixture authority','manual_structured')");
    env.EVIDENCE_DESK_READ_ENV='non-production';
    env.EVIDENCE_DESK_READ_DB={prepare(sql){reads.push(sql);assert.match(sql,/^SELECT /,'isolated database is read only');return{async first(){return sqlite.prepare(sql).get()||null},async all(){return{results:sqlite.prepare(sql).all()}}}}};
  }
  const call=(path='overview',options={})=>worker.fetch(new Request('https://api.shiftsometimber.co.uk/v1/hq/evidence-desk/'+path,{...options,headers:{Origin:origin,Cookie:'sst_hq_session=fictional-unit-test-cookie',...options.headers}}),env,{});
  return{env,sqlite,call,mainQueries,reads};
}

test('production dispatcher reports unavailable staging records instead of falling through or inventing an empty queue',async t=>{
  const f=fixture(t),response=await f.call(),body=await response.json();
  assert.equal(response.status,503);assert.equal(body.error,'evidence_inbox_not_connected');
  assert.match(body.message,/not connected/);assert.equal('counts' in body,false);assert.equal('control' in body,false);
  assert.equal(response.headers.get('access-control-allow-origin'),origin);assert.equal(response.headers.get('cache-control'),'no-store');
});

test('production dispatcher retains HQ session rejection before staging reads',async t=>{
  const f=fixture(t,{connected:true});
  let response=await f.call('overview',{headers:{Cookie:''}});
  assert.equal(response.status,401);assert.equal(f.mainQueries.length,0);assert.equal(f.reads.length,0);
  const expired=fixture(t,{connected:true,expired:true});response=await expired.call();
  assert.equal(response.status,401);assert.equal(expired.reads.length,0);
});

test('isolated staging adapter returns the five actual HQ GET shapes without writing a schema or enabling controls',async t=>{
  const f=fixture(t,{connected:true});
  const response=await f.call(),overview=await response.json();
  assert.equal(response.status,200);assert.equal(overview.environment,'non-production');assert.equal(overview.mode,'read_only');
  assert.equal(overview.counts.sources.total,1);assert.equal(overview.control.enabled,0);assert.equal(overview.locks.websitePublish,true);
  for(const key of ['sources','claims','events','packages']){
    const result=await f.call(key),body=await result.json();assert.equal(result.status,200,key);assert.ok(Array.isArray(body[key]),key);
    if(key==='sources')assert.equal(body.sources[0].name,'Fictional source');
  }
  assert.equal(f.sqlite.prepare('SELECT enabled+ingestion_enabled+website_publish_enabled+newsletter_enabled+social_enabled n FROM evidence_desk_control').get().n,0);
});

test('mutating methods are refused before any staging read and hostile origins are never reflected',async t=>{
  const f=fixture(t,{connected:true});
  for(const method of ['POST','PUT','PATCH','DELETE']){
    const response=await f.call('sources/seed',{method,headers:{Origin:'https://hostile.example'}});
    assert.equal(response.status,405);assert.equal((await response.json()).error,'evidence_inbox_read_only');
    assert.equal(response.headers.get('access-control-allow-origin'),null);
  }
  assert.equal(f.reads.length,0);
});

test('main database aliases and missing environment markers cannot become staging records',async t=>{
  const f=fixture(t);f.env.EVIDENCE_DESK_READ_DB=f.env.DB;f.env.EVIDENCE_DESK_READ_ENV='non-production';
  assert.equal((await f.call()).status,503);
  const other=fixture(t,{connected:true});delete other.env.EVIDENCE_DESK_READ_ENV;
  assert.equal((await other.call()).status,503);assert.equal(other.reads.length,0);
});

test('missing staging schema fails visibly without initializing or inventing records',async t=>{
  const f=fixture(t,{connected:true});f.sqlite.exec('DROP TABLE evidence_desk_packages');
  const response=await f.call(),body=await response.json();
  assert.equal(response.status,503);assert.equal(body.error,'evidence_inbox_unavailable');assert.equal('counts' in body,false);
});

test('deployment verifier rejects account/database confusion and malformed or incomplete remote proof',()=>{
  const config={vars:{EVIDENCE_DESK_READ_ENV:'non-production'},d1_databases:[{binding:'DB',database_id:identity.productionId},{binding:'EVIDENCE_DESK_READ_DB',database_id:identity.id,database_name:identity.name}]};
  verifyConfig(config,identity.account);assert.throws(()=>verifyConfig(config,'wrong-account'));
  const aliased=structuredClone(config);aliased.d1_databases[1].database_id=identity.productionId;assert.throws(()=>verifyConfig(aliased,identity.account));
  const databases=[{uuid:identity.id,name:identity.name}],response=[{success:true,results:tables.map(name=>({name}))},{success:true,results:[{id:1,enabled:1,ingestion_enabled:1,decision_email_enabled:0,website_publish_enabled:1,newsletter_enabled:0,social_enabled:0}]}];
  assert.equal(verifyRemote(databases,response).databaseWrites,false);
  assert.throws(()=>verifyRemote([],response));
  assert.throws(()=>verifyRemote(databases,[{...response[0],success:false},response[1]]));
  assert.throws(()=>verifyRemote(databases,[{success:true,results:[]},response[1]]));
  assert.throws(()=>verifyRemote(databases,[response[0],{success:true,results:[]}]));
  assert.doesNotMatch(query,/\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i);
  assert.doesNotMatch(query,/article|proposed_changes|evidence_json/i);
});
