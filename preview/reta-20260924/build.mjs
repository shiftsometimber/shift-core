import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {repairRetaPresentation,RETA_PATH} from '../../reta-presentation-repair.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const get=async path=>{const r=await fetch('https://shiftsometimber.co.uk'+path);assert(r.ok,path+' '+r.status);return await r.text()};
mkdirSync('reta-proof',{recursive:true});mkdirSync('preview/reta-20260924/generated',{recursive:true});
const pages={};for(const p of ['/',RETA_PATH,'/shift-health','/articles/mounjaro-cost-uk']){const baseline=await get(p);pages[p]={baseline,candidate:repairRetaPresentation(baseline,p)}}
for(const a of JSON.parse(readFileSync('editorial/retatrutide/media/style-provenance.json'))){assert.equal(sha(await get(a.url)),a.sha256,'Stylesheet source changed: '+a.url)}
writeFileSync('preview/reta-20260924/generated/pages.mjs','export const pages='+JSON.stringify(pages)+';\nexport const ticker='+JSON.stringify(await get('/v1/radar/ticker'))+';\n');
writeFileSync('reta-proof/capture.json',JSON.stringify(Object.fromEntries(Object.entries(pages).map(([p,v])=>[p,{before:sha(v.baseline),after:sha(v.candidate),unchanged:v.baseline===v.candidate}])),null,2));
writeFileSync('reta-proof/reta-before.html',pages[RETA_PATH].baseline);writeFileSync('reta-proof/reta-after.html',pages[RETA_PATH].candidate);

// Freeze anonymous static assets once for both variants. Avoid making the
// comparison depend on extra preview-to-production proxy round trips.
const urls=new Set();
for(const pair of Object.values(pages))for(const m of pair.baseline.matchAll(/(?:src|href)=["']([^"']+)["']/gi)){
 const u=m[1];if(u.startsWith('/')&&/\.(?:css|js|png|jpg|jpeg|webp|svg|ico|webmanifest)(?:\?|$)/.test(u))urls.add(u);
}
const assets={};for(const u of urls){const r=await fetch('https://shiftsometimber.co.uk'+u);assert(r.ok,u+' '+r.status);assets[u]={base64:Buffer.from(await r.arrayBuffer()).toString('base64'),type:r.headers.get('content-type')};}
writeFileSync('preview/reta-20260924/generated/assets.mjs','export const frozenAssets='+JSON.stringify(assets)+';\n');
writeFileSync('reta-proof/frozen-assets.json',JSON.stringify(Object.fromEntries(Object.entries(assets).map(([p,v])=>[p,{sha256:sha(Buffer.from(v.base64,'base64')),type:v.type}])),null,2));
