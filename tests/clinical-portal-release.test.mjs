import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{existingHqIdentity} from '../clinical-assessment/portal-release-worker.mjs';
import {readFileSync} from 'node:fs';
test('additive portal serves the brand and only exact allowlisted assets',async()=>{
 for(const p of ['/clinical-portal','/clinical-portal/','/clinical-assets/client.mjs','/clinical-assets/hq.css']){const r=await worker.fetch(new Request('https://hq.shiftsometimber.co.uk'+p),{});assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/no-store/);assert.match(r.headers.get('Content-Security-Policy'),/frame-ancestors 'none'/);}
 assert.match(await(await worker.fetch(new Request('https://hq.shiftsometimber.co.uk/clinical-portal'),{})).text(),/awaiting commissioning/);
 for(const u of ['https://hq.shiftsometimber.co.uk/','https://shiftsometimber.co.uk/clinical-portal','https://hq.shiftsometimber.co.uk/clinical-assets/nope','https://hq.shiftsometimber.co.uk/clinical-portal-other'])assert.equal((await worker.fetch(new Request(u),{})).status,404);
 assert.equal((await worker.fetch(new Request('https://hq.shiftsometimber.co.uk/clinical-portal',{method:'POST'}),{})).status,405);
});
test('identity delegates only to existing HQ authentication with minimal headers',async()=>{
 const result=await existingHqIdentity(new Request('https://api.shiftsometimber.co.uk/v1/hq/clinical',{headers:{Cookie:'hq=opaque','X-User-Role':'clinical'}}),{},async(req)=>{assert.equal(req.url,'https://api.shiftsometimber.co.uk/v1/hq/me');assert.equal(req.headers.get('cookie'),'hq=opaque');assert.equal(req.headers.has('X-User-Role'),false);assert.equal(req.redirect,'manual');return Response.json({user:{id:7,role:'owner'}});});assert.equal(result.user.role,'owner');
});
test('unauthenticated and failed HQ authentication fail closed',async()=>{
 for(const [status,want] of [[401,401],[403,503],[500,503]]){const r=await existingHqIdentity(new Request('https://api.shiftsometimber.co.uk/v1/hq/clinical'),{},async()=>new Response('',{status}));assert.equal(r.response.status,want);}
});
test('infrastructure release cannot activate clinical access even with provider flags enabled',async()=>{
 const saved=globalThis.fetch;try{globalThis.fetch=async()=>Response.json({user:{id:7,role:'clinical'}});const r=await worker.fetch(new Request('https://api.shiftsometimber.co.uk/v1/hq/clinical'),{CLINICAL_CASEWORK_ENABLED:'true',CLINICAL_REVIEW_READY:'true',CLINICAL_CONTEXT_ENABLED:'true',HQ_AUTH:{fetch:globalThis.fetch},DB:{prepare(){throw Error('must not read patient data');}}});assert.equal(r.status,503);assert.equal((await r.json()).error,'clinical_casework_not_open');}finally{globalThis.fetch=saved;}
});
test('generated portal assets are exactly the validated runtime sources and route scope is additive',async()=>{
 const r=await worker.fetch(new Request('https://hq.shiftsometimber.co.uk/clinical-assets/client.mjs'),{});assert.equal(await r.text(),readFileSync(new URL('../clinical-assessment/hq-clinical-client.mjs',import.meta.url),'utf8'));
 const config=JSON.parse(readFileSync(new URL('../clinical-assessment/wrangler.portal-release.json',import.meta.url)));assert.equal(config.name,'shift-hq-clinical-portal');assert.equal(config.workers_dev,false);assert.equal(config.preview_urls,false);assert(config.routes.every(r=>r.pattern.includes('/clinical-')||r.pattern.includes('/v1/hq/clinical')));assert(Object.values(config.vars).every(v=>v==='false'));
});
test('fictional demo has no network permission and never opens live clinical flags',async()=>{
 const r=await worker.fetch(new Request('https://hq.shiftsometimber.co.uk/clinical-portal/demo'),{});assert.equal(r.status,200);assert.match(r.headers.get('Content-Security-Policy'),/connect-src 'none'/);const html=await r.text();assert.match(html,/demo-client.mjs/);assert.match(html,/fictional information only/);
 const script=await worker.fetch(new Request('https://hq.shiftsometimber.co.uk/clinical-assets/demo-client.mjs'),{});assert.match(await script.text(),/^import \{demoFetch as fetch\}/);
 const root=await worker.fetch(new Request('https://hq.shiftsometimber.co.uk/clinical-portal'),{});assert.doesNotMatch(await root.text(),/demo-client.mjs/);
});
