import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {PROGRAMME_DRAFTS,improveProgrammeSupport,programmeSection,programmeStyle} from '../public-seo-programme.mjs';
import {withProgrammeSeo as withPublicSeoCloseout} from '../public-seo-programme.mjs';
const pages=PROGRAMME_DRAFTS.map(d=>({url:'https://shiftsometimber.co.uk'+d.path,file:new URL('./fixtures/public-seo-programme/'+d.id+'.html',import.meta.url)}));
for(const d of PROGRAMME_DRAFTS)test(d.path+' preserves original document and existing safety information',async()=>{
 const p=pages.find(p=>new URL(p.url).pathname===d.path);assert.ok(p);const before=fs.readFileSync(p.file,'utf8'),after=improveProgrammeSupport(before,d.path);
 assert.notEqual(after,before);assert.equal(improveProgrammeSupport(after,d.path),after);
 const main=s=>s.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0];
 assert.equal(main(after).replace(programmeSection(d),''),main(before));assert.equal((after.match(/<h1\b/gi)||[]).length,1);
 assert.deepEqual(after.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi),before.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi));
 assert.deepEqual(after.match(/<link[^>]*rel=["']canonical["'][^>]*>/gi),before.match(/<link[^>]*rel=["']canonical["'][^>]*>/gi));
 if(d.path.startsWith('/mental-health/')){assert.ok(before.indexOf('/mental-health/urgent-mental-health-help')<before.indexOf(d.anchor));assert.ok(after.indexOf('/mental-health/urgent-mental-health-help')<after.indexOf('data-programme-support='));assert.ok(!/href=["']\/(?:member|treatment|mounjaro|wegovy)/.test(programmeSection(d)));}
 const res=await withPublicSeoCloseout(new Response(before,{headers:{'content-type':'text/html','etag':'old','content-length':'999'}}),new Request('https://shiftsometimber.co.uk'+d.path));const body=await res.text();assert.ok(body.includes('data-programme-support='));assert.equal(res.headers.get('etag'),null);

});
test('protected paths and missing anchors remain exact',()=>{for(const path of ['/','/start-here','/member/dashboard','/wegovy'])assert.equal(improveProgrammeSupport('<main><h1>Protected</h1></main>',path),'<main><h1>Protected</h1></main>');assert.equal(improveProgrammeSupport('<main><h1>Missing</h1></main>',PROGRAMME_DRAFTS[0].path),'<main><h1>Missing</h1></main>')});
test('POST and error responses stay unchanged',async()=>{for(const [method,status] of [['POST',200],['GET',500]]){const r=new Response('unchanged',{status,headers:{'content-type':'text/html'}});assert.equal(await withPublicSeoCloseout(r,new Request('https://shiftsometimber.co.uk'+PROGRAMME_DRAFTS[0].path,{method})),r)}});
test('HEAD has no body',async()=>{const d=PROGRAMME_DRAFTS[0],p=pages.find(p=>new URL(p.url).pathname===d.path);const res=await withPublicSeoCloseout(new Response(fs.readFileSync(p.file,'utf8'),{headers:{'content-type':'text/html'}}),new Request('https://shiftsometimber.co.uk'+d.path,{method:'HEAD'}));assert.equal(await res.text(),'')});
