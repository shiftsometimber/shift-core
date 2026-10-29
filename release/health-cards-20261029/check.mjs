import fs from 'node:fs';
import assert from 'node:assert/strict';
import {cards,photoAssets,transformHTML,extractLinks,approvedLinks,outsideApprovedScope,introduction} from './cards.mjs';
const dir=new URL('./',import.meta.url);
const localCurrent=new URL('h6-baseline.html',dir),localLegacy=new URL('baseline.html',dir);
let current;
if(fs.existsSync(localCurrent))current=fs.readFileSync(localCurrent,'utf8');
else{const r=await fetch('https://shiftsometimber.co.uk/shift-health',{signal:AbortSignal.timeout(45000)});assert.equal(r.status,200);current=await r.text();}
const legacy=fs.existsSync(localLegacy)?fs.readFileSync(localLegacy,'utf8'):null;
assert.equal(cards.length,10);assert.equal(photoAssets.length,11);
const out=transformHTML(current);
for(const source of [current,...(legacy?[legacy]:[]),out]){
 const candidate=transformHTML(source);
 assert.equal((candidate.match(/class="shc-card"/g)||[]).length,10);
 assert.equal(outsideApprovedScope(candidate),outsideApprovedScope(source));
 assert.deepEqual(extractLinks(candidate).links,approvedLinks(source));
 assert.equal(transformHTML(candidate),candidate);
 assert(candidate.includes(introduction));
 assert.equal((candidate.match(/data-health-header-release="H6"/g)||[]).length,1);
 assert.equal((candidate.match(/class="shh-chooser"/g)||[]).length,1);
 assert.equal((candidate.match(/header-h6\.webp/g)||[]).length,1);
 assert(!/<article\b[^>]*class="[^"]*sst-feature-weight-management/.test(candidate));
 assert(candidate.includes('sst-feature-bloods'));
 const schemas=[...candidate.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(x=>JSON.parse(x[1]));
 const categories=schemas.filter(x=>x['@id']==='https://shiftsometimber.co.uk/shift-health#health-categories');
 assert.equal(categories.length,1);assert.equal(categories[0].itemListElement.length,10);
}
const anchors=s=>[...extractLinks(s).grid.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(x=>x[0]);
assert.deepEqual(anchors(out).slice(0,9),anchors(current).slice(0,9),'The nine signed-off cards remain byte-for-byte identical');
assert.equal(extractLinks(out).links[2].href,'/shift-health/testing/male-fertility');
assert.equal(extractLinks(out).links[9].href,'/mens-weight-management');
for(const c of photoAssets)assert(fs.statSync(new URL('assets/'+c.file,dir)).size>0);
assert.throws(()=>transformHTML(current.replace(/<section class="sst-health-hero(?: shh-hero)?"/,'<section class="unrecognised-hero"')));
assert.throws(()=>transformHTML(current.replace('href="/shift-health/testing/male-fertility"','href="//unexpected.example/fertility"')));
fs.writeFileSync(new URL('h6-candidate.html',dir),out);
console.log('PASS H6 copy and photograph, W1 tenth card, ten current destinations, nine exact approved cards, removal of duplicate weight feature, all other HTML preserved, valid unique schemas, idempotence and refusal of an unexpected source.');
