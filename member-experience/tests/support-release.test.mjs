import test from 'node:test';
import assert from 'node:assert/strict';
import {wrapSupportService} from '../support-release.mjs';
import {wrapSupportMarkup} from '../support-markup.mjs';
import {withSupportLayout} from '../support-layout.mjs';
import {sixPageRecoveryRuntime} from '../six-page-recovery.mjs';
test('support layout changes only its owned suffix and preserves independent deployed chrome',async()=>{
 const marker='/* My Timber six-page presentation recovery. No fabricated member data. */',prefix='/* independent live repairs */\nconst existingChrome=true;\n';
 const request=new Request('https://shiftsometimber.co.uk/assets/my-timber-layout.mjs');
 const response=new Response(prefix+marker+'old recovery',{headers:{'Content-Type':'text/javascript','ETag':'old'}});
 const result=await withSupportLayout(request,response),text=await result.text();
 assert.equal(text,prefix+sixPageRecoveryRuntime.slice(sixPageRecoveryRuntime.indexOf(marker)));assert.equal(result.headers.get('ETag'),null);
 const unknown=new Response('unrecognised current source',{headers:{'Content-Type':'text/javascript'}});assert.equal(await withSupportLayout(request,unknown),unknown);
});
test('the scoped support release passes protected public, clinical and commerce requests through unchanged',async()=>{
 for(const path of ['/','/treatment-assessment','/v1/checkout','/shop','/v1/auth/login']){
  const response=new Response('Original protected output',{headers:{'Content-Type':'text/html','X-Original':'retained'}});
  const scheduled=()=>{};const wrapped=wrapSupportService({fetch:async()=>response,scheduled});
  assert.equal(wrapped.scheduled,scheduled);assert.equal(await wrapped.fetch(new Request('https://shiftsometimber.co.uk'+path),{MEMBER_EXPERIENCE_V1_ENABLED:'true'},{}),response);
 }
});
test('member markup keeps existing account scripts and cookies and adds the support client only once',async()=>{
 const scheduled=()=>{};const original={scheduled,fetch:async()=>new Response('<html><body><script src="/existing-account.js"></script></body></html>',{headers:{'Content-Type':'text/html','Set-Cookie':'existing=value; Secure; HttpOnly'}})};
 const wrapped=wrapSupportMarkup(original),request=new Request('https://shiftsometimber.co.uk/member/dashboard');const r=await wrapped.fetch(request,{},{}),html=await r.clone().text();assert.match(html,/existing-account.js/);assert.equal(r.headers.get('Set-Cookie'),'existing=value; Secure; HttpOnly');assert.equal((html.match(/src="\/assets\/member-experience\/programme-support-plan.mjs"/g)||[]).length,1);
 const twice=await wrapSupportMarkup({fetch:async()=>r}).fetch(request,{},{});assert.equal(await twice.text(),html);
});
test('the existing website origins have CORS preflight while an unrelated site is rejected',async()=>{
 const wrapped=wrapSupportService({fetch:async()=>new Response('fallback')});
 for(const origin of ['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk']){const r=await wrapped.fetch(new Request('https://api.shiftsometimber.co.uk/v1/life-back',{method:'OPTIONS',headers:{Origin:origin}}),{},{});assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);}
 assert.equal((await wrapped.fetch(new Request('https://api.shiftsometimber.co.uk/v1/life-back',{method:'OPTIONS',headers:{Origin:'https://unrelated.invalid'}}),{},{})).status,403);
});

test('existing programme route prefixes reach private support and check-in auth without new provider routes',async()=>{const wrapped=wrapSupportService({fetch:async()=>new Response('fallback',{status:404})});for(const path of ['/v1/life-back/member-support','/v1/life-back/check-in','/v1/life-back/support-inbox']){const r=await wrapped.fetch(new Request('https://shiftsometimber.co.uk'+path),{MEMBER_EXPERIENCE_V1_ENABLED:'true'},{});assert.ok([401,403].includes(r.status),path+' stays private');}});
