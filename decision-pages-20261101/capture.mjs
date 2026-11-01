import assert from 'node:assert/strict';
import fs from 'node:fs';
import {routeOwner} from './route-owner.mjs';
import {paths,assets,pages} from './config.mjs';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
async function cf(path){const r=await fetch('https://api.cloudflare.com/client/v4'+path,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(60000)});const j=await r.json();assert(r.ok&&j.success,JSON.stringify(j.errors));return j.result;}
const routes=await cf('/zones/'+zone+'/workers/routes');
const owners=[...paths,...assets].map(path=>({path,route:routeOwner(routes,'https://shiftsometimber.co.uk'+path)}));assert(owners.every(x=>x.route?.script));
const workers=[];
for(const name of new Set(owners.map(x=>x.route.script))){
 const settings=await cf('/accounts/'+account+'/workers/scripts/'+name+'/settings');
 const result=await cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments');
 const d=result.deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];
 const live=d.versions.find(x=>x.percentage===100);assert(live&&d.versions.every(x=>x.percentage===0||x.percentage===100));
 const v=await cf('/accounts/'+account+'/workers/workers/'+name+'/versions/'+live.version_id+'?include=modules');
 workers.push({name,versionId:live.version_id,deploymentId:d.id,main:v.main_module||v.metadata?.main_module||v.resources?.script?.main_module||settings.main_module,modules:v.modules.map(m=>({name:m.name,bytes:Buffer.from(m.content_base64,'base64').length})),assets:v.assets||settings.assets,bindingCount:(v.bindings||settings.bindings||[]).length});
}
fs.mkdirSync('decision-pages-evidence',{recursive:true});
const captures=[];
for(const page of pages){const r=await fetch('https://shiftsometimber.co.uk'+page.path,{signal:AbortSignal.timeout(45000)});assert.equal(r.status,200);const html=await r.text();fs.writeFileSync('decision-pages-evidence/'+page.key+'-baseline.html',html);captures.push({key:page.key,status:r.status,bytes:html.length});}
const report={readOnly:true,source:process.env.GITHUB_SHA,capturedAt:new Date().toISOString(),routeCount:routes.length,owners,workers,captures};
fs.writeFileSync('decision-pages-evidence/preflight.json',JSON.stringify(report,null,2));console.log('REMAINING_PAGES_PREFLIGHT '+JSON.stringify(report));
