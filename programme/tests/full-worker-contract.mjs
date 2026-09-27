// Read/write fictional aggregates through the actual bundled Worker entry.
// No remote requests, production bindings or compatibility changes.
import {dirname} from 'node:path';
import {Miniflare} from 'miniflare';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {SCHEMA} from '../store.mjs';
import {fixture} from '../test-support/fixtures.mjs';
const bundle=process.env.PROGRAMME_FULL_BUNDLE;
if(!bundle)throw new Error('Set PROGRAMME_FULL_BUNDLE to the exact wrangler dry-run output.');
const results=[],record=(name,details)=>results.push({name,result:'PASS',details});
const mf=new Miniflare({modules:[{type:'ESModule',path:bundle}],modulesRoot:dirname(bundle),compatibilityDate:'2026-08-09',d1Databases:{DB:'full-worker-fictional-auth',PROGRAMME_DB:'full-worker-fictional-programme'},bindings:{PROGRAMME_V1_ENABLED:'true'}});
let failure=null;
try{
 const auth=await mf.getD1Database('DB'),db=await mf.getD1Database('PROGRAMME_DB');
 await auth.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,first_name TEXT);CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,preferences TEXT);');await db.exec(SCHEMA);
 for(const [id,name]of [[1,'Dave'],[2,'Gaz']]){
  await auth.prepare('INSERT INTO users VALUES(?,?)').bind(id,name).run();
  await auth.prepare('INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(?,?,?)').bind(id,createHash('sha256').update('full-worker-fictional-'+id).digest('hex'),'2099-01-01').run();
  await auth.prepare('INSERT INTO member_state VALUES(?,?)').bind(id,JSON.stringify({myJourney:{setup:{why:name+' purpose'}}})).run();
  const s=fixture(name);s.entitlement={active:true,expiresAt:'2099-01-01T00:00:00Z'};
  await db.prepare('INSERT INTO programme_v1_accounts VALUES(?,0,?,?)').bind(id,JSON.stringify(s),'2026-09-13').run();
 }
 const request=(path,id=1,body)=>mf.dispatchFetch('https://full-worker.invalid'+path,{method:body?'POST':'GET',redirect:'manual',headers:{Cookie:id?'sst_session=full-worker-fictional-'+id:'',Origin:'https://full-worker.invalid','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 let response=await request('/v1/programme');assert.equal(response.status,200);let state=await response.json();assert.equal(state.name,'Dave');assert.equal(state.fixtureMode,false);assert.equal(state.catalogue.length,0);record('Real Worker entry refuses unapproved fixtures',{read:200,fixtureMode:false,selectableRecipes:0});
 response=await request('/member/programme');assert.equal(response.status,200);assert.match(await response.text(),/id="programme"/);record('Authenticated private page through actual Worker',{status:200});
 response=await request('/v1/programme/existing-tools?userId=2');assert.equal(response.status,200);assert.equal((await response.json()).journey.purpose,'Dave purpose');record('Journey adapter through actual Worker',{status:200,ownerScoped:true});
 const revision=state.revision;
 const writes=await Promise.all(Array.from({length:8},(_,i)=>request('/v1/programme',1,{type:'manual-item',start:'2026-09-14',name:'Fictional item '+i,revision,operationId:'full-worker-write-'+i})));
 assert.equal(writes.filter(x=>x.status===200).length,1);assert.equal(writes.filter(x=>x.status===409).length,7);record('Concurrent saves through full Worker',{statuses:writes.map(x=>x.status),commits:1});
 response=await request('/v1/programme/export?userId=2');assert.equal(response.status,200);assert.equal((await response.json()).record.name,'Dave');record('Export remains owner-scoped',{status:200});
 await auth.prepare('UPDATE user_sessions SET revoked_at=? WHERE user_id=1').bind('2026-09-13T12:00:00Z').run();
 assert.equal((await request('/v1/programme')).status,401);assert.equal((await request('/v1/programme/export')).status,401);assert.equal((await request('/member/programme')).status,303);assert.equal((await request('/v1/programme',2)).status,200);record('Revocation through actual authentication',{revokedRead:401,revokedExport:401,privatePage:303,otherAccount:200});
}catch(e){failure=String(e);process.exitCode=1;console.error(e)}finally{await mf.dispose();const evidence={scope:'Actual Wrangler-bundled root Worker on local workerd, separate emulated D1 stores; not remote commissioning.',bundleSha256:createHash('sha256').update(readFileSync(bundle)).digest('hex'),compatibilityDate:'2026-08-09',results,failure};writeFileSync(new URL('../evidence/takeover-full-worker.json',import.meta.url),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence,null,2))}
