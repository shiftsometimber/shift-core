import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {fixture} from '../../health-passport/fixture.mjs';import {v7FoodRoutes} from '../v7-food-routes.mjs';
import {v7State} from '../v7-model.mjs';import {journeyDay} from '../journey-records.mjs';
const schema=fs.readFileSync(new URL('../v7-food-schema.sql',import.meta.url),'utf8');
const source={id:'cofid:2021:test-food',name:'Synthetic food fixture',kind:'food',per100:{kcal:120,proteinG:10,fatG:3,saltG:.3},source:{name:'UK CoFID 2021',version:'2021',recordId:'test-fixture'}};
function setup(t){const f=fixture({seed:false});t.after(()=>f.close());f.db.exec(schema);f.db.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1),(2,'my_shift_health_tracking',1)");f.db.prepare('INSERT INTO member_food_catalogue VALUES(?,?,?,?,?)').run(source.id,source.name,'cofid',JSON.stringify(source),'2021-03-19T00:00:00Z');return f;}
const req=(body,method='POST',token='test-only-member-1',path='/v1/grub/eaten')=>new Request('https://shiftsometimber.co.uk'+path,{method,headers:{Origin:'https://shiftsometimber.co.uk',Cookie:'sst_session='+token,'Content-Type':'application/json'},body:JSON.stringify({v7:true,expectedAccount:1,operationId:crypto.randomUUID(),meal:'dinner',on:journeyDay(new Date().toISOString()),catalogueId:source.id,amount:250,...body})});
const prefs=f=>JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences);
test('food writes use server source values, ignore supplied macros and do not alter the pile',async t=>{
 const f=setup(t),before=v7State(prefs(f).lifeBack?.progress).count;
 const r=await v7FoodRoutes(req({proteinG:999,kcal:1}),f.env);assert.equal(r.status,201);const body=await r.json();
 assert.equal(body.entry.proteinG,25);assert.equal(body.entry.kcal,300);assert.equal(body.entry.sugarsG,null);
 assert.equal(body.nutritionDay.proteinG,25);assert.equal(body.nutritionDay.kcal,300);
 assert.equal(v7State(prefs(f).lifeBack?.progress).count,before);
});
test('overlapping food retries insert once and rebuild totals atomically',async t=>{
 const f=setup(t),operationId=crypto.randomUUID();const responses=await Promise.all(Array.from({length:10},()=>v7FoodRoutes(req({operationId}),f.env)));
 assert(responses.every(r=>[200,201].includes(r.status)));assert.equal(responses.filter(r=>r.status===201).length,1);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM member_food_entries').get().n,1);assert.equal(prefs(f).v7NutritionDay.proteinG,25);
 assert.equal((await v7FoodRoutes(req({operationId,amount:500}),f.env)).status,409);
});
test('portion edits keep source and preserve pile; stale edits cannot replace a newer record',async t=>{
 const f=setup(t),id=crypto.randomUUID();await v7FoodRoutes(req({operationId:id}),f.env);
 const r=await v7FoodRoutes(req({id,amount:100,revision:0},'PATCH'),f.env);assert.equal(r.status,200);const d=await r.json();assert.equal(d.entry.kcal,120);assert.equal(d.entry.proteinG,10);assert.equal(d.entry.source.recordId,source.source.recordId);
 assert.equal((await v7FoodRoutes(req({id,amount:200,revision:0},'PATCH'),f.env)).status,409);assert.equal(prefs(f).v7NutritionDay.proteinG,10);assert.equal(v7State(prefs(f).lifeBack?.progress).count,0);
});
test('search does no external lookup, account mismatch and missing consent fail closed',async t=>{
 const f=setup(t);let external=0;
 const r=await v7FoodRoutes(req({query:'Synthetic'},'POST',undefined,'/v1/grub/food-search'),f.env,{fetch:()=>{external++;throw Error('not expected')}});assert.equal(r.status,200);assert.equal((await r.json()).foods.length,1);assert.equal(external,0);
 assert.equal((await v7FoodRoutes(req({expectedAccount:2}),f.env)).status,409);
 f.db.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)");
 assert.equal((await v7FoodRoutes(req({}),f.env)).status,409);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM member_food_entries').get().n,0);
});
