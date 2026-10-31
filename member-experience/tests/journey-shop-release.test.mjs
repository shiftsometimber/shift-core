import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {fixture} from '../../health-passport/fixture.mjs';
import {wrapJourneyShopService} from '../journey-shop-release.mjs';
import {wrapJourneyShopDocuments} from '../shop-document-release.mjs';
import {updateApprovedJourneyNavigation,withJourneyShopAssets,shopBootRuntime} from '../journey-shop-assets.mjs';
const origin='https://shiftsometimber.co.uk',env={MEMBER_EXPERIENCE_V1_ENABLED:'true'};
const req=(p,options={})=>new Request(origin+p,options);

test('outer release passes public, clinical, payment, auth and existing support operations unchanged',async()=>{
 const calls=[];const original={scheduled:()=>{},fetch:async(r)=>{calls.push({url:r.url,method:r.method,body:await r.text()});return new Response('CURRENT_OWNER_BYTES',{headers:{'X-Existing':'kept','Set-Cookie':'same-owner-cookie'}});}};
 const wrapped=wrapJourneyShopService(original);assert.equal(wrapped.scheduled,original.scheduled);
 for(const path of ['/','/clinic-gone-quiet','/shift-health','/v1/checkout','/v1/me','/v1/clinical-review','/v1/life-back']){const r=await wrapped.fetch(req(path),env,{});assert.equal(await r.text(),'CURRENT_OWNER_BYTES');assert.equal(r.headers.get('Set-Cookie'),'same-owner-cookie');}
 for(const body of ['{"action":"focus","goal":"unchanged"}','not-json','x'.repeat(8100)]){const r=await wrapped.fetch(req('/v1/life-back',{method:'POST',body}),env,{});assert.equal(await r.text(),'CURRENT_OWNER_BYTES');assert.equal(calls.at(-1).body,body);}
});
test('new Journey persistence survives refresh with account, consent and Origin guards through actual release wrapper',async t=>{
 const f=fixture({seed:false});t.after(()=>f.close());f.db.exec('ALTER TABLE progress_entries ADD COLUMN notes TEXT');
 const wrapped=wrapJourneyShopService({fetch:async()=>new Response('retained',{status:418})});
 const body={action:'journey-record',record:{kind:'win',on:'2026-10-28',text:'Real fixture save'},revision:0,expectedAccount:1,operationId:'scoped-journey-operation-20261031'};
 const write=(b,originHeader=origin)=>wrapped.fetch(req('/v1/life-back',{method:'POST',headers:{Cookie:'sst_session=test-only-member-1',Origin:originHeader,'Content-Type':'application/json'},body:JSON.stringify(b)}),f.env,{});
 assert.equal((await write(body)).status,409);
 f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1)").run();
 assert.equal((await write(body,'https://foreign.invalid')).status,403);assert.equal((await write({...body,expectedAccount:2})).status,409);
 assert.equal((await write(body)).status,201);
 const load=id=>wrapped.fetch(req('/v1/life-back/journey',{headers:{Cookie:'sst_session=test-only-member-'+id}}),f.env,{});
 const one=await(await load(1)).json(),two=await(await load(2)).json();assert.equal(one.records[0].text,'Real fixture save');assert.deepEqual(two.records,[]);
 assert.equal((await write({...body,operationId:'scoped-stale-operation-20261031'})).status,409);
 assert.equal(JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences).grubV2.savedRecipes[0],'kept');
 assert.equal((await wrapped.fetch(req('/v1/life-back/journey'),f.env,{})).status,401);
});
test('new routes enforce finite methods, private output, feature flag and restricted preflight',async()=>{
 const wrapped=wrapJourneyShopService({fetch:async()=>new Response('BEFORE')});
 for(const path of ['/member/life-back/shop','/member/life-back/journey']){const r=await wrapped.fetch(req(path),env,{});assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/private/);assert.match(await r.text(),/data-member-session="pending"/);}
 assert.equal(await(await wrapped.fetch(req('/member/life-back/shop'),{},{})).text(),'BEFORE');
 assert.equal((await wrapped.fetch(req('/member/life-back/shop',{method:'POST',body:'no orders'}),env,{})).status,405);
 for(const [allowed,want]of [[origin,204],['https://www.shiftsometimber.co.uk',204],['https://foreign.invalid',403]])assert.equal((await wrapped.fetch(req('/v1/life-back/journey',{method:'OPTIONS',headers:{Origin:allowed}}),env,{})).status,want);
});
test('dashboard owner retains cron and non-member responses, injecting exactly one Shop asset pair',async()=>{
 const scheduled=()=>{},original={scheduled,fetch:async()=>new Response('<html><body>Existing account content</body></html>',{headers:{'Content-Type':'text/html','Set-Cookie':'kept'}})};
 const wrapped=wrapJourneyShopDocuments(original);assert.equal(wrapped.scheduled,scheduled);
 for(const path of ['/v1/hq/outbox','/v1/privacy/account','/'])assert.equal(await(await wrapped.fetch(req(path),{MY_TIMBER_V6_RELEASE_ENABLED:'true'},{})).text(),'<html><body>Existing account content</body></html>');
 const r=await wrapped.fetch(req('/member/dashboard'),{MY_TIMBER_V6_RELEASE_ENABLED:'true'},{}),html=await r.text();assert.equal(r.headers.get('Set-Cookie'),'kept');assert.equal((html.match(/programme-shop-navigation.mjs/g)||[]).length,1);assert.equal((html.match(/data-mt-shop-assets/g)||[]).length,1);
});
test('approved recovery delta preserves unrelated layout and bootstraps settings/orders without new routes',async()=>{
 const live=readFileSync(process.env.MY_TIMBER_SHOP_LAYOUT||new URL('./fixtures/journey-shop-live-layout-20261031.txt',import.meta.url),'utf8');
 const updated=updateApprovedJourneyNavigation(live);assert.equal(updated.state,'approved-journey-applied');assert.ok(updated.source.includes('/member/life-back/journey#snapshot'));assert.equal(updateApprovedJourneyNavigation(updated.source).source,updated.source);
 assert.equal(updateApprovedJourneyNavigation('new unrelated owner source').source,'new unrelated owner source');new vm.Script(shopBootRuntime);new vm.Script(updated.source);
 const response=await withJourneyShopAssets(req('/my-timber-v11.js'),new Response('window.existingOwner=true;',{headers:{'Content-Type':'text/javascript'}}));const s=await response.text();assert.ok(s.startsWith('window.existingOwner=true;'));assert.ok(s.includes('orders|saved|plans|settings'));assert.equal((s.match(/Approved My Timber Journey\/Shop loader/g)||[]).length,1);new vm.Script(s);
});
