import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {fixture} from '../../health-passport/fixture.mjs';
import {applyLifeBackOperation,emptyLifeBack} from '../life-back-routes.mjs';
import {saveCheckinWithAction,reviewCheckinAction,latestCheckinAction} from '../checkin-followup.mjs';
import {connectedDay} from '../journey-context.mjs';
import {checkinFollowupRuntime} from '../checkin-followup-client.mjs';
import {dayGuideRuntime} from '../day-guide.mjs';
import {memberExperienceEntry} from '../entry.mjs';
const at=new Date().toISOString(),ratings={energy:30,sleep:60,confidence:60,movement:60,clothes:60,personal:60};
function setup(t){const f=fixture({seed:false});t.after(()=>f.close());f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1)").run();return f;}
function seedLife(f,supportNeed='food'){
 let s=applyLifeBackOperation(emptyLifeBack(),{action:'goal',operationId:'goal-five-points-12345',revision:0,goal:'Walk with my family'},at);
 s=applyLifeBackOperation(s,{action:'checkin',operationId:'check-five-points-12345',goalId:s.goalId,ratings,supportNeed},at);
 f.db.prepare("UPDATE member_state SET preferences=json_set(preferences,'$.lifeBack.progress',json(?)) WHERE user_id=1").run(JSON.stringify(s));return s;
}
const prefs=f=>JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences);
for(const outcome of ['helped','not-fit','not-tried','skip'])test('linked '+outcome+' updates the same episode without inventing a reflection; retry is exact',async t=>{
 const f=setup(t),initial=seedLife(f),before=prefs(f),{nextStep}=await saveCheckinWithAction(f.DB,1,3,'',at);
 assert.equal(nextStep.action.loopId,initial.nextShift.id);
 const input={actionId:nextStep.id,revision:0,outcome},saved=await reviewCheckinAction(f.DB,1,input),after=prefs(f);
 assert.deepEqual(after.lifeBack.progress.entries,initial.entries);assert.deepEqual(after.grubV2,before.grubV2);
 assert.equal((after.lifeBack.progress.shiftHistory?.[0]||after.lifeBack.progress.nextShift).reviews.at(-1).outcome,outcome);
 assert.equal((await latestCheckinAction(f.DB,1,nextStep.id)).feedback,outcome);
 assert.deepEqual(await reviewCheckinAction(f.DB,1,input),saved);assert.deepEqual(prefs(f),after);
 if(outcome==='not-fit')assert.match((await connectedDay(f.DB,1)).next.title,/familiar meal/);
 if(outcome==='helped')assert.match((await connectedDay(f.DB,1)).next.reason,/You said this helped/);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM check_ins').get().n,1);
});
test('a moved Life Back action cannot be overwritten by an older daily prompt',async t=>{
 const f=setup(t),s=seedLife(f),{nextStep}=await saveCheckinWithAction(f.DB,1,3,'',at);
 const newer=applyLifeBackOperation(s,{action:'shift-feedback',operationId:'feedback-five-points-123',shiftId:s.nextShift.id,outcome:'helped'},at);
 f.db.prepare("UPDATE member_state SET preferences=json_set(preferences,'$.lifeBack.progress',json(?)) WHERE user_id=1").run(JSON.stringify(newer));
 await assert.rejects(reviewCheckinAction(f.DB,1,{actionId:nextStep.id,revision:0,outcome:'not-fit'}),e=>e.status===409);
 assert.deepEqual(prefs(f).lifeBack.progress,newer);assert.equal((await latestCheckinAction(f.DB,1)).feedback,null);
});
test('consent revocation at the transaction boundary changes neither linked record',async t=>{
 const f=setup(t),s=seedLife(f),{nextStep}=await saveCheckinWithAction(f.DB,1,3,'',at),batch=f.DB.batch.bind(f.DB);
 f.DB.batch=async statements=>{f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)").run();return batch(statements)};
 await assert.rejects(reviewCheckinAction(f.DB,1,{actionId:nextStep.id,revision:0,outcome:'helped'}),e=>e.status===409);
 assert.deepEqual(prefs(f).lifeBack.progress,s);assert.equal((await latestCheckinAction(f.DB,1)).feedback,null);
});
test('standalone daily feedback influences the next step, exact identity remains account private',async t=>{
 const f=setup(t),{nextStep}=await saveCheckinWithAction(f.DB,1,3,'',at);
 await reviewCheckinAction(f.DB,1,{actionId:nextStep.id,revision:0,outcome:'not-fit'});
 const d=await connectedDay(f.DB,1);assert.equal(d.next.href,'/member/dashboard#more-for-today');
 assert.equal(await latestCheckinAction(f.DB,2,nextStep.id),null);assert.equal(prefs(f).lifeBack,undefined);
});
test('standalone Life Back feedback requires no new ratings and rejects an old identity',()=>{
 const f=fixture({seed:false});try{const s=seedLife(f);const input={action:'shift-feedback',operationId:'feedback-five-points-123',shiftId:s.nextShift.id,outcome:'not-fit'};
 const n=applyLifeBackOperation(s,input,at);assert.equal(n.entries.length,s.entries.length);assert.match(n.nextShift.title,/familiar meal/);assert.deepEqual(applyLifeBackOperation(n,input,at),n);
 assert.throws(()=>applyLifeBackOperation(n,{...input,operationId:'another-operation-12345'},at),e=>e.status===409);}finally{f.close()}
});
test('clinic-quiet task reaches the relevant guide without inferred treatment changes',()=>{const f=fixture({seed:false});try{const s=seedLife(f,'clinic-quiet');assert.equal(s.nextShift.href,'/clinic-gone-quiet');assert.equal(s.treatment,undefined)}finally{f.close()}});
test('feedback is available exactly once at both action destinations and clients parse',async()=>{
 new vm.Script(checkinFollowupRuntime);new vm.Script(dayGuideRuntime);
 for(const name of ['dashboard','check-in','grub','fit']){const r=await memberExperienceEntry(new Request('https://shiftsometimber.co.uk/member/'+name),{MEMBER_EXPERIENCE_V1_ENABLED:'true'},new Response('<html><head></head><body><main><section id="panel-today"></section></main></body></html>',{headers:{'Content-Type':'text/html'}}));const html=await r.text();assert.equal((html.match(/id="dailyCheckinFollowup"/g)||[]).length,1,name);}
});
