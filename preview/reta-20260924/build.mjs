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
