import{readFileSync,writeFileSync}from'node:fs';import{createHash}from'node:crypto';import assert from'node:assert/strict';
const baseline=JSON.parse(readFileSync('performance-serving-baseline.json')),state=JSON.parse(readFileSync('performance-release-state.json')),auth=readFileSync('/Users/shiftsometimberltd/Library/Preferences/.wrangler/config/default.toml','utf8'),token=auth.match(/^oauth_token\s*=\s*"([^"\n]+)"/m)[1],account='9e5386dcf455be34c582d93f8bfc79e6',hash=b=>createHash('sha256').update(b).digest('hex'),hashes=v=>Object.fromEntries(v.modules.map(m=>[m.name,hash(Buffer.from(m.content_base64,'base64'))]));
async function cf(p){const r=await fetch('https://api.cloudflare.com/client/v4'+p,{headers:{Authorization:'Bearer '+token}}),j=await r.json();assert(r.ok&&j.success,JSON.stringify(j.errors));return j.result;}
const receipt={at:new Date().toISOString(),changes:[]};
for(let i=0;i<baseline.owners.length;i++){
const o=baseline.owners[i],ep='/accounts/'+account+'/workers/scripts/'+o.name,d=[...(await cf(ep+'/deployments')).deployments].sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];if(d.id===o.deployment.id)continue;
assert(!state.owners[i].versionId&&!state.owners[i].uploadIntent,'Cannot silently rebase a prepared upload');assert.equal(d.versions.length,1);
const v=await cf('/accounts/'+account+'/workers/workers/'+o.name+'/versions/'+d.versions[0].version_id+'?include=modules'),before=hashes(o.version),after=hashes(v),changed=Object.keys(before).filter(k=>before[k]!==after[k]),added=Object.keys(after).filter(k=>!before[k]),removed=Object.keys(before).filter(k=>!after[k]);
const item={name:o.name,beforeDeployment:o.deployment.id,afterDeployment:d.id,beforeVersion:o.deployment.versions[0].version_id,afterVersion:d.versions[0].version_id,main:v.main_module,changed,added,removed};console.log('CONCURRENT_CHANGE',JSON.stringify(item));
if(o.name==='shift-core'){
const prior=Buffer.from(o.version.modules.find(m=>m.name==='worker.js').content_base64,'base64').toString(),current=Buffer.from(v.modules.find(m=>m.name==='worker.js').content_base64,'base64').toString(),section=s=>s.slice(s.indexOf('async function publicPagesAsset(request, targetPath) {'),s.indexOf('__name(publicPagesAsset, "publicPagesAsset");'));
assert.equal(section(prior),section(current),'Public base function changed; inspect before applying its surgical patch');item.publicBaseFunctionUnchanged=true;
}
receipt.changes.push(item);o.deployment=d;o.version=v;o.settings=await cf(ep+'/settings');o.schedules=await cf(ep+'/schedules');Object.assign(state.owners[i],{currentDeployment:d.id,previousVersion:d.versions[0].version_id,oldMain:v.main_module,baselineModuleHashes:Object.fromEntries(Object.entries(after).sort(([a],[b])=>a.localeCompare(b)))});
}
assert.deepEqual(await cf('/zones/66ec3268950adcfc837b7b8b2f8356ed/workers/routes'),baseline.routes,'Concurrent route change requires inspection');
for(const [i,p]of [[0,'/member/dashboard?view=app'],[1,'/member/life-back/journey'],[2,'/member/life-back/shop'],[3,'/member/grub'],[4,'/member/fit']]){
const r=await fetch('https://shiftsometimber.co.uk'+p,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,p);const bytes=Buffer.from(await r.arrayBuffer());assert.equal(hash(bytes),hash(readFileSync('public-fixtures/perf-recheck-'+i+'.txt')),'Member template changed '+p);console.log('MEMBER_UNCHANGED',p,hash(bytes));
}
writeFileSync('performance-concurrent-release-retained.json',JSON.stringify(receipt,null,2));writeFileSync('performance-serving-baseline.json',JSON.stringify(baseline));delete state.failure;writeFileSync('performance-release-state.json',JSON.stringify(state,null,2));console.log('NEWER_SERVING_RELEASE_RETAINED');
