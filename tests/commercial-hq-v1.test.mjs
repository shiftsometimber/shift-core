import test from 'node:test';
import assert from 'node:assert/strict';
import {commercialHqRoutes} from '../commercial-hq-v1.js';

test('non-HQ paths are ignored',async()=>assert.equal(await commercialHqRoutes(new Request('https://api.example/v1/other'),{}),null));
test('HQ catalogue rejects an unapproved origin before touching storage',async()=>{
  const response=await commercialHqRoutes(new Request('https://api.example/v1/hq/catalogue',{headers:{Origin:'https://evil.example','X-Shift-Admin-Key':'secret'}}),{ADMIN_API_KEY:'secret'});
  assert.equal(response.status,403);assert.equal((await response.json()).error,'origin_not_allowed');
});
test('HQ catalogue rejects a missing admin secret before touching storage',async()=>{
  const response=await commercialHqRoutes(new Request('https://api.example/v1/hq/catalogue',{headers:{Origin:'https://hq.shiftsometimber.co.uk'}}),{ADMIN_API_KEY:'secret'});
  assert.equal(response.status,401);assert.equal((await response.json()).error,'unauthorised');
});
