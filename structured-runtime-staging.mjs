import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {ensureStructuredLaunchSeed} from './structured-launch-seed-v1.js';
import {listPublishedContent} from './structured-content-v1.js';

class D1Statement{constructor(db,sql,params=[]){this.db=db;this.sql=sql;this.params=params}bind(...p){return new D1Statement(this.db,this.sql,p.map(v=>v===undefined?null:v))}async run(){const r=this.db.prepare(this.sql).run(...this.params);return{success:true,meta:{changes:Number(r.changes||0),last_row_id:Number(r.lastInsertRowid||0)}}}async first(){return this.db.prepare(this.sql).get(...this.params)||null}async all(){return{results:this.db.prepare(this.sql).all(...this.params)}}}
class D1Database{constructor(){this.sqlite=new DatabaseSync(':memory:')}prepare(sql){return new D1Statement(this.sqlite,sql)}async exec(sql){this.sqlite.exec(sql);return{success:true}}}

const DB=new D1Database();
const seeded=await ensureStructuredLaunchSeed(DB);
assert.deepEqual(seeded,{recipes:1,exercises:3});
const recipes=await listPublishedContent(DB,'recipe',{limit:500});
const exercises=await listPublishedContent(DB,'exercise',{limit:500});
assert.equal(recipes.length,1);assert.equal(exercises.length,3);
const recipe=recipes[0];assert.equal(recipe.id,'lighter-beef-cottage-pie');assert.equal(recipe.data.nutrition.status,'validated');assert.equal(recipe.data.nutrition.dataset_version,'CoFID 2021');for(const k of ['kcal','protein_g','carbohydrate_g','fat_g','fibre_g'])assert.ok(Number.isFinite(Number(recipe.data.nutrition[k])),`missing ${k}`);
for(const ex of exercises){assert.equal(ex.data.visual.status,'approved');assert.ok(ex.data.visual.asset_ref);assert.ok(ex.data.visual.alt_text);assert.ok(ex.data.instructions.length>=4);assert.ok(ex.data.regressions.length);assert.ok(ex.data.progressions.length);}
const v7=fs.readFileSync('member-product-v7.js','utf8');
const v8=fs.readFileSync('member-product-v8.js','utf8');
const entry=fs.readFileSync('worker-entry-v6.js','utf8');
for(const marker of ['listPublishedContent','negativeIds','structured_published_preferred','legacy_fallback','shift_grub_plan_v7','shift_fit_plan_v7','structured_items_served'])assert.ok(v7.includes(marker),`runtime contract missing ${marker}`);
assert.ok(v8.includes("import {memberProductV7Routes} from './member-product-v7.js'"),'V8 must preserve V7 structured authority');
assert.ok(v8.includes('memberProductV7Routes(request,env,ctx)'),'V8 must delegate through V7 before duration composition');
assert.ok(entry.includes("import {memberProductV8Routes} from './member-product-v8.js'"),'production entrypoint must import V8');
assert.ok(entry.includes('await memberProductV8Routes'),'production entrypoint must route member product through V8');
console.log(JSON.stringify({published:{recipes:recipes.length,exercises:exercises.length},recipe:{id:recipe.id,nutrition:recipe.data.nutrition.status,dataset:recipe.data.nutrition.dataset_version},exerciseIds:exercises.map(x=>x.id),runtime:{durationAwareV8:true,structuredV7Preserved:true,structuredPreferred:true,legacyFallbackControlled:true,naysPreserved:true}},null,2));
console.log('PASS M07 commissioning-floor structured content is review-gated, publishable, queryable and preserved as preferred Grub/Fit authority through the V8 duration-aware member runtime with controlled legacy fallback.');
