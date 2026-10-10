import test from 'node:test';import assert from 'node:assert/strict';
import {beginCommissioningGrubTimings,createGrubTimingCollector} from '../member-experience/grub-commissioning-timing.mjs';
test('disabled/ordinary requests and invalid OIDC cannot enable diagnostics',async()=>{
 for(const request of [new Request('https://test/v1/grub/workspace'),new Request('https://test/v1/grub/workspace',{headers:{'X-Shift-Commissioning-OIDC':'invalid'}}),new Request('https://test/v1/grub/workspace',{method:'POST'})])assert.equal(await beginCommissioningGrubTimings(request,{COMMISSIONING_GRUB_TIMING_ENABLED:'true'}),null);
 assert.equal(await beginCommissioningGrubTimings(new Request('https://test/v1/grub/workspace',{headers:{'X-Shift-Commissioning-OIDC':'invalid'}}),{}),null);
});
test('only authenticated fictional identity exposes timings; body/headers retained',async()=>{
 const c=createGrubTimingCollector();for(const auth of [{response:new Response(null,{status:401})},{user:{email:'customer@example.com'}}]){c.identity(auth);const r=new Response('exact',{headers:{'Cache-Control':'no-store'}});assert.equal(c.response(r),r);}
 c.identity({user:{email:'shiftsometimber+structured-authrender-live-1@gmail.com'}});
 const r=c.response(new Response('exact',{status:200,headers:{'Vary':'Cookie'}}));assert.equal(await r.text(),'exact');assert.equal(r.headers.get('Vary'),'Cookie');assert(r.headers.has('X-Shift-Commissioning-Timing'));
});
test('binding calls and metadata preserved; SQL/bind values never recorded',async()=>{
 const c=createGrubTimingCollector();c.identity({user:{email:'shiftsometimber+structured-authrender-live-1@gmail.com'}});
 const row={email:'private@example.com'},all={results:[row],meta:{duration:4.5}},calls=[];
 const statement={bind(...args){calls.push(args);return this},async first(column){return column?row[column]:row},async all(){return all},async run(){return all}};
 const db=c.wrapDB({prepare(sql){calls.push(sql);return statement}});
 assert.equal(await db.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind('sensitive').first(),row);
 assert.equal(await db.prepare('SELECT preferences FROM member_state WHERE user_id=?').first('email'),row.email);
 assert.equal(await db.prepare('SELECT id FROM structured_content').all(),all);assert.equal(await db.prepare('UPDATE user_sessions SET last_used_at=?').run(),all);
 await c.measure('catalogue',async()=>true);const output=c.response(new Response('{}'));const text=output.headers.get('X-Shift-Commissioning-Timing'),j=JSON.parse(text);
 assert.equal(j.database[0].executionMs,null);assert.equal(j.database[2].executionMs,4.5);assert.equal(j.database[3].executionMs,4.5);assert(!text.includes('sensitive'));assert(!text.includes('private@example.com'));assert(!text.includes('SELECT'));assert.equal(j.phases[0].name,'catalogue');
});
test('database failures retain failure and original exception; collector bounded',async()=>{
 const c=createGrubTimingCollector();c.identity({user:{email:'shiftsometimber+structured-authrender-live-1@gmail.com'}});const error=new Error('sensitive DB failure');const db=c.wrapDB({prepare(){return{async first(){throw error}}}});
 await assert.rejects(db.prepare('SELECT preferences FROM member_state').first(),e=>e===error);for(let i=0;i<30;i++)await c.measure('catalogue',async()=>true);
 const raw=c.response(new Response('{}')).headers.get('X-Shift-Commissioning-Timing'),j=JSON.parse(raw);assert.equal(j.database[0].ok,false);assert.equal(j.phases.length,24);assert.equal(j.overflow,true);assert(!raw.includes(error.message));
});
