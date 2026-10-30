import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
const pages=JSON.parse(readFileSync('hero-set-20261030/pages.json','utf8'));
const cf=async path=>{const r=await fetch('https://api.cloudflare.com/client/v4'+path,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(60000)});const j=await r.json();assert(r.ok&&j.success,JSON.stringify(j.errors));return j.result;};
function owner(routes,path){const url='https://shiftsometimber.co.uk'+path;const hits=routes.filter(r=>new RegExp('^'+r.pattern.split('*').map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*')+'$').test(url));hits.sort((a,b)=>b.pattern.replaceAll('*','').length-a.pattern.replaceAll('*','').length);assert(hits[0]?.script,'No Worker for '+path);return hits[0];}
const routes=await cf('/zones/'+zone+'/workers/routes');
const serving=pages.map(p=>({path:p.path,owner:owner(routes,p.path)}));
const assetPath='/shift-health/hero-set-20261030/test.webp';const assetOwner=owner(routes,assetPath);
const workers=[];mkdirSync('hero-set-evidence',{recursive:true});
for(const name of new Set([...serving.map(s=>s.owner.script),assetOwner.script])){
 const base='/accounts/'+account+'/workers/scripts/'+name;
 const settings=await cf(base+'/settings');const ds=await cf(base+'/deployments');const deployment=ds.deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0];
 assert.equal(deployment.versions.length,1);const version=await cf('/accounts/'+account+'/workers/workers/'+name+'/versions/'+deployment.versions[0].version_id+'?include=modules');
 const main=version.main_module||version.metadata?.main_module||version.resources?.script?.main_module||settings.main_module;
 const entry=version.modules.find(m=>m.name===main);assert(entry);
 const item={name,deployment,main,assets:version.assets,modules:version.modules.map(m=>({name:m.name,bytes:Buffer.from(m.content_base64,'base64').length})),entry:Buffer.from(entry.content_base64,'base64').toString().slice(0,5000),bindings:(version.bindings||[]).map(b=>({name:b.name,type:b.type,service:b.service}))};
 workers.push(item);writeFileSync('hero-set-evidence/'+name+'.json',JSON.stringify({settings,deployment,version},null,2));
}
const baselines=[];for(const page of pages){const r=await fetch('https://shiftsometimber.co.uk'+page.path);const body=await r.text();baselines.push({path:page.path,status:r.status,url:r.url,h1:[...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m=>m[1].replace(/<[^>]+>/g,' ')),existingHeroes:[...body.matchAll(/data-[\w-]*hero[^>]*|class="[^"]*(?:hero|masthead)[^"]*"/gi)].map(m=>m[0]).slice(0,12)});writeFileSync('hero-set-evidence/'+page.id+'.html',body);}
const report={serving,assetPath,assetOwner,workers,baselines};writeFileSync('hero-set-evidence/preflight.json',JSON.stringify(report,null,2));console.log('HERO_PREFLIGHT '+JSON.stringify(report));
