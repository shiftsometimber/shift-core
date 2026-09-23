import test from 'node:test';import assert from 'node:assert/strict';
import {idealEnabled,mapIdealAddresses,createIdealSearch} from '../ideal-address.mjs';
import {addressLookupEnabled,addressLookupProvider,photonAddressRoute} from '../photon-address.mjs';
import {fixture} from '../../health-passport/fixture.mjs';
const env={MEMBER_ADDRESS_PROVIDER:'ideal-postcodes',MEMBER_ADDRESS_API_KEY:'test-only-key'};
const row=(patch={})=>({line_1:'Flat 2',line_2:'12 Example Street',line_3:'Example Village',post_town:'London',county:'',postcode:'SW1A 1AA',...patch});
const response=(...rows)=>({code:2000,result:rows});
test('licensed provider needs both explicit selection and a valid server secret',()=>{
 assert(idealEnabled(env));assert(addressLookupEnabled(env));assert.equal(addressLookupProvider(env),'ideal-postcodes');
 for(const e of [{},{MEMBER_ADDRESS_API_KEY:'old-key'},{...env,MEMBER_ADDRESS_PROVIDER:'photon'},{...env,MEMBER_ADDRESS_API_KEY:''},{...env,MEMBER_ADDRESS_API_KEY:'key"\r\n'}])assert.equal(idealEnabled(e),false);
 assert.equal(addressLookupProvider({MEMBER_ADDRESS_API_KEY:'old-key'}),null);
 assert.equal(addressLookupProvider({...env,MEMBER_ADDRESS_PROVIDER:'photon'}),'photon');
});
test('all 68 fictional results survive mapping, including flat and locality fields',()=>{
 const b=mapIdealAddresses(response(...Array.from({length:68},(_,i)=>row({line_1:'Flat '+(i+1),privateValue:'omit'}))),'sw1a1aa');
 assert.equal(b.addresses.length,68);assert.equal(b.addresses[67].address1,'Flat 68');assert.equal(b.addresses[0].address2,'12 Example Street, Example Village');assert.equal(b.mayHaveMore,false);assert(!JSON.stringify(b).includes('privateValue'));assert.equal(b.needsReview,true);
});
test('reject wrong postcodes, incomplete, unsafe and overlong fields without truncating addresses',()=>{
 for(const patch of [{postcode:'SW1A 2AA'},{post_town:''},{line_1:''},{line_1:'x'.repeat(121)},{line_2:'<script>'},{line_2:'x'.repeat(100),line_3:'y'.repeat(100)}, {county:3}])assert.throws(()=>mapIdealAddresses(response(row(patch)),'SW1A 1AA'));
 for(const body of [{code:4020},{code:2000,result:null},response(...Array(101).fill(row()))])assert.throws(()=>mapIdealAddresses(body,'SW1A 1AA'));
 assert.equal(mapIdealAddresses(response(...Array(100).fill(row())),'SW1A 1AA').mayHaveMore,true);
});
test('provider sees only postcode and minimal requested fields; key stays in server header',async()=>{
 const search=createIdealSearch({transport:async(url,opts)=>{
  const u=new URL(url);assert.equal(u.origin,'https://api.ideal-postcodes.co.uk');assert.equal(u.pathname,'/v1/postcodes/SW1A1AA');assert.equal(u.searchParams.get('filter'),'line_1,line_2,line_3,post_town,county,postcode');assert(!url.includes('key'));assert(!url.includes('ignored'));
  assert.equal(opts.headers.Authorization,'api_key="test-only-key"');assert.equal(opts.headers.Cookie,undefined);assert.equal(opts.credentials,'omit');assert.equal(opts.redirect,'manual');assert.equal(opts.referrerPolicy,'no-referrer');assert(opts.signal instanceof AbortSignal);
  return Response.json(response(row()));
 }});
 const b=await search({postcode:'sw1a 1aa',query:'ignored'},'member-private-id',env);assert.equal(b.addresses.length,1);assert(!JSON.stringify(b).includes('key'));
});
test('missing opt-in/key, invalid postcode and bursts never call upstream',async()=>{
 let calls=0,time=100000;const search=createIdealSearch({now:()=>time,transport:async()=>{calls++;return Response.json(response(row()));}});
 await assert.rejects(search({postcode:'SW1A 1AA'},1,{}));await assert.rejects(search({postcode:'bad'},1,env));assert.equal(calls,0);
 await search({postcode:'SW1A 1AA'},1,env);await assert.rejects(search({postcode:'SW1A 1AA'},2,env),e=>e.status===429);assert.equal(calls,1);
 time+=2000;await search({postcode:'SW1A 1AA'},2,env);assert.equal(calls,2);
});
test('404 postcode not found is empty; authentication, credit, redirect and invalid JSON failures stay failures',async()=>{
 const empty=createIdealSearch({transport:async()=>Response.json({code:4040},{status:404})});assert.deepEqual((await empty({postcode:'SW1A 1AA'},1,env)).addresses,[]);
 for(const make of [()=>Response.json({code:5000},{status:404}),()=>Response.json({code:4020},{status:402}),()=>new Response(null,{status:302}),()=>new Response('bad'),()=>Response.json({code:4010},{status:401})]){
  let calls=0,time=100000;const search=createIdealSearch({now:()=>time,transport:async()=>{calls++;return make();}});await assert.rejects(search({postcode:'SW1A 1AA'},1,env));time+=2000;await assert.rejects(search({postcode:'SW1A 1AA'},2,env));assert.equal(calls,1);
 }
});
test('oversized streamed response is cancelled before mapping',async()=>{
 let cancelled=false,reads=0;const search=createIdealSearch({transport:async()=>new Response(new ReadableStream({pull(c){reads++;c.enqueue(new Uint8Array(100001));},cancel(){cancelled=true;}},{highWaterMark:0}))});
 await assert.rejects(search({postcode:'SW1A 1AA'},1,env));assert(cancelled);assert.equal(reads,2);
});
test('licensed route preserves authentication, same-origin, content-type and input guards',async t=>{
 const f=fixture({seed:false});t.after(()=>f.close());Object.assign(f.env,env);
 const origin='https://shiftsometimber.co.uk';const req=(headers={},body={postcode:'SW1A 1AA',query:''},method='POST')=>new Request(origin+'/v1/member/details/address-search',{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:'sst_session=test-only-member-1',...headers},...(method==='POST'?{body:JSON.stringify(body)}:{})});
 assert.equal((await photonAddressRoute(req({Cookie:''}),f.env)).status,401);assert.equal((await photonAddressRoute(req({Origin:'https://evil.invalid'}),f.env)).status,403);assert.equal((await photonAddressRoute(req({'Content-Type':'text/plain'}),f.env)).status,415);assert.equal((await photonAddressRoute(req({},null,'GET'),f.env)).status,405);assert.equal((await photonAddressRoute(req({},{postcode:'SW1A 1AA',query:'',userId:2}),f.env)).status,400);
 f.env.MEMBER_ADDRESS_API_KEY='';assert.equal((await photonAddressRoute(req(),f.env)).status,503);
});
