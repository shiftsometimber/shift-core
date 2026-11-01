import test from 'node:test';
import assert from 'node:assert/strict';
import {withFirstSixWeeks,wrapFirstSixWeeks,firstSixWeeksRoutes} from '../first-six-weeks.mjs';
const enabled={MEMBER_EXPERIENCE_V1_ENABLED:'true'};
const html='<html><head><title>Your Journey · My Timber</title></head><body><div id="session-gate"></div><main id="timberJourney"><p>Sign in</p></main><script type="module" src="/assets/member-experience/programme-journey.mjs"></script><script src="/assets/member-experience/programme-shop-navigation.mjs"></script></body></html>';
const response=()=>new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','ETag':'old','X-Existing':'kept'}});
test('only the explicit programme view replaces the Journey renderer; navigation and session owner remain',async()=>{
  const out=await withFirstSixWeeks(new Request('https://shiftsometimber.co.uk/member/life-back/journey?view=first-six-weeks'),response(),enabled),body=await out.text();
  assert(!body.includes('src="/assets/member-experience/programme-journey.mjs"'));
  assert(body.includes('id="session-gate"'));assert(body.includes('programme-shop-navigation.mjs'));assert(body.includes('first-six-weeks.mjs'));
  assert.equal(out.headers.get('X-Existing'),'kept');assert.equal(out.headers.get('ETag'),null);assert.equal(out.headers.get('Cache-Control'),'no-store, private');
  const normal=await withFirstSixWeeks(new Request('https://shiftsometimber.co.uk/member/life-back/journey'),response(),enabled);
  assert((await normal.text()).includes('src="/assets/member-experience/programme-journey.mjs"'));
});
test('public, account, clinical, disabled, non-HTML, unsuccessful and mutation responses pass through untouched',async()=>{
  for(const path of ['/','/programme','/member/settings','/member/orders','/member/saved','/v1/life-back','/start-here','/member/treatment']){
    const r=response(),out=await withFirstSixWeeks(new Request('https://shiftsometimber.co.uk'+path),r,enabled);assert.equal(out,r,path);
  }
  for(const [method,env,r] of [['POST',enabled,response()],['GET',{},response()],['GET',enabled,new Response('error',{status:500})],['GET',enabled,new Response('{}',{headers:{'Content-Type':'application/json'}})]]){
    assert.equal(await withFirstSixWeeks(new Request('https://shiftsometimber.co.uk/member/dashboard',{method}),r,env),r);
  }
});
test('wrapper delegates every existing mutation, context and scheduled handler without replacing them',async()=>{
  const scheduled=()=>{},ctx={},body='{"action":"journey-add"}',original={scheduled,async fetch(r,env,c){assert.equal(await r.text(),body);assert.equal(c,ctx);return new Response('existing action result');}};
  const next=wrapFirstSixWeeks(original);assert.equal(next.scheduled,scheduled);
  const out=await next.fetch(new Request('https://shiftsometimber.co.uk/v1/life-back',{method:'POST',body}),enabled,ctx);assert.equal(await out.text(),'existing action result');
});
test('asset methods, type, feature switch and photo bytes have correct HTTP behaviour',async()=>{
  for(const [suffix,type] of [['mjs','text/javascript'],['css','text/css'],['webp','image/webp']]){
    const url='https://shiftsometimber.co.uk/assets/member-experience/programme-first-six-weeks.'+suffix;
    const r=firstSixWeeksRoutes(new Request(url),enabled);assert.equal(r.status,200);assert(r.headers.get('Content-Type').startsWith(type));
    assert((await r.arrayBuffer()).byteLength>100);
    assert.equal(await firstSixWeeksRoutes(new Request(url,{method:'HEAD'}),enabled).text(),'');
    assert.equal(firstSixWeeksRoutes(new Request(url,{method:'POST'}),enabled),null);assert.equal(firstSixWeeksRoutes(new Request(url),{}),null);
  }
});
test('unknown templates fail safely and repeated presentation does not duplicate assets',async()=>{
  const request=new Request('https://shiftsometimber.co.uk/member/life-back/journey?view=first-six-weeks'),unrecognised=new Response('<html><body><main>new template</main></body></html>',{headers:{'Content-Type':'text/html'}});
  assert.equal(await (await withFirstSixWeeks(request,unrecognised,enabled)).text(),'<html><body><main>new template</main></body></html>');
  const once=await withFirstSixWeeks(request,response(),enabled),twice=await withFirstSixWeeks(request,once,enabled);
  assert.equal((await twice.text()).match(/data-mt-first-six-weeks=/g).length,1);
});
