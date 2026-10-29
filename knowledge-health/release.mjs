// Inspect the current serving owners before a bounded, version-only release.
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {guides,existing,version} from './content.mjs';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
const dir='knowledge-health-evidence';mkdirSync(dir,{recursive:true});
const hash=v=>createHash('sha256').update(v).digest('hex');
const save=(name,data)=>writeFileSync(dir+'/'+name+'.json',JSON.stringify(data,null,2));
assert(process.env.CLOUDFLARE_API_TOKEN,'Cloudflare release credential missing');
async function cf(path){
 const r=await fetch('https://api.cloudflare.com/client/v4'+path,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(45000)});
 const j=await r.json();assert(r.ok&&j.success,'Provider read failed '+path+' '+JSON.stringify(j.errors?.map(e=>({code:e.code,message:e.message}))));return j.result;
}
const routes=await cf('/zones/'+zone+'/workers/routes');
const matches=(pattern,url)=>new RegExp('^'+pattern.replace(/^https?:\/\//,'').replace(/[.+?^${}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*')+'$').test(url.replace(/^https?:\/\//,''));
const owner=url=>routes.filter(r=>matches(r.pattern,url)).sort((a,b)=>b.pattern.replace(/\*/g,'').length-a.pattern.replace(/\*/g,'').length)[0];
const paths=[...new Set(['/','/knowledge','/explore-knowledge','/faq','/ask-timber','/sitemap.xml','/shift-health','/shift-health/fertility','/shift-health/testing','/shift-health/blood-tests','/shift-health/sleep-apnoea','/shift-health/supplements-nutrition','/shift-health/erectile-dysfunction','/v1/ai/chat',...guides.map(g=>g.path),...guides.map(g=>g.service),...existing.map(g=>g.path)])];
const serving=paths.map(path=>({path,route:owner('https://shiftsometimber.co.uk'+path)}));
const names=[...new Set([...serving.map(s=>s.route?.script).filter(Boolean),'shift-core'])];
const workers=[];
for(const name of names){
 const settings=await cf('/accounts/'+account+'/workers/scripts/'+name+'/settings');
 const list=await cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments');
 const active=list.deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];
 assert.equal(active.versions.length,1);assert.equal(active.versions[0].percentage,100);
 const current=await cf('/accounts/'+account+'/workers/workers/'+name+'/versions/'+active.versions[0].version_id+'?include=modules');
 const modules=current.modules.map(m=>{
  const bytes=Buffer.from(m.content_base64,'base64'),code=/\.(mjs|js)$/.test(m.name)?bytes.toString('utf8'):'';
  const anchors=['async function askTimberRoutes','async function retrieveForParts','reviewedDirect = directReviewedAnswer','const items =','const items='].map(anchor=>{const at=code.indexOf(anchor);return at<0?null:{anchor,index:at,context:code.slice(Math.max(0,at-100),at+900)};}).filter(Boolean);
  return {name:m.name,bytes:bytes.length,sha256:hash(bytes),anchors};
 });
 workers.push({name,deployment:active,mainModule:current.main_module||current.metadata?.main_module||current.resources?.script?.main_module||settings.main_module,modules,bindings:settings.bindings.map(b=>({name:b.name,type:b.type})),compatibilityDate:settings.compatibility_date});
}
const result={source:process.env.GITHUB_SHA,version,readOnly:true,routes,serving,workers,at:new Date().toISOString()};
save('preflight',result);console.log('KNOWLEDGE_RELEASE_PREFLIGHT '+JSON.stringify(result));
