import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture} from '../../health-passport/fixture.mjs';
import {lifeBackRoutes,emptyLifeBack,applyLifeBackOperation} from '../life-back-routes.mjs';
import {programmeSummary} from '../programme-model.mjs';
import {privacyHealthErasureRoute} from '../../privacy-health-erasure-route-v1.js';
import {memberHealthRoutes} from '../health-routes.mjs';
import {memberExperienceEntry,memberExperienceRoutes} from '../entry.mjs';
const origin='https://shiftsometimber.co.uk',at='2026-10-01T12:00:00Z',op=()=>crypto.randomUUID();
const focus=()=>({selected:['energy','confidence'],custom:'',ratings:{energy:2,confidence:3},note:'Often tired after work.',win:'Join in after work.'});
const begin=()=>applyLifeBackOperation(emptyLifeBack(),{action:'programme-start',operationId:op(),revision:0,focus:focus()},at);
const req=(path='',method='GET',body,user=1,extra={})=>new Request(origin+'/v1/life-back'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(user?{Cookie:'sst_session=test-only-member-'+user}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});
const call=(f,body,user=1,query='')=>lifeBackRoutes(req(query,body?'POST':'GET',body,user),f.env);
const read=async(f,user=1)=>(await(await call(f,undefined,user)).json());
function setup(t){const f=fixture({seed:false});t.after(()=>f.close());for(const id of [1,2])f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(?,'my_shift_health_tracking',1)").run(id);return f}
async function start(f,extra={}){const body={action:'programme-start',operationId:op(),revision:0,focus:focus(),...extra};const r=await call(f,body);assert.equal(r.status,201,await r.clone().text());return{body,data:await r.json()}}
function age(f,days){const p=JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences);const stamp=new Date(Date.now()-days*86400000).toISOString();p.lifeBack.progress.programme.baseline.at=stamp;p.lifeBack.progress.programme.focus.at=stamp;f.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify(p));return p.lifeBack.progress}

test('joining keeps an account-owned baseline without creating clinical readings or six-area scores',async t=>{
 const f=setup(t),{data,body}=await start(f),saved=await read(f);
 assert.deepEqual(saved.progress,data.progress);assert.equal(saved.progress.entries.length,0);assert.equal(saved.progress.nextShift.kind,'food');assert.equal(saved.progress.nextShift.status,'planned');
 assert.equal(saved.progress.programme.baseline.ratings.energy,2);assert.deepEqual((await read(f,2)).progress,emptyLifeBack());
 assert.deepEqual(JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences).grubV2,{savedRecipes:['kept']});
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM progress_entries').get().n,0);assert.equal((await call(f,body)).status,200);
});
test('anonymous, cross-origin and consent-off writes fail without changing the member history',async t=>{
 const f=setup(t);assert.equal((await call(f,undefined,0)).status,401);
 const body={action:'programme-start',operationId:op(),revision:0,focus:focus()};
 assert.equal((await lifeBackRoutes(req('','POST',body,1,{Origin:'https://untrusted.example'}),f.env)).status,403);
 f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)").run();assert.equal((await call(f,body)).status,409);assert.equal((await read(f)).programme,null);
});
test('edits and new reasons preserve the original starting point and existing measurements',()=>{
 let s=begin();const original=structuredClone(s.programme.baseline),nextFocus={...focus(),ratings:{energy:4,confidence:4},win:'A more manageable win.'};
 s=applyLifeBackOperation(s,{action:'programme-start',operationId:op(),revision:s.revision,focus:nextFocus},'2026-10-08T12:00:00Z');
 assert.deepEqual(s.programme.baseline,original);assert.equal(programmeSummary(s.programme,'2026-11-01T12:00:00Z').baselineValue,2);assert.equal(s.programme.focusHistory.length,1);
 s=applyLifeBackOperation(s,{action:'programme-start',operationId:op(),revision:s.revision,focus:{selected:['own'],custom:'Return to a hobby',ratings:{own:2},note:'',win:'Try it once.'}},'2026-10-30T12:00:00Z');
 const sum=programmeSummary(s.programme,'2026-11-01T12:00:00Z');assert.equal(sum.reflectionDue,false);assert.equal(sum.baselineValue,2);assert.deepEqual(s.programme.baseline,original);
});
test('stale tabs cannot overwrite a newly saved starting point',async t=>{
 const f=setup(t),{data}=await start(f),revision=data.progress.revision;
 const writes=await Promise.all([1,2].map(n=>call(f,{action:'programme-start',operationId:op(),revision,focus:{...focus(),win:'Updated win '+n}})));
 assert.deepEqual(writes.map(r=>r.status).sort(),[201,409]);assert.equal((await read(f)).progress.programme.focusHistory.length,1);
});
test('weekly and four-week prompts use actual elapsed time; clocks are explicitly simulated in the fixture',async t=>{
 const f=setup(t),{data}=await start(f);
 assert.equal((await call(f,{action:'programme-week',operationId:op(),revision:data.progress.revision,managed:[],barrier:'time',focus:'food',note:''})).status,409);
 assert.equal((await read(f)).programme.reflectionDue,false);age(f,8);assert.equal((await read(f)).programme.reviewDue,true);assert.equal((await read(f)).programme.reflectionDue,false);age(f,29);assert.equal((await read(f)).programme.reflectionDue,true);
});
test('weekly proposal is read-only; accepting saves one review and leaves Grub and Fit plans intact',async t=>{
 const f=setup(t);await start(f);const p=age(f,8),before=await read(f);
 const proposal=await call(f,undefined,1,'?weekFocus=movement');assert.equal(proposal.status,200);assert.equal((await proposal.json()).proposal.kind,'movement');assert.deepEqual(await read(f),before);
 const body={action:'programme-week',operationId:op(),revision:p.revision,managed:['food'],barrier:'time',focus:'movement',note:'Try a different focus.'};
 const r=await call(f,body);assert.equal(r.status,201);assert.equal((await call(f,body)).status,200);const after=await read(f);assert.equal(after.progress.programme.weeklyReviews.length,1);assert.equal(after.progress.nextShift.kind,'movement');assert.equal(after.progress.nextShift.completedAt,undefined);assert.deepEqual(after.progress.programme.baseline,p.programme.baseline);
 assert.equal((await call(f,{...body,operationId:op(),revision:after.progress.revision})).status,409);
});
for(const rating of [1,2,4])test('four-week reflection '+rating+' preserves the baseline and saves the member’s honest answer',async t=>{
 const f=setup(t);await start(f);const p=age(f,29),body={action:'programme-reflection',operationId:op(),revision:p.revision,baselineId:p.programme.baseline.id,rating,note:'In my own words.'};
 assert.equal((await call(f,body)).status,201);assert.equal((await call(f,body)).status,200);const after=await read(f);assert.equal(after.progress.programme.reflections.length,1);assert.equal(after.programme.latestReflection.rating,rating);assert.equal(after.programme.latestReflection.baselineRating,2);assert.deepEqual(after.progress.programme.baseline,p.programme.baseline);
 assert.equal((await call(f,{...body,operationId:op(),revision:after.progress.revision,baselineId:op()})).status,409);
});
test('did not help offers a different approach, previews without saving and remembers rejected advice',async t=>{
 const f=setup(t),{data}=await start(f);const old=data.progress.nextShift;
 const proposal=await call(f,undefined,1,'?feedback=not-helped&shiftId='+old.id);assert.equal(proposal.status,200);assert.match((await proposal.json()).proposal.href,/meal-guide/);assert.equal((await read(f)).progress.nextShift.id,old.id);
 const r=await call(f,{action:'shift-feedback',operationId:op(),revision:data.progress.revision,shiftId:old.id,outcome:'not-helped'});assert.equal(r.status,201);let saved=(await r.json()).progress;assert.match(saved.nextShift.href,/meal-guide/);assert.equal(saved.rejectedShifts.length,1);assert.equal(saved.shiftHistory[0].reviews[0].outcome,'not-helped');assert.ok(saved.shiftHistory[0].attemptedAt);assert.equal(saved.shiftHistory[0].completedAt,undefined);
 saved=applyLifeBackOperation(saved,{action:'focus',operationId:op(),revision:saved.revision,supportNeed:'movement'},at);saved=applyLifeBackOperation(saved,{action:'focus',operationId:op(),revision:saved.revision,supportNeed:'food'},at);assert.notEqual(saved.nextShift.title,old.title);
 assert.equal((await call(f,{action:'shift-feedback',operationId:op(),shiftId:saved.nextShift.id,outcome:'not-helped'},2)).status,409);
});
test('withdrawal race cannot save; erasure removes the entire programme branch and preserves another member',async t=>{
 const f=setup(t);await start(f);const before=await read(f),original=f.DB.prepare.bind(f.DB);let withdrew=false;
 f.DB.prepare=sql=>{if(sql.startsWith('UPDATE member_state SET preferences=json_set')&&!withdrew){withdrew=true;f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)").run()}return original(sql)};
 assert.equal((await call(f,{action:'programme-start',operationId:op(),revision:before.progress.revision,focus:{...focus(),win:'Must not save.'}})).status,409);assert.deepEqual((await read(f)).progress,before.progress);
 f.DB.prepare=original;const request=new Request(origin+'/v1/privacy/health-tracking',{method:'DELETE',headers:{Cookie:'sst_session=test-only-member-1'}});
 const er=await privacyHealthErasureRoute(request,f.env,{},async()=>Response.json({user:{id:1}}));assert.equal(er.status,200);assert.equal((await read(f)).programme,null);assert.ok(f.db.prepare('SELECT id FROM users WHERE id=1').get());assert.equal((await read(f,2)).programme,null);
});
test('input cannot create incomplete or unrecognised starting points',()=>{
 for(const focus of [{selected:[]},{selected:['unknown']},{selected:['energy','energy']},{selected:['own'],ratings:{own:2},custom:'',win:'One thing'},{...focusInvalid()}])assert.throws(()=>applyLifeBackOperation(emptyLifeBack(),{action:'programme-start',revision:0,operationId:op(),focus},at));
 function focusInvalid(){return{...focus(),ratings:{energy:6,confidence:3}}}
});
test('joining and tools serve private source, contain no design toolbar, fictional seed or browser health store',async()=>{
 const env={MEMBER_EXPERIENCE_V1_ENABLED:'true'},r=memberExperienceRoutes(new Request(origin+'/member/get-started'),env),html=await r.text();assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/no-store/);assert.match(html,/memberSessionStatus/);assert.doesNotMatch(html,/DESIGN PREVIEW|openMemberPreview|member-preview/);
 const js=await memberExperienceRoutes(new Request(origin+'/assets/member-experience/programme-joining.js'),env).text();new Function(js);assert.doesNotMatch(js,/sessionStorage|localStorage|sst-programme-design|2026-10-23/);assert.match(js,/programme-start/);
 for(const name of ['dashboard','grub','fit']){const enhanced=await memberExperienceEntry(new Request(origin+'/member/'+name),env,new Response('<html><head></head><body><main><section id="panel-today"></section></main></body></html>',{headers:{'Content-Type':'text/html'}}));assert.match(await enhanced.text(),/programme-client.js/)}
 assert.doesNotMatch(readFileSync(new URL('../programme-client.js',import.meta.url),'utf8'),/sessionStorage|localStorage|gtag\(/);
});


test('choosing a smaller step after reflection keeps all records and does not invent an unsuccessful attempt',()=>{
 const s=begin(),next=applyLifeBackOperation(s,{action:'focus',revision:s.revision,operationId:op(),supportNeed:'food',approach:'smaller'},at);
 assert.notEqual(next.nextShift.title,s.nextShift.title);assert.equal(next.nextShift.status,'planned');assert.equal(next.shiftHistory[0].closedReason,'member-chose-smaller');assert.deepEqual(next.shiftHistory[0].reviews,[]);assert.deepEqual(next.programme,s.programme);
});
test('a different approach that helped retains its identity so later rejection cannot offer it again',()=>{
 let s=begin();const review=outcome=>{s=applyLifeBackOperation(s,{action:'shift-feedback',operationId:op(),shiftId:s.nextShift.id,outcome},at)};
 review('not-helped');assert.equal(s.nextShift.approach,'meal-guide');review('helped');assert.equal(s.nextShift.approach,'meal-guide');review('not-helped');assert.notEqual(s.nextShift.approach,'meal-guide');
 for(let n=0;n<10&&s.nextShift.approach!=='choose-focus';n++)review('not-helped');
 assert.equal(s.nextShift.approach,'choose-focus');assert.throws(()=>review('not-helped'),e=>e.status===409);
});


test('linked daily feedback cannot accept a proposal from an older Life Back revision',async t=>{
 const f=setup(t),{data}=await start(f),request=(path,body)=>new Request(origin+path,{method:'POST',headers:{Origin:origin,Cookie:'sst_session=test-only-member-1','Content-Type':'application/json'},body:JSON.stringify(body)});
 const daily=await memberHealthRoutes(request('/v1/check-ins',{mood:'OK'}),f.env);assert.equal(daily.status,201);const step=(await daily.json()).nextStep;
 assert.equal((await call(f,{action:'shift-status',operationId:op(),shiftId:data.progress.nextShift.id,status:'attempted'})).status,201);
 const reviewed=await memberHealthRoutes(request('/v1/check-ins/follow-up',{actionId:step.id,revision:step.revision,lifeBackRevision:data.progress.revision,outcome:'not-helped'}),f.env);
 assert.equal(reviewed.status,409);assert.equal(f.db.prepare('SELECT feedback FROM daily_checkin_actions WHERE id=?').get(step.id).feedback,null);
});
