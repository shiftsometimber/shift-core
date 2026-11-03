import test from 'node:test';import assert from 'node:assert/strict';import {createHash}from'node:crypto';
import {fixture} from '../../health-passport/fixture.mjs';import {wrapV7}from'../v7-release.mjs';import{supportSummary}from'../support-plan.mjs';import {lifeBackRoutes as legacy,emptyLifeBack} from '../life-back-routes.mjs';
import {v7State} from '../v7-model.mjs';import{v7Offer}from'../v7-context.mjs';import {journeyPortabilityRoutes} from '../journey-portability.mjs';
const lifeBackRoutes=(request,env)=>wrapV7({fetch:r=>legacy(r,env)},{supportSummary}).fetch(request,env,{});
const action={key:'pause',kind:'confidence',name:'Let one ordinary job wait',href:'/member/dashboard?timber=support',label:'Open Support',items:[],steps:['Leave one ordinary job for later.']};
function setup(t){
 const f=fixture({seed:false});t.after(()=>f.close());f.db.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1),(2,'my_shift_health_tracking',1)");
 const progress={...emptyLifeBack(),nextShift:{id:'own-prepared-action',practical:action}};
 f.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({lifeBack:{progress},food:{protein_target:120},grubV2:{savedRecipes:['kept']}}));
 f.db.prepare('INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES(3,1,?,?)').run(createHash('sha256').update('second-device-synthetic').digest('hex'),'2099-01-01T00:00:00Z');
 return f;
}
const req=(body,token='test-only-member-1')=>new Request('https://shiftsometimber.co.uk/v1/life-back',{method:body?'POST':'GET',headers:{Cookie:'sst_session='+token,Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'},body:body?JSON.stringify({expectedAccount:1,operationId:crypto.randomUUID(),...body}):undefined});
const read=f=>JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences);
test('actual SQL CAS awards once across twenty overlapping saves, a second session, refresh and retries',async t=>{
 const f=setup(t),first=await(await lifeBackRoutes(req(),f.env)).json(),id=first.v7.action.id;
 const responses=await Promise.all(Array.from({length:20},(_,i)=>lifeBackRoutes(req({action:'v7-complete',actionId:id,revision:0},i%2?'second-device-synthetic':'test-only-member-1'),f.env)));
 assert.equal(responses.filter(r=>r.status===201).length,1);assert(responses.every(r=>[200,201,409].includes(r.status)));
 assert.equal(v7State(read(f).lifeBack.progress).count,1);
 const refreshed=await(await lifeBackRoutes(req(),f.env)).json();assert.equal(refreshed.v7.count,1);assert.equal(refreshed.v7.completedToday,true);
 assert.equal((await lifeBackRoutes(req({action:'v7-complete',actionId:id,revision:0}),f.env)).status,200);
 const other=await(await lifeBackRoutes(req(undefined,'test-only-member-2'),f.env)).json();assert.equal(other.v7.count,0);
 assert.equal(f.db.prepare("SELECT json_array_length(json_extract(preferences,'$.lifeBack.progress.operations')) n FROM member_state WHERE user_id=1").get().n,1);
});
test('Done cannot write actual-food totals; feedback stays optional and changes a future offer with a reason',async t=>{
 const f=setup(t);
 const foodRequest=new Request('https://shiftsometimber.co.uk/v1/grub/eaten',{method:'POST',headers:{Cookie:'sst_session=test-only-member-1',Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'},body:JSON.stringify({on:v7State().today,food:'Synthetic food actually eaten',proteinG:40,operationId:crypto.randomUUID()})});
 assert.equal((await journeyPortabilityRoutes(foodRequest,f.env)).status,201);
 const first=await(await lifeBackRoutes(req(),f.env)).json();assert.equal(first.v7.proteinG,40);
 const done=await(await lifeBackRoutes(req({action:'v7-complete',actionId:first.v7.action.id,proteinG:999}),f.env)).json();assert.equal(done.v7.proteinG,40);assert.equal(done.v7.count,1);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM member_food_entries WHERE user_id=1').get().n,1);
 const day=done.progress.v7.days[done.v7.today];
 const feedback=await(await lifeBackRoutes(req({action:'v7-feedback',on:day.on,logId:day.log.id,outcome:'not-helped'}),f.env)).json();assert.equal(feedback.v7.count,1);assert.equal(feedback.v7.proteinG,40);
 const tomorrow=new Date(Date.parse(done.v7.today+'T12:00:00Z')+86400000).toISOString(),next=v7Offer(read(f),[],tomorrow);
 assert.notEqual(next.action.id,first.v7.action.id);assert.match(next.adaptation,/did not help.*different approach/);
});
test('30th milestone is one durable database award across devices; privacy preference needs no new tracking consent',async t=>{
 const f=setup(t),prefs=read(f),progress=prefs.lifeBack.progress;
 progress.v7={days:{},milestones:{},preferences:{showWeight:true,lead:'weight'}};
 const today=v7State().today;
 for(let n=1;n<=29;n++){const on=new Date(Date.parse(today+'T12:00:00Z')-n*86400000).toISOString().slice(0,10);progress.v7.days[on]={on,log:{id:'seed-'+n,at:on+'T12:00:00Z',action},selected:action};}
 f.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify(prefs));
 const first=await(await lifeBackRoutes(req(),f.env)).json();
 await Promise.all(Array.from({length:12},(_,i)=>lifeBackRoutes(req({action:'v7-complete',actionId:first.v7.action.id},i%2?'second-device-synthetic':'test-only-member-1'),f.env)));
 const saved=read(f).lifeBack.progress;assert.equal(v7State(saved).count,30);assert.deepEqual(Object.keys(saved.v7.milestones),['30']);const award=saved.v7.milestones['30'].id;
 await lifeBackRoutes(req({action:'v7-complete',actionId:first.v7.action.id}),f.env);assert.equal(read(f).lifeBack.progress.v7.milestones['30'].id,award);
 f.db.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)");
 const response=await lifeBackRoutes(req({action:'v7-preferences',revision:saved.revision,showWeight:false}),f.env);assert.equal(response.status,201);assert.equal(v7State(read(f).lifeBack.progress).preferences.showWeight,false);
});
test('account ownership, Origin, paused tracking and a consent withdrawal at the SQL write fail closed',async t=>{
 const f=setup(t),first=await(await lifeBackRoutes(req(),f.env)).json(),body={action:'v7-complete',actionId:first.v7.action.id};
 assert.equal((await lifeBackRoutes(req({...body,expectedAccount:2}),f.env)).status,409);
 const foreign=req(body);const bad=new Request(foreign,{headers:{...Object.fromEntries(foreign.headers),Origin:'https://foreign.invalid'}});assert.equal((await lifeBackRoutes(bad,f.env)).status,403);
 const prepare=f.env.DB.prepare.bind(f.env.DB);let raced=false;
 f.env.DB.prepare=sql=>{const statement=prepare(sql);if(sql.startsWith('UPDATE member_state SET preferences=json_set(CASE')){const run=statement.run.bind(statement);statement.run=async()=>{if(!raced){raced=true;f.db.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)");}return run();};}return statement;};
 assert.equal((await lifeBackRoutes(req(body),f.env)).status,409);assert.equal(v7State(read(f).lifeBack.progress).count,0);
});
