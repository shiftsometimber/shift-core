// One guarded release: member questionnaire and prospective public assessment-fee terms.
// Existing Core modules, settings, secret bindings, payment/provider/stock gates preserved.
import fs from 'node:fs';import crypto from 'node:crypto';import zlib from 'node:zlib';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import esbuild from 'esbuild';
import {cloudflareRequest as cf} from '/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/journey-shop-release-20261031/performance-precompiled-cloudflare-client-20261103.mjs';
const A='9e5386dcf455be34c582d93f8bfc79e6',front='shift-programme-member-20261023',core='shift-core',dir='member-experience/welcome-release-evidence/assessment-notes',file=dir+'/release.json',command=process.argv[2]||'inspect',bases={[front]:'858d9de6-3a04-4358-8bb1-85a20a50080b',[core]:'a301697d-5586-4839-aa44-5edb01105731'};fs.mkdirSync(dir,{recursive:true});
let state=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{bases,scope:'BMI guidance, previous medicine/dose catalogue selectors, ten written steps without pre-payment image pickers, prospective 10% completed-assessment fee terms. No checkout/provider activation or actual financial operations.'};const save=()=>fs.writeFileSync(file,JSON.stringify(state,null,2)),ep=n=>'/accounts/'+A+'/workers/scripts/'+n,active=async n=>(await cf(ep(n)+'/deployments')).deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0].versions.filter(v=>v.percentage>0),hash=m=>crypto.createHash('sha256').update(Buffer.from(m.content_base64,'base64')).digest('hex'),hashes=p=>Object.fromEntries(p.modules.map(m=>[m.name,hash(m)]));
const project=b=>{const x={...b};if(x.type==='secret_text')delete x.text;delete x.version_id;if(x.environment==='production')delete x.environment;return x;};
async function traffic(name,id){await cf(ep(name)+'/deployments','POST',{strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':id===bases[name]?'Rollback exact pre-assessment-notes version':'Matt: BMI, linked history choices and assessment fee disclosure'}});assert.deepEqual(await active(name),[{version_id:id,percentage:100}]);}
async function rollback(){for(const name of[front,core]){const now=await active(name);assert(now.every(v=>[bases[name],state.workers?.[name]?.candidate].includes(v.version_id)),'Another release is live; do not overwrite');if(now.some(v=>v.version_id!==bases[name]))await traffic(name,bases[name]);}state.rolledBackAt=new Date().toISOString();state.live=false;save();}
if(command==='prepare'){
 const proof=JSON.parse(fs.readFileSync(dir+'/test/results.json'));assert.equal(proof.engines.length,2);assert(proof.engines.every(e=>!e.errors.length&&e.checks.length>=20&&e.checks.every(c=>c.pass)));assert(/(?:#|ℹ)\s+fail 0/.test(fs.readFileSync(dir+'/unit.txt','utf8')));
 for(const name of[front,core])assert.deepEqual(await active(name),[{version_id:bases[name],percentage:100}]);
 state.at=new Date().toISOString();state.source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();state.workers={};state.live=false;save();
 for(const name of[core,front]){
  const old=await cf('/accounts/'+A+'/workers/workers/'+name+'/versions/'+bases[name]+'?include=modules'),settings=await cf(ep(name)+'/settings');
  fs.writeFileSync('/private/tmp/assessment-notes-baseline-'+name+'.json.gz',zlib.gzipSync(JSON.stringify(old)),{mode:0o600});
  let packet;
  if(name===front){packet=JSON.parse(zlib.gunzipSync(fs.readFileSync('/private/tmp/my-timber-v7-test-package/programme.json.gz')));packet.modules=packet.modules.filter(m=>m.name==='v7-release-20261103/programme.mjs');packet.main_module='v7-release-20261103/programme.mjs';assert.equal(packet.modules.length,1);}
  else{
   const built=await esbuild.build({entryPoints:['member-experience/assessment-policy-core-entry.mjs'],bundle:true,write:false,format:'esm',platform:'node',target:'es2022',minify:true,external:['__MY_TIMBER_CURRENT_CORE__']});
   const source=built.outputFiles[0].text.replaceAll('__MY_TIMBER_CURRENT_CORE__','../'+old.main_module),name='assessment-notes-20261104/core.mjs';
   packet={...old,main_module:name,modules:[...old.modules,{name,content_type:'application/javascript+module',content_base64:Buffer.from(source).toString('base64')}]};
   for(const m of old.modules)assert.equal(hash(packet.modules.find(x=>x.name===m.name)),hash(m));
  }
  const operating={};for(const key of['usage_model','limits','placement','cache_options','observability','tail_consumers','logpush'])if((old[key]??settings[key])!==undefined)operating[key]=old[key]??settings[key];
  const metadata={main_module:packet.main_module,compatibility_date:old.compatibility_date,compatibility_flags:old.compatibility_flags||[],bindings:old.bindings.map(b=>({type:'inherit',name:b.name})),keep_assets:true,...operating,annotations:{'workers/message':'INACTIVE tested assessment notes; no payment/provider activation'}};
  const form=new FormData();form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');for(const m of packet.modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type}),m.name);
  const candidate=(await cf(ep(name)+'/versions?bindings_inheritance=strict','POST',form)).id;state.workers[name]={base:bases[name],candidate,expectedHashes:hashes(packet),schedules:(await cf(ep(name)+'/schedules')).schedules,originalModulesPreserved:name===core};save();
  const uploaded=await cf('/accounts/'+A+'/workers/workers/'+name+'/versions/'+candidate+'?include=modules');assert.deepEqual(hashes(uploaded),hashes(packet));assert.deepEqual(uploaded.bindings.map(project).sort((a,b)=>a.name.localeCompare(b.name)),old.bindings.map(project).sort((a,b)=>a.name.localeCompare(b.name)));
  console.log(JSON.stringify({prepared:name,version:candidate,originalCoreModulesPreserved:name===core}));
 }
 state.preparedAt=new Date().toISOString();save();
}else if(command==='live'){
 assert(state.preparedAt);for(const name of[front,core])assert.deepEqual(await active(name),[{version_id:bases[name],percentage:100}]);
 try{
  state.attemptedAt=new Date().toISOString();save();for(const name of[core,front])await traffic(name,state.workers[name].candidate);state.live=true;state.liveAt=new Date().toISOString();save();
  for(const name of[core,front])assert.deepEqual((await cf(ep(name)+'/schedules')).schedules,state.workers[name].schedules);
  execFileSync(process.execPath,['member-experience/tools/assessment-notes-browser.mjs','--live'],{stdio:'inherit',timeout:240000});
  for(const path of['/terms-of-sale','/refunds']){const r=await fetch('https://shiftsometimber.co.uk'+path);assert.equal(r.status,200);assert.equal(r.headers.get('X-Shift-Assessment-Fee-Policy'),'treatment-assessment/2026-11-04');const html=await r.text();assert(html.includes('10%')&&html.includes('90%'));}state.verifiedAt=new Date().toISOString();save();console.log(JSON.stringify({LIVE:true,liveAt:state.liveAt,verifiedAt:state.verifiedAt,workers:Object.fromEntries(Object.entries(state.workers).map(([n,v])=>[n,v.candidate])),paymentEnabled:false,postPaymentProviderUploadsConnected:false}));
 }catch(e){state.failure={at:new Date().toISOString(),message:e.message};save();await rollback();throw e;}
}else if(command==='rollback'){await rollback();console.log('Both exact prior worker versions restored');}else{console.log(JSON.stringify({state,active:{[front]:await active(front),[core]:await active(core)}}));}
