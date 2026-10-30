import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {routeOwner} from '../hero-set-20261030/route-owner.mjs';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
async function cf(path){const r=await fetch('https://api.cloudflare.com/client/v4'+path,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(60000)});const j=await r.json();assert(r.ok&&j.success,JSON.stringify(j.errors));return j.result;}
const routes=await cf('/zones/'+zone+'/workers/routes');
const paths=['/shift-for-work','/shift-for-work/','/shift-for-work.html','/shift-for-work?work-w2=1','/shift-for-work/?work-w2=1','/shift-for-work.html?work-w2=1','/shift-for-work/assets/workplace-w2-20261030.webp','/shift-for-work/client.js'];
const owners=paths.map(path=>({path,route:routeOwner(routes,'https://shiftsometimber.co.uk'+path)}));
assert(owners.every(x=>x.route?.script));
const workers=[];
for(const name of new Set(owners.map(x=>x.route.script))){
 const settings=await cf('/accounts/'+account+'/workers/scripts/'+name+'/settings');
 const result=await cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments');
 const deployment=result.deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];
 const live=deployment.versions.find(x=>x.percentage===100);assert(live&&deployment.versions.every(x=>x.percentage===0||x.percentage===100));
 const version=await cf('/accounts/'+account+'/workers/workers/'+name+'/versions/'+live.version_id+'?include=modules');
 workers.push({name,deployment,main:version.main_module||version.metadata?.main_module||version.resources?.script?.main_module||settings.main_module,assets:version.assets||settings.assets,modules:version.modules.map(m=>({name:m.name,bytes:Buffer.from(m.content_base64,'base64').length})),bindings:(version.bindings||settings.bindings||[]).map(b=>({name:b.name,type:b.type,service:b.service}))});
}
const report={readOnly:true,source:process.env.GITHUB_SHA,capturedAt:new Date().toISOString(),routeCount:routes.length,owners,workers};
mkdirSync('work-w2-evidence',{recursive:true});writeFileSync('work-w2-evidence/preflight.json',JSON.stringify(report,null,2));console.log('WORK_W2_PREFLIGHT '+JSON.stringify(report));
