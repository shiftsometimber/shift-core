import test from'node:test';import assert from'node:assert/strict';
import{wrapMemberPerformance,augmentPerformanceDocument}from'../performance-delivery.mjs';
import{performanceRuntime}from'../performance-client.mjs';
test('private identity, records, account, basket, writes and public handlers retain exact existing response',async()=>{
 const paths=['/v1/me','/v1/life-back/journey','/v1/privacy/export','/v1/privacy/account','/v1/commerce/active-checkout','/v1/commerce/basket-quote','/v1/auth/logout','/','/start-here','/shift-health/testing/vitamin-d'];
 for(const path of paths)for(const method of ['GET','POST','DELETE']){
 const expected=new Response('unchanged guarded response',{status:401,headers:{'Cache-Control':'no-store','Set-Cookie':'synthetic=retained'}}),env={MEMBER_EXPERIENCE_V1_ENABLED:'true',CORE:{otherMethod:()=>42}},original={fetch:(request,e)=>{assert.equal(e,env);return expected;},scheduled:()=>{}},wrapped=wrapMemberPerformance(original,{},{} ,'core');
 assert.equal(wrapped.scheduled,original.scheduled);assert.equal(await wrapped.fetch(new Request('https://shiftsometimber.co.uk'+path,{method}),env,{}),expected);
 }});
test('only exact non-personalised, content-versioned assets are immutable; wrong versions revalidate',async()=>{
 const asset={body:'static code',type:'text/javascript',sha256:'a'.repeat(64),owner:'core'},wrapped=wrapMemberPerformance({fetch:()=>new Response('original')},{},{'/assets/example.mjs':asset},'core'),env={MEMBER_EXPERIENCE_V1_ENABLED:'true'};
 for(const [query,immutable]of [['?mtv='+asset.sha256.slice(0,20),true],['',false],['?mtv=old',false]]){const r=await wrapped.fetch(new Request('https://shiftsometimber.co.uk/assets/example.mjs'+query,{headers:{Cookie:'synthetic'}}),env,{});assert.equal(await r.text(),asset.body);assert.equal(r.headers.get('Cache-Control').includes('immutable'),immutable);assert(!r.headers.has('Set-Cookie'));}
});
test('original member document remains private; one bootstrap precedes every member script, and repeated shell scripts are removed',async()=>{
 const html='<!doctype html><html><head><title>Approved</title></head><body data-member-session="pending"><main>Approved controls</main><script src="/assets/member-shell-v6.js"></script><script src="/assets/member-shell-v6.js"></script></body></html>',r=new Response(html,{headers:{'Content-Type':'text/html','Cache-Control':'no-store, private'}}),wrapped=wrapMemberPerformance({fetch:()=>r},{},{},'core'),response=await wrapped.fetch(new Request('https://shiftsometimber.co.uk/member/dashboard'),{MEMBER_EXPERIENCE_V1_ENABLED:'true'},{});
 const text=await response.text();assert(text.includes('<main>Approved controls</main>'));assert.equal(text.match(/src="\/assets\/member-shell-v6.js"/g).length,1);assert(text.indexOf('data-mt-performance')<text.indexOf('<body'));assert.equal(response.headers.get('Cache-Control'),'no-store, private');assert.equal(augmentPerformanceDocument(text),text);new Function(performanceRuntime);
});
test('disabled feature flags cannot activate the transport or static assets',async()=>{
 const expected=new Response('old'),original={fetch:()=>expected};assert.equal(await wrapMemberPerformance(original,{},{} ,'core').fetch(new Request('https://shiftsometimber.co.uk/member/fit'),{},{}),expected);
});
