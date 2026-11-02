import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {brotliCompressSync} from 'node:zlib';
import {evidence} from './retatrutide-evidence.mjs';
import {withRetatrutideEvidence,renderRetatrutideGuide,retatrutideImage,RETA_PATH,COMPARISON_PATH,RETA_IMAGE_PATH} from './retatrutide.mjs';
import {withAeoGeo} from './delivery.mjs';
import {prepareRetatrutidePackage,verifyPackage} from './package.mjs';
const before=readFileSync(new URL('./retatrutide-before-20261102.html',import.meta.url),'utf8');
const after=await withRetatrutideEvidence(before,RETA_PATH);
const fragment=(s,tag)=>s.match(new RegExp('<'+tag+'\\b[\\s\\S]*?</'+tag+'>','i'))?.[0];
test('approved informational page preserves actual header, footer, drawer and original publication history',()=>{
 assert.equal(fragment(after,'header'),fragment(before,'header'));
 assert.equal(fragment(after,'footer'),fragment(before,'footer'));
 const drawer=s=>s.match(/<aside\b[^>]*id="site-drawer"[\s\S]*?<\/aside>/)?.[0];assert.equal(drawer(after),drawer(before));
 assert(after.includes('data-reta-evidence="20261102"'));assert(!after.includes('PRIVATE REVIEW DRAFT'));assert(!after.includes('Content preview for the existing'));
 assert(after.includes('Written and researched by'));assert(!/"(?:reviewedBy|lastReviewed)"/.test(after));
 assert.equal(evidence.independentClinicalReviewClaimed,false);
 assert(after.includes('not authorised'));assert(!/"@type"\s*:\s*"(?:Product|Offer|AggregateRating)"/.test(after));
});
test('all charts and ordinary data tables agree with the single source register',()=>{
 const t=evidence.triumph1,z=evidence.triumph2;
 for(const value of [t.treatment.active,t.treatment.placebo,t.efficacy.active,t.efficacy.placebo,z.activeWeight,z.placeboWeight])assert(after.includes(value.toFixed(1)+'%'));
 assert(after.includes('width="'+(t.treatment.active*17.5).toFixed(3)+'"'));
 assert(after.includes('values:'+JSON.stringify([t.treatment.active,t.treatment.placebo])));
 assert(after.includes('values:'+JSON.stringify([t.efficacy.active,t.efficacy.placebo])));
 assert(!/\[\[[A-Z0-9_]+\]\]/.test(after));
 const ids=[...after.matchAll(/\bid="([^" ]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Unique document ids');
 for(const [,id] of after.matchAll(/href="#([^" ]+)"/g))assert(ids.includes(id),'Missing fragment '+id);
 assert.equal((after.match(/<h1\b/gi)||[]).length,1);
});
test('useful context remains and the image and full-CSS reduction are actual, route-scoped changes',async()=>{
 for(const id of ['illegal','cost','nhs','availability','vs-mounjaro','vs-wegovy','surgery','wait','alternatives','natural','questions','shift','print','sources'])assert(after.includes('id="'+id+'"'));
 assert(Buffer.byteLength(after)<Buffer.byteLength(before)*.65);assert(brotliCompressSync(Buffer.from(after)).length<brotliCompressSync(Buffer.from(before)).length*.7);
 for(const path of ['/','/member/dashboard','/member-login','/checkout','/admin','/guides/another'])assert.equal(await withRetatrutideEvidence(before,path),before);
 assert.equal(await withRetatrutideEvidence(after,RETA_PATH),after);
 for(const m of after.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g))JSON.parse(m[1]);
});
test('the mixed comparison status does not imply every listed molecule is authorised',async()=>{
 const original='<span>UK-authorised prescription medicine — check the page for current access and product information.</span><span>August 2026. Sources and review detail remain in the guide.</span>Updated 26 August 2026';
 const corrected=await withRetatrutideEvidence(original,COMPARISON_PATH);
 assert(corrected.includes('authorised and investigational medicines'));assert(!corrected.includes('UK-authorised prescription medicine'));
 assert(!corrected.includes('August 2026'));assert(corrected.includes('Updated 2 November 2026'));
});
test('image GET, HEAD and conditional semantics need no session or data access',async()=>{
 const url='https://shiftsometimber.co.uk'+RETA_IMAGE_PATH;
 const response=retatrutideImage(new Request(url));assert.equal(response.headers.get('Content-Type'),'image/png');
 const bytes=new Uint8Array(await response.arrayBuffer());assert.deepEqual([...bytes.slice(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(retatrutideImage(new Request(url,{method:'HEAD'})).body,null);
 assert.equal(retatrutideImage(new Request(url,{headers:{'If-None-Match':response.headers.get('ETag')}})).status,304);
 assert.equal(retatrutideImage(new Request(url,{method:'POST'})),null);
});
test('the public wrapper passes private requests through without reading or rewriting them',async()=>{
 const calls=[];const original={async fetch(request){calls.push(request);return new Response('private',{headers:{'Cache-Control':'no-store'}})}};
 const wrapped=withAeoGeo(original,{catalogue(){throw Error('No catalogue access permitted')},shell:{}});
 for(const path of ['/member/dashboard','/v1/member-state','/checkout','/admin']){
  const request=new Request('https://shiftsometimber.co.uk'+path),response=await wrapped.fetch(request);
  assert.equal(await response.text(),'private');assert.equal(response.headers.get('Cache-Control'),'no-store');assert.equal(calls.at(-1),request);
 }
});
test('a package amendment changes only the four declared public modules and keeps binary modules and catalogue exact',()=>{
 const entry='import original from "../worker.mjs";\nexport * from "../worker.mjs";\nimport {withAeoGeo} from "./delivery.mjs";\nimport {catalogue} from "./data.mjs";\nimport * as shell from "./shell.mjs";\nimport metadata from "./sitemap-metadata.mjs";\nexport default withAeoGeo(original,{catalogue,shell,metadata});\n';
 const module=(name,text,content_type='application/javascript+module')=>({name,content_type,content_base64:Buffer.from(text).toString('base64')});
 const names=['delivery.mjs','schema.mjs','content.mjs','analytics.mjs','chrome.mjs','sitemap-metadata.mjs','data.mjs','shell.mjs'];
 const original={main_module:'aeo-geo/entry.mjs',bindings:[{name:'DB',type:'d1'}],compatibility_date:'2026-08-09',modules:[module('worker.mjs','export default {};'),module('data.bin','binary','application/octet-stream'),module('aeo-geo/entry.mjs',entry),...names.map(name=>module('aeo-geo/'+name,name==='sitemap-metadata.mjs'?'export default {"/unchanged":{"lastmod":"2026-10-01"}};':name))]};
 const planned=prepareRetatrutidePackage(original),staged={...original,...planned};verifyPackage(original,staged,planned);
 const replaceable=new Set(['aeo-geo/delivery.mjs','aeo-geo/sitemap-metadata.mjs','aeo-geo/retatrutide.mjs','aeo-geo/retatrutide-evidence.mjs']);
 for(const m of original.modules.filter(x=>!replaceable.has(x.name)))assert.deepEqual(planned.modules.find(x=>x.name===m.name),m);
 assert.equal(planned.modules.length,original.modules.length+2);
 const bad=structuredClone(staged);bad.bindings=[];assert.throws(()=>verifyPackage(original,bad,planned));
});
