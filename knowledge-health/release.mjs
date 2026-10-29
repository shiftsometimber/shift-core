// Version-only deployment of the owner-approved Knowledge payload.
// Every existing provider module is retained byte-for-byte, except two bounded
// Ask insertion points in the captured, current adapters. No routes/data writes.
import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {guides,existing,version} from './content.mjs';
import {ASSET} from './render.mjs';
import {hash,routeOwner,patchAskModule,entryModule,metadataFor} from './release-helpers.mjs';
import {get,main,cards,verifyLive} from './verify-live.mjs';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
const dir='knowledge-health-evidence';mkdirSync(dir,{recursive:true});
const save=(name,value)=>writeFileSync(dir+'/'+name+'.json',JSON.stringify(value,null,2));
const expectedOwners=['shift-core','shift-blog-publisher','shift-public-presentation-batch-20261022','shift-ask-guided-presentation-20261021','shift-seo-followup-v3-20261024','shift-health-nutrition-20261027','shift-health-heroes-20261029'];
const payloadFiles=['content.mjs','expansion-content.mjs','evidence.mjs','production.mjs','render.mjs','client.mjs'];
const payload=payloadFiles.map(file=>({name:'knowledge-health/'+file,content_type:'application/javascript+module',content_base64:readFileSync('knowledge-health/'+file).toString('base64')}));
assert(process.env.CLOUDFLARE_API_TOKEN,'Release credential missing');
assert.equal(process.env.GITHUB_REF,'refs/heads/work/knowledge-health-expansion-20261029');
async function cf(path,method='GET',body){
 const form=body instanceof FormData;
 const response=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,...(body&&!form?{'Content-Type':'application/json'}:{})},body:form?body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});
 const data=await response.json();assert(response.ok&&data.success,'Provider '+method+' '+path+' failed '+JSON.stringify(data.errors?.map(e=>({code:e.code,message:e.message}))));return data.result;
}
const routeList=()=>cf('/zones/'+zone+'/workers/routes');
const active=async name=>{
 const result=await cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments');
 const deployment=result.deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];
 assert.equal(deployment.versions.length,1,name+' has split traffic');assert.equal(deployment.versions[0].percentage,100);return deployment;
};
const promote=(name,id,message)=>cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments','POST',{strategy:'percentage',versions:[{version_id:id,percentage:100}],annotations:{'workers/message':message}});
const summaries=modules=>modules.map(m=>({name:m.name,sha256:hash(Buffer.from(m.content_base64,'base64'))}));
const captured=[],promoted=[];
let beforeRoutes;
try{
 beforeRoutes=await routeList();
 const paths=[...new Set(['/knowledge','/explore-knowledge','/faq','/ask-timber','/sitemap.xml',ASSET,'/shift-health','/shift-health/fertility','/shift-health/testing','/shift-health/blood-tests','/shift-health/sleep-apnoea','/shift-health/supplements-nutrition','/shift-health/erectile-dysfunction','/v1/ai/chat',...guides.map(g=>g.path),...guides.map(g=>g.service),...existing.map(g=>g.path)])];
 const serving=paths.map(path=>({path,route:routeOwner(beforeRoutes,'https://shiftsometimber.co.uk'+path)}));
 assert(serving.every(s=>s.route?.script),'An affected path no longer has a serving owner');
 const names=[...new Set([...serving.map(s=>s.route.script),'shift-core'])];
 assert.deepEqual([...names].sort(),[...expectedOwners].sort(),'Serving owners changed since the read-only preflight');
 const baselines={};
 for(const path of ['/','/shift-health','/shift-health/testing','/shift-health/blood-tests','/shift-health/testosterone-energy','/shift-health/trt-explained','/shift-health/sleep-apnoea','/shift-health/supplements-nutrition','/shift-health/erectile-dysfunction']){
  const page=await get(path);assert.equal(page.status,200,'Existing page unavailable '+path);assert(main(page.body),'Existing main missing '+path);baselines[path]=page;
 }
 assert.equal(cards(baselines['/shift-health'].body).length,9,'Approved nine-card layer missing before staging');
 for(const name of names){
  const settings=await cf('/accounts/'+account+'/workers/scripts/'+name+'/settings');
  const deployment=await active(name),previousVersion=deployment.versions[0].version_id;
  const current=await cf('/accounts/'+account+'/workers/workers/'+name+'/versions/'+previousVersion+'?include=modules');
  const oldMain=current.main_module||current.metadata?.main_module||current.resources?.script?.main_module||settings.main_module;
  assert(oldMain&&current.modules.some(m=>m.name===oldMain),'Current entry not identified '+name);
  assert(!current.modules.some(m=>m.name.startsWith('knowledge-health/')||m.name==='knowledge-health-entry.mjs'),'Knowledge layer already present; inspect its receipt before another release');
  const changes=[];
  const retained=current.modules.map(m=>{
   if(!/\.(mjs|js)$/.test(m.name))return m;
   const before=Buffer.from(m.content_base64,'base64').toString('utf8'),patch=patchAskModule(before,m.name);
   if(!patch.patched)return m;
   changes.push({name:m.name,beforeSHA256:hash(before),afterSHA256:hash(patch.code),bodyBinding:patch.bodyBinding,responseBinding:patch.responseBinding});
   return {...m,content_base64:Buffer.from(patch.code).toString('base64')};
  });
  if(['shift-core','shift-ask-guided-presentation-20261021'].includes(name))assert.equal(changes.length,1,name+' must retain one patched Ask adapter');
  else assert.equal(changes.length,0,name+' should have no Ask changes');
  const modules=[...retained,...payload,{name:'knowledge-health-entry.mjs',content_type:'application/javascript+module',content_base64:Buffer.from(entryModule(oldMain)).toString('base64')}];
  assert.equal(new Set(modules.map(m=>m.name)).size,modules.length);
  const metadata=metadataFor(current,settings,'knowledge-health-entry.mjs',process.env.GITHUB_SHA);
  if(settings.bindings.some(b=>b.type==='secret_text')){
   const versions=await cf('/accounts/'+account+'/workers/scripts/'+name+'/versions');
   assert.equal(versions.items?.[0]?.id||versions[0]?.id,previousVersion,'Do not inherit secrets across an unowned staged version '+name);
  }
  const state={name,deployment,previousVersion,oldMain,modules,metadata,changes,originalHashes:summaries(current.modules)};
  captured.push(state);
 }
 save('before',{source:process.env.GITHUB_SHA,version,routes:beforeRoutes,serving,workers:captured.map(s=>({name:s.name,deployment:s.deployment,mainModule:s.oldMain,moduleHashes:s.originalHashes,changes:s.changes})),baselineHashes:Object.entries(baselines).map(([path,page])=>({path,mainSHA256:hash(main(page.body))}))});
 // Stage every owner first. A failed stage never changes live traffic.
 for(const state of captured){
  assert.equal((await active(state.name)).id,state.deployment.id,'Current owner moved before upload '+state.name);
  const form=new FormData();form.set('metadata',new Blob([JSON.stringify(state.metadata)],{type:'application/json'}));
  for(const module of state.modules)form.set(module.name,new Blob([Buffer.from(module.content_base64,'base64')],{type:module.content_type||(/\.(mjs|js)$/.test(module.name)?'application/javascript+module':'application/octet-stream')}),module.name);
  const uploaded=await cf('/accounts/'+account+'/workers/scripts/'+state.name+'/versions?bindings_inherit=strict','POST',form);state.versionId=uploaded.id;assert(state.versionId);
  const staged=await cf('/accounts/'+account+'/workers/workers/'+state.name+'/versions/'+state.versionId+'?include=modules');
  assert.deepEqual(summaries(staged.modules).sort((a,b)=>a.name.localeCompare(b.name)),summaries(state.modules).sort((a,b)=>a.name.localeCompare(b.name)),'Staged module bytes differ '+state.name);
  console.log('KNOWLEDGE_STAGED '+JSON.stringify({name:state.name,versionId:state.versionId,previousVersion:state.previousVersion,retainedModules:state.originalHashes.length,askChanges:state.changes.length}));
 }
 assert.deepEqual(await routeList(),beforeRoutes,'Routes moved during staging');
 for(const state of captured)assert.equal((await active(state.name)).id,state.deployment.id,'Owner moved during staging '+state.name);
 for(const [path,before]of Object.entries(baselines))assert.equal(main((await get(path)).body),main(before.body),'Page changed during staging '+path);
 save('staged',{source:process.env.GITHUB_SHA,workers:captured.map(s=>({name:s.name,previousVersion:s.previousVersion,versionId:s.versionId,moduleHashes:summaries(s.modules)}))});
 for(const state of captured){
  assert.equal((await active(state.name)).id,state.deployment.id,'Owner moved before promotion '+state.name);
  try{await promote(state.name,state.versionId,'Publish Matt’s approved 50-topic Knowledge expansion only');}
  finally{if((await active(state.name)).versions[0].version_id===state.versionId)promoted.push(state);}
  assert(promoted.includes(state),'Owned promotion not observed '+state.name);
 }
 // Bounded propagation wait; no second upload or unowned rollback on failure.
 for(let n=0;n<10;n++){const page=await get('/knowledge');if(page.headers['x-shift-health-knowledge']===version)break;await new Promise(resolve=>setTimeout(resolve,1500));}
 const live=await verifyLive(baselines);
 assert.deepEqual(await routeList(),beforeRoutes,'The release must change zero routes');
 for(const state of captured)assert.equal((await active(state.name)).versions[0].version_id,state.versionId,'Another owner followed this release '+state.name);
 const receipt={...live,source:process.env.GITHUB_SHA,routeCount:beforeRoutes.length,routesChanged:0,workers:captured.map(s=>({name:s.name,versionId:s.versionId,previousVersion:s.previousVersion,retainedModules:s.originalHashes.length,askChanges:s.changes.length})),verifiedAt:new Date().toISOString()};
 save('receipt',receipt);console.log('KNOWLEDGE_RELEASE '+JSON.stringify(receipt));
}catch(error){
 save('failure',{message:error.message,stack:error.stack,promoted:promoted.map(s=>({name:s.name,versionId:s.versionId,previousVersion:s.previousVersion}))});
 const rollbacks=[];
 for(const state of [...promoted].reverse()){
  if((await active(state.name)).versions[0].version_id===state.versionId){await promote(state.name,state.previousVersion,'Restore only this Knowledge release’s captured predecessor after verification failure');rollbacks.push({name:state.name,restoredVersion:state.previousVersion});}
 }
 save('rollback',{workers:rollbacks,at:new Date().toISOString()});console.log('KNOWLEDGE_ROLLBACK '+JSON.stringify(rollbacks));throw error;
}
