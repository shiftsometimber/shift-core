import fs from 'node:fs';
import assert from 'node:assert/strict';
import {cards,photoAssets,transformHTML,extractLinks,approvedLinks,outsideApprovedScope,outsideR5Scope,introduction} from './cards.mjs';
const dir=new URL('./',import.meta.url),local=new URL('h6-baseline.html',dir),legacyFile=new URL('baseline.html',dir);
let current;if(fs.existsSync(local))current=fs.readFileSync(local,'utf8');else{const r=await fetch('https://shiftsometimber.co.uk/shift-health',{signal:AbortSignal.timeout(45000)});assert.equal(r.status,200);current=await r.text();}
const legacy=fs.existsSync(legacyFile)?fs.readFileSync(legacyFile,'utf8'):null,out=transformHTML(current);
assert.equal(cards.length,10);assert.equal(photoAssets.length,12);
for(const source of [current,...(legacy?[legacy]:[]),out]){
 const next=transformHTML(source);
 assert.equal((next.match(/class="shc-card"/g)||[]).length,10);
 assert.equal(outsideApprovedScope(next),outsideApprovedScope(source));
 assert.deepEqual(extractLinks(next).links,approvedLinks(source));
 assert.equal(transformHTML(next),next);
 assert(next.includes(introduction));
 assert.equal((next.match(/data-health-header-release="R5"/g)||[]).length,1);
 assert.equal((next.match(/header-r5\.webp/g)||[]).length,1);
 assert.equal((next.match(/data-health-r5-styles="20261030"/g)||[]).length,1);
 const hero=next.match(/<section class="sst-health-hero[^\"]*"[^>]*>[\s\S]*?<\/section>/)?.[0];assert(hero&&!hero.includes('<figcaption'));
 assert(!/<article\b[^>]*class="[^"]*sst-feature-(?:weight-management|bloods|testosterone|nutrition)/.test(next));
 assert(!/<section\b[^>]*class="[^"]*\bnft-hub\b/.test(next));
 const schemas=[...next.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(x=>JSON.parse(x[1]));
 const categories=schemas.filter(x=>x['@id']==='https://shiftsometimber.co.uk/shift-health#health-categories');assert.equal(categories.length,1);assert.equal(categories[0].itemListElement.length,10);
}
const anchors=s=>[...extractLinks(s).grid.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(x=>x[0]);
if(extractLinks(current).links.length===10){assert.deepEqual(anchors(out),anchors(current));assert.equal(outsideR5Scope(out),outsideR5Scope(current),'Only change the approved hero and its stylesheet');}
assert.equal(extractLinks(out).links[2].href,'/shift-health/testing/male-fertility');
assert.equal(extractLinks(out).links[9].href,'/mens-weight-management');
assert.equal((out.match(/<svg class="shh-line-arrow"/g)||[]).length,4);
for(const c of photoAssets)assert(fs.statSync(new URL('assets/'+c.file,dir)).size>0);
assert.throws(()=>transformHTML(current.replace(/<section class="sst-health-hero[^\"]*"/,'<section class="unrecognised-hero"')));
fs.writeFileSync(new URL('h6-candidate.html',dir),out);
console.log('PASS R5 semantic hero and image, no caption strip, compact responsive styles, exact ten cards and destinations, closing sections and independent content preserved, valid schemas and idempotence.');
