import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {fixture} from '../../health-passport/fixture.mjs';import {initialiseV7Member} from '../v7-bootstrap.mjs';
function setup(t){const f=fixture({seed:false});t.after(()=>f.close());f.db.exec(fs.readFileSync(new URL('../v7-food-schema.sql',import.meta.url),'utf8'));f.db.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1)");return f;}
const offer=async()=>({on:'2026-11-03',action:{id:'routine:one',kind:'routine',name:'One manageable thing'},alternatives:[]});
test('initial preparation preserves existing logs, milestone, words and unrelated settings',async t=>{
 const f=setup(t),prefs={food:{protein_target:125},movement:{equipment:'none'},unrelated:'retain',lifeBack:{progress:{revision:4,goal:'My own reason',entries:[{win:'My own win'}],v7:{days:{'2026-11-02':{on:'2026-11-02',log:{id:'real-existing'}}},milestones:{'30':{id:'existing-milestone'}}}}}};
 f.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify(prefs));const r=await initialiseV7Member(f.env,1,offer,null,'2026-11-03T22:00:00Z');assert(r.initialised);
 const next=JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences);assert.equal(next.unrelated,'retain');assert.deepEqual(next.lifeBack.progress.v7.days,prefs.lifeBack.progress.v7.days);assert.deepEqual(next.lifeBack.progress.v7.milestones,prefs.lifeBack.progress.v7.milestones);assert.equal(next.lifeBack.progress.goal,'My own reason');assert.equal(next.lifeBack.progress.revision,5);assert.equal(next.lifeBack.progress.v7.insights,undefined);
 assert.equal((await initialiseV7Member(f.env,1,()=>{throw Error('must not rerun')},null,'2026-11-03T23:59:00Z')).skipped,'already_prepared');
 const refreshed=await initialiseV7Member(f.env,1,async()=>({...await offer(),on:'2026-11-04'}),null,'2026-11-04T00:01:00Z');
 assert(refreshed.initialised);
 const midnight=JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences);
 assert.equal(midnight.lifeBack.progress.v7.offers.on,'2026-11-04');
 assert.deepEqual(midnight.lifeBack.progress.v7.days,prefs.lifeBack.progress.v7.days);
});
test('withdrawn tracking cannot initialise or overwrite member records',async t=>{const f=setup(t);f.db.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)");assert.equal((await initialiseV7Member(f.env,1,()=>{throw Error('must not run')},null)).skipped,'tracking_off_or_paused');});
