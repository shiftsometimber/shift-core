import fs from 'node:fs';
import assert from 'node:assert/strict';
import {cards,photoAssets,transformHTML,extractLinks,approvedLinks,outsideApprovedScope,introduction,removeDuplicateFeatures,desktopCss} from './cards.mjs';
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
 assert(!/<article\b[^>]*class="[^"]*sst-feature-(?:bloods|testosterone|nutrition)/.test(candidate));
 assert(!/<section\b[^>]*class="[^"]*\bnft-hub\b/.test(candidate));
 assert(!/<div\b[^>]*class="[^"]*\bsst-features\b[^\"]*">\s*<\/div>/.test(candidate));
 const schemas=[...candidate.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(x=>JSON.parse(x[1]));
 const categories=schemas.filter(x=>x['@id']==='https://shiftsometimber.co.uk/shift-health#health-categories');
 assert.equal(categories.length,1);assert.equal(categories[0].itemListElement.length,10);
}
const anchors=s=>[...extractLinks(s).grid.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)].map(x=>x[0]);
assert.deepEqual(anchors(out).slice(0,9),anchors(current).slice(0,9),'The nine signed-off cards remain byte-for-byte identical');
if(extractLinks(current).links.length===10){
 assert.deepEqual(anchors(out),anchors(current),'All ten signed-off cards remain byte-for-byte identical');
 const hero=s=>s.match(/<section class="sst-health-hero shh-hero"[^>]*>[\s\S]*?<\/section>/)?.[0];
 assert.equal(hero(out),hero(current),'Keep the existing H6 wording and image');
 const style=s=>s.match(/<style data-health-card-styles="20261029">[\s\S]*?<\/style>/)?.[0];
 assert.equal(style(out),style(current),'Keep the existing mobile header and card styles');
 const withoutDesktop=s=>s.replace(/data-health-card-release="[^"]+"/,'data-health-card-release="VERSION"').replace(/<style data-health-desktop-styles="20261029">[\s\S]*?<\/style>/,'');
 if(current.includes('data-health-bottom-styles="20261029"'))assert.equal(withoutDesktop(out),withoutDesktop(current),'Only add the desktop-specific stylesheet');
 const closingScope=s=>withoutDesktop(s).replace(/<style data-health-bottom-styles="20261029">[\s\S]*?<\/style>/,'').replace(/<section\b[^>]*class="[^"]*\bsst-linkline\b[^"]*"[^>]*>[\s\S]*?<\/section>/,'__USEFUL_LINKS__').replace(/<section\b[^>]*class="[^"]*\bsst-free\b[^"]*"[^>]*>[\s\S]*?<\/section>/,'__MY_TIMBER__');
 assert.equal(closingScope(out),closingScope(removeDuplicateFeatures(current)),'Only remove the four selected duplicate sections and polish the two closing sections');
 for(const cls of ['sst-linkline','sst-free']){
  const pattern=new RegExp('<section\\b[^>]*class="[^"]*\\b'+cls+'\\b[^"]*"[^>]*>[\\s\\S]*?<\\/section>');
  const oldBlock=current.match(pattern)?.[0],newBlock=out.match(pattern)?.[0];assert(oldBlock&&newBlock);
  const text=s=>s.replace(/<[^>]*>/g,' ').replace(/&#(?:x(?:2197|fe0e|fe0f)|8599|65038|65039);/gi,'').replace(/[\u2197\uFE0E\uFE0F]/g,'').replace(/\s+/g,' ').trim();
  assert.equal(text(newBlock),text(oldBlock),'Keep the exact closing-section wording');
  assert.deepEqual([...newBlock.matchAll(/href="([^"]+)"/g)].map(x=>x[1]),[...oldBlock.matchAll(/href="([^"]+)"/g)].map(x=>x[1]));
  assert(!/[\u2197\uFE0E\uFE0F]/.test(newBlock),'No emoji arrow characters in closing links');
 }
 assert.equal((out.match(/<svg class="shh-line-arrow"/g)||[]).length,4);
}
assert.equal(extractLinks(out).links[2].href,'/shift-health/testing/male-fertility');
assert.equal(extractLinks(out).links[9].href,'/mens-weight-management');
assert.equal((out.match(/data-health-desktop-styles="20261029"/g)||[]).length,1);
assert(desktopCss.trim().startsWith('@media(min-width:821px){'));
assert.equal((desktopCss.match(/@media/g)||[]).length,1);
for(const c of photoAssets)assert(fs.statSync(new URL('assets/'+c.file,dir)).size>0);
assert.throws(()=>transformHTML(current.replace(/<section class="sst-health-hero(?: shh-hero)?"/,'<section class="unrecognised-hero"')));
assert.throws(()=>transformHTML(current.replace('href="/shift-health/testing/male-fertility"','href="//unexpected.example/fertility"')));
fs.writeFileSync(new URL('h6-candidate.html',dir),out);
console.log('PASS desktop-only hero stylesheet; mobile styles, all content, ten cards and closing sections unchanged; valid schemas and idempotence.');
