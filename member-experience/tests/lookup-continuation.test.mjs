import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const {searchGpPractices,memberDetailsLookupRoute}=await import(process.env.LOOKUP_TEST_MODULE||'../member-details-lookups.mjs');
import {gpFormRuntime} from '../gp-form.mjs';
const gp={Name:'Fictional Practice',OrgId:'A12345',Status:'Active',PrimaryRoleId:'RO177',PostCode:'SK10 1AA'};


test('provider Content-Length limit rejects before consuming a large body',async()=>{
 let pulls=0,cancelled=false;const body=new ReadableStream({pull(c){pulls++;c.enqueue(new TextEncoder().encode('{}'));c.close();},cancel(){cancelled=true;}},{highWaterMark:0});
 await assert.rejects(searchGpPractices('Example',async()=>new Response(body,{headers:{'Content-Length':'200001'}})),/provider_too_large/);
 assert.equal(pulls,0);assert.equal(cancelled,true);
});
test('chunked stream is cancelled when byte limit is exceeded instead of fully buffered',async()=>{
 let pulls=0,cancelled=false;const body=new ReadableStream({pull(c){pulls++;c.enqueue(new Uint8Array(80000));if(pulls===8)c.close();},cancel(){cancelled=true;}},{highWaterMark:0});
 await assert.rejects(searchGpPractices('Example',async()=>new Response(body)),/provider_too_large/);
 assert.equal(cancelled,true);assert.equal(pulls,3);
});
test('ordinary chunked provider JSON still returns filtered bounded practice results',async()=>{
 const bytes=new TextEncoder().encode(JSON.stringify({Organisations:[gp,{...gp,Status:'Inactive'}]}));let i=0;
 const body=new ReadableStream({pull(c){if(i>=bytes.length)return c.close();c.enqueue(bytes.slice(i,i+9));i+=9;}});
 const result=await searchGpPractices('Example',async()=>new Response(body));assert.deepEqual(result.practices,[{name:gp.Name,code:gp.OrgId,postcode:gp.PostCode}]);
});
test('malformed JSON and redirects are never GP suggestions',async()=>{
 await assert.rejects(searchGpPractices('Example',async()=>new Response('not JSON')));
 await assert.rejects(searchGpPractices('Example',async()=>new Response(null,{status:302,headers:{Location:'https://untrusted.invalid/'}})),/provider_unavailable/);
});

test('optional GP form script asset is same origin, no-store and supports empty HEAD',async()=>{
 for(const method of ['GET','HEAD']){const r=await memberDetailsLookupRoute(new Request('https://shiftsometimber.co.uk/assets/member-experience/gp-form.mjs',{method}),{});assert.equal(r.status,200);assert.match(r.headers.get('Content-Type'),/javascript/);assert.match(r.headers.get('Cache-Control'),/no-store/);assert.equal(await r.text(),method==='HEAD'?'':gpFormRuntime);}
});
test('both assessment additions preserve the immutable original fields, content and submit script',()=>{
 const script='<script defer src="/assets/member-experience/gp-form.mjs"></script>\n';
 for(const path of ['../../frontend/member/treatment-assessment.html','../../frontend/medicine-front-door/treatment-assessment.html']){
  const html=readFileSync(new URL(path,import.meta.url),'utf8');assert.equal(html.split(script).length,2);
  const original=html.replace(script,'');const blob=createHash('sha1').update('blob '+Buffer.byteLength(original)+'\0').update(original).digest('hex');
  assert.equal(blob,'0603847db45d10ae20d2924278c95a0ff47a2849','Clinical content changed outside the exact GP script addition: '+path);
 }
 assert(!gpFormRuntime.includes("addEventListener('submit'"));assert(!gpFormRuntime.includes('localStorage'));assert(!gpFormRuntime.includes('sessionStorage'));assert(!gpFormRuntime.includes('/v1/profile'));assert(!gpFormRuntime.includes('/v1/commerce/'));assert(!gpFormRuntime.includes('innerHTML=body'));new vm.Script(gpFormRuntime);
});
test('preview clinical submission remains disabled with original production handler excluded',()=>{
 const s=readFileSync(new URL('../../preview/member-details/prepare.mjs',import.meta.url),'utf8'),worker=readFileSync(new URL('../../preview/member-details/worker.mjs',import.meta.url),'utf8');
 assert(s.includes('action="/__preview/clinical-disabled"'));assert(s.includes('<button type="submit" disabled>'));assert(worker.includes("if(path==='/__preview/clinical-disabled')"));assert(worker.includes("{status:403,headers}"));
});
