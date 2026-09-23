import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';
import {withMemberDetails,memberDetailsRuntime} from '../member-details.mjs';
import {memberDetailsRoute} from '../member-details-routes.mjs';
import {memberDeliveryRoute} from '../member-delivery-routes.mjs';
import {memberDetailsLookupRoute} from '../member-details-lookups.mjs';
import {readFileSync} from 'node:fs';
import {fixture} from '../../health-passport/fixture.mjs';
const origin='https://shiftsometimber.co.uk';
const req=(path,method='GET',headers={})=>new Request(origin+path,{method,headers:{Cookie:'sst_session=test-only-member-1',Origin:origin,'Content-Type':'application/json',...headers},...(method==='POST'?{body:JSON.stringify({postcode:'SW1A 1AA',query:''})}:{})});
test('home and delivery render editable autofill fields without lookup UI or runtime',()=>{
 const html=withMemberDetails('<html><body><main></main></body></html>');
 for(const id of ['memberAddress1','memberAddress2','memberTown','memberPostcode','memberDeliveryAddress1','memberDeliveryAddress2','memberDeliveryTown','memberDeliveryPostcode','memberDeliveryRecipient'])assert(html.includes('id="'+id+'"'));
 for(const text of ['memberFindAddress','memberAddressSelect','memberAddressQuery','memberDeliveryFind','memberDeliverySelect','memberDeliveryAddressQuery','Photon','Ideal Postcodes','OpenStreetMap','not connected']){assert(!html.includes(text),text);assert(!memberDetailsRuntime.includes(text),text);}
 assert(!memberDetailsRuntime.includes('address-search'));assert(html.includes('autocomplete="address-line1"'));assert(html.includes('autocomplete="shipping address-line1"'));assert(html.includes('memberGpSelect'));new vm.Script(memberDetailsRuntime);
});
test('stale flags or keys cannot advertise address lookup or call any address provider',async t=>{
 const f=fixture({seed:false});t.after(()=>f.close());f.db.exec('ALTER TABLE users ADD COLUMN phone TEXT;ALTER TABLE users ADD COLUMN date_of_birth TEXT;ALTER TABLE users ADD COLUMN postcode TEXT;ALTER TABLE users ADD COLUMN updated_at TEXT;');f.db.exec(readFileSync(new URL('../member-details.sql',import.meta.url),'utf8'));let calls=0;const before=globalThis.fetch;globalThis.fetch=async()=>{calls++;throw Error('Unexpected network call');};t.after(()=>{globalThis.fetch=before;});
 for(const provider of ['photon','ideal-postcodes',undefined]){
  Object.assign(f.env,{MEMBER_ADDRESS_PROVIDER:provider,MEMBER_ADDRESS_API_KEY:'unused-test-secret',MEMBER_GP_LOOKUP_ENABLED:'true'});
  const home=await(await memberDetailsRoute(req('/v1/member/details'),f.env)).json();assert.equal(home.addressLookupConfigured,false);assert.equal(home.gpLookupConfigured,true);
  const delivery=await(await memberDeliveryRoute(req('/v1/member/details/delivery'),f.env)).json();assert.equal(delivery.addressLookupConfigured,false);
  const old=await memberDetailsLookupRoute(req('/v1/member/details/address-search','POST'),f.env);assert.equal(old.status,410);assert.equal((await old.json()).error,'address_lookup_removed');
 }assert.equal(calls,0);
});
test('retired address route preserves anonymous and cross-origin boundaries',async t=>{
 const f=fixture({seed:false});t.after(()=>f.close());
 assert.equal((await memberDetailsLookupRoute(req('/v1/member/details/address-search'),f.env)).status,405);
 assert.equal((await memberDetailsLookupRoute(req('/v1/member/details/address-search','POST',{Cookie:''}),f.env)).status,401);
 assert.equal((await memberDetailsLookupRoute(req('/v1/member/details/address-search','POST',{Origin:'https://evil.invalid'}),f.env)).status,403);
});
