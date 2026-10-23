import test from 'node:test';
import assert from 'node:assert/strict';
import {createTimberShedPrivateRoutes,timberShedPrivateSchema} from '../member-experience/timber-shed-private.mjs';
const BASE='https://example.test/v1/timber-shed/private-progress';
function setup(){
 const records=new Map(),reads=[],writes=[];
 const DB={prepare(sql){return{bind(...params){return{
  async first(){reads.push({sql,params});const row=records.get(params[0]);return row?{...row}:null},
  async run(){writes.push({sql,params});if(sql.startsWith('UPDATE')){const [enabled,revision,activities_json,updated_at,id,expected]=params;const old=records.get(id);if(!old||old.revision!==expected)return{meta:{changes:0}};records.set(id,{enabled,revision,activities_json,updated_at});return{meta:{changes:1}}}
   if(sql.startsWith('INSERT')){const [id,enabled,revision,activities_json,updated_at]=params;if(records.has(id))return{meta:{changes:0}};records.set(id,{enabled,revision,activities_json,updated_at});return{meta:{changes:1}}}
   throw Error('Unexpected SQL')},
 }}}}};
 const route=createTimberShedPrivateRoutes(async request=>{const id=Number(request.headers.get('x-fixture-member'));return id>0?{userId:id}:{response:Response.json({error:'authentication_required'},{status:401})}});
 const env={TIMBER_SHED_PRIVATE_ENABLED:'true',DB};
 async function send(id,method='GET',body,extra={}){
  const headers={'x-fixture-member':String(id),...extra};
  if(method==='POST'){headers.Origin='https://example.test';headers['Content-Type']='application/json'}
  const request=new Request(BASE,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});
  const response=await route(request,env);return{status:response.status,headers:response.headers,body:await response.json()};
 }
 return{send,env,route,records,reads,writes};
}
test('default-off flag prevents reads and writes even for an authenticated user',async()=>{
 const t=setup();t.env.TIMBER_SHED_PRIVATE_ENABLED='false';const a=await t.send(11);
 assert.equal(a.status,404);assert.equal(t.reads.length,0);assert.equal(t.writes.length,0);
});
test('no session never accesses private records',async()=>{
 const t=setup();const a=await t.send(0);assert.equal(a.status,401);assert.equal(t.reads.length,0);
});
test('default state contains no health data, names, emails, posts or cross-member feed',async()=>{
 const t=setup();const a=await t.send(11);assert.deepEqual(a.body,{ok:true,private:true,enabled:false,revision:0,activities:{}});
 assert.equal(a.headers.get('Cache-Control'),'private, no-store, max-age=0');
 assert.equal(a.headers.get('X-Robots-Tag'),'noindex, nofollow, noarchive');
 assert.equal(a.headers.get('Access-Control-Allow-Origin'),null);
});
test('member activity is opt-in, private, bounded, and never shared to another member',async()=>{
 const t=setup();assert.equal((await t.send(11,'POST',{action:'activity',revision:0,activityId:'w1-start',status:'done'})).status,400);
 let a=await t.send(11,'POST',{action:'enable',revision:0});assert.equal(a.status,200);assert.equal(a.body.enabled,true);
 a=await t.send(11,'POST',{action:'activity',revision:1,activityId:'w1-start',status:'done',feedback:'helped'});assert.equal(a.status,200);
 assert.deepEqual(a.body.activities,{'w1-start':{status:'done',feedback:'helped'}});
 assert.deepEqual((await t.send(12)).body.activities,{});
 assert.deepEqual((await t.send(11)).body.activities,{'w1-start':{status:'done',feedback:'helped'}});
 assert(t.reads.every(x=>x.sql.includes('WHERE user_id=?')));
 assert(t.writes.every(x=>x.sql.includes('user_id')));
 assert(!JSON.stringify(a.body).includes('userId'));
});
test('rejects unapproved fields, free text, health values, invalid activities and replay',async()=>{
 const t=setup();await t.send(11,'POST',{action:'enable',revision:0});
 for(const body of [
  {action:'activity',revision:1,activityId:'w1-start',status:'done',mood:'anxious'},
  {action:'activity',revision:1,activityId:'w1-start',status:'done',weight:93},
  {action:'activity',revision:1,activityId:'w1-start',status:'done',notes:'I am unwell'},
  {action:'activity',revision:1,activityId:'w99-start',status:'done'},
  {action:'activity',revision:1,activityId:'w1-start',status:'done',feedback:'depressed'},
 ])assert.equal((await t.send(11,'POST',body)).status,400);
 assert.equal((await t.send(11,'POST',{action:'enable',revision:0})).status,409);
 assert.deepEqual((await t.send(11)).body.activities,{});
});
test('rejects cross-site writes and oversized requests, without changing records',async()=>{
 const t=setup();const x=await t.route(new Request(BASE,{method:'POST',headers:{'x-fixture-member':'11',Origin:'https://evil.test','Content-Type':'application/json'},body:JSON.stringify({action:'enable',revision:0})}),t.env);
 assert.equal(x.status,403);
 const y=await t.send(11,'POST',{action:'enable',revision:0,extra:'x'.repeat(550)});assert.equal(y.status,413);
 assert.equal(t.writes.length,0);
});
test('disable clears stored progress, and a later enable cannot restore it',async()=>{
 const t=setup();await t.send(11,'POST',{action:'enable',revision:0});await t.send(11,'POST',{action:'activity',revision:1,activityId:'w1-start',status:'done'});
 const disabled=await t.send(11,'POST',{action:'disable',revision:2});assert.equal(disabled.body.enabled,false);assert.deepEqual(disabled.body.activities,{});
 const again=await t.send(11,'POST',{action:'enable',revision:3});assert.deepEqual(again.body.activities,{});
 assert.equal(t.records.get(11).activities_json,'{}');
});
test('database failures fail closed with no personal information in error',async()=>{
 const t=setup();t.env.DB.prepare=()=>{throw Error('sensitive DB error: john@example.com')};
 const a=await t.send(11);assert.equal(a.status,503);assert(!JSON.stringify(a.body).includes('john@example.com'));
});
test('schema is user-scoped with deletion cascade and no public feed table',()=>{
 assert.match(timberShedPrivateSchema,/user_id INTEGER PRIMARY KEY/);
 assert.match(timberShedPrivateSchema,/ON DELETE CASCADE/);
 assert.doesNotMatch(timberShedPrivateSchema,/public|post|comment|share|profile/i);
});

// Private account export must contain only the requesting member's data.
test('export is scoped to the authenticated account, and preserves the original export',async()=>{
 const {appendTimberShedPrivateExport}=await import('../member-experience/timber-shed-private.mjs');
 const t=setup();
 await t.send(11,'POST',{action:'enable',revision:0});
 await t.send(11,'POST',{action:'activity',revision:1,activityId:'w1-start',status:'done'});
 const auth=async request=>({userId:Number(request.headers.get('x-fixture-member'))});
 const req=id=>new Request('https://example.test/v1/privacy/export',{method:'POST',headers:{'x-fixture-member':String(id)}});
 const original=()=>Response.json({existing:{safe:true}});
 const own=await appendTimberShedPrivateExport(req(11),t.env,original(),auth);
 const other=await appendTimberShedPrivateExport(req(12),t.env,original(),auth);
 const mine=await own.json(),theirs=await other.json();
 assert.equal(mine.timberShedPrivateProgress.activities['w1-start'].status,'done');
 assert.deepEqual(theirs.timberShedPrivateProgress.activities,{});
 assert.deepEqual(mine.existing,{safe:true});
 assert.equal(own.headers.get('Cache-Control'),'private, no-store, max-age=0');
});
