// Exact-route, owner-approved six-tag metadata release. Changes no existing worker module.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WEGOVY_META as c,MARKER,repairWegovyMeta} from './wegovy-meta.mjs';
import {activeDeployment,replaceActiveTraffic} from './deployment.mjs';
import {runtimeRollbackDecision} from '../release/runtime-rollback-guard.mjs';

const WORKER='shift-public-presentation-batch-20261022';
const MAIN='wegovy-owner/entry.mjs',PATCH='wegovy-owner/patch.mjs';
const ACCOUNT='9e5386dcf455be34c582d93f8bfc79e6';
const ORIGIN='https://shiftsometimber.co.uk';
const directory='wegovy-owner-proof';mkdirSync(directory,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const save=(name,x)=>writeFileSync(directory+'/'+name,JSON.stringify(x,null,2));
const token=process.env.CLOUDFLARE_API_TOKEN;
assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID,ACCOUNT);
assert(token,'Existing Cloudflare deployment token missing');

async function provider(path,init={}){
 const response=await fetch('https://api.cloudflare.com/client/v4'+path,{
  ...init,headers:{Authorization:'Bearer '+token,...init.headers},signal:AbortSignal.timeout(60000)});
 const data=await response.json();assert(response.ok&&data.success,'Cloudflare refusal: '+JSON.stringify(data.errors));
 return data.result;
}
const api=(path,init)=>provider('/accounts/'+ACCOUNT+path,init);
const latest=async()=>activeDeployment((await api('/workers/scripts/'+WORKER+'/deployments')).deployments.toSorted((a,b)=>b.created_on.localeCompare(a.created_on))[0]);
const version=id=>api('/workers/workers/'+WORKER+'/versions/'+id+'?include=modules');
async function page(path){
 const response=await fetch(ORIGIN+path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(35000)});
 return {response,body:await response.text()};
}
function currentMain(){
 assert.equal(process.env.GITHUB_REF,'refs/heads/main');
 assert.match(process.env.GITHUB_SHA||'',/^[0-9a-f]{40}$/);
 execFileSync('git',['fetch','--no-tags','origin','main'],{stdio:'pipe'});
 assert.equal(execFileSync('git',['rev-parse','origin/main'],{encoding:'utf8'}).trim(),process.env.GITHUB_SHA,'Main moved during release');
}
const scrub=x=>x.replace(/<script\b[^>]*\bsrc=["']https:\/\/static.cloudflareinsights.com[^"']*["'][\s\S]*?<\/script>/gi,'')
 .replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
function unchanged(node){return {status:node.response.status,sha256:sha(scrub(node.body))}}
const receiptPath=directory+'/deployments.json';

if(process.argv[2]==='rollback'){
 if(!existsSync(receiptPath)){console.log('No owned production mutation to restore');process.exit(0);}
 const rows=JSON.parse(readFileSync(receiptPath));
 for(const receipt of rows.toReversed()){
  const live=await latest();
  const decision=runtimeRollbackDecision({before:receipt.before,active:live,receipt,source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID});
  if(decision.action==='restore'){
   const restore=await api('/workers/scripts/'+WORKER+'/deployments',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({strategy:'percentage',versions:receipt.before.providerVersions||receipt.before.versions})});
   assert.equal((await latest()).id,restore.id,'Rollback was displaced');
  }
  save('rollback.json',{worker:WORKER,...decision});
 }
}else{
 currentMain();
 const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
 assert.match(event.before||'',/^[0-9a-f]{40}$/);
 const changed=execFileSync('git',['diff','--name-only',event.before,'HEAD'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 const allowed=new Set(['aeo-geo/wegovy-meta.mjs','aeo-geo/wegovy-meta.test.mjs','aeo-geo/wegovy-owner-release.mjs','.github/workflows/aeo-geo-technical.yml']);
 assert(changed.includes('aeo-geo/wegovy-meta.mjs')&&changed.every(p=>allowed.has(p)),'Unreviewed release scope: '+changed.join(','));
 const zones=await provider('/zones?name=shiftsometimber.co.uk');assert.equal(zones.length,1);
 const routes=await provider('/zones/'+zones[0].id+'/workers/routes');
 const wanted='shiftsometimber.co.uk'+c.path;
 const matches=routes.filter(r=>{
  const bits=r.pattern.replace(/^https?:\/\//,'').split('*');
  return bits.length===1?bits[0]===wanted:bits.length===2&&wanted.startsWith(bits[0])&&wanted.endsWith(bits[1]);
 }).sort((a,b)=>b.pattern.replaceAll('*','').length-a.pattern.replaceAll('*','').length);
 save('route-owner.json',{path:c.path,matchingRoutes:matches.map(r=>({pattern:r.pattern,worker:r.script})),routeWrites:0});
 assert(matches.length&&matches[0].script===WORKER,'The inspected exact route owner changed; no deployment');
 const old=await page(c.path);
 assert.equal(old.response.status,200);
 assert.notEqual(repairWegovyMeta(old.body,c.path),old.body,'Current article metadata differs from approved original');
 save('target-before.json',{url:c.path,status:old.response.status,sha256:sha(old.body)});
 const protectedPaths=['/','/start-here','/member/dashboard','/guides/retatrutide-uk-guide'];
 const beforeProtected={};for(const path of protectedPaths)beforeProtected[path]=unchanged(await page(path));
 save('protected-before.json',beforeProtected);
 const before=await latest();
 const original=await version(before.versions[0].version_id);
 assert(original.modules.some(m=>m.name===original.main_module),'Published entry module not found');
 assert(/^[a-zA-Z0-9_./-]+\.m?js$/.test(original.main_module));
 assert(!original.main_module.split('/').includes('..'));
 assert(!original.modules.some(m=>m.name.startsWith('wegovy-owner/')),'An existing metadata wrapper must be inspected, not stacked');
 const entry='import original from '+JSON.stringify('../'+original.main_module)+';\nexport * from '+JSON.stringify('../'+original.main_module)+';\nimport {withWegovyMeta} from "./patch.mjs";\nexport default withWegovyMeta(original);\n';
 const own=[{name:MAIN,content_type:'application/javascript+module',content_base64:Buffer.from(entry).toString('base64')},
  {name:PATCH,content_type:'application/javascript+module',content_base64:readFileSync(new URL('./wegovy-meta.mjs',import.meta.url)).toString('base64')}];
 const candidate={main_module:MAIN,modules:[...original.modules,...own]};
 const settings=await api('/workers/scripts/'+WORKER+'/settings');
 const metadata={main_module:MAIN,compatibility_date:original.compatibility_date,
  compatibility_flags:original.compatibility_flags||[],bindings:original.bindings.map(b=>({type:'inherit',name:b.name})),
  keep_assets:true,annotations:{'workers/message':'Matt-approved Wegovy search metadata; original page owner preserved'}};
 if(original.usage_model)metadata.usage_model=original.usage_model;
 for(const key of ['placement','limits','observability','logpush'])if(settings[key]!==undefined)metadata[key]=settings[key];
 const form=new FormData();
 form.set('metadata',new Blob([JSON.stringify(metadata)],{type:'application/json'}),'metadata.json');
 for(const m of candidate.modules)form.set(m.name,new Blob([Buffer.from(m.content_base64,'base64')],{type:m.content_type}),m.name);
 currentMain();assert.equal((await latest()).id,before.id,'Article serving lease moved before staging');
 const staged=await api('/workers/scripts/'+WORKER+'/versions?bindings_inherit=strict',{method:'POST',body:form});
 const reviewed=await version(staged.id);
 assert.equal(reviewed.main_module,MAIN);
 for(const key of ['bindings','compatibility_date','compatibility_flags','assets','usage_model','migration_tag'])
  assert.deepEqual(reviewed[key],original[key],'Unexpected change to '+key);
 assert.equal(reviewed.modules.length,original.modules.length+2);
 for(const module of candidate.modules){
  const served=reviewed.modules.find(m=>m.name===module.name);
  assert(served&&served.content_type===module.content_type,'Staged module missing: '+module.name);
  assert.equal(sha(Buffer.from(served.content_base64,'base64')),sha(Buffer.from(module.content_base64,'base64')),'Staged module drift: '+module.name);
 }
 save('staged.json',{worker:WORKER,versionId:staged.id,originalModulesUnchanged:original.modules.length,newModules:2,routeWrites:0,databaseWrites:0});
 currentMain();assert.equal((await latest()).id,before.id,'Article serving lease moved before promotion');
 const deployed=await api('/workers/scripts/'+WORKER+'/deployments',{method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({strategy:'percentage',versions:replaceActiveTraffic(before,staged.id)})});
 const receipt={kind:'owned_runtime_deployment',source:process.env.GITHUB_SHA,run:process.env.GITHUB_RUN_ID,
  script:WORKER,deploymentId:deployed.id,versionId:staged.id,before};
 save('deployments.json',[receipt]);
 assert.equal((await latest()).id,deployed.id);
 let live;
 for(let attempt=0;attempt<5;attempt++){
  live=await page(c.path);
  if(live.response.status===200&&live.response.headers.get('X-Shift-Wegovy-Metadata')===MARKER)break;
  await new Promise(r=>setTimeout(r,4000));
 }
 assert.equal(live.response.status,200);
 assert.equal(live.response.headers.get('X-Shift-Wegovy-Metadata'),MARKER,'Edited Wegovy page not serving');
 for(const pair of [
  ['<title>',c.title],['<meta name="description" content="',c.description],
  ['<meta property="og:title" content="',c.title],['<meta property="og:description" content="',c.description],
  ['<meta name="twitter:title" content="',c.title],['<meta name="twitter:description" content="',c.description]
 ])assert(live.body.includes(pair[0]+pair[1]),'Approved metadata not served: '+pair[0]);
 assert(live.body.includes('<h1>'+c.oldTitle+'</h1>'),'Original clinical heading changed');
 assert(live.body.includes('<link rel="canonical" href="'+ORIGIN+c.path+'">'),'Original canonical changed');
 const beforeProtected2={};for(const path of protectedPaths)beforeProtected2[path]=unchanged(await page(path));
 save('protected-after.json',beforeProtected2);
 assert.deepEqual(beforeProtected2,beforeProtected,'Other public/private content changed');
 const proof={verified:true,worker:WORKER,deploymentId:deployed.id,versionId:staged.id,source:process.env.GITHUB_SHA,
  path:c.path,title:c.title,description:c.description,approvedMetadataTags:6,
  originalModulesPreserved:original.modules.length,addedModules:2,routeWrites:0,databaseWrites:0,
  protectedUnchanged:true,clinicalCopyChanged:false};
 save('live-verification.json',proof);console.log(JSON.stringify(proof));
}
