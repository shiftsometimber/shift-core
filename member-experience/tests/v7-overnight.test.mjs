import test from'node:test';import assert from'node:assert/strict';import{fixture}from'../../health-passport/fixture.mjs';import{prepareV7Insights,runV7Overnight,overnightWindow}from'../v7-overnight.mjs';import{v7State}from'../v7-model.mjs';
test('nightly observations retain recorded dates and never infer why weight changed',()=>{
 const p={v7:{days:{'2026-10-28':{on:'2026-10-28',log:{id:'one'}}}}};
 const i=prepareV7Insights(p,[{recorded_on:'2026-10-20',weight_kg:108.5},{recorded_on:'2026-11-01',weight_kg:108.5}],'2026-11-03T02:00:00Z');
 assert.equal(i.recap.from,'2026-10-26');assert.equal(i.recap.to,'2026-11-01');assert.equal(i.recap.items[0].text,'1 daily actions completed.');assert.match(i.stall.text,/records do not tell us what caused/);
 assert.equal(prepareV7Insights(p,[{recorded_on:'2026-10-20',weight_kg:108.6},{recorded_on:'2026-11-01',weight_kg:108.5}],'2026-11-03T02:00:00Z').stall,null);
});
test('overnight job prepares once, does not change the pile, and never runs from a screen GET',async t=>{
 const f=fixture({seed:false});t.after(()=>f.close());f.db.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1)");
 const p={revision:1,entries:[],v7:{days:{'2026-10-28':{on:'2026-10-28',log:{id:'one'}}},milestones:{}}};f.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({lifeBack:{progress:p}}));
 assert.equal((await runV7Overnight(f.env,'2026-11-03T12:00:00Z')).prepared,0);
 assert.equal((await runV7Overnight(f.env,'2026-11-03T02:00:00Z')).prepared,1);
 assert.equal((await runV7Overnight(f.env,'2026-11-03T02:15:00Z')).prepared,0);
 const stored=JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences).lifeBack.progress;assert.equal(v7State(stored).count,1);assert.equal(stored.revision,2);
});
test('hidden weight is suppressed when reading an older prepared insight',()=>{
 const p={v7:{preferences:{showWeight:false,lead:'strength'},insights:{stall:{title:'weight'},recap:{items:[{topic:'weight',text:'108kg'},{topic:'effort',text:'One action'}],weight:108}}}};
 const v=v7State(p,'2026-11-03T12:00:00Z');assert.equal(v.insights.stall,null);assert.equal(v.insights.recap.weight,null);assert.deepEqual(v.insights.recap.items,[{topic:'effort',text:'One action'}]);
 assert.equal(overnightWindow('2026-06-01T00:15:00Z'),true);assert.equal(overnightWindow('2026-11-03T06:00:00Z'),false);
});
