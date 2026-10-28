import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {fixture} from '../../health-passport/fixture.mjs';
import {validateJourneyRecord,validJourneyDate} from '../journey-records.mjs';
import {applyLifeBackOperation,emptyLifeBack,lifeBackRoutes} from '../life-back-routes.mjs';
import {journeyDataRoutes,journeyDataView} from '../journey-data.mjs';
import {journeyPresentation} from '../journey-presentation.mjs';
import {journeyPageRoutes,journeyPageHTML,journeyNavigation} from '../journey-page.mjs';
import {journeyPageRuntime} from '../journey-page-client.mjs';
import {wrapSupportService} from '../support-release.mjs';
import {sixPageRecoveryRuntime} from '../six-page-recovery.mjs';
import {myJourneyRoutes} from '../../my-journey-v1.js';
import {myJourneyTrendRoutes} from '../../my-journey-checkin-v1.js';
const at='2026-10-27T12:00:00Z',on='2026-10-20',V=journeyPresentation();
const op=(s,record,rest={})=>applyLifeBackOperation(s,{action:'journey-record',record,revision:s.revision,operationId:crypto.randomUUID(),...rest},at);
const request=(body,id=1,origin='https://shiftsometimber.co.uk')=>new Request('https://shiftsometimber.co.uk/v1/life-back',{method:body?'POST':'GET',headers:{Origin:origin,Cookie:'sst_session=test-only-member-'+id,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});

test('Journey records reject impossible/future dates, unrecorded amounts and unsupported clinical fields',()=>{
  for(const day of ['2026-02-30','2026-13-01','2027-01-01','yesterday','1899-01-01'])assert.equal(validJourneyDate(day,'2026-10-27'),false);
  assert.equal(validJourneyDate('2024-02-29','2026-10-27'),true);
  for(const record of [{kind:'measurement',weightKg:null},{kind:'measurement',weightKg:'95'},{kind:'measurement',weightKg:NaN},{kind:'measurement',waistCm:0},{kind:'feeling',feelings:['probably nausea']},{kind:'treatment',change:'increase-dose'},{kind:'injection',site:'Thigh',nextSite:'Other thigh'},{kind:'win',text:'okay',medicine:'hidden'}])assert.throws(()=>validateJourneyRecord({on,...record},'2026-10-27'));
  assert.deepEqual(validateJourneyRecord({kind:'measurement',on,waistCm:102.1},'2026-10-27'),{kind:'measurement',on,waistCm:102.1});
  assert.deepEqual(validateJourneyRecord({kind:'injection',on,site:'My own site description',time:'15:30',medicine:'My private medicine',dose:'As recorded'},'2026-10-27'),{kind:'injection',on,site:'My own site description',time:'15:30',medicine:'My private medicine',dose:'As recorded'});
  assert.throws(()=>validateJourneyRecord({kind:'injection',on:'2026-10-27',site:'Past site',time:'23:30'},'2026-10-27',at),/already happened/);
});
test('records survive refresh, correct/delete by id, and never alter other member support or the illustration',()=>{
  const original={...emptyLifeBack(),memberSupport:{note:{text:'My separately saved question.'}},other:'retained'};
  const saved=op(original,{kind:'win',on,text:'Stairs felt easier'}),id=saved.journey.records[0].id;
  assert.equal(original.journey,undefined);assert.equal(saved.entries.length,0);assert.equal(saved.other,'retained');
  const fresh=JSON.parse(JSON.stringify(saved)),corrected=op(fresh,{kind:'win',on,text:'My corrected words'},{recordId:id});
  assert.equal(corrected.journey.records[0].createdAt,at);assert.equal(corrected.journey.records[0].correctedAt,at);
  assert.equal(corrected.memberSupport.note.text,'My separately saved question.');
  assert.throws(()=>op(corrected,{kind:'win',on,text:'Stale'},{revision:0}),e=>e.status===409);
  assert.throws(()=>op(corrected,{kind:'win',on,text:'Foreign'},{recordId:'other-account-id'}),e=>e.status===404);
  const removed=applyLifeBackOperation(corrected,{action:'journey-delete',recordId:id,operationId:crypto.randomUUID(),revision:corrected.revision},at);
  assert.equal(removed.journey.records.length,0);assert.doesNotMatch(JSON.stringify(removed),/My corrected words/);
  const retry=applyLifeBackOperation(saved,{action:'journey-record',operationId:id},at);assert.deepEqual(retry,saved);
});
test('no fabricated records; legacy weekly dates and actual labels retain their provenance',()=>{
  const empty=journeyDataView({},[],[],[],'2026-10-27');assert.deepEqual(empty.records,[]);assert.equal(empty.showMedicine,false);
  const prefs={myJourney:{clothes:{currentTop:'XL',currentTrouserWaist:'36'},updatedAt:at},lifeBack:{progress:{revision:2,entries:[{id:'own',at,win:'My exact win'}]}}};
  const view=journeyDataView(prefs,[{id:1,recorded_on:on,weight_kg:95,waist_cm:null}],[],[{id:2,wellbeing_score:4,notes:'My exact note',submitted_at:at}],'2026-10-27');
  assert.equal(view.records.find(r=>r.id==='setup-clothes').dateBasis,'Date saved in setup');
  assert.equal(view.records.find(r=>r.id==='progress:1').waistCm,undefined);
  assert.equal(view.records.find(r=>r.kind==='checkin').text,'My exact note');
  assert.equal(view.records.find(r=>r.kind==='checkin').feelings,undefined);
});
test('weight and waist keep fluctuations, missing dates and same-day readings; clothes never become a numeric series',()=>{
  const records=[{id:'a',kind:'measurement',on:'2026-10-01',weightKg:95},{id:'b',kind:'measurement',on:'2026-10-02',weightKg:96},{id:'c',kind:'measurement',on:'2026-10-05',weightKg:94},{id:'d',kind:'measurement',on:'2026-10-05',weightKg:94.2},{id:'e',kind:'clothes',on:'2026-10-05',top:'XL',trousers:'36'}];
  const chart=V.progressGraph(records,'weightKg','2026-10-01','2026-10-07','kg');
  assert.equal(V.series(records,'weightKg','2026-10-01','2026-10-07').length,4);
  assert.equal((chart.match(/<path /g)||[]).length,2,'no line over the three missing days');
  assert.match(chart,/96.0 kg/);assert.match(chart,/94.2 kg/);assert.doesNotMatch(chart,/XL|<polyline/);
  assert.equal(V.series(records,'waistCm','2026-10-01','2026-10-07').length,0);
});
test('medicine changes and injection details do not change the teaching line or infer a cause',()=>{
  const from='2026-10-01',to='2026-10-28',selected='2026-10-07';
  const before=V.medicineGraph([],from,to,selected),after=V.medicineGraph([{id:'a',kind:'treatment',change:'changed',on:'2026-10-05',dose:'private'},{id:'b',kind:'injection',on:'2026-10-06',site:'private'}],from,to,selected);
  const paths=s=>[...s.matchAll(/<path d="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(paths(after),paths(before));
  assert.doesNotMatch(after,/private/);assert.equal(V.exampleLevel(2),V.exampleLevel(9));
  assert.ok(V.exampleLevel(6)>0,'day seven does not imply no remaining medicine');
});
test('snapshot quotes real dated records, preserves clothes labels and escapes user text in HTML',()=>{
  const data={today:'2026-10-27',units:'kg',goal:null,records:[{kind:'win',on,text:'<script>private words</script>'},{kind:'clothes',on,top:'XL',trousers:'36'},{kind:'treatment',on,change:'changed',medicine:'Private medicine',dose:'Private dose'}]};
  const text=V.snapshotText(data);assert.match(text,/20 Oct 2026 — <script>private words<\/script>/);assert.match(text,/Top: XL · Trousers: 36/);assert.doesNotMatch(text,/Private medicine|Private dose|95.3|Dan/);
  assert.equal(V.esc('<img src=x onerror=alert(1)>'),'&lt;img src=x onerror=alert(1)&gt;');
  assert.match(V.snapshotText({...data,records:[]}),/No dated records/);
});
test('real page is session gated, uncached, shares the five-tab navigation, and has a valid standalone runtime',async()=>{
  const env={MEMBER_EXPERIENCE_V1_ENABLED:'true'},page=journeyPageRoutes(new Request('https://stage/member/life-back/journey'),env);
  assert.equal(page.status,200);assert.match(page.headers.get('Cache-Control'),/no-store, private/);assert.equal(page.headers.get('Vary'),'Cookie');
  assert.match(journeyPageHTML,/data-member-session="pending"/);assert.match(journeyPageHTML,/session.mjs/);assert.match(journeyPageHTML,/programme-journey.mjs/);
  assert.equal((journeyNavigation.match(/<a /g)||[]).length,5);for(const label of ['Today','Journey','Grub','Fit','More'])assert.match(journeyNavigation,new RegExp('>'+label+'<'));
  assert.doesNotMatch(journeyPageRuntime,/localStorage|sessionStorage|sendBeacon|saveMemberState|2\.5mg|7\.5mg/);
  new vm.Script(journeyPageRuntime);new vm.Script(sixPageRecoveryRuntime);
  assert.match(sixPageRecoveryRuntime,/\['journey','Journey','map','\/member\/life-back\/journey'\]/);
  assert.match(sixPageRecoveryRuntime,/Your snapshot/);assert.match(sixPageRecoveryRuntime,/\['stuff','More'/);
  assert.equal(journeyPageRoutes(new Request('https://stage/member/life-back/journey'),{}),null);
  assert.equal(await journeyPageRoutes(new Request('https://stage/member/life-back/journey',{method:'HEAD'}),env).text(),'');
});
test('actual auth API persists only its owned path; account mismatch, consent, CSRF, pause and deletion are enforced',async t=>{
  const f=fixture({seed:false});t.after(()=>f.close());f.db.exec('ALTER TABLE progress_entries ADD COLUMN notes TEXT');
  const body={action:'journey-record',record:{kind:'feeling',on,feelings:['tired'],note:'My actual words'},revision:0,expectedAccount:'1',operationId:'journey-test-operation-123456'};
  assert.equal((await lifeBackRoutes(request(body),f.env)).status,409);
  f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1)").run();
  assert.equal((await lifeBackRoutes(request(body,1,'https://foreign.invalid'),f.env)).status,403);
  assert.equal((await lifeBackRoutes(request({...body,expectedAccount:'2'}),f.env)).status,409);
  const missing={...body};delete missing.expectedAccount;assert.equal((await lifeBackRoutes(request(missing),f.env)).status,409);
  assert.equal((await lifeBackRoutes(request(body),f.env)).status,201);
  const load=id=>journeyDataRoutes(new Request('https://shiftsometimber.co.uk/v1/life-back/journey',{headers:{Cookie:'sst_session=test-only-member-'+id}}),f.env);
  const a=await(await load(1)).json(),b=await(await load(2)).json();assert.equal(a.records[0].note,'My actual words');assert.deepEqual(b.records,[]);assert.equal(a.accountId,1);
  assert.equal(JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences).grubV2.savedRecipes[0],'kept');
  assert.equal((await lifeBackRoutes(request({...body,operationId:'stale-journey-operation-12345'}),f.env)).status,409);
  f.db.prepare("UPDATE member_state SET preferences=json_set(preferences,'$.myJourney.setup.paused',json('true')) WHERE user_id=1").run();
  assert.equal((await lifeBackRoutes(request({...body,operationId:'paused-journey-operation-12345',revision:1}),f.env)).status,409);
  f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)").run();
  assert.equal((await lifeBackRoutes(request({action:'journey-delete',recordId:body.operationId,revision:1,expectedAccount:1,operationId:'erase-journey-operation-12345'}),f.env)).status,201,'erasure still works when consent is off and tracking paused');
  const reread=await(await load(1)).json();assert.equal(reread.records.length,0);assert.equal(reread.trackingEnabled,false);
  assert.equal((await lifeBackRoutes(request({action:'journey-view',showMedicine:false,revision:reread.revision,expectedAccount:1,operationId:'hide-journey-operation-12345'}),f.env)).status,201,'hiding the optional illustration never requires new health tracking');
  assert.equal((await journeyDataRoutes(new Request('https://stage/v1/life-back/journey'),f.env)).status,401);
});
test('new page and API use scoped release paths; protected commerce remains the existing fallback',async()=>{
  const original=new Response('retained commerce'),wrapped=wrapSupportService({fetch:async()=>original}),env={MEMBER_EXPERIENCE_V1_ENABLED:'true'};
  assert.equal((await wrapped.fetch(new Request('https://stage/member/life-back/journey'),env,{})).status,200);
  assert.equal((await wrapped.fetch(new Request('https://stage/v1/life-back/journey'),env,{})).status,401);
  assert.equal(await wrapped.fetch(new Request('https://stage/v1/checkout'),env,{}),original);
});
test('Journey export includes the new records, and existing Journey deletion erases them without losing other preferences',async t=>{
  const f=fixture({seed:false});t.after(()=>f.close());f.db.exec('ALTER TABLE progress_entries ADD COLUMN notes TEXT');
  f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1)").run();
  const body={action:'journey-record',record:{kind:'injection',on,site:'My recorded site',medicine:'My own medicine'},revision:0,expectedAccount:1,operationId:'export-journey-operation-12345'};
  assert.equal((await lifeBackRoutes(request(body),f.env)).status,201);
  const headers={Cookie:'sst_session=test-only-member-1'};
  const exported=await(await myJourneyTrendRoutes(new Request('https://stage/v1/journey/export',{headers}),f.env)).json();
  assert.equal(exported.lifeBack.progress.journey.records[0].medicine,'My own medicine');
  assert.equal((await myJourneyRoutes(new Request('https://stage/v1/my-journey',{method:'DELETE',headers}),f.env)).status,200);
  const prefs=JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences);
  assert.equal(prefs.lifeBack,undefined);assert.equal(prefs.myJourney,undefined);assert.deepEqual(prefs.grubV2.savedRecipes,['kept']);
});
test('consent revocation and pause at the actual database write prevent a new Journey record',async t=>{
  for(const change of ['consent','pause']){
    const f=fixture({seed:false});t.after(()=>f.close());f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1)").run();
    const original=f.env.DB.prepare.bind(f.env.DB);let raced=false;
    f.env.DB.prepare=sql=>{const stmt=original(sql);if(sql.startsWith('UPDATE member_state SET preferences=json_set(CASE')){const run=stmt.run.bind(stmt);stmt.run=async()=>{if(!raced){raced=true;if(change==='consent')f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)").run();else f.db.prepare("UPDATE member_state SET preferences=json_set(preferences,'$.myJourney.setup.paused',json('true')) WHERE user_id=1").run();}return run();};}return stmt;};
    const body={action:'journey-record',record:{kind:'win',on,text:'This must not save'},revision:0,expectedAccount:1,operationId:'raced-journey-operation-'+change};
    assert.equal((await lifeBackRoutes(request(body),f.env)).status,409,change);
    assert.equal(JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences).lifeBack,undefined);
  }
});
