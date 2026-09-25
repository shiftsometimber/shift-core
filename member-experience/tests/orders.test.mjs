import test from 'node:test';
import assert from 'node:assert/strict';
import {memberExperienceRoutes,memberExperienceEntry} from '../entry.mjs';
import {memberNavigation} from '../chrome.mjs';

const origin='https://shiftsometimber.co.uk';
const enabled={MEMBER_EXPERIENCE_V1_ENABLED:'true'};
const get=(path,method='GET')=>memberExperienceRoutes(new Request(origin+path,{method}),enabled);

test('My Orders is linked from the current member chrome and serves a private deep link',async()=>{
 assert.match(memberNavigation(),/href="\/member\/orders">My Orders/);
 for(const path of ['/member/orders','/member/orders.html']){
  const response=get(path),html=await response.text();
  assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control'),/no-store/);
  assert.match(response.headers.get('Vary'),/Cookie/);assert.match(response.headers.get('X-Robots-Tag'),/noindex/);
  assert.match(html,/data-member-page="orders"/);assert.match(html,/id="memberSessionStatus"/);
  assert.match(html,/\/assets\/member-experience\/orders\.mjs/);
  assert.doesNotMatch(html,/sample order|fictional order|stock_on_hand/i);
  assert.equal((await get(path,'HEAD').text()),'');
 }
 const dashboard=await memberExperienceEntry(new Request(origin+'/member/dashboard'),enabled,new Response('<html><head></head><body><main></main></body></html>',{headers:{'Content-Type':'text/html'}}));
 assert.match(await dashboard.text(),/href="\/member\/orders">My Orders/);
 assert.equal(memberExperienceRoutes(new Request(origin+'/member/orders',{method:'POST'}),enabled),null);
 assert.equal(memberExperienceRoutes(new Request(origin+'/member/orders'),{}),null);
});

test('Orders runtime uses the existing member API and safe DOM rendering',async()=>{
 for(const path of ['/assets/member-experience/orders.mjs','/assets/member-experience/orders.css']){
  const r=get(path);assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/no-store/);
  assert.equal(await get(path,'HEAD').text(),'');
 }
 const script=await get('/assets/member-experience/orders.mjs').text();
 new Function(script);
 assert.match(script,/fetch\('\/v1\/commerce\/orders'/);
 assert.match(script,/credentials:'include'/);
 assert.match(script,/retry\.addEventListener/);
 assert.match(script,/You have no SHIFT shop orders yet/);
 assert.match(script,/response\.status===401/);
 assert.match(script,/textContent=/);
 assert.doesNotMatch(script,/innerHTML|localStorage|sessionStorage|method:'POST'|stock_on_hand/);
});
