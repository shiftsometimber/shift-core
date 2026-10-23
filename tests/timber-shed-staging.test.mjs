import test from 'node:test';
import assert from 'node:assert/strict';
import staging from '../member-experience/timber-shed-staging-entry.mjs';
const origin='https://synthetic.test';
const env={SHIFT_ENVIRONMENT:'timber-shed-synthetic-acceptance',TIMBER_SHED_SYNTHETIC_ONLY:'true',SYNTHETIC_DB:{},SHED_ACCEPTANCE_AUTHORIZATION:'Basic ZmljdGlvbmFsOm9ubHk='};
test('acceptance host fails closed without its explicit synthetic environment, binding or secret',async()=>{
 for(const change of [{SHIFT_ENVIRONMENT:'production'},{TIMBER_SHED_SYNTHETIC_ONLY:'false'},{SYNTHETIC_DB:null}])
  assert.equal((await staging.fetch(new Request(origin),{...env,...change})).status,404);
 const denied=await staging.fetch(new Request(origin),env);assert.equal(denied.status,401);
 assert.equal(denied.headers.get('Cache-Control'),'private, no-store');
 assert.equal((await staging.fetch(new Request(origin,{headers:{Authorization:env.SHED_ACCEPTANCE_AUTHORIZATION}}),{...env,SHED_ACCEPTANCE_AUTHORIZATION:''})).status,401);
});
test('synthetic sessions require private authentication, same-origin POST and a fixed fictional role',async()=>{
 const request=(body,Origin=origin)=>new Request(origin+'/__synthetic/session',{method:'POST',headers:{Authorization:env.SHED_ACCEPTANCE_AUTHORIZATION,Origin},body});
 assert.equal((await staging.fetch(request('role=member-one','https://other.test'),env)).status,403);
 assert.equal((await staging.fetch(request('role=real-person'),env)).status,400);
 const response=await staging.fetch(request('role=member-one'),env);
 assert.equal(response.status,303);assert.equal(response.headers.get('Location'),'/member/timber-shed');
 assert.match(response.headers.get('Set-Cookie'),/HttpOnly; Secure; SameSite=Strict$/);
});
test('acceptance cannot expose unrelated APIs or public site features',async()=>{
 for(const path of ['/v1/auth/register','/v1/checkout','/programme','/__synthetic/session']){
  const response=await staging.fetch(new Request(origin+path,{headers:{Authorization:env.SHED_ACCEPTANCE_AUTHORIZATION}}),env);
  assert.equal(response.status,404,path);
 }
});

test('private selector preserves same-origin form navigation without weakening Origin checks',async()=>{
 const response=await staging.fetch(new Request(origin,{headers:{Authorization:env.SHED_ACCEPTANCE_AUTHORIZATION}}),env);
 assert.equal(response.status,200);assert.equal(response.headers.get('Referrer-Policy'),'same-origin');
 assert(!(await response.text()).includes(env.SHED_ACCEPTANCE_AUTHORIZATION));
 const denied=await staging.fetch(new Request(origin+'/__synthetic/session',{method:'POST',headers:{Authorization:env.SHED_ACCEPTANCE_AUTHORIZATION,Origin:'null'},body:'role=member-one'}),env);
 assert.equal(denied.status,403);
});
