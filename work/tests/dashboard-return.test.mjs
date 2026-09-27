import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {workRoutes} from '../routes.mjs';
const pinned=JSON.parse(readFileSync(new URL('../../programme/test-support/pinned-dashboard-return.json',import.meta.url)));
test('Both workplace audiences return through the existing My Timber sign-in destination',async()=>{
 for(const path of ['/member/work','/employer/work']){
  const r=await workRoutes(new Request('https://test.invalid'+path),{WORK_V1_ENABLED:'true'},{authenticate:async()=>({response:new Response(null,{status:401})})});
  assert.equal(r.status,303);const destination=new URL(r.headers.get('Location'),'https://test.invalid');assert.equal(destination.pathname,'/member/dashboard');
  const ctx={URLSearchParams,location:{search:destination.search}};vm.createContext(ctx);vm.runInContext(pinned.returnFunction,ctx);assert.equal(vm.runInContext('requestedDestination()',ctx),path);
 }
});
