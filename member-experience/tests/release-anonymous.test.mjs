import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyAnonymousMemberBoundaries} from '../../release/member-details-anonymous.mjs';
import {memberDetailsRoute} from '../member-details-routes.mjs';
import {memberDetailsLookupRoute} from '../member-details-lookups.mjs';
import {memberDeliveryRoute} from '../member-delivery-routes.mjs';

test('release probes exercise actual account routes using the correct methods without data access',async()=>{
  const calls=[];
  const env={DB:{prepare(){throw Error('Anonymous probe must not query or mutate member records');}}};
  const checks=await verifyAnonymousMemberBoundaries('https://shiftsometimber.co.uk',async(url,init)=>{
    assert.equal(init.credentials,'omit');
    assert.equal(init.redirect,'manual');
    assert(!init.headers.Cookie&&!init.headers.Authorization);
    const request=new Request(url,init);calls.push({method:request.method,path:new URL(url).pathname});
    return await memberDetailsLookupRoute(request,env)||await memberDeliveryRoute(request,env)||await memberDetailsRoute(request,env)||new Response(null,{status:404});
  });
  assert.equal(calls.length,6);
  assert.deepEqual(checks.map(c=>c.status),[401,401,401,405,401,403]);
  assert.equal(checks[4].method,'POST');assert.equal(checks[4].sameOrigin,true);
  assert.equal(checks[5].sameOrigin,false);
});

test('release probes reject anonymously accessible routes and redirects instead of following them',async()=>{
  for(const status of [200,302,500])await assert.rejects(
    verifyAnonymousMemberBoundaries('https://shiftsometimber.co.uk',async()=>new Response(null,{status})),
    /anonymous boundary/
  );
});

test('release probes reject a stale GET-only address handler',async()=>{
  await assert.rejects(verifyAnonymousMemberBoundaries('https://shiftsometimber.co.uk',async()=>new Response(null,{status:401})),/GET .*address-search.*anonymous boundary/);
});
