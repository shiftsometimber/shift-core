// One front-worker release, inheriting current bindings/assets/schedules.
// The actual clinical/financial acceptance gates must pass before traffic moves.
import fs from 'node:fs';import zlib from 'node:zlib';import crypto from 'node:crypto';import assert from 'node:assert/strict';
import {cloudflareRequest as cf} from '/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/journey-shop-release-20261031/performance-precompiled-cloudflare-client-20261103.mjs';
const A='9e5386dcf455be34c582d93f8bfc79e6',front='shift-programme-member-20261023',original='42f085ae-553c-4b11-82f6-116203fb3c5e';
const dir='member-experience/welcome-release-evidence',file=dir+'/release.json',command=process.argv[2]||'inspect';fs.mkdirSync(dir,{recursive:true});
const state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{createdAt:new Date().toISOString(),original,rollback:'node member-experience/tools/welcome-release.mjs rollback',scope:'Front only; Core, Shop, till, clinical service, supplier gates and database unchanged'};
const save=()=>fs.writeFileSync(file,JSON.stringify(state,null,2)+'\n'),ep='/accounts/'+A+'/workers/scripts/'+front;
const active=async()=>{const ds=(await cf(ep+'/deployments')).deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on));return ds[0].versions.filter(v=>v.percentage>0);};
const hashes=s=>Object.fromEntries(s.modules.map(m=>[m.name,crypto.createHash('sha256').update(Buffer.from(m.content_base64,'base64')).digest('hex')]));
const project=b=>{const p={...b};if(p.type==='secret_text')delete p.text;delete p.version_id;if(p.environment==='production')delete p.environment;return p;};
async function guard(){const v=await active();assert.equal(v.length,1);assert.equal(v[0].percentage,100);assert([original,state.candidate].includes(v[0].version_id),'Another front release is serving; preserve it');}
async function traffic(id){await cf(ep+'/deployments','POST',{strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':id===original?'Restore exact pre-Welcome member front':'Matt approved Welcome and member release'}});assert.deepEqual(await active(),[{version_id:id,percentage:100}]);}
try{
 await guard();
 if(command==='prepare'){
  assert.deepEqual(await active(),[{version_id:original,percentage:100}]);
  const packet=JSON.parse(zlib.gunzipSync(fs.readFileSync('/private/tmp/my-timber-v7-test-package/programme.json.gz')));packet.modules=packet.modules.filter(m=>m.name==='v7-release-20261103/programme.mjs');packet.main_module='v7-release-20261103/programme.mjs';assert.equal(packet.modules.length,1);
  const old=await cf('/accounts/'+A+'/workers/workers/'+front+'/versions/'+original+'?include=modules'),settings=await cf(ep+'/settings');state.originalHashes=hashes(old);state.expectedHashes=hashes(packet);state.schedules=(await cf(ep+'/schedules')).schedules;
  const operating={};for(const k of ['usage_model','limits','placement','cache_options','observability','tail_consumers','logpush'])if((old[k]??settings[k])!==undefined)operating[k]=old[k]??settings[k];
  const metadata={main_module:packet.main_module,compatibility_date:old.compatibility_date,compatibility_flags:old.compatibility_flags||[],bindings:old.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,...operating,annotations:{'workers/message':'INACTIVE Welcome candidate; all acceptance gates required'}};
  const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');for(const m of packet.modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type}),m.name);
  state.candidate=(await cf(ep+'/versions?bindings_inheritance=strict','POST',form)).id;save();
  const uploaded=await cf('/accounts/'+A+'/workers/workers/'+front+'/versions/'+state.candidate+'?include=modules');assert.deepEqual(hashes(uploaded),state.expectedHashes);assert.deepEqual(uploaded.bindings.map(project).sort((a,b)=>a.name.localeCompare(b.name)),old.bindings.map(project).sort((a,b)=>a.name.localeCompare(b.name)));if(old.assets)assert.deepEqual(uploaded.assets?.config,old.assets.config);
  state.preparedAt=new Date().toISOString();state.memberTrafficChanged=false;save();console.log('INACTIVE_CANDIDATE_VERIFIED',state.candidate);
 }else if(command==='live'){
  assert(state.preparedAt);const acceptance=JSON.parse(fs.readFileSync(dir+'/acceptance.json'));assert(acceptance.allRequiredPass===true,'Release blocked by the recorded acceptance failures');
  assert(acceptance.clinicalEndToEnd&&acceptance.automaticRefund&&acceptance.speedPass&&acceptance.shopUnchanged,'Clinical, refund, speed or Shop proof incomplete');state.memberTrafficChanged=true;state.deploymentAttemptAt=new Date().toISOString();save();await traffic(state.candidate);assert.deepEqual((await cf(ep+'/schedules')).schedules,state.schedules);state.liveAt=new Date().toISOString();state.memberTrafficChanged=true;save();console.log('LIVE',state.candidate,state.liveAt);
 }else if(command==='rollback'){await traffic(original);state.rolledBackAt=new Date().toISOString();state.memberTrafficChanged=false;save();console.log('EXACT_PRE_RELEASE_FRONT_RESTORED');}
 else if(command==='inspect')console.log(JSON.stringify({active:await active(),...state}));else throw Error('Unknown release command');
}catch(e){state.failure={command,at:new Date().toISOString(),message:e.message};save();console.error('WELCOME_RELEASE_STOPPED',e.message);if(command==='live'&&state.memberTrafficChanged){try{await guard();await traffic(original);state.rolledBackAt=new Date().toISOString();state.memberTrafficChanged=false;save();}catch(r){console.error('ROLLBACK_FAILED',r.message)}}process.exitCode=1;}
