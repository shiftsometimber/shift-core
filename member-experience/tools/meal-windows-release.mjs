// One additive member release, with exact version rollback. No Core/Shop change.
import fs from'node:fs';import crypto from'node:crypto';import zlib from'node:zlib';import assert from'node:assert/strict';import{execFileSync}from'node:child_process';
import{cloudflareRequest as cf}from'/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/journey-shop-release-20261031/performance-precompiled-cloudflare-client-20261103.mjs';
const A='9e5386dcf455be34c582d93f8bfc79e6',DB='88f40aed-cb23-4372-8c94-8a73f48bc847',front='shift-programme-member-20261023',prep='shift-my-timber-v7-preparer-live',operator='shift-my-timber-v7-release-operator',base={[front]:'17bb6c7a-8f46-45f5-9ce3-e81cd7946adf',[prep]:'fd40f888-6cec-48bc-b9e8-22bce33b182b'},dir='member-experience/meal-windows-evidence',file=dir+'/release.json',command=process.argv[2]||'inspect';
fs.mkdirSync(dir,{recursive:true});let state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{scope:'UK-clock prepared breakfast, lunch and tea shared by Today and Grub; retain chosen/completed action and one daily log',base,owners:[]};const save=()=>fs.writeFileSync(file,JSON.stringify(state,null,2));
const ep=n=>'/accounts/'+A+'/workers/scripts/'+n,version=(n,id)=>'/accounts/'+A+'/workers/workers/'+n+'/versions/'+id+'?include=modules',active=async n=>(await cf(ep(n)+'/deployments')).deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0].versions.filter(v=>v.percentage>0);
const hashes=p=>Object.fromEntries(p.modules.map(m=>[m.name,crypto.createHash('sha256').update(Buffer.from(m.content_base64,'base64')).digest('hex')]));
const projection=b=>{const x={...b};if(x.type==='secret_text')delete x.text;delete x.version_id;if(x.environment==='production')delete x.environment;return x};
const packet=n=>JSON.parse(zlib.gunzipSync(fs.readFileSync('/private/tmp/my-timber-v7-test-package/'+n+'.json.gz')));
async function traffic(name,id){await cf(ep(name)+'/deployments','POST',{strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':id===base[name]?'Rollback timed meal suggestions to exact previous version':'Matt: breakfast, lunch and tea in My Timber; one daily log'}});assert.deepEqual(await active(name),[{version_id:id,percentage:100}]);}
async function upload(name,p){
 assert.deepEqual(await active(name),[{version_id:base[name],percentage:100}]);
 const old=await cf(version(name,base[name])),settings=await cf(ep(name)+'/settings'),operating={};
 for(const k of['usage_model','limits','placement','cache_options','observability','tail_consumers','logpush'])if((old[k]??settings[k])!==undefined)operating[k]=old[k]??settings[k];
 const metadata={main_module:p.main_module,compatibility_date:old.compatibility_date,compatibility_flags:old.compatibility_flags||[],bindings:old.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,...operating,annotations:{'workers/message':'INACTIVE tested UK meal windows; no clinical or commerce changes'}};
 const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');for(const m of p.modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type}),m.name);
 const o={name,base:base[name],candidate:(await cf(ep(name)+'/versions?bindings_inheritance=strict','POST',form)).id,hashes:hashes(p),schedules:(await cf(ep(name)+'/schedules')).schedules};state.owners.push(o);save();
 const uploaded=await cf(version(name,o.candidate));assert.deepEqual(hashes(uploaded),o.hashes);assert.deepEqual(uploaded.bindings.map(projection).sort((a,b)=>a.name.localeCompare(b.name)),old.bindings.map(projection).sort((a,b)=>a.name.localeCompare(b.name)));o.verifiedAt=new Date().toISOString();save();
}
const query=async(sql,params=[])=>{const r=await cf('/accounts/'+A+'/d1/database/'+DB+'/query','POST',{sql,params});assert(r.every(x=>x.success));return r[0].results};
async function prepareMembers(){
 const key=fs.readFileSync('/private/tmp/my-timber-v7-production-operator-key','utf8'),original=await active(operator),subdomain=await cf(ep(operator)+'/subdomain');
 // Authenticated finite operator, disabled and restored after this release.
 // It delegates the path-specific revision-guarded write; no full preferences
 // replacement and no test data is ever written into a member account.
 const code=`export default{async fetch(r,env){if(r.method!=='POST'||r.headers.get('X-Release-Key')!==${JSON.stringify(key)})return new Response('Not found',{status:404});const b=await r.json();if(!Array.isArray(b.userIds)||b.userIds.length>8||b.userIds.some(id=>!Number.isSafeInteger(id)||id<=0))return new Response('Invalid batch',{status:400});const out=[];for(const userId of b.userIds)out.push(await env.MEALS.prepareMealWindows({userId,at:new Date().toISOString()}));return Response.json({prepared:out.filter(x=>x.prepared).length,skipped:out.filter(x=>x.skipped).length,conflicts:out.filter(x=>x.skipped==='concurrent_change_retry_later').length})}};`;
 const old=await cf(version(operator,original[0].version_id)),form=new FormData();form.set('metadata',JSON.stringify({main_module:'operator.mjs',compatibility_date:old.compatibility_date,compatibility_flags:old.compatibility_flags||[],bindings:[...old.bindings.map(b=>({type:'inherit',name:b.name})),{type:'service',name:'MEALS',service:prep,entrypoint:'V7Offers'}]}));form.set('operator.mjs',new Blob([code],{type:'application/javascript+module'}),'operator.mjs');
 try{
  const uploaded=await cf(ep(operator)+'/versions?bindings_inheritance=strict','POST',form);await traffic(operator,uploaded.id);await cf(ep(operator)+'/subdomain','POST',{enabled:true});
  const rows=await query("SELECT user_id FROM member_state WHERE json_type(preferences,'$.lifeBack.progress.v7')='object' AND (SELECT granted FROM consents WHERE user_id=member_state.user_id AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=1 AND COALESCE(json_extract(preferences,'$.myJourney.setup.paused'),0)<>1 ORDER BY user_id"),counts={eligible:rows.length,prepared:0,skipped:0,conflicts:0};
  for(let i=0;i<rows.length;i+=8){
   const r=await fetch('https://'+operator+'.matobrien.workers.dev/meal-windows',{method:'POST',headers:{'X-Release-Key':key,'Content-Type':'application/json'},body:JSON.stringify({userIds:rows.slice(i,i+8).map(r=>r.user_id)}),signal:AbortSignal.timeout(60000)});assert(r.ok,'Meal preparation failed HTTP '+r.status);const b=await r.json();for(const k of['prepared','skipped','conflicts'])counts[k]+=b[k];state.preparation=counts;save();console.log(JSON.stringify({mealPreparation:counts}));
  }
  assert.equal(counts.conflicts,0,'A member changed records throughout all four preparation attempts');state.preparedMembersAt=new Date().toISOString();save();
 }finally{
  await cf(ep(operator)+'/subdomain','POST',{enabled:false});
  await cf(ep(operator)+'/deployments','POST',{strategy:'percentage',versions:original,annotations:{'workers/message':'Restore finite release operator after meal preparation'}});
  if(subdomain.enabled)await cf(ep(operator)+'/subdomain','POST',{enabled:true});
 }
}
async function rollback(){for(const o of [...state.owners].reverse())if((await active(o.name)).some(v=>v.version_id===o.candidate))await traffic(o.name,o.base);state.rolledBackAt=new Date().toISOString();save();}
if(command==='prepare'){
 assert(!state.preparedAt,'Candidate already prepared');
 const tests=JSON.parse(fs.readFileSync(dir+'/test/results.json'));assert.equal(tests.engines.length,2);assert(tests.engines.every(e=>!e.errors.length&&e.checks.length>=20&&e.checks.every(c=>c.pass)));
 state.source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();state.coreBefore=await active('shift-core');save();
 const p=packet('programme');p.modules=p.modules.filter(m=>m.name==='v7-release-20261103/programme.mjs');p.main_module=p.modules[0].name;assert.equal(p.modules.length,1);assert(!Buffer.from(p.modules[0].content_base64,'base64').toString().includes('mt_upgrade_fixture'));
 await upload(prep,packet('preparer'));await upload(front,p);state.preparedAt=new Date().toISOString();save();console.log(JSON.stringify({prepared:true,owners:state.owners.map(({name,candidate})=>({name,candidate}))}));
}else if(command==='live'){
 assert(state.preparedAt);try{
  for(const o of state.owners){assert.deepEqual(await active(o.name),[{version_id:o.base,percentage:100}]);await traffic(o.name,o.candidate);assert.deepEqual((await cf(ep(o.name)+'/schedules')).schedules,o.schedules);}
  state.liveAt=new Date().toISOString();save();await prepareMembers();
  execFileSync(process.execPath,['member-experience/tools/meal-windows-proof.mjs','--live'],{stdio:'inherit',timeout:180000});
  state.coreAfter=await active('shift-core');state.verifiedAt=new Date().toISOString();save();console.log(JSON.stringify({LIVE:true,liveAt:state.liveAt,verifiedAt:state.verifiedAt,preparation:state.preparation,versions:state.owners.map(({name,candidate})=>({name,candidate}))}));
 }catch(e){state.failure={at:new Date().toISOString(),message:e.message};save();await rollback();throw e;}
}else if(command==='rollback')await rollback();else console.log(JSON.stringify({active:await active(front),...state}));
