import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {joinedJourney,readJoinedJourney} from '../joined-journey.mjs';
import {fixture} from '../../health-passport/fixture.mjs';
import {myJourneyRoutes} from '../../my-journey-v1.js';
import {lifeBackRoutes,applyLifeBackOperation,emptyLifeBack} from '../life-back-routes.mjs';
import {tabClient} from '../../preview/app-layout/tabs.mjs';
import {supplyEstimate} from '../progress-journey.mjs';

const origin='https://shiftsometimber.co.uk';
const request=(path,id=1)=>new Request(origin+path,{headers:{Cookie:'sst_session=test-only-member-'+id}});
function preferences(){
 let progress=applyLifeBackOperation(emptyLifeBack(),{action:'programme-start',operationId:'joined-programme-start-001',revision:0,focus:{selected:['energy'],ratings:{energy:3},custom:'',note:'Original fictional baseline',win:'A short walk'}},'2026-10-01T10:00:00Z');
 progress=applyLifeBackOperation(progress,{action:'checkin',operationId:'joined-six-ratings-test-01',goalId:progress.goalId,ratings:{energy:50,sleep:60,confidence:55,movement:45,clothes:65,personal:50},win:'Fictional walk'},'2026-10-23T10:00:00Z');
 return {myJourney:{setup:{startDate:'2026-10-01',why:'Old Journey reason',units:'kg'},weight:{startKg:95,currentKg:95,targetKg:90},waist:{startCm:100,currentCm:100},wellbeing:{baseline:20}},lifeBack:{progress}};
}
test('latest measurements and six-area Life Back are a read view; original answers stay unchanged',()=>{
 const prefs=preferences(),before=JSON.stringify(prefs),j=joinedJourney(prefs.myJourney,prefs,{weight:{recorded_on:'2026-10-23',weight_kg:94.5},waist:{recorded_on:'2026-10-22',waist_cm:99}},{overall_feeling:'60',note:'Confirmed week'});
 assert.equal(j.weight.currentKg,94.5);assert.equal(j.weight.startKg,95);assert.equal(j.waist.currentCm,99);assert.equal(j.waist.startCm,100);
 assert.equal(j.wellbeing.latest,60);assert.equal(j.wellbeing.baseline,20);assert.equal(j.connected.lifeBack.score,54);assert.equal(j.connected.reason,'More energy for the family');
 assert.equal(JSON.stringify(prefs),before);assert.equal(prefs.lifeBack.progress.programme.baseline.note,'Original fictional baseline');
});
test('missing measurements and absent Life Back ratings remain unknown; legacy values survive',()=>{
 const j=joinedJourney({weight:{startKg:95,currentKg:94},waist:{currentCm:99}},{},{weight:{weight_kg:null}},null);
 assert.equal(j.weight.currentKg,94);assert.equal(j.waist.currentCm,99);assert.equal(j.connected.lifeBack,null);assert.deepEqual(j.connected.measurements,{});assert.equal(j.wellbeing.latest,undefined);
});
test('each measure uses its latest non-null owned record; both live read endpoints agree',async t=>{
 const f=fixture({seed:false});t.after(()=>f.close());const prefs=preferences();
 for(const id of [1,2])f.db.prepare('INSERT INTO member_state(user_id,preferences) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET preferences=excluded.preferences').run(id,JSON.stringify(prefs));
 f.db.exec("CREATE TABLE IF NOT EXISTS progress_entries(id INTEGER PRIMARY KEY,user_id INTEGER,recorded_on TEXT,weight_kg REAL,waist_cm REAL,source TEXT)");
 f.db.prepare('INSERT INTO progress_entries(user_id,recorded_on,weight_kg,waist_cm,source) VALUES(?,?,?,?,?)').run(1,'2026-10-22',95,99,'manual');
 f.db.prepare('INSERT INTO progress_entries(user_id,recorded_on,weight_kg,waist_cm,source) VALUES(?,?,?,?,?)').run(1,'2026-10-23',94.5,null,'my_journey_weekly');
 f.db.prepare('INSERT INTO progress_entries(user_id,recorded_on,weight_kg,waist_cm,source) VALUES(?,?,?,?,?)').run(2,'2026-10-24',70,75,'other_member');
 const before=f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences;
 const direct=await readJoinedJourney(f.env.DB,1,prefs.myJourney,prefs);assert.equal(direct.weight.currentKg,94.5);assert.equal(direct.waist.currentCm,99);
 for(const path of ['/v1/my-journey','/v1/journey']){const r=await myJourneyRoutes(request(path),f.env);assert.equal(r.status,200);const d=await r.json();assert.equal(d.journey.weight.currentKg,94.5);assert.equal(d.journey.connected.lifeBack.score,54);}
 const life=await(await lifeBackRoutes(request('/v1/life-back'),f.env)).json();assert.equal(life.journey.weight.currentKg,94.5);assert.equal(life.journey.waist.currentCm,99);
 assert.equal(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences,before);
 assert.equal((await myJourneyRoutes(request('/v1/my-journey',0),f.env)).status,401);
});
test('Journey renders saved Life Back and reuses Programme reason without a second baseline form',()=>{
 let source=readFileSync(new URL('../../frontend/member/member-my-journey-v2.js',import.meta.url),'utf8');
 source=source.replace('function ensure(){','window.joinedViewTest={summary,setup};function ensure(){');
 const ctx={window:{SST_API:{}},document:{readyState:'loading',addEventListener(){}},location:{pathname:'/member/dashboard'},setTimeout(){}};vm.runInNewContext(source,ctx);
 const prefs=preferences(),j=joinedJourney({...prefs.myJourney,setup:{...prefs.myJourney.setup,complete:true}},prefs,{weight:{weight_kg:94.5}});
 assert.match(ctx.window.joinedViewTest.summary(j),/54 \/ 100/);assert.doesNotMatch(ctx.window.joinedViewTest.summary(j),/Set your baseline/);
 const form=ctx.window.joinedViewTest.setup(j);assert.match(form,/What matters to you/);assert.match(form,/type="hidden" name="why" value="More energy for the family"/);assert.doesNotMatch(form,/Life Back baseline|name="life_energy"/);
});
test('opening a tool from Progress activates Today before displaying the embedded tool',()=>{
 let active='visualise',todayClicks=0;
 const ctx={document:{body:{dataset:{memberPage:'dashboard'}},readyState:'loading',addEventListener(){},getElementById:id=>id==='panel-today'?{classList:{contains:()=>active==='today'}}:null,querySelector:s=>s==='.mp-tab[data-panel="today"]'?{click(){todayClicks++;active='today';}}:null},location:{href:origin+'/member/dashboard#visualise'},URL,Map,addEventListener(){}};
 vm.runInNewContext(tabClient.replace('function mount(){','globalThis.chooseToolForTest=select;function mount(){'),ctx);
 ctx.chooseToolForTest('fit',true);assert.equal(active,'today');assert.equal(todayClicks,1);
 active='journey';ctx.chooseToolForTest('today',false);assert.equal(active,'journey','history return without a tool must not force Today');
});
test('appointments have no supply estimate while medicine supply retains its existing boundary',()=>{
 for(const medicine of ['Health appointment','Blood test'])assert.equal(supplyEstimate({medicine,status:'active',supply:0}),null);
 assert.equal(supplyEstimate({medicine:'Mounjaro',status:'active',supply:4}).status,'setup');
});
