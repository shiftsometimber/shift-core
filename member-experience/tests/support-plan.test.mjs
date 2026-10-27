import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyLifeBack,applyLifeBackOperation,lifeBackRoutes} from '../life-back-routes.mjs';
import {supportPlanRoutes,supportTryRuntime} from '../support-plan-pages.mjs';
import {supportSummary,supportChoices} from '../support-plan.mjs';
import {fixture} from '../../health-passport/fixture.mjs';

const at='2026-10-01T12:00:00Z';
const op=(s,action,rest={},date=at)=>applyLifeBackOperation(s,{action,revision:s.revision,operationId:'support-'+crypto.randomUUID(),...rest},date);
const start=choice=>op(emptyLifeBack(),'support-start',{choice:choice||'late'});

test('C1 new signed-out route supplies only labelled general examples and no member state',async()=>{
 const env={MEMBER_EXPERIENCE_V1_ENABLED:'true'},url='https://stage/member/get-started/try';
 const r=supportPlanRoutes(new Request(url),env),html=await r.text();
 assert.equal(r.status,200);assert.match(html,/fictional examples/i);assert.match(html,/data-try-choice="late"/);assert.match(html,/support-try.mjs/);
 assert.doesNotMatch(supportTryRuntime,/fetch\(|localStorage|sessionStorage|sendBeacon/);
 assert.equal((await supportPlanRoutes(new Request(url,{method:'HEAD'}),env).text()),'');
 assert.equal(supportPlanRoutes(new Request(url,{method:'POST'}),env),null);
 for(const choice of Object.keys(supportChoices)){const s=start(choice);assert(s.nextShift.practical.steps.length);assert(s.nextShift.practical.fallback);assert.equal(s.entries.length,0);assert.equal(s.nextShift.status,'planned');}
});
test('C2 timing, effort and idea create three materially different practical offers',()=>{
 const s=start(),next=['timing','effort','idea'].map(reason=>op(s,'shift-feedback',{shiftId:s.nextShift.id,outcome:'not-fit',reason}));
 assert.equal(new Set(next.map(n=>n.nextShift.practical.key)).size,3);
 assert.equal(next[0].nextShift.practical.key,'earlier');assert.equal(next[1].nextShift.practical.key,'assembly');assert.equal(next[2].nextShift.practical.key,'eggs');
 for(const n of next)assert.notEqual(n.nextShift.id,s.nextShift.id);
});
test('C3 dated actual answers retire after resolution, correction or staleness',()=>{
 const s=start(),summary=supportSummary(s,at);assert.equal(summary.memory.text,supportChoices.late.label);assert.equal(summary.memory.at,at);
 assert.equal(supportSummary(s,'2026-10-09T12:00:00Z').memory,null);
 const m=s.memberSupport.memories[0],edited=op(s,'support-memory',{memoryId:m.id,words:'My shifts changed; that is no longer the problem.'},'2026-10-02T12:00:00Z');
 assert.equal(edited.memberSupport.memories[0].at,at);assert.equal(supportSummary(edited,at).memory,null);
 const helped=op(s,'shift-feedback',{shiftId:s.nextShift.id,outcome:'helped'});assert.equal(supportSummary(helped,at).memory,null);
});
test('C4 feedback distinguishes useful repetition, unsuitable, tried-unhelpful and untried',()=>{
 const s=start(),out=Object.fromEntries(['helped','not-fit','not-helped','not-tried'].map(outcome=>[outcome,op(s,'shift-feedback',{shiftId:s.nextShift.id,outcome})]));
 assert.equal(out.helped.nextShift.practical.key,'beans');assert.equal(out['not-tried'].nextShift.id,s.nextShift.id);
 assert.equal(out['not-helped'].nextShift.practical.key,'earlier');assert.notEqual(out['not-fit'].nextShift.practical.key,'earlier');
 const adjusted=op(out['not-tried'],'support-obstacle',{reason:'effort'});
 const reviews=adjusted.shiftHistory.flatMap(a=>a.reviews);assert.equal(reviews.length,1);assert.equal(reviews[0].outcome,'not-tried');assert.equal(reviews[0].reason,'effort');
 assert.equal(adjusted.nextShift.practical.key,'assembly');
 const retry=applyLifeBackOperation(adjusted,{action:'support-start',operationId:adjusted.operations.at(-1)},at);assert.deepEqual(retry,adjusted);
});
test('C5 deletion removes personal words from the refreshed state and stops quoting the source',()=>{
 const s=start(),id=s.memberSupport.memories[0].id,d=op(s,'support-memory',{memoryId:id,remove:true});
 const fresh=JSON.parse(JSON.stringify(d));assert.equal(fresh.memberSupport.memories.length,0);assert.equal(supportSummary(fresh,at).memory,null);
 assert.doesNotMatch(JSON.stringify(fresh),new RegExp(supportChoices.late.label));
 assert.throws(()=>op(d,'support-memory',{memoryId:id,words:'gone'}),e=>e.status===404);
});
test('C6 own note remains editable without a send operation',()=>{
 const s=start(),one=op(s,'support-note',{text:'My question for my own prescriber.'}),two=op(one,'support-note',{text:'My corrected question.'});
 assert.equal(two.memberSupport.note.text,'My corrected question.');assert(!('sentAt'in two.memberSupport.note));
 assert.throws(()=>op(s,'support-note',{text:'x'.repeat(5001)}));
});
test('C9 confirmed circumstance and cadence survive; due reviews follow the selected in-app rhythm',()=>{
 const s=start();assert.throws(()=>op(s,'support-circumstance',{stage:'stopped',cadence:'weekly'}));
 const stopped=op(s,'support-circumstance',{stage:'stopped',cadence:'weekly',confirmed:true},'2026-10-02T12:00:00Z');
 assert.deepEqual(stopped.memberSupport.memories,s.memberSupport.memories);assert.equal(stopped.nextShift.id,s.nextShift.id);
 assert.equal(supportSummary(stopped,'2026-10-05T12:00:00Z').reviewDue,false);assert.equal(supportSummary(stopped,'2026-10-09T12:00:00Z').reviewDue,true);
 const continuing=op(stopped,'support-circumstance',{stage:'continuing',cadence:'fortnightly',confirmed:true});assert.equal(continuing.memberSupport.stage,'continuing');assert.equal(supportSummary(continuing,'2026-10-09T12:00:00Z').reviewDue,false);
});
test('C10 finishing is member-confirmed goal completion, keeps actual helpful history and permits return',()=>{
 const s=start(),helped=op(s,'shift-feedback',{shiftId:s.nextShift.id,outcome:'helped'});
 assert.throws(()=>op(helped,'support-finish',{words:'I got my evenings back.'}));
 const finished=op(helped,'support-finish',{confirmed:true,words:'I got my evenings back.'},'2026-10-26T12:00:00Z');
 assert.equal(finished.memberSupport.stage,'finished');assert.equal(finished.memberSupport.finished.routines[0].title,'Beans and cheese on toast');assert.equal(finished.memberSupport.finished.words,'I got my evenings back.');
 const returned=op(finished,'support-resume',{},'2026-11-01T12:00:00Z');assert.deepEqual(returned.shiftHistory,finished.shiftHistory);assert.equal(returned.memberSupport.finished.at,finished.memberSupport.finished.at);assert.equal(returned.memberSupport.stage,'returning');
 assert.equal(start().memberSupport.finished,undefined);
});
test('new operations use actual existing route ownership, consent, refresh and revision guards',async t=>{
 const f=fixture({seed:false});t.after(()=>f.close());const origin='https://shiftsometimber.co.uk';
 const request=(body,user=1,originHeader=origin)=>new Request(origin+'/v1/life-back',{method:body?'POST':'GET',headers:{Origin:originHeader,Cookie:'sst_session=test-only-member-'+user,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const body={action:'support-start',choice:'late',revision:0,operationId:'support-account-operation-123456'};
 assert.equal((await lifeBackRoutes(request(body),f.env)).status,409);
 f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1)").run();
 assert.equal((await lifeBackRoutes(request(body,1,'https://elsewhere.invalid'),f.env)).status,403);
 assert.equal((await lifeBackRoutes(request(body),f.env)).status,201);
 assert.equal((await lifeBackRoutes(request({...body,operationId:'wrong-account-precondition-12345',expectedAccount:2}),f.env)).status,409);
 const a=await(await lifeBackRoutes(request(),f.env)).json(),b=await(await lifeBackRoutes(request(null,2),f.env)).json();
 assert.equal(a.progress.memberSupport.memories[0].text,supportChoices.late.label);assert.equal(a.progress.supportSummary.memory.at,a.progress.memberSupport.memories[0].at);assert.equal(b.progress.memberSupport,undefined);
 const foreign={action:'support-memory',memoryId:a.progress.memberSupport.memories[0].id,remove:true,revision:0,operationId:'foreign-delete-operation-12345'};
 f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(2,'my_shift_health_tracking',1)").run();
 assert.equal((await lifeBackRoutes(request(foreign,2),f.env)).status,404);
 const stale={...body,operationId:'stale-start-operation-12345'};assert.equal((await lifeBackRoutes(request(stale),f.env)).status,409);
 const del={...foreign,revision:a.progress.revision,operationId:'own-delete-operation-12345'};assert.equal((await lifeBackRoutes(request(del),f.env)).status,201);
 const reread=await(await lifeBackRoutes(request(),f.env)).json();assert.equal(reread.progress.memberSupport.memories.length,0);assert.equal(reread.progress.supportSummary.memory,null);
});
