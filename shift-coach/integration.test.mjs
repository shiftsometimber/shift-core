import {library} from './voice.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {fixture,request,setupInput} from './test-fixture.mjs';
import {coachingRoutes} from './routes.mjs';import {load,mutate,activeConsent} from './store.mjs';
import {fastMemberStateRoute} from '../member-state-fast-v1.js';
import {myJourneyRoutes} from '../my-journey-v1.js';
import {privacyHealthErasureRoute} from '../privacy-health-erasure-route-v1.js';
import {runCoachingNight} from './night-job.mjs';
import {pendingFollowup,acknowledgeFollowup} from './followup-view.mjs';
import {withCoaching,coachingAsset} from './presentation.mjs';
import {readFileSync} from 'node:fs';
import {client} from './ui.mjs';
import {weeklyPlan} from './planning.mjs';

const env=DB=>({DB,MEMBER_EXPERIENCE_V1_ENABLED:'true'});
async function read(DB,id=1){const r=await coachingRoutes(request('GET',null,id),env(DB));return r.json();}
async function save(DB,input,id=1){return coachingRoutes(request('POST',{revision:(await read(DB,id)).revision,operationId:crypto.randomUUID(),...input},id),env(DB));}
async function start(DB,id=1){const r=await save(DB,setupInput((await read(DB,id)).revision),id);assert.equal(r.status,201);return read(DB,id);}
async function plan(DB,week='2026-10-02'){
 const saved=await mutate(DB,1,'test_weekly_plan',s=>({plan:weeklyPlan(s,week)}));
 return saved.result.plan;
}
test('a weekly plan follows changed feedback instead of reusing the earlier action',async t=>{
 const DB=fixture(t);let data=await start(DB);const first=await plan(DB);
 await save(DB,{kind:'accept',id:data.action.id});
 await save(DB,{kind:'outcome',id:data.action.id,value:'didnt-help'});
 data=await read(DB);const next=await plan(DB);
 assert.notEqual(next.id,first.id);assert.equal(next.title,data.action.title);
 assert.equal(next.actionId,data.action.id);
});
test('an earlier weekly plan cannot be accepted after the member changes approach',async t=>{
 const DB=fixture(t);const data=await start(DB),first=await plan(DB);
 await save(DB,{kind:'decline',id:data.action.id});
 const before=await read(DB);
 assert.equal((await save(DB,{kind:'plan-accept',id:first.id})).status,409);
 assert.deepEqual((await read(DB)).memory.derivedPlans,before.memory.derivedPlans);
});
test('a treatment-situation change retires the old weekly plan while retaining its history',async t=>{
 const DB=fixture(t);await start(DB);const first=await plan(DB);
 assert.equal((await save(DB,{kind:'plan-accept',id:first.id})).status,201);
 assert.equal((await save(DB,{kind:'mode',mode:'stopped'})).status,201);
 const data=await read(DB),old=data.memory.derivedPlans.find(p=>p.id===first.id);
 assert.equal(old.accepted,true);assert.equal(old.status,'superseded');
 assert.equal((await save(DB,{kind:'plan-accept',id:first.id})).status,409);
 const next=await plan(DB);assert.equal(next.reason,data.action.reason);
 assert.match(next.reason,/After treatment/);
});
test('unchanged legacy plans remain usable, but changed legacy plans do not',async t=>{
 const DB=fixture(t);await start(DB);const first=await plan(DB);
 await mutate(DB,1,'test_legacy_plan',s=>{delete s.weeklyPlans[0].actionId;return {};});
 const stored=(await load(DB,1)).state;
 assert.equal((await read(DB)).memory.derivedPlans[0].status,'current');
 assert.deepEqual((await load(DB,1)).state,stored,'Reading must not migrate or rewrite member records');
 assert.equal((await save(DB,{kind:'plan-accept',id:first.id})).status,201);
 await save(DB,{kind:'mode',mode:'stopped'});
 assert.equal((await read(DB)).memory.derivedPlans[0].status,'superseded');
 assert.equal((await save(DB,{kind:'plan-accept',id:first.id})).status,409);
});
test('weekly plans wait for wanted confirmation and do not turn an exhausted focus into a task',async t=>{
 const DB=fixture(t);let data=await start(DB);
 await save(DB,{kind:'accept',id:data.action.id});
 await save(DB,{kind:'outcome',id:data.action.id,value:'didnt-try'});
 assert.equal(await plan(DB),null);
 await save(DB,{kind:'wanted',yes:false});
 for(let i=0;i<library.length;i++){
  data=await read(DB);if(data.action.type==='member-choice')break;
  await save(DB,{kind:'decline',id:data.action.id});
 }
 assert.equal((await read(DB)).action.type,'member-choice');
 assert.equal(await plan(DB),null);
});
test('eight scripted visits retain useful feedback and reject obsolete plans across changing weeks',async t=>{
 const DB=fixture(t);let now=Date.parse('2026-10-02T12:00:00Z');
 t.mock.method(Date,'now',()=>now);
 let data=await start(DB);const goal=data.memory.facts.find(f=>f.key==='goal').value;
 const week=n=>{now=Date.parse('2026-10-02T12:00:00Z')+(n-1)*7*86400000;};
 const feedback=async value=>{const a=(await read(DB)).action;assert.equal((await save(DB,{kind:'accept',id:a.id})).status,201);assert.equal((await save(DB,{kind:'outcome',id:a.id,value})).status,201);return a;};
 const plans=[];
 await save(DB,{kind:'settings',settings:{proactive:true,followup:true,weeklyDay:5}});
 // Week 1: retain a helpful result.
 plans.push(await plan(DB));await feedback('helped');
 // Week 2: shrink a step that did not fit, including its prepared plan.
 week(2);await feedback('didnt-fit');data=await read(DB);
 assert.equal(data.action.minutes,1);plans.push(await plan(DB,'2026-10-09'));
 assert.equal(plans.at(-1).steps[0].minutes,1);
 // Week 3: a real correction invalidates the old week without dropping feedback.
 week(3);await save(DB,{kind:'fact',key:'week',value:'Two late shifts now; Wednesday morning is free'});
 data=await read(DB);assert.match(data.action.reason,/Wednesday/);assert.equal(data.memory.outcomes.length,2);
 // Week 4: stopping treatment retains the person and produces the current plan.
 week(4);const before=await plan(DB,'2026-10-23');plans.push(before);
 await save(DB,{kind:'mode',mode:'stopped'});data=await read(DB);
 assert.equal(data.memory.facts.find(f=>f.key==='goal').value,goal);
 assert.match(data.treatment.title,/After treatment/);
 assert.equal((await save(DB,{kind:'plan-accept',id:before.id})).status,409);
 assert.match((await plan(DB,'2026-10-23')).reason,/After treatment/);
 // Week 5: unhelpful feedback changes the approach and stays saved.
 week(5);const rejected=await feedback('didnt-help');data=await read(DB);
 assert.notEqual(data.action.type,rejected.type);assert(data.memory.rejections.includes(rejected.type));
 // Week 6: an untried step asks, rather than issuing a weekly plan regardless.
 week(6);await feedback('didnt-try');assert.equal(await plan(DB,'2026-11-06'),null);
 // Week 7: a break longer than a fortnight clears the backlog but keeps context.
 now+=15*86400000;const run=await runCoachingNight(env(DB),now);assert.equal(run.prepared,1);
 data=await read(DB);assert.match(data.action.tone,/Good to have you back/);
 assert.equal((await load(DB,1)).state.queue.length,0);
 await save(DB,{kind:'wanted',yes:true});
 // Week 8: a professional-help concern is rejected without losing ordinary history.
 now+=7*86400000;const beforeConcern=await read(DB);
 assert.equal((await save(DB,{kind:'fact',key:'week',value:'I keep being sick and cannot keep water down'})).status,422);
 data=await read(DB);assert.deepEqual(data.memory.facts,beforeConcern.memory.facts);
 assert.equal(data.memory.outcomes.length,4);
 assert.deepEqual(data.memory.outcomes.map(o=>o.value),['helped','didnt-fit','didnt-help','didnt-try']);
 assert.equal((await read(DB,2)).memory,null,'Other account stays isolated');
 assert.equal(data.modelCalls,0);
});
test('existing auth rejects anonymous, expired and cross-origin callers',async t=>{const DB=fixture(t);assert.equal((await coachingRoutes(new Request('https://shiftsometimber.co.uk/v1/shift-coach'),env(DB))).status,401);assert.equal((await coachingRoutes(request('POST',setupInput(0),1,{Origin:'https://evil.invalid'}),env(DB))).status,403);DB.sqlite.exec("UPDATE user_sessions SET expires_at='2020-01-01'");assert.equal((await coachingRoutes(request(),env(DB))).status,401);});
test('no context is a general read-only starter; setup prepares a reason with two confirmed facts',async t=>{const DB=fixture(t);const blank=await read(DB);assert.equal(blank.enabled,false);assert.equal(blank.action.general,true);assert.equal((await load(DB,1)).state,null);const data=await start(DB);assert.equal(data.enabled,true);assert.match(data.action.reason,/family/);assert.match(data.action.reason,/late shifts/);assert(data.action.dataUsed.every(id=>data.memory.facts.some(f=>f.id===id&&f.confirmed)));});
test('a second signed-in session reads the same action and feedback changes the next choice',async t=>{const DB=fixture(t);let a=await start(DB);const first=a.action.id;assert.equal((await read(DB)).action.id,first);assert.equal((await save(DB,{kind:'accept',id:first})).status,201);assert.equal((await read(DB)).action.status,'accepted');assert.equal((await save(DB,{kind:'outcome',id:first,value:'didnt-help'})).status,201);a=await read(DB);assert.notEqual(a.action.id,first);assert.notEqual(a.action.type,'food-plan');assert(a.memory.rejections.includes('food-plan'));});
test('did not fit makes the same goal smaller and did not try asks before accepting',async t=>{const DB=fixture(t);let a=await start(DB);await save(DB,{kind:'accept',id:a.action.id});await save(DB,{kind:'outcome',id:a.action.id,value:'didnt-fit'});a=await read(DB);assert.equal(a.action.minutes,1);await save(DB,{kind:'accept',id:a.action.id});await save(DB,{kind:'outcome',id:a.action.id,value:'didnt-try'});a=await read(DB);assert(a.action.awaitingWant);assert.equal((await save(DB,{kind:'accept',id:a.action.id})).status,409);await save(DB,{kind:'wanted',yes:false});assert(!(await read(DB)).action.awaitingWant);});
test('memory corrections cancel old plans and records do not leak across accounts',async t=>{const DB=fixture(t);let a=await start(DB);const old=a.action.id;await save(DB,{kind:'fact',key:'week',value:'Mornings are free now'});a=await read(DB);assert.notEqual(a.action.id,old);assert.match(a.action.reason,/Mornings/);assert(!a.memory.preparedActions.some(x=>x.id===old));assert.equal((await read(DB,2)).enabled,false);assert.equal((await save(DB,{kind:'accept',id:a.action.id},2)).status,409);assert.equal((await save(DB,{kind:'fact',key:'week',value:'x',userId:2})).status,400);});
test('health withdrawal and regrant cannot revive old context',async t=>{const DB=fixture(t);await start(DB);DB.sqlite.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)");assert.equal((await read(DB)).enabled,false);assert.equal((await save(DB,{kind:'fact',key:'week',value:'Free'})).status,409);DB.sqlite.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1)");assert.equal((await read(DB)).enabled,false);await start(DB);assert.equal((await load(DB,1)).state.consentId,(await activeConsent(DB,1)).id);});
test('stale tabs fail without losing newer context, and duplicate operations are idempotent',async t=>{const DB=fixture(t);const a=await start(DB);const body={kind:'fact',key:'week',value:'One late shift',revision:a.revision,operationId:crypto.randomUUID()};assert.equal((await coachingRoutes(request('POST',body),env(DB))).status,201);const duplicate=await coachingRoutes(request('POST',body),env(DB));assert.equal(duplicate.status,200);assert((await duplicate.json()).duplicate);assert.equal((await coachingRoutes(request('POST',{...body,value:'Stale overwrite',operationId:crypto.randomUUID()}),env(DB))).status,409);assert.match((await read(DB)).action.reason,/One late shift/);});
test('old whole-profile and Journey saves preserve the entire coach snapshot',async t=>{const DB=fixture(t);await start(DB);const before=(await load(DB,1)).state;const headers={Cookie:'sst_session=fixture-token-1','Content-Type':'application/json'};await fastMemberStateRoute(new Request('https://shiftsometimber.co.uk/v1/member-state',{method:'PATCH',headers,body:JSON.stringify({preferences:{old:'value',lifeBack:{progress:{shiftAI:{facts:[]}}}}})}),env(DB));assert.deepEqual((await load(DB,1)).state,before);const response=await myJourneyRoutes(new Request('https://shiftsometimber.co.uk/v1/my-journey',{method:'PATCH',headers,body:JSON.stringify({setup:{why:'Keep going'},lifeBack:{}})}),env(DB));assert.equal(response.status,200);assert.deepEqual((await load(DB,1)).state,before);});
test('a concurrent Life Back revision prevents coaching overwrite',async t=>{const DB=fixture(t);const a=await start(DB);DB.sqlite.prepare("UPDATE member_state SET preferences=json_set(preferences,'$.lifeBack.progress.revision',?) WHERE user_id=1").run(a.revision+1);assert.equal((await coachingRoutes(request('POST',{kind:'fact',key:'week',value:'Stale',revision:a.revision,operationId:crypto.randomUUID()}),env(DB))).status,409);});
test('deleting a memory item removes it and its derived content from the actual store',async t=>{const DB=fixture(t);const a=await start(DB),f=a.memory.facts.find(f=>f.key==='week');await save(DB,{kind:'delete-item',id:f.id});const text=DB.sqlite.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences;assert(!text.includes(f.value));assert(!text.includes(f.id));});
test('delete-all blocks an in-flight old snapshot and leaves other Life Back records',async t=>{const DB=fixture(t);const a=await start(DB);DB.sqlite.exec("UPDATE member_state SET preferences=json_set(preferences,'$.lifeBack.progress.goal','Keep this goal') WHERE user_id=1");assert.equal((await coachingRoutes(request('DELETE'),env(DB))).status,200);assert.equal((await read(DB)).enabled,false);assert.equal((await coachingRoutes(request('POST',{kind:'fact',key:'week',value:'Old context',revision:a.revision,operationId:crypto.randomUUID()}),env(DB))).status,409);assert.equal(JSON.parse(DB.sqlite.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences).lifeBack.progress.goal,'Keep this goal');});
test('existing optional-health erasure removes all coaching data atomically',async t=>{const DB=fixture(t);await start(DB);await start(DB,2);const r=await privacyHealthErasureRoute(new Request('https://shiftsometimber.co.uk/v1/privacy/health-tracking',{method:'DELETE'}),env(DB),{},async()=>Response.json({user:{id:1}}));assert.equal(r.status,200);assert.equal((await load(DB,1)).state,null);assert.equal((await read(DB)).consent,false);assert((await load(DB,2)).state);});
test('night preparation is opted-in, paged, repeat-safe, and never calls AI or sends externally',async t=>{const DB=fixture(t);await start(DB);assert.deepEqual(await runCoachingNight(env(DB)),{checked:0,prepared:0,conflicts:0,modelCalls:0,externalNotifications:0});await save(DB,{kind:'settings',settings:{proactive:true,weeklyDay:4}});const now=Date.parse('2026-10-01T20:00:00Z');const once=await runCoachingNight(env(DB),now);assert.equal(once.prepared,1);const state=(await load(DB,1)).state;assert.equal(state.weeklyPlans.length,1);assert.equal((await runCoachingNight(env(DB),now)).prepared,0);assert.deepEqual((await load(DB,1)).state,state);});
test('global off leaves prepared Today readable',async t=>{const DB=fixture(t);const a=await start(DB);assert((await runCoachingNight({...env(DB),SHIFT_COACH_OFF:'true'})).disabled);const r=await coachingRoutes(request(),{...env(DB),SHIFT_COACH_OFF:'true'});assert.equal((await r.json()).action.id,a.action.id);});
test('two unanswered follow-ups pause the type and explicit restoration is required',async t=>{
 const DB=fixture(t);await start(DB);await save(DB,{kind:'settings',settings:{proactive:true,followup:true}});
 const now=Date.now()+3*86400000;
 await mutate(DB,1,'fixture_ignored',s=>{s.touches=[1,2].map(i=>({id:crypto.randomUUID(),type:'followup',at:now-(i+1)*86400000,answered:false}));return{};});
 await runCoachingNight(env(DB),now);let data=await read(DB);assert(data.memory.pausedTypes.includes('followup'));
 const prompt=data.memory.pauseRequests[0];assert.equal(prompt.status,'queued');
 await save(DB,{kind:'pause-choice',id:prompt.id,yes:true});data=await read(DB);
 assert(!data.memory.pausedTypes.includes('followup'));assert.equal(data.memory.pauseRequests[0].status,'restored');
 await runCoachingNight(env(DB),now+86400000);assert.equal((await read(DB)).memory.pauseRequests.filter(x=>x.status==='queued').length,0);
});
test('follow-up respects permission, quiet hours, weekly cap and once per day',async t=>{const DB=fixture(t);const a=await start(DB);await save(DB,{kind:'settings',settings:{proactive:true,followup:true}});await save(DB,{kind:'accept',id:a.action.id});const s=(await load(DB,1)).state;const now=s.queue[0].dueAt+12*3600000;const daytime=new Date(now);daytime.setUTCHours(12,0,0,0);const at=daytime.getTime();const p=pendingFollowup(s,at);assert(p);acknowledgeFollowup(s,p.id,at);assert.equal(pendingFollowup(s,at),null);s.queue.push({...s.queue[0],id:crypto.randomUUID(),status:'queued'});s.touches=[];assert.equal(pendingFollowup(s,Date.parse('2026-10-09T05:00:00Z')),null);s.touches=[1,2,3].map(i=>({at:at-i*1000,type:'weekly'}));assert.equal(pendingFollowup(s,at),null);});
test('stopped and elsewhere modes retain history without dose nudges or medicine plans',async t=>{const DB=fixture(t);await start(DB);await save(DB,{kind:'mode',mode:'stopped'});const a=await read(DB);assert.equal(a.memory.mode,'stopped');assert.equal(a.memory.facts.length,3);assert(!/dose|taper|restart/i.test(a.action.title));await save(DB,{kind:'mode',mode:'elsewhere'});assert.equal((await read(DB)).memory.mode,'elsewhere');});
test('return after absence has one welcome and no backlog',async t=>{const DB=fixture(t);await start(DB);await save(DB,{kind:'settings',settings:{proactive:true}});const s=(await load(DB,1)).state;const now=s.lastActivity+15*86400000;await runCoachingNight(env(DB),now);const after=(await read(DB));assert.match(after.action.title,/restart/);assert.equal((await load(DB,1)).state.queue.length,0);});
test('clinical text is blocked before saving and no invented hand-off exists',async t=>{const DB=fixture(t);const a=await start(DB);for(const value of ['Change my dose to 5mg','I have chest pain','I am barely eating and making myself sick','I want to end my life']){assert.equal((await save(DB,{kind:'fact',key:'goal',value})).status,422);}assert.deepEqual((await read(DB)).memory.facts,a.memory.facts);assert.match(a.help.text,/Nobody is monitoring/);});
test('typographic punctuation does not bypass the finite support boundary',async t=>{const DB=fixture(t);const a=await start(DB);for(const value of ['I can’t go on','I haven’t eaten for three days','I’m 17 years old','I have side–effects'])assert.equal((await save(DB,{kind:'fact',key:'goal',value})).status,422);assert.deepEqual((await read(DB)).memory.facts,a.memory.facts);});
test('oversized streamed writes are stopped before buffering the complete body',async t=>{const DB=fixture(t);let pulls=0;const stream=new ReadableStream({pull(controller){pulls++;controller.enqueue(new Uint8Array(4097));}});const req=new Request('https://shiftsometimber.co.uk/v1/shift-coach',{method:'POST',headers:{Cookie:'sst_session=fixture-token-1',Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'},body:stream,duplex:'half'});assert.equal((await coachingRoutes(req,env(DB))).status,413);assert(pulls<=2);assert.equal((await read(DB)).enabled,false);});
test('weekly assessment stays personal, honours weight-plus-components and changes tone',async t=>{const DB=fixture(t);await start(DB);assert.equal((await save(DB,{kind:'components',components:['weight']})).status,400);await save(DB,{kind:'review',rating:1});await save(DB,{kind:'review',rating:2});const a=await read(DB);assert.equal(a.review.combinedScore,null);assert.equal(a.memory.stage,'Hit a wall');assert.match(a.action.tone,/hard week/);});
test('wrapper changes only dashboard and preserves body, chrome and originals',async()=>{const publicResponse=new Response('<main>Public</main>',{headers:{'Content-Type':'text/html'}});assert.equal(await withCoaching(new Request('https://shiftsometimber.co.uk/treatment-centre'),publicResponse),publicResponse);const html='<html><body><header id="approved">Keep</header><section id="panel-today"><div id="todayActions">Original tools</div></section><footer id="sst-footer-c">Footer</footer></body></html>';const result=await withCoaching(new Request('https://shiftsometimber.co.uk/member/dashboard'),new Response(html,{headers:{'Content-Type':'text/html','Content-Length':'100'}}));const text=await result.text();assert(text.includes('<header id="approved">Keep</header>'));assert(text.includes('Original tools</div>'));assert(!text.includes('<body data-shift-coach-session>'));assert.equal((text.match(/id="todayActions"/g)||[]).length,1);assert(text.includes('<footer id="sst-footer-c">Footer</footer>'));assert.equal((text.match(/id="shiftCoach"/g)||[]).length,1);assert.equal(result.headers.get('Content-Length'),null);assert.match(result.headers.get('Cache-Control'),/private/);assert.equal((await coachingAsset(new Request('https://shiftsometimber.co.uk/assets/shift-coach.mjs')).text()),client);new Function(client);});
test('production config differs only in entrypoint; test fixture cannot be reached through production graph',()=>{const source=readFileSync('wrangler.jsonc','utf8');assert.equal(readFileSync('wrangler.coaching.jsonc','utf8'),source.replace('"main": "worker-entry-v6.js"','"main": "shift-coach/worker.mjs"'));for(const f of ['worker','routes','store','night-job','presentation'])assert(!readFileSync('shift-coach/'+f+'.mjs','utf8').includes('./test-fixture'));});

test('fresh prepared seed stays private and cannot inject instructions or executable HTML',async()=>{
 const seed={enabled:true,memory:{goal:'</script><script>window.bad=true</script> & <tag>'},action:{title:'Prepared',reason:'Confirmed context'}};
 const source='<html><head><title>Keep</title></head><body><section id="previewMember" hidden><section id="panel-today"><div id="todayActions">Keep tools</div></section></section></body></html>';
 const r=await withCoaching(new Request('https://shiftsometimber.co.uk/member/dashboard'),new Response(source,{headers:{'Content-Type':'text/html','ETag':'old'}}),seed);const text=await r.text();
 const json=text.match(/<script type="application\/json" id="shiftCoachInitial">(.*?)<\/script>/s)[1];assert.deepEqual(JSON.parse(json),seed);assert(!json.includes('<'));assert(!text.includes('<script>window.bad'));assert.match(r.headers.get('Cache-Control'),/no-store, private/);assert.equal(r.headers.get('Vary'),'Cookie, Accept-Encoding');assert.equal(r.headers.get('ETag'),null);assert(text.indexOf('data-shift-coach-styles')<text.indexOf('</head>'));assert(text.includes('<script data-shift-coach-client>'));assert(text.includes('<body data-shift-coach-session>'));assert(text.includes('<section id="previewMember">'));const anonymous=await withCoaching(new Request('https://shiftsometimber.co.uk/member/dashboard'),new Response(source,{headers:{'Content-Type':'text/html'}}));assert((await anonymous.text()).includes('<section id="previewMember" hidden>'));assert(!text.includes('<script async src="/assets/shift-coach.mjs">'));
 const unchanged=new Response('Public',{headers:{'Content-Type':'text/html'}});assert.equal(await withCoaching(new Request('https://shiftsometimber.co.uk/programme'),unchanged,seed),unchanged);
});

// A real browser receives the same private document after decoding; q=0
// explicitly keeps identity transport rather than silently compressing it.
test('private dashboard compression preserves content and honours gzip refusal',async()=>{
 const html='<html><head></head><body><div id="todayActions">Keep tools</div></body></html>';
 const respond=encoding=>withCoaching(new Request('https://shiftsometimber.co.uk/member/dashboard',{headers:{'Accept-Encoding':encoding}}),new Response(html,{headers:{'Content-Type':'text/html'}}));
 const plain=await respond('gzip;q=0, identity');assert.equal(plain.headers.get('Content-Encoding'),null);const expected=await plain.text();
 const compressed=await respond('br, gzip;q=0.8');assert.equal(compressed.headers.get('Content-Encoding'),'gzip');assert.equal(compressed.headers.get('Vary'),'Cookie, Accept-Encoding');assert.match(compressed.headers.get('Cache-Control'),/no-store, private/);
 assert.equal(await new Response(compressed.body.pipeThrough(new DecompressionStream('gzip'))).text(),expected);
});

test('practical steps and tool links survive acceptance; did-not-fit is visibly smaller',async t=>{const DB=fixture(t);let a=await start(DB);assert(a.action.task.steps.length>=2);assert.equal(a.action.task.link.url,'/member/grub');await save(DB,{kind:'accept',id:a.action.id});assert((await read(DB)).action.task.steps.length>=2);await save(DB,{kind:'outcome',id:a.action.id,value:'didnt-fit'});const small=await read(DB);assert.notEqual(small.action.title,a.action.title);assert.equal(small.action.task.steps.length,1);assert.equal(small.action.minutes,1);assert.notDeepEqual(small.action.task.steps,a.action.task.steps);});
test('exhausted suggestions expose choices; changing focus keeps feedback; retry needs explicit restoration',async t=>{const DB=fixture(t);let a=await start(DB);for(let i=0;i<library.length&&a.action?.type!=='member-choice';i++){await save(DB,{kind:'decline',id:a.action.id});a=await read(DB);}assert.equal(a.action.type,'member-choice');assert.equal((await save(DB,{kind:'accept',id:a.action.id})).status,409);assert(a.choices.find(x=>x.focus==='food').restore);assert(!a.choices.find(x=>x.focus==='movement').restore);const rejects=[...a.memory.rejections];await save(DB,{kind:'focus',focus:'movement',restore:false});a=await read(DB);assert.equal(a.action.type,'movement-plan');assert.deepEqual(a.memory.rejections,rejects);await save(DB,{kind:'focus',focus:'food',restore:false});assert.equal((await read(DB)).action.type,'member-choice');await save(DB,{kind:'focus',focus:'food',restore:true});a=await read(DB);assert.equal(a.action.type,'food-plan');assert.equal(a.memory.rejections.length,0);assert.equal((await save(DB,{kind:'focus',focus:'dose',restore:true})).status,400);});
test('treatment phases have different practical support without losing outcomes or becoming dose advice',async t=>{const DB=fixture(t);let a=await start(DB);await save(DB,{kind:'accept',id:a.action.id});await save(DB,{kind:'outcome',id:a.action.id,value:'helped'});a=await read(DB);const before=a.memory.outcomes;await save(DB,{kind:'mode',mode:'stopped'});const stopped=await read(DB);assert.notEqual(stopped.treatment.title,a.treatment.title);assert.notEqual(stopped.action.title,a.action.title);assert.notDeepEqual(stopped.action.task.steps,a.action.task.steps);assert.match(stopped.treatment.text,/food noise/);assert.deepEqual(stopped.memory.outcomes,before);await save(DB,{kind:'fact',key:'week',value:'Food noise is back in the evenings'});assert.match((await read(DB)).action.task.steps.join(' '),/food thoughts/);await save(DB,{kind:'mode',mode:'shift'});assert.match((await read(DB)).treatment.clinical,/does not send/);});
test('ordinary illness language is not stored; safe everyday idioms still work',async t=>{const DB=fixture(t);await start(DB);const before=await read(DB);for(const value of ['I keep being sick and cannot keep water down','I can’t keep fluids down','I cannot keep down any water','I am throwing up again','My stomach hurts','I feel dizzy','My knee aches','I can not keep liquids down']){const r=await save(DB,{kind:'fact',key:'week',value});assert.equal(r.status,422,value);assert((await r.json()).help);assert.deepEqual((await read(DB)).memory.facts,before.memory.facts);}for(const value of ['I am sick of takeaway every night','I want to keep water nearby','Food noise is back at night','I had a busy week'])assert.equal((await save(DB,{kind:'fact',key:'week',value})).status,201,value);});
test('previously saved illness context cannot serve an action or a follow-up after the boundary changes',async t=>{const DB=fixture(t);let a=await start(DB);await save(DB,{kind:'accept',id:a.action.id});await mutate(DB,1,'synthetic_legacy_illness',s=>{s.facts.find(f=>f.key==='week').value='I keep being sick and cannot keep water down';return{dataUsed:[]};});const legacy=await read(DB);assert.equal(legacy.action,null);assert.equal(legacy.supportRequired,true);assert.equal(legacy.followup,null);assert.equal((await save(DB,{kind:'outcome',id:a.action.id,value:'helped'})).status,409);await save(DB,{kind:'refresh'});assert.equal((await load(DB,1)).state.nightRuns.at(-1).outcome,'support_required');await save(DB,{kind:'fact',key:'week',value:'One busy evening'});assert((await read(DB)).action.task);assert.equal((await read(DB)).supportRequired,false);});
test('existing stylesheet preloads preserve previous Link headers without preloading scripts or foreign URLs',async()=>{const html='<html><head><link rel="stylesheet" href="/existing.css?v=1"><link rel="stylesheet" href="https://foreign.invalid/style.css"><script src="/analytics.js"></script></head><body><div id="todayActions">Keep</div></body></html>';const r=await withCoaching(new Request('https://shiftsometimber.co.uk/member/dashboard'),new Response(html,{headers:{'Content-Type':'text/html',Link:'</keep.css>; rel=preload; as=style'}}));assert.equal(r.headers.get('Link'),'</keep.css>; rel=preload; as=style, </existing.css?v=1>; rel=preload; as=style');assert((await r.text()).includes('<script src="/analytics.js"></script>'));});

test('accepted action survives weekly review and remains answerable; smaller helpful step is retained',async t=>{const DB=fixture(t);let a=await start(DB);await save(DB,{kind:'accept',id:a.action.id});const id=a.action.id;await save(DB,{kind:'review',rating:3});a=await read(DB);assert.equal(a.action.id,id);assert.equal(a.action.status,'accepted');assert.equal((await save(DB,{kind:'outcome',id,value:'didnt-fit'})).status,201);a=await read(DB);await save(DB,{kind:'accept',id:a.action.id});await save(DB,{kind:'outcome',id:a.action.id,value:'helped'});a=await read(DB);assert.equal(a.action.minutes,1);assert.equal(a.action.task.steps.length,1);assert(a.action.keepSuccessful);assert.match(a.review.win.text,/Name one familiar meal/);});
test('weekly plan follows source action and an obsolete plan cannot be accepted',async t=>{const DB=fixture(t);let a=await start(DB);await save(DB,{kind:'settings',settings:{proactive:true,weeklyDay:4}});await runCoachingNight(env(DB),Date.parse('2026-10-01T20:00:00Z'));const old=(await load(DB,1)).state.weeklyPlans[0];await save(DB,{kind:'accept',id:a.action.id});await save(DB,{kind:'outcome',id:a.action.id,value:'didnt-help'});assert.equal((await save(DB,{kind:'plan-accept',id:old.id})).status,409);assert.equal((await read(DB)).memory.derivedPlans.find(p=>p.id===old.id).status,'superseded');});
test('explicit practical constraints change instructions and invalidate previous data dependencies',async t=>{const DB=fixture(t);let a=await start(DB);const old=a.action;await save(DB,{kind:'constraints',constraints:{kitchen:'no-cook',time:'short',budget:'tight'}});a=await read(DB);assert.equal(a.action.type,'food-assemble');assert.match(a.action.task.steps.join(' '),/without cooking|no-cook|sandwich/);assert(!a.action.task.steps.join(' ').includes('Toast the bread'));assert.notEqual(a.action.id,old.id);assert.equal((await save(DB,{kind:'accept',id:old.id})).status,409);assert.equal((await save(DB,{kind:'constraints',constraints:{cost:'anything'}})).status,400);});
test('two unsuccessful approaches ask for blocker, then use the explicit answer without erasing rejection history',async t=>{const DB=fixture(t);let a=await start(DB);for(let i=0;i<2;i++){await save(DB,{kind:'accept',id:a.action.id});await save(DB,{kind:'outcome',id:a.action.id,value:'didnt-help'});a=await read(DB);}assert(a.memory.pendingBlocker);assert.equal(a.action.type,'member-choice');const rejected=a.memory.rejections;await save(DB,{kind:'blocker',blocker:'equipment'});a=await read(DB);assert(a.action.type.startsWith('food-'));assert(!rejected.includes(a.action.type));assert.match(a.action.task.steps.join(' '),/no-cook|without cooking/);assert.deepEqual(a.memory.rejections,rejected);assert.equal(a.memory.pendingBlocker,null);assert.equal(a.memory.constraints.kitchen,'no-cook');});
test('never-treated and planning-for-stop modes are truthful, with no implicit followup or treatment decisions',async t=>{const DB=fixture(t);await start(DB);await save(DB,{kind:'mode',mode:'none'});let a=await read(DB);assert.match(a.treatment.text,/without taking medication/);assert.equal(a.followup,null);await save(DB,{kind:'mode',mode:'planning-stop'});a=await read(DB);assert.match(a.treatment.clinical,/prescriber/);assert(a.journey.completionInferred===false);});
test('explicit followup at acceptance and opt-in afterwards schedule once; unrelated review preserves it',async t=>{const DB=fixture(t);let a=await start(DB);await save(DB,{kind:'accept',id:a.action.id,followup:true});let s=(await load(DB,1)).state;assert.equal(s.queue.length,1);assert(s.actions.find(x=>x.id===a.action.id).acceptedAt);await save(DB,{kind:'settings',settings:{proactive:true,followup:true}});assert.equal((await load(DB,1)).state.queue.length,1);await save(DB,{kind:'review',rating:4});assert.equal((await load(DB,1)).state.queue.length,1);});
test('help requests require explicit sharing, are isolated and idempotent, and cannot turn symptoms into coaching tickets',async t=>{const DB=fixture(t);let a=await start(DB);await start(DB,2);assert((await read(DB)).support.available);assert.equal((await save(DB,{kind:'support-request',message:'Help choosing a no-cook meal',share:false})).status,400);const input={kind:'support-request',message:'Help choosing a no-cook meal',share:true,revision:a.revision,operationId:crypto.randomUUID()};let r=await coachingRoutes(request('POST',input),env(DB));assert.equal(r.status,201);const ticket=(await r.json()).reference;assert.equal((await coachingRoutes(request('POST',input),env(DB))).status,201);assert.equal(DB.sqlite.prepare('SELECT COUNT(*) n FROM support_tickets').get().n,1);assert.equal((await read(DB,2)).support.tickets.length,0);assert.equal((await save(DB,{kind:'support-request',message:'I keep being sick',share:true})).status,422);DB.sqlite.prepare("UPDATE support_tickets SET status='closed',closed_at='2026-10-02' WHERE reference=?").run(ticket);assert.equal((await save(DB,{kind:'support-reopen',reference:ticket})).status,201);assert.equal((await read(DB)).support.tickets[0].status,'open');assert.equal((await save(DB,{kind:'support-reopen',reference:ticket},2)).status,404);});
test('help request admission cap holds and the ordinary queue is labelled honestly',async t=>{const DB=fixture(t);await start(DB);for(let i=0;i<3;i++)assert.equal((await save(DB,{kind:'support-request',message:'I need help choosing an everyday step '+i,share:true})).status,201);assert.equal((await save(DB,{kind:'support-request',message:'Another everyday request',share:true})).status,409);assert.equal((await read(DB)).support.responsePromise,null);});
test('selected difficulty drives practical help and is remembered across sessions without guessing',async t=>{
 const DB=fixture(t);await start(DB);
 for(const [challenge,type] of [['weekends','food-social'],['evenings','food-evening'],['setback','food-default'],['returning-food-noise','food-evening'],['busy-days','food-default']]){
  assert.equal((await save(DB,{kind:'fact',key:'challenge',value:challenge})).status,201);
  const next=await read(DB);assert.equal(next.action.type,type);assert.equal(next.action.challenge,challenge);assert(next.action.task.steps.length>=2);assert(next.action.dataUsed.includes(next.memory.facts.find(f=>f.key==='challenge').id));assert.match(next.action.reason,/hardest right now/);
 }
 assert.equal((await save(DB,{kind:'fact',key:'challenge',value:'unknown-challenge'})).status,400);
 const persisted=await read(DB);assert.equal(persisted.memory.facts.find(f=>f.key==='challenge').value,'busy-days');assert.equal((await read(DB,2)).enabled,false);
});
test('did not help changes strategy rather than swapping one meal-planning task for another',async t=>{
 const DB=fixture(t);let next=await start(DB);const previous=next.action;
 await save(DB,{kind:'accept',id:previous.id});await save(DB,{kind:'outcome',id:previous.id,value:'didnt-help'});next=await read(DB);
 assert.notEqual(next.action.approach,previous.approach);assert.match(next.action.reason,/didn’t help.*different approach/);assert.equal(next.memory.outcomes.at(-1).title,previous.task.title);
 for(let i=0;i<3;i++){await save(DB,{kind:'review',rating:3});next=await read(DB);assert.notEqual(next.action.approach,previous.approach);}
 await save(DB,{kind:'focus',focus:'movement',restore:false});assert.equal((await read(DB)).action.type,'movement-plan');
});
test('did not fit preserves the selected approach and helpful feedback keeps the useful step',async t=>{
 const DB=fixture(t);await start(DB);await save(DB,{kind:'fact',key:'challenge',value:'weekends'});let next=await read(DB);const previous=next.action;
 await save(DB,{kind:'accept',id:previous.id});await save(DB,{kind:'outcome',id:previous.id,value:'didnt-fit'});next=await read(DB);
 assert.equal(next.action.type,previous.type);assert.equal(next.action.approach,previous.approach);assert.equal(next.action.minutes,1);assert.equal(next.action.task.steps.length,1);assert.match(next.action.reason,/makes the first step smaller/);
 await save(DB,{kind:'accept',id:next.action.id});await save(DB,{kind:'outcome',id:next.action.id,value:'helped'});next=await read(DB);assert.equal(next.action.type,previous.type);assert.match(next.action.reason,/last step helped/);
});
test('corrected or deleted context cannot keep an old feedback explanation in the next action',async t=>{
 const DB=fixture(t);let next=await start(DB);await save(DB,{kind:'accept',id:next.action.id});await save(DB,{kind:'outcome',id:next.action.id,value:'didnt-help'});assert.match((await read(DB)).action.reason,/didn’t help/);
 await save(DB,{kind:'fact',key:'week',value:'A new routine, mornings suit me'});next=await read(DB);assert.match(next.action.reason,/A new routine/);assert.doesNotMatch(next.action.reason,/didn’t help|late shifts/);
 const week=next.memory.facts.find(f=>f.key==='week');await save(DB,{kind:'delete-item',id:week.id});assert.doesNotMatch((await read(DB)).action.reason,/A new routine/);
});

test('dashboard sends only active prepared actions while stored feedback and action history remain intact',async t=>{
 const DB=fixture(t);let next=await start(DB);
 for(let i=0;i<4;i++){await save(DB,{kind:'accept',id:next.action.id});await save(DB,{kind:'outcome',id:next.action.id,value:'helped'});next=await read(DB);}
 assert.equal(next.memory.preparedActions.length,1);assert.equal(next.memory.outcomes.length,4);
 const stored=(await load(DB,1)).state;assert.equal(stored.actions.filter(a=>a.status==='completed').length,4);assert.equal(stored.outcomes.length,4);
});

test('confirmed practical constraints keep feedback explanations until those constraints change',async t=>{
 const DB=fixture(t);await start(DB);
 await save(DB,{kind:'constraints',constraints:{kitchen:'no-cook',time:'short',budget:'tight'}});
 let next=await read(DB);const first=next.action;
 await save(DB,{kind:'accept',id:first.id});await save(DB,{kind:'outcome',id:first.id,value:'didnt-help'});
 next=await read(DB);assert.notEqual(next.action.approach,first.approach);assert.match(next.action.reason,/didn’t help.*different approach/);
 await save(DB,{kind:'constraints',constraints:{kitchen:'cook',time:'flexible',budget:'regular'}});
 next=await read(DB);assert.doesNotMatch(next.action.reason,/didn’t help/);
 assert.equal(next.memory.outcomes.at(-1).title,first.task.title);
});
