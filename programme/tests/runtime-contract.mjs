// Local workerd + Miniflare D1 contract proof. Not a deployed Cloudflare/D1 test.
import {Miniflare} from 'miniflare';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {fixture} from '../test-support/fixtures.mjs';
import {SCHEMA} from '../store.mjs';
const source=`import {programmeRoutes} from './programme/routes.mjs';import {authenticateMember} from './member-state-fast-v1.js';export default {fetch(request,env){return programmeRoutes(request,env,{authenticate:authenticateMember,html:'PRIVATE-WORKSPACE',fixtureMode:true})}};`;
const bundled=await build({stdin:{contents:source,resolveDir:process.cwd(),sourcefile:'programme-contract-worker.mjs'},bundle:true,write:false,format:'esm',platform:'browser',target:'es2022'});
const mf=new Miniflare({modules:true,script:bundled.outputFiles[0].text,compatibilityDate:'2026-08-09',d1Databases:{DB:'fictional-auth',PROGRAMME_DB:'fictional-programme'},bindings:{PROGRAMME_V1_ENABLED:'true'}});
const results=[];
const record=(name,details)=>results.push({name,result:'PASS',details});
try{
 const auth=await mf.getD1Database('DB'),db=await mf.getD1Database('PROGRAMME_DB');
 await auth.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,first_name TEXT); CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);');
 await db.exec(SCHEMA);
 for(const [id,name] of [[1,'Dave'],[2,'Gaz']]){
  await auth.prepare('INSERT INTO users VALUES(?,?)').bind(id,name).run();
  for(const session of ['a','b'])await auth.prepare('INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(?,?,?)').bind(id,createHash('sha256').update(`fictional-${id}-${session}`).digest('hex'),'2099-01-01').run();
  await db.prepare('INSERT INTO programme_v1_accounts VALUES(?,0,?,?)').bind(id,JSON.stringify(fixture(name)),'2026-09-13').run();
 }
 const request=(id,session,body,path='/v1/programme')=>mf.dispatchFetch('https://programme-contract.invalid'+path,{method:body?'POST':'GET',redirect:'manual',headers:{Cookie:`sst_session=fictional-${id}-${session}`,Origin:'https://programme-contract.invalid','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const get=async id=>{const r=await request(id,'a');assert.equal(r.status,200);return r.json()};
 let state=await get(1);
 const parallel=await Promise.all(Array.from({length:12},(_,i)=>request(1,i%2?'a':'b',{type:'manual-item',start:'2026-09-14',name:`Concurrent item ${i}`,revision:state.revision,operationId:`runtime-compete-${i}`})));
 assert.equal(parallel.filter(r=>r.status===200).length,1);assert.equal(parallel.filter(r=>r.status===409).length,11);
 state=await get(1);assert.equal(state.revision,1);assert.equal(state.manualItems.length,2);assert.deepEqual(state.slots,fixture().slots);
 record('Twelve concurrent writes across two authenticated sessions',{statuses:parallel.map(r=>r.status),revision:state.revision,committedAdditions:1,planUnchanged:true});
 const duplicate={type:'review',revision:1,operationId:'runtime-duplicate-review'};
 const responses=await Promise.all([request(1,'a',duplicate),request(1,'b',duplicate)]);assert(responses.some(r=>r.status===200));assert(responses.every(r=>[200,409].includes(r.status)));
 assert.equal((await request(1,'b',duplicate)).status,200);state=await get(1);assert.equal(state.revision,2);assert.equal(state.reviews.length,1);
 record('Concurrent duplicate then retry',{firstStatuses:responses.map(r=>r.status),retry:200,revision:2,reviewCount:1});
 assert.equal((await request(1,'a',{...duplicate,type:'skip',revision:2})).status,409);record('Reused operation ID with different payload',{status:409});
 const proposalId=state.review.proposals[0].id;
 assert.equal((await request(1,'a',{type:'manual-item',start:'2026-09-14',name:'Later edit',revision:2,operationId:'runtime-later-edit'})).status,200);
 assert.equal((await request(1,'b',{type:'accept',proposalId,recipeId:'tuna',revision:2,operationId:'runtime-stale-accept'})).status,409);
 assert.deepEqual((await get(1)).slots,fixture().slots);record('Stale acceptance after another session writes',{status:409,planUnchanged:true});
 const foreign=await request(1,'a',undefined,'/v1/programme?userId=2');assert.equal((await foreign.json()).name,'Dave');assert.equal((await get(2)).revision,0);record('Account isolation',{foreignIdIgnored:true,otherAccountRevision:0});
 await auth.prepare('UPDATE user_sessions SET expires_at=? WHERE user_id=1').bind('2000-01-01').run();
 assert.equal((await request(1,'a')).status,401);assert.equal((await request(1,'b',{type:'review',revision:3,operationId:'runtime-expired-review'})).status,401);
 const page=await request(1,'a',undefined,'/member/programme');assert.equal(page.status,303);assert.doesNotMatch(await page.text(),/PRIVATE-WORKSPACE/);record('Real session expiry in workerd',{read:401,write:401,privatePage:303});
}finally{
 await mf.dispose();
 writeFileSync(new URL('../evidence/workerd-d1-contract.json',import.meta.url),JSON.stringify({scope:'Local workerd using Miniflare D1 emulation, not remote Cloudflare D1. Full Worker integration and remote concurrency remain distinct gates.',compatibilityDate:'2026-08-09',workerdVersion:'1.20260911.1',results},null,2)+'\n');
}
console.log(JSON.stringify({passed:results.length,results},null,2));
