// Execute this after a local Wrangler dry run. No Cloudflare account connection.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
(async()=>{
 const {Miniflare,convertV4MiniflareOptions}=require(process.env.COACHING_TEST_MINIFLARE_PACKAGE||'miniflare');
 const bundle=process.env.COACHING_TEST_WORKER_BUNDLE;if(!bundle)throw Error('COACHING_TEST_WORKER_BUNDLE_required');
 const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:fs.readFileSync(bundle,'utf8'),compatibilityDate:'2026-10-01',compatibilityFlags:['nodejs_compat'],bindings:{COACHING_TEST_MODE:'synthetic',COACHING_TEST_LOCAL:'true',COACHING_TEST_SESSION_SECRET:crypto.randomBytes(32).toString('hex')},d1Databases:{COACHING_TEST_DB:'coaching-synthetic-only'},outboundService:()=>new Response('External requests disabled',{status:503})}));
 const out=process.env.COACHING_TEST_EVIDENCE_DIR||'/tmp/shift-coaching-test';fs.mkdirSync(out,{recursive:true});
 try{
  const DB=await mf.getD1Database('COACHING_TEST_DB');
  for(const sql of fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8').split(/;\s*(?=CREATE|INSERT)/i))if(sql.trim())await DB.prepare(sql).run();
  const call=async(p,b,c)=>mf.dispatchFetch('http://localhost/v1/coaching-test'+p,{method:b===undefined?'GET':'POST',headers:{...(b===undefined?{}:{'Content-Type':'application/json',Origin:'http://localhost'}),...(c?{Cookie:c}:{})},...(b===undefined?{}:{body:JSON.stringify(b)})});
  const login=await call('/test/session',{account:'one',admin:true});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
  let response=await call('/setup',{goal:'Join in with family',week:'Three late shifts',focus:'food',stage:'Just starting'},cookie);assert.equal(response.status,200);
  let today=await(await call('/today',undefined,cookie)).json();assert(today.data.action.reason.includes('Three late shifts'));const id=today.data.action.id;
  assert.equal((await call('/accept',{actionId:id},cookie)).status,200);assert.equal((await call('/outcomes',{actionId:id,value:'didnt-help'},cookie)).status,200);
  today=await(await call('/today',undefined,cookie)).json();assert.notEqual(today.data.action.type,'food-plan');
  const one=await call('/test/cost',{microUsd:50000},cookie);assert((await one.json()).data.allowed);assert.equal((await(await call('/test/cost',{microUsd:1},cookie)).json()).data.allowed,false);
  assert.equal((await call('/test/night-job',{},cookie)).status,200);assert.equal((await call('/test/night-job',{},cookie)).status,200);
  const log=await(await call('/audit',undefined,cookie)).json();assert(log.data.every(r=>r.reason&&r.channel));
  await call('/permissions',{source:'scale',enabled:true},cookie);const readingStart=performance.now();await call('/test/reading',{source:'scale',kind:'weight',value:100,eventId:'test-runtime-scale',at:Date.now()},cookie);const records=await(await call('/readings',undefined,cookie)).json();assert.equal(records.data.scale.length,1);const readingVisibleMs=performance.now()-readingStart;
  await call('/permissions',{source:'dose',enabled:true},cookie);assert.equal((await call('/doses',{},cookie)).status,200);const secondLogin=await call('/test/session',{account:'one'});const secondCookie=secondLogin.headers.get('set-cookie').split(';')[0];assert.equal((await(await call('/readings',undefined,secondCookie)).json()).data.dose.length,1);
  const offStart=performance.now();await call('/test/global-off',{enabled:false},cookie);const dispatch=await(await call('/test/push',{},cookie)).json();assert.equal(dispatch.data.sent,0);const globalOffMs=performance.now()-offStart;assert((await(await call('/today',undefined,cookie)).json()).data.action);
  const raw={memory:(await DB.prepare('SELECT * FROM coaching_test_memory').all()).results,audit:(await DB.prepare('SELECT * FROM coaching_test_audit_events').all()).results,costs:(await DB.prepare('SELECT * FROM coaching_test_call_costs').all()).results};
  fs.writeFileSync(path.join(out,'workerd-stored-proof.json'),JSON.stringify(raw,null,2));
  const result={at:new Date().toISOString(),status:'PASS',environment:'Miniflare workerd + local D1 binding',checks:['signed test login','prepared Today','persistent acceptance/outcome/adaptation','D1 cost trigger','night rerun','audit reason and channel','synthetic reading visibility','dose persistence in second signed session','global off keeps Today'],timings:{readingVisibleMs,globalOffMs},measure:'performance.now across API write and subsequent visible-record read; local runtime only',remoteResources:false,modelCalls:0,externalNotifications:0};fs.writeFileSync(path.join(out,'workerd-proof.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
 }finally{await mf.dispose();}
})().catch(e=>{console.error(e);process.exitCode=1;});
