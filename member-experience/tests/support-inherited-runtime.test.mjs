import test from'node:test';import assert from'node:assert/strict';import{composeV6Owner}from'../support-release-gate.mjs';import{wrapSupportService}from'../support-release.mjs';
test('enabling support retains earlier browser-runtime repairs before applying its own recovery suffix',async()=>{
 const marker='/* My Timber six-page presentation recovery. No fabricated member data. */',original={fetch:async()=>new Response('BROKEN_SERIALIZED_PREFIX;'+marker+'oldSuffix',{headers:{'Content-Type':'text/javascript','X-Retained':'original'}})};
 const before=inner=>({fetch:async(...args)=>{const r=await inner.fetch(...args);return new Response((await r.text()).replace('BROKEN_SERIALIZED_PREFIX','CORRECT_NATIVE_PREFIX'),{headers:r.headers})}});
 const app=composeV6Owner(before,wrapSupportService,original),r=await app.fetch(new Request('https://shiftsometimber.co.uk/assets/my-timber-layout.mjs'),{MY_TIMBER_V6_RELEASE_ENABLED:'true'},{}),text=await r.text();
 assert(text.startsWith('CORRECT_NATIVE_PREFIX;'+marker));assert(!text.includes('BROKEN_SERIALIZED_PREFIX'));assert(!text.includes('oldSuffix'));assert(text.includes('mtSixNav'));assert.equal(text.split(marker).length,2);assert.equal(r.headers.get('X-Retained'),'original');
});
