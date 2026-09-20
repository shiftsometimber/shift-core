import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from '../../health-passport/fixture.mjs';
import {memberHealthRoutes,appendHealthExport} from '../health-routes.mjs';
import {privacyHealthErasureRoute} from '../../privacy-health-erasure-route-v1.js';
import {memberExperienceEntry,memberExperienceRoutes} from '../entry.mjs';
import worker from '../../worker-entry-v6.js';
const origin='https://shiftsometimber.co.uk';
const request=(path,method='GET',body,user=1)=>new Request('https://api.shiftsometimber.co.uk/v1/'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(user?{Cookie:'sst_session=test-only-member-'+user}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
function setup(t){const f=fixture({seed:false});t.after(()=>f.close());for(const id of [1,2])f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(?,'my_shift_health_tracking',1)").run(id);return f}
async function save(f,user=1){const r=await memberHealthRoutes(request('check-ins','POST',{mood:'OK',note:'walked to the shops'},user),f.env);assert.equal(r.status,201,await r.clone().text());return r.json()}
const review=(f,step,outcome='helped',user=1)=>memberHealthRoutes(request('check-ins/follow-up','POST',{actionId:step.id,revision:step.revision,outcome},user),f.env);
const read=async(f,user=1)=>(await (await memberHealthRoutes(request('check-ins/follow-up','GET',undefined,user),f.env)).json()).followUp;

test('save atomically associates the exact offered action; fresh reads preserve it when Today changes',async t=>{
 const f=setup(t),saved=await save(f);assert.equal(saved.nextStep.checkInId,saved.checkIn.id);assert.equal(saved.nextStep.action.title,'Choose your next meal');
 assert.equal(saved.nextStep.feedback,null);assert.equal(saved.nextStep.revision,0);assert.deepEqual(await read(f),saved.nextStep);
 f.db.prepare("UPDATE member_state SET preferences=json_set(preferences,'$.grubV2.today',json(?)) WHERE user_id=1").run(JSON.stringify({date:new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London'}).format(new Date()),name:'Different meal'}));
 assert.deepEqual(await read(f),saved.nextStep);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM check_ins').get().n,1);
});
test('failure to write the action rolls back the check-in; no half-save',async t=>{
 const f=setup(t);f.db.exec('DROP TABLE daily_checkin_actions');
 const r=await memberHealthRoutes(request('check-ins','POST',{mood:'OK'}),f.env);assert.equal(r.status,503);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM check_ins').get().n,0);
});
test('feedback persists, retries are idempotent, stale changes conflict and explicit updates work',async t=>{
 const f=setup(t),{nextStep}=await save(f);
 for(const outcome of ['helped','not-fit','not-tried','skip']){
  const before=await read(f);const first=await review(f,before,outcome);assert.equal(first.status,200);const after=(await first.json()).followUp;
  assert.equal(after.feedback,outcome);assert.equal(after.revision,before.revision+1);assert.ok(after.reviewedAt);assert.deepEqual(await read(f),after);
  assert.equal((await review(f,before,outcome)).status,200);assert.equal((await read(f)).revision,after.revision);
  const conflicting=outcome==='helped'?'not-fit':'helped';assert.equal((await review(f,before,conflicting)).status,409);
 }
 assert.equal((await review(f,nextStep,'helped')).status,409);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM check_ins').get().n,1);
 assert.equal(JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences).lifeBack,undefined);
});
test('another member cannot read or review the action; anonymous requests cannot review',async t=>{
 const f=setup(t),{nextStep}=await save(f);assert.equal(await read(f,2),null);assert.equal((await review(f,nextStep,'helped',2)).status,404);assert.equal((await review(f,nextStep,'helped',0)).status,401);
 assert.equal((await review(f,{...nextStep,revision:-1})).status,400);assert.equal((await review(f,nextStep,'completed')).status,400);
});
test('withdrawal hides the prompt and denies feedback; erasure clears action and review, retaining account',async t=>{
 const f=setup(t),{nextStep}=await save(f);await save(f,2);assert.equal((await review(f,nextStep)).status,200);
 f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)").run();
 assert.equal(await read(f),null);assert.equal((await review(f,{...nextStep,revision:1},'not-fit')).status,409);
 const r=await privacyHealthErasureRoute(request('privacy/health-tracking','DELETE'),f.env,{},async()=>Response.json({user:{id:1}}));assert.equal(r.status,200);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM daily_checkin_actions WHERE user_id=1').get().n,0);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM daily_checkin_actions WHERE user_id=2').get().n,1);assert.ok(f.db.prepare('SELECT id FROM users WHERE id=1').get());
 f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1)").run();assert.equal((await review(f,nextStep)).status,404);
});
test('consent checked within transaction prevents a withdrawal race',async t=>{
 const f=setup(t),original=f.DB.batch.bind(f.DB);f.DB.batch=async statements=>{f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)").run();return original(statements)};
 const r=await memberHealthRoutes(request('check-ins','POST',{mood:'OK'}),f.env);assert.equal(r.status,409);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM check_ins').get().n,0);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM daily_checkin_actions').get().n,0);
});
test('optional health export includes action and explicit feedback for only that account',async t=>{
 const f=setup(t),{nextStep}=await save(f);await save(f,2);await review(f,nextStep,'not-tried');
 const r=await appendHealthExport(request('privacy/export','POST',{}),f.env,Response.json({ok:true}));const data=await r.json();assert.equal(data.dailyCheckinActions.length,1);assert.equal(data.dailyCheckinActions[0].feedback,'not-tried');assert.equal(data.dailyCheckinActions[0].user_id,1);
});
test('real Worker preflight permits official origins; untrusted writes are rejected',async t=>{
 const f=setup(t);for(const supplied of [origin,'https://www.shiftsometimber.co.uk']){const r=await worker.fetch(new Request('https://api.shiftsometimber.co.uk/v1/check-ins/follow-up',{method:'OPTIONS',headers:{Origin:supplied,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}}),f.env,{});assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),supplied)}
 const req=request('check-ins/follow-up','POST',{});req.headers.set('Origin','https://untrusted.example');assert.equal((await memberHealthRoutes(req,f.env)).status,403);
});
test('follow-up is mounted once in Today and Check-in, with private assets',async()=>{
 const env={MEMBER_EXPERIENCE_V1_ENABLED:'true'};
 for(const name of ['dashboard','check-in']){const req=new Request(origin+'/member/'+name),html='<html><head></head><body><main><section id="panel-today"></section></main></body></html>';const result=await memberExperienceEntry(req,env,new Response(html,{headers:{'Content-Type':'text/html'}}));const body=await result.text();assert.equal((body.match(/id="dailyCheckinFollowup"/g)||[]).length,1);assert.match(body,/checkin-followup.mjs/)}
 const r=memberExperienceRoutes(new Request(origin+'/assets/member-experience/checkin-followup.mjs'),env);assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/no-store/);
});
