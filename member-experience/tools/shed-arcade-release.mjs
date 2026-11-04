// Bounded additive Arcade release on current V7. No schema, cohorts, new private
// services, catalogue preparation, email, or member data mutations.
import fs from 'node:fs';import zlib from 'node:zlib';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {cloudflareRequest as cf} from '/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/journey-shop-release-20261031/performance-precompiled-cloudflare-client-20261103.mjs';
const A='9e5386dcf455be34c582d93f8bfc79e6',Z='66ec3268950adcfc837b7b8b2f8356ed',FRONT='shift-programme-member-20261023',CORE='shift-core';
const anchors={[FRONT]:'f9780c08-fe6d-4f62-8eb8-cab368f57981',[CORE]:'199339a4-4c48-43bd-892d-e60d33c6c862','shift-hq-member-comms-20261023':'67958f58-8712-49ec-bcf0-2e513c1fd5d2','shift-mytimber-support-20261023':'1ff41acd-546e-431a-ab7f-fbc1f6f65b68'};
const directory='member-experience/arcade-evidence',file=directory+'/release.json',command=process.argv[2]||'inspect';fs.mkdirSync(directory,{recursive:true});
const state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{createdAt:new Date().toISOString(),owners:[],routeChanges:[],rollback:'node member-experience/tools/shed-arcade-release.mjs rollback'};
const save=()=>fs.writeFileSync(file,JSON.stringify(state,null,2)+'\n'),ep=n=>'/accounts/'+A+'/workers/scripts/'+n;
const active=async n=>{const d=[...(await cf(ep(n)+'/deployments')).deployments].sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];return {...d,versions:d.versions.filter(v=>v.percentage>0)};};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),hashes=s=>Object.fromEntries(s.modules.map(m=>[m.name,hash(Buffer.from(m.content_base64,'base64'))]).sort(([a],[b])=>a.localeCompare(b)));
const projection=b=>{const x={...b};if(x.type==='secret_text')delete x.text;delete x.version_id;if(x.environment==='production')delete x.environment;return x;};
async function guard(){for(const [n,id]of Object.entries(anchors)){const d=await active(n);assert.equal(d.versions.length,1);assert.equal(d.versions[0].percentage,100);const o=state.owners.find(o=>o.name===n);assert([id,o?.candidate].includes(d.versions[0].version_id),'Concurrent release changed '+n);}}
async function upload(name,source){
 await guard();let o=state.owners.find(o=>o.name===name);const expected=hashes(source);
 if(o?.verifiedAt&&JSON.stringify(o.hashes)===JSON.stringify(expected)){console.log('CANDIDATE_RETAINED',name,o.candidate);return;}
 assert.equal((await active(name)).versions[0].version_id,anchors[name],'Cannot replace active Arcade candidate');
 const original=await cf('/accounts/'+A+'/workers/workers/'+name+'/versions/'+anchors[name]+'?include=modules'),settings=await cf(ep(name)+'/settings');
 if(!o){o={name,original:anchors[name],originalHashes:hashes(original),originalSchedules:(await cf(ep(name)+'/schedules')).schedules};state.owners.push(o);}
 const operating={};for(const k of ['usage_model','limits','placement','cache_options','observability','tail_consumers','logpush'])if((original[k]??settings[k])!==undefined)operating[k]=original[k]??settings[k];
 const metadata={main_module:source.main_module,compatibility_date:original.compatibility_date,compatibility_flags:original.compatibility_flags||[],bindings:original.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,...operating,annotations:{'workers/message':'Matt-approved Shed Arcade inside existing My Timber V7'}};
 const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');for(const m of source.modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type}),m.name);
 o.intentAt=new Date().toISOString();o.hashes=expected;save();const uploaded=await cf(ep(name)+'/versions?bindings_inheritance=strict','POST',form);o.candidate=uploaded.id;save();
 const v=await cf('/accounts/'+A+'/workers/workers/'+name+'/versions/'+o.candidate+'?include=modules');assert.equal(v.main_module,source.main_module);assert.deepEqual(hashes(v),expected);assert.deepEqual(v.bindings.map(projection).sort((a,b)=>a.name.localeCompare(b.name)),original.bindings.map(projection).sort((a,b)=>a.name.localeCompare(b.name)),'Existing bindings changed');if(original.assets)assert.deepEqual(v.assets?.config,original.assets.config);assert(!v.bindings.some(b=>(b.id||b.database_id)==='247b065f-fea4-4891-945b-b707f2417656'||/my-timber-v7-(test|backend|legacy)$/.test(b.service||'')),'Test dependency in release');o.verifiedAt=new Date().toISOString();save();console.log('CANDIDATE_VERIFIED',name,o.candidate);
}
async function traffic(name,id){await cf(ep(name)+'/deployments','POST',{strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':id===anchors[name]?'Restore V7 before Arcade':'Authorised Shed Arcade release'}});assert.deepEqual((await active(name)).versions,[{version_id:id,percentage:100}]);}
async function rollback(){await guard();for(const name of [FRONT,CORE])if((await active(name)).versions[0].version_id!==anchors[name])await traffic(name,anchors[name]);for(const r of state.routeChanges){if(r.before)await cf('/zones/'+Z+'/workers/routes/'+r.id,'PUT',r.before);else if(r.id)await cf('/zones/'+Z+'/workers/routes/'+r.id,'DELETE');}state.rolledBackAt=new Date().toISOString();save();console.log('V7_RESTORED',state.rolledBackAt);}
try{
 await guard();
 if(command==='prepare'){
  const packet=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync('/private/tmp/my-timber-v7-test-package/'+n+'.json.gz'))),front=packet('programme'),core=packet('core');front.modules=front.modules.filter(m=>m.name==='v7-release-20261103/programme.mjs');front.main_module='v7-release-20261103/programme.mjs';core.modules=core.modules.filter(m=>!['v7-release-20261103/assets-entrypoint.mjs','v7-release-20261103/assets.mjs'].includes(m.name));assert.equal(front.modules.length,1);for(const p of [front,core])assert(p.modules.every(m=>!/(?:test-entry|test-start|assets-entrypoint)/.test(m.name)));
  await upload(CORE,core);await upload(FRONT,front);state.preparedAt=new Date().toISOString();save();console.log('PREPARED_NO_TRAFFIC_CHANGE');
 }else if(command==='live'){
  assert(state.preparedAt);
  for(const engine of ['chromium','webkit']){const evidence=JSON.parse(fs.readFileSync(directory+'/'+engine+'-proof/results.json'));assert.equal(evidence.checks.length,23);assert(evidence.checks.every(c=>c.result==='PASS')&&!evidence.errors.length,'Browser proof incomplete: '+engine);}
  const speed=JSON.parse(fs.readFileSync(directory+'/game-speed/results.json'));assert.equal(speed.rows.length,7);assert(!speed.errors.length&&speed.rows.every(r=>r.n>=20&&r.p95<2000),'Game speed target not met');
  for(const name of [CORE,FRONT]){const o=state.owners.find(o=>o.name===name);assert(o.verifiedAt);await traffic(name,o.candidate);o.promotedAt=new Date().toISOString();save();}
  const routes=await cf('/zones/'+Z+'/workers/routes');for(const host of ['shiftsometimber.co.uk','www.shiftsometimber.co.uk']){const pattern=host+'/member/shed-arcade*',before=routes.find(r=>r.pattern===pattern);if(before?.script===FRONT)continue;const row={pattern,before:before?{pattern:before.pattern,script:before.script}:null};state.routeChanges.push(row);save();const r=await cf('/zones/'+Z+'/workers/routes'+(before?'/'+before.id:''),before?'PUT':'POST',{pattern,script:FRONT});row.id=r.id||before?.id;save();}
  for(const o of state.owners)assert.deepEqual((await cf(ep(o.name)+'/schedules')).schedules,o.originalSchedules,'Schedule changed');await guard();state.liveAt=new Date().toISOString();save();console.log('LIVE_AT',state.liveAt);
 }else if(command==='rollback')await rollback();
 else if(command==='inspect')console.log(JSON.stringify(state));else throw Error('Unknown command');
 if(state.failure){(state.recoveredFailures||=[]).push(state.failure);delete state.failure;save();}
}catch(e){state.failure={command,at:new Date().toISOString(),message:e.message};save();console.error('ARCADE_RELEASE_FAILED',e.message);if(command==='live'){try{await rollback();}catch(r){console.error('ROLLBACK_FAILED',r.message)}}process.exitCode=1;}
