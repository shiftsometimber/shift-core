import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {routeOwner} from '../../knowledge-health/release-helpers.mjs';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
async function cf(p){const r=await fetch('https://api.cloudflare.com/client/v4'+p,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(60000)});const j=await r.json();assert(r.ok&&j.success,'Provider read failed '+p);return j.result;}
const routes=await cf('/zones/'+zone+'/workers/routes');
const paths=['/knowledge','/explore-knowledge','/knowledge/assets/k3-20261030/hero.webp'];
const owners=paths.map(p=>({path:p,route:routeOwner(routes,'https://shiftsometimber.co.uk'+p)}));
const workers=[];
for(const name of [...new Set(owners.map(x=>x.route?.script).filter(Boolean))]){
 const deployments=await cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments');const deployment=deployments.deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];assert.equal(deployment.versions.length,1);const version=deployment.versions[0].version_id;
 const current=await cf('/accounts/'+account+'/workers/workers/'+name+'/versions/'+version+'?include=modules');const settings=await cf('/accounts/'+account+'/workers/scripts/'+name+'/settings');
 workers.push({name,version,main:current.main_module||current.metadata?.main_module||current.resources?.script?.main_module||settings.main_module,assetConfigKeys:Object.keys(current.assets||current.resources?.script_runtime?.assets||settings.assets||{}),bindings:(current.bindings||settings.bindings||[]).map(b=>({name:b.name,type:b.type})),modules:current.modules.map(m=>({name:m.name,type:m.content_type,sha256:createHash('sha256').update(Buffer.from(m.content_base64,'base64')).digest('hex')}))});
}
const pages=[];for(const p of paths.slice(0,2)){const r=await fetch('https://shiftsometimber.co.uk'+p,{headers:{'Cache-Control':'no-cache'}});const html=await r.text();pages.push({path:p,status:r.status,finalURL:r.url,cards:[...html.matchAll(/<article\b[^>]*data-kh-card/g)].length,mainHash:createHash('sha256').update(html.match(/<main\b[^>]*>[\s\S]*?<\/main>/)?.[0]||'').digest('hex')});}
const result={source:process.env.GITHUB_SHA,routeCount:routes.length,owners,workers,pages,mutations:0};fs.mkdirSync('knowledge-k3-evidence',{recursive:true});fs.writeFileSync('knowledge-k3-evidence/preflight.json',JSON.stringify(result,null,2));console.log('K3_PREFLIGHT '+JSON.stringify(result));
