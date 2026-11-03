import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
const paths=JSON.parse(readFileSync(new URL('./paths.json',import.meta.url))),directory='medication-inventory-proof';mkdirSync(directory,{recursive:true});
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;assert.equal(account,'9e5386dcf455be34c582d93f8bfc79e6');assert(token);
const hash=text=>createHash('sha256').update(text).digest('hex');
async function provider(path){const response=await fetch('https://api.cloudflare.com/client/v4'+path,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(60000)});const body=await response.json();assert(response.ok&&body.success,'Read-only provider request failed');return body.result;}
const api=path=>provider('/accounts/'+account+path);
const zone=(await provider('/zones?name=shiftsometimber.co.uk'))[0];assert(zone);assert.equal(zone.account.id,account,'The serving zone must belong to the inspected account');
const routes=await provider('/zones/'+zone.id+'/workers/routes');
function owner(path){const url='https://shiftsometimber.co.uk'+path;const matches=routes.filter(r=>{const pattern=r.pattern.includes('://')?r.pattern:'*://'+r.pattern;return new RegExp('^'+pattern.split('*').map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*')+'$').test(url)}).sort((a,b)=>b.pattern.replaceAll('*','').length-a.pattern.replaceAll('*','').length);return matches[0]?.script||null;}
const ownership=Object.fromEntries(paths.concat('/sitemap.xml','/assets/medicine-evidence-20261103/probe.png').map(p=>[p,{canonical:owner(p),query:owner(p+'?inventory=1')}]));
const workers=[];
for(const script of [...new Set(Object.values(ownership).flatMap(x=>[x.canonical,x.query]).filter(Boolean))]){
 const deployments=(await api('/workers/scripts/'+script+'/deployments')).deployments.toSorted((a,b)=>b.created_on.localeCompare(a.created_on));const active=deployments[0];assert(active.versions.every(v=>v.percentage===0||v.percentage===100));const live=active.versions.filter(v=>v.percentage===100);assert.equal(live.length,1);
 const source=await api('/workers/workers/'+script+'/versions/'+live[0].version_id+'?include=modules');
 workers.push({script,deploymentId:active.id,versionId:live[0].version_id,main:source.main_module,moduleCount:source.modules.length,modules:source.modules.map(m=>({name:m.name,type:m.content_type,sha256:hash(Buffer.from(m.content_base64,'base64'))})),bindingNames:source.bindings.map(b=>({name:b.name,type:b.type})),compatibilityDate:source.compatibility_date});
}
const documents=[];
for(const path of paths){const response=await fetch('https://shiftsometimber.co.uk'+path,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(45000)});const html=await response.text(),main=html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];documents.push({path,status:response.status,url:response.url,mainSha256:main?hash(main):null,h1Count:(html.match(/<h1\b/gi)||[]).length,retatrutideVersion:response.headers.get('X-Shift-Retatrutide-Evidence')});}
const result={readOnly:true,source:process.env.GITHUB_SHA,routeWrites:0,databaseWrites:0,workerWrites:0,ownership,workers,documents};writeFileSync(directory+'/inventory.json',JSON.stringify(result,null,2));console.log(JSON.stringify({readOnly:true,workers:workers.map(w=>({script:w.script,deploymentId:w.deploymentId,versionId:w.versionId,main:w.main,moduleCount:w.moduleCount})),pages:documents.length,badResponses:documents.filter(x=>x.status!==200),routeWrites:0,databaseWrites:0,workerWrites:0}));
