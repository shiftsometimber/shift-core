import test from 'node:test';import assert from 'node:assert/strict';import {reportWorker} from '../hq-reporting-entry.mjs';
const base='https://api.shiftsometimber.co.uk',origin='https://hq.shiftsometimber.co.uk',path='/v1/hq/management/report?kind=growth&start=2026-10-08&end=2026-10-18';
test('delegates real session validation to fixed existing auth endpoint and forwards no unrelated headers',async()=>{
 let called=0;const worker=reportWorker(async(url,options)=>{called++;assert.equal(url,base+'/v1/hq/me');assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.equal(options.headers.get('Cookie'),'sst_hq_session=fixture');assert.equal(options.headers.get('X-Admin-Key'),null);return Response.json({ok:false,error:'hq_session_expired'},{status:401});});
 const response=await worker.fetch(new Request(base+path,{headers:{Cookie:'sst_hq_session=fixture',Origin:origin,'X-Admin-Key':'not-forwarded'}}),{DB:{prepare(){throw Error('No query before auth')}}},{});
 assert.equal(response.status,401);assert.equal(called,1);assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);assert.equal(response.headers.get('Cache-Control'),'no-store');
});
test('other HQ, GP, partner, staff, login and public paths are not served',async()=>{
 const worker=reportWorker(()=>{throw Error('No auth permitted')});
 for(const path of ['/v1/hq/me','/v1/hq/auth/login','/v1/hq/management/partners','/v1/hq/management/gp-directory','/v1/hq/management/users/1','/'])assert.equal((await worker.fetch(new Request(base+path),{},{})).status,404);
});
test('preflight permits only existing HQ origin',async()=>{
 const worker=reportWorker(()=>{throw Error('No auth for preflight')});
 assert.equal((await worker.fetch(new Request(base+path,{method:'OPTIONS',headers:{Origin:origin}}),{},{})).status,204);
 const bad=await worker.fetch(new Request(base+path,{method:'OPTIONS',headers:{Origin:'https://untrusted.example'}}),{},{});assert.equal(bad.status,403);assert.equal(bad.headers.get('Access-Control-Allow-Origin'),null);
});
test('unavailable upstream auth fails closed without private contents or database reads',async()=>{
 const response=await reportWorker(async()=>{throw Error('private upstream diagnostics')}).fetch(new Request(base+path),{DB:{prepare(){throw Error('No database read')}}},{});
 assert.equal(response.status,503);assert.deepEqual(await response.json(),{ok:false,error:'reporting_unavailable'});
});
test('upstream non-CRM role cannot get a report',async()=>{
 const response=await reportWorker(async()=>Response.json({ok:true,user:{id:1},permissions:[]})).fetch(new Request(base+path),{DB:{prepare(){throw Error('No database read')}}},{});
 assert.equal(response.status,403);
});
test('foreign-origin export rejected after ordinary session authentication',async()=>{
 const response=await reportWorker(async()=>Response.json({ok:true,user:{id:1},permissions:['*']})).fetch(new Request(base+'/v1/hq/management/export',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:'{}'}),{DB:{prepare(){throw Error('No export before origin check')}}},{});
 assert.equal(response.status,403);
});
