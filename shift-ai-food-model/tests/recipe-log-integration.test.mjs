// Fictional accounts and explicit simulated confirmation. No photo, model API,
// member account, production database or external communication is used here.
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {buildRecipeCatalogue,recipeDraft} from '../recipe_catalogue.mjs';
import {journeyPortabilityRoutes} from '../../member-experience/journey-portability.mjs';
import {buildMemberJourneyContext} from '../../member-experience/ai-context.mjs';
import {savedFactAnswer} from '../../member-experience/ai-fast-answers.mjs';

const repo=new URL('../../',import.meta.url);
const paths={full:'grub-uk-full-publication-20261018.mjs',core:'grub-uk-core-publication-20261017.mjs',everyday:'grub-everyday-publication-v1.mjs',images:'member-experience/grub-image-map.mjs'};
const catalogue=buildRecipeCatalogue(Object.fromEntries(Object.entries(paths).map(([key,path])=>[key,readFileSync(new URL(path,repo),'utf8')])));
const recipe=catalogue.recipes.find(r=>r.id==='everyday-beans-on-toast');
const date=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const request=(body,{user=1,method=body?'POST':'GET'}={})=>new Request('https://shiftsometimber.co.uk/v1/grub/eaten',{method,headers:{Cookie:'sst_session=recipe-fixture-'+user,Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
async function fixture(t){
 const sql=new DatabaseSync(':memory:');t.after(()=>sql.close());
 sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT);CREATE TABLE user_sessions(id TEXT,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);CREATE TABLE consents(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,consent_type TEXT,granted INTEGER);CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,preferences TEXT);CREATE TABLE check_ins(id INTEGER PRIMARY KEY,user_id INTEGER,case_id INTEGER,wellbeing_score INTEGER,notes TEXT,submitted_at TEXT);CREATE TABLE progress_entries(id INTEGER PRIMARY KEY,user_id INTEGER,recorded_on TEXT,protein_g REAL);CREATE TABLE member_food_entries(id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,recorded_on TEXT NOT NULL,body_json TEXT NOT NULL,created_at TEXT NOT NULL);INSERT INTO users VALUES(1,'one@example.invalid'),(2,'two@example.invalid');INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1),(2,'my_shift_health_tracking',1);INSERT INTO member_state VALUES(1,'{}'),(2,'{}');");
 const env={sql,MEMBER_EXPERIENCE_V1_ENABLED:'true',DB:{exec:async q=>sql.exec(q),prepare(q){let values=[];return{bind(...args){values=args;return this},first:async()=>sql.prepare(q).get(...values)||null,all:async()=>({results:sql.prepare(q).all(...values)}),run:async()=>({meta:{changes:Number(sql.prepare(q).run(...values).changes)}})}}}};
 for(const user of[1,2]){const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('recipe-fixture-'+user))).toString('hex');sql.prepare('INSERT INTO user_sessions VALUES(?,?,?,?,NULL,NULL)').run('session-'+user,user,hash,'2099-01-01');}
 return env;
}
const confirmed=(changes={})=>recipeDraft(catalogue,{recipeId:recipe.id,recipeHash:recipe.content_sha256,memberConfirmed:true,servingsEaten:1.5,includeNutrition:true,...changes});
// Deliberate test-harness bridge: the live recipe UI is not wired to this yet.
const entry=(draft,id)=>({operationId:id,on:date(),food:draft.food+' · '+draft.recipe.servingsEaten+' recipe servings',...draft.nutrition,nutritionSource:draft.nutritionSource});

test('confirmed current recipe portion saves once and updates the real diary and shared AI read model',async t=>{
 const env=await fixture(t),draft=confirmed(),body=entry(draft,'recipe-full-test-save');
 assert.equal(draft.autoSave,false);assert.equal(env.sql.prepare('SELECT count(*) AS n FROM member_food_entries').get().n,0);
 assert.equal((await journeyPortabilityRoutes(request(body),env)).status,201);
 assert.equal((await journeyPortabilityRoutes(request(body),env)).status,200);
 const diary=await(await journeyPortabilityRoutes(request(),env)).json();
 assert.equal(diary.entries.length,1);assert.equal(diary.foodLog.today.entryCount,1);
 assert.equal(diary.foodLog.today.nutrition.kcal.total,Math.round(recipe.nutrition.kcal*1.5*10)/10);
 assert.equal(diary.foodLog.today.nutrition.proteinG.total,draft.nutrition.proteinG);
 const journey=await buildMemberJourneyContext(env.DB,1);assert.deepEqual(journey.grub.foodLog,diary.foodLog);
 assert.match(savedFactAnswer('food_today',journey),/Beans on toast/);
 assert(savedFactAnswer('food_protein',journey).includes(String(draft.nutrition.proteinG)));
 const other=await(await journeyPortabilityRoutes(request(undefined,{user:2}),env)).json();assert.equal(other.foodLog.today.entryCount,0);
 assert.equal((await journeyPortabilityRoutes(request({id:body.operationId},{method:'DELETE'}),env)).status,200);
 const deleted=await buildMemberJourneyContext(env.DB,1);assert.equal(deleted.grub.foodLog.today.entryCount,0);
 assert.equal(deleted.grub.foodLog.today.nutrition.kcal,undefined);assert.doesNotMatch(savedFactAnswer('food_today',deleted),/Beans on toast/);
});

test('unconfirmed or stale recipe drafts cannot create an entry',async t=>{
 const env=await fixture(t);
 assert.throws(()=>confirmed({memberConfirmed:false}),/Confirm/);
 assert.throws(()=>confirmed({recipeHash:'stale'}),/changed/);
 for(const servingsEaten of[0,NaN,Infinity,9])assert.throws(()=>confirmed({servingsEaten}),/how many/);
 assert.equal(env.sql.prepare('SELECT count(*) AS n FROM member_food_entries').get().n,0);
});

test('optional nutrition and changed ingredients stay unknown through the actual save/read route',async t=>{
 const env=await fixture(t);
 for(const [index,changes] of[{includeNutrition:false},{ingredientsChanged:true}].entries()){
  const draft=confirmed(changes);assert.deepEqual(draft.nutrition,{});
  assert.equal((await journeyPortabilityRoutes(request(entry(draft,'recipe-no-numbers-'+index)),env)).status,201);
 }
 const diary=await(await journeyPortabilityRoutes(request(),env)).json();assert.equal(diary.foodLog.today.entryCount,2);assert.deepEqual(diary.foodLog.today.nutrition,{});
 const journey=await buildMemberJourneyContext(env.DB,1);assert.match(savedFactAnswer('food_protein',journey),/no protein amounts/);
});

test('a recipe confirmation does not bypass withdrawn member tracking consent',async t=>{
 const env=await fixture(t);env.sql.exec('UPDATE consents SET granted=0 WHERE user_id=1');
 const response=await journeyPortabilityRoutes(request(entry(confirmed(),'recipe-consent-refused')),env);
 assert.equal(response.status,409);assert.equal((await response.json()).error,'health_consent_required');
 assert.equal(env.sql.prepare('SELECT count(*) AS n FROM member_food_entries').get().n,0);
});
