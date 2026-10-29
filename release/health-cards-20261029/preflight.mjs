import fs from 'node:fs';
import assert from 'node:assert/strict';
const account='9e5386dcf455be34c582d93f8bfc79e6',zone='66ec3268950adcfc837b7b8b2f8356ed';
async function cf(path){const r=await fetch('https://api.cloudflare.com/client/v4'+path,{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(45000)});const j=await r.json();assert(r.ok&&j.success,JSON.stringify(j.errors));return j.result;}
fs.mkdirSync('health-card-evidence',{recursive:true});
const routes=await cf('/zones/'+zone+'/workers/routes');
const health=routes.filter(r=>/^(?:www\.)?shiftsometimber\.co\.uk\/shift-health/.test(r.pattern));
const owners=[...new Set(health.map(r=>r.script).filter(Boolean))];
const services={};
for(const name of owners){const settings=await cf('/accounts/'+account+'/workers/scripts/'+name+'/settings');const d=await cf('/accounts/'+account+'/workers/scripts/'+name+'/deployments');services[name]={bindings:settings.bindings.filter(x=>x.type==='service').map(x=>({name:x.name,service:x.service})),deployment:d.deployments.sort((a,b)=>b.created_on.localeCompare(a.created_on))[0]};}
const page=await fetch('https://shiftsometimber.co.uk/shift-health',{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(45000)});assert.equal(page.status,200);const html=await page.text();fs.writeFileSync('health-card-evidence/current-health.html',html);
const result={source:process.env.GITHUB_SHA,routeCount:routes.length,health,services,headers:Object.fromEntries([...page.headers].filter(([k])=>/content-type|x-shift|etag|cache-control/.test(k))),hasGrid:html.includes('sst-health-grid')};
fs.writeFileSync('health-card-evidence/preflight.json',JSON.stringify(result,null,2));console.log('HEALTH_CARD_PREFLIGHT '+JSON.stringify(result));
