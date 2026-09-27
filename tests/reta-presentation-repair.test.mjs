import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {repairRetaPresentation,RETA_PATH} from '../reta-presentation-repair.mjs';
import {RETA_IMAGE} from '../reta-editorial-asset.mjs';
import {seoAssetResponse} from '../public-seo-presentation.mjs';
const before=readFileSync(new URL('./fixtures/reta-before-20260924.html',import.meta.url),'utf8'),after=repairRetaPresentation(before,RETA_PATH);
const schemas=h=>[...h.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(x=>JSON.parse(x[1]));
test('article dates and original image agree; publisher identity and FAQ remain unchanged',()=>{
 const old=schemas(before),now=schemas(after);
 for(const type of ['Article','MedicalWebPage']){let o=old.find(x=>x['@type']===type),n=now.find(x=>x['@type']===type);assert(!('datePublished' in n));assert.equal(n.dateModified,o.dateModified);assert.equal(n.image.url,'https://shiftsometimber.co.uk'+RETA_IMAGE.path)}
 for(const type of ['Organization','FAQPage'])assert.deepEqual(now.find(x=>x['@type']===type),old.find(x=>x['@type']===type));
 for(const key of ['og:image','twitter:image'])assert(after.includes('"'+key+'" content="https://shiftsometimber.co.uk'+RETA_IMAGE.path+'"'));
});
test('visible copy, links, scripts and header are unchanged except the declared illustration',()=>{
 const main=h=>h.match(/<main\b[\s\S]*?<\/main>/)[0];assert.equal(main(after).replace(/<figure data-reta-editorial-image[\s\S]*?<\/figure>/,''),main(before));
 const scripts=h=>[...h.matchAll(/<script\b[\s\S]*?<\/script>/g)].map(x=>x[0]).filter(x=>!x.includes('application/ld+json'));assert.deepEqual(scripts(after),scripts(before));
 assert.equal(after.match(/<header\b[\s\S]*?<\/header>/)[0],before.match(/<header\b[\s\S]*?<\/header>/)[0]);
});
test('idempotent, route-scoped and no new script dependencies',()=>{assert.equal(repairRetaPresentation(after,RETA_PATH),after);for(const p of ['/','/shift-health','/member/dashboard','/guides/another'])assert.equal(repairRetaPresentation(before,p),before);assert.equal((after.match(/data-reta-inline-css=/g)||[]).length,5)});
test('original asset GET HEAD conditional and method semantics',async()=>{const url='https://shiftsometimber.co.uk'+RETA_IMAGE.path;let r=seoAssetResponse(new Request(url));assert.equal(r.status,200);assert.equal((await r.arrayBuffer()).byteLength,28088);assert.equal(r.headers.get('Content-Type'),'image/webp');assert.equal(seoAssetResponse(new Request(url,{method:'HEAD'})).body,null);assert.equal(seoAssetResponse(new Request(url,{headers:{'If-None-Match':'"'+RETA_IMAGE.sha256+'"'}})).status,304);assert.equal(seoAssetResponse(new Request(url,{method:'POST'})).status,405)});
test('a later article revision automatically keeps the full original stylesheet',()=>{
 const revised=before.replace('what we know so far','what we know now');
 const changed=repairRetaPresentation(revised,RETA_PATH);
 const css=h=>h.match(/<style[^>]*data-reta-inline-css="\/assets\/shift-recovery-v6[^>]*>([\s\S]*?)<\/style>/)[1];
 assert(css(after).length<50000);assert(css(changed).length>200000);assert(changed.includes('what we know now'));
});
