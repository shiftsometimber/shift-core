import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {foodCaptureRoutes,captureCapabilities,validBarcode,productDraft,normaliseCapture,scaleNutrition} from '../food-capture.mjs';
import {foodNutrition} from '../food-entry-nutrition.mjs';
import {foodDiaryRuntime} from '../food-diary-client.mjs';
import {journeyPortabilityRoutes} from '../journey-portability.mjs';
import vm from 'node:vm';

async function fixture(){
 const sql=new DatabaseSync(':memory:');
 sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT);CREATE TABLE user_sessions(id TEXT,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);CREATE TABLE consents(id INTEGER PRIMARY KEY,user_id INTEGER,consent_type TEXT,granted INTEGER);CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,preferences TEXT DEFAULT '{}');INSERT INTO users VALUES(1,'one@example.invalid'),(2,'two@example.invalid');INSERT INTO consents VALUES(1,1,'my_shift_health_tracking',1),(2,2,'my_shift_health_tracking',1);INSERT INTO member_state VALUES(1,'{}'),(2,'{}');");
 const DB={exec:async q=>sql.exec(q),prepare(q){let values=[];return{bind(...v){values=v;return this;},first:async()=>sql.prepare(q).get(...values)||null,all:async()=>({results:sql.prepare(q).all(...values)}),run:async()=>({meta:{changes:Number(sql.prepare(q).run(...values).changes)}})}}};
 for(const id of[1,2]){const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('capture-'+id))).toString('hex');sql.prepare('INSERT INTO user_sessions VALUES(?,?,?,?,NULL,NULL)').run('session-'+id,id,hash,'2099-01-01');}
 return {sql,DB,MEMBER_EXPERIENCE_V1_ENABLED:'true'};
}
const req=(body,{user=1,method=body?'POST':'GET',origin='https://shiftsometimber.co.uk',type='application/json',path='/v1/grub/capture'}={})=>new Request('https://shiftsometimber.co.uk'+path,{method,headers:{Cookie:'sst_session=capture-'+user,Origin:origin,'Content-Type':type},body:body?JSON.stringify(body):undefined});
const photo={mode:'photo',processingConsent:true,image:'data:image/jpeg;base64,/9j/2Q=='};
const activate=e=>Object.assign(e,{GRUB_CAPTURE_VISION_ENABLED:'true',GRUB_CAPTURE_BUDGET_APPROVED:'true',GRUB_CAPTURE_VISION_TERMS_APPROVED:'true',GRUB_CAPTURE_VISION_MODEL:'@cf/meta/llama-3.2-11b-vision-instruct',AI:{run:async()=>({response:JSON.stringify({items:['Eggs','toast'],nutrition:{kcal:300,proteinG:18}})})}});
const product={product:{product_name:'Synthetic porridge',brands:'Fixture',nutriments:{'energy-kcal_100g':380,proteins_100g:12,carbohydrates_100g:60,fat_100g:8,fiber_100g:0}}};

test('photo processing is disabled unless budget, terms and the exact model are configured',()=>{
 assert.equal(captureCapabilities({}).photo,false);
 for(const key of['GRUB_CAPTURE_VISION_ENABLED','GRUB_CAPTURE_BUDGET_APPROVED','GRUB_CAPTURE_VISION_TERMS_APPROVED','GRUB_CAPTURE_VISION_MODEL','AI']){const env=activate({});delete env[key];assert.equal(captureCapabilities(env).photo,false,key);}
 assert.equal(captureCapabilities(activate({})).photo,true);
});
test('barcodes require a valid GTIN check digit and bounded all-digit input',()=>{
 for(const code of['3017620422003','5000159484695','96385074','036000291452'])assert.equal(validBarcode(code),true,code);
 for(const code of['3017620422004','foo','123','1234567890','https://example.invalid',3017620422003,'3017620422003 '])assert.equal(validBarcode(code),false,String(code));
});
test('packet draft preserves 100g basis, actual zero and unknown amounts without guessing',()=>{
 const draft=productDraft(product,'3017620422003');assert.deepEqual(draft.basis,{amount:100,unit:'g'});assert.equal(draft.nutrition.fibreG,0);assert.equal(draft.requiresReview,true);assert.equal(draft.source.name,'Open Food Facts');assert.match(draft.source.url,/3017620422003$/);
 assert.deepEqual(productDraft({product:{product_name:'No nutrition supplied'}},'3017620422003').nutrition,{});
 assert.throws(()=>productDraft({},'3017620422003'),/not found/);
});
test('portion scaling is explicit, bounded and leaves missing nutrients unknown',()=>{
 assert.deepEqual(scaleNutrition({kcal:300,proteinG:18,fibreG:0},.5),{kcal:150,proteinG:9,fibreG:0});
 assert.deepEqual(scaleNutrition({proteinG:12},1.5),{proteinG:18});
 for(const value of[0,-1,Infinity,'2',21])assert.throws(()=>scaleNutrition({},value));
 assert.throws(()=>scaleNutrition({kcal:6000},2),/too large/);
});
test('model output is treated as an untrusted draft; advice and unsupported fields never propagate',()=>{
 const draft=normaliseCapture({items:['Eggs','toast'],nutrition:{kcal:300,proteinG:-1,fatG:'10'},advice:'Change a medicine',target:1200},'photo');
 assert.deepEqual(draft.nutrition,{kcal:300});assert.equal(draft.estimate,true);assert.equal('advice'in draft,false);assert.equal('target'in draft,false);
 for(const raw of['not json',{},[],{items:[]},{items:['insulin dose']},{items:['food',null]}])assert.throws(()=>normaliseCapture(raw,'photo'));
});
test('member nutrition validation keeps zero distinct from missing and rejects targets/source spoofing',()=>{
 assert.deepEqual(foodNutrition({kcal:0,proteinG:0,nutritionSource:'member_entered'}),{proteinG:0,kcal:0,nutritionSource:'member_entered'});
 assert.deepEqual(foodNutrition({}),{});
 for(const value of[{kcal:-1},{kcal:6001},{proteinG:'20'},{fatG:Infinity},{fibreG:201},{nutritionSource:'clinically_verified'}])assert.throws(()=>foodNutrition(value));
});
test('confirmed estimates use the real diary save, duplicate prevention, account and deletion controls',async()=>{
 const e=await fixture();try{
  const entry={operationId:'capture-confirmed-food-operation',on:'2026-10-01',food:'Synthetic porridge · 40 g',kcal:152,proteinG:4.8,fibreG:0,nutritionSource:'packet_database'};
  const post=()=>req(entry,{path:'/v1/grub/eaten'});
  assert.equal((await journeyPortabilityRoutes(post(),e)).status,201);
  assert.equal((await journeyPortabilityRoutes(post(),e)).status,200);
  assert.equal((await journeyPortabilityRoutes(req({...entry,kcal:999},{path:'/v1/grub/eaten'}),e)).status,409);
  const own=await(await journeyPortabilityRoutes(req(undefined,{path:'/v1/grub/eaten'}),e)).json();assert.equal(own.entries.length,1);assert.equal(own.entries[0].kcal,152);assert.equal(own.entries[0].fibreG,0);assert.equal('fatG'in own.entries[0],false);
  assert.deepEqual((await(await journeyPortabilityRoutes(req(undefined,{path:'/v1/grub/eaten',user:2}),e)).json()).entries,[]);
  assert.equal((await(await journeyPortabilityRoutes(req({id:entry.operationId},{path:'/v1/grub/eaten',method:'DELETE',user:2}),e)).json()).deleted,false);
  assert.equal((await(await journeyPortabilityRoutes(req({id:entry.operationId},{path:'/v1/grub/eaten',method:'DELETE'}),e)).json()).deleted,true);
 }finally{e.sql.close();}
});
test('unrelated routes pass through and unsupported methods are rejected',async()=>{
 const e=await fixture();try{assert.equal(await foodCaptureRoutes(req(undefined,{path:'/'}),e),null);assert.equal((await foodCaptureRoutes(req(undefined,{method:'DELETE'}),e)).status,405);e.MEMBER_EXPERIENCE_V1_ENABLED='false';assert.equal((await foodCaptureRoutes(req(),e)).status,404);}finally{e.sql.close();}
});
test('anonymous, expired and cross-account requests cannot bypass the private boundary',async()=>{
 const e=await fixture();try{assert.equal((await foodCaptureRoutes(new Request('https://shiftsometimber.co.uk/v1/grub/capture'),e)).status,401);assert.equal((await foodCaptureRoutes(req(undefined,{user:99}),e)).status,401);e.sql.exec("UPDATE user_sessions SET expires_at='2000-01-01' WHERE user_id=1");assert.equal((await foodCaptureRoutes(req(),e)).status,401);}finally{e.sql.close();}
});
test('current consent and pause state apply before any scan or provider call',async()=>{
 const e=await fixture();try{e.sql.exec('UPDATE consents SET granted=0 WHERE user_id=1');assert.equal((await foodCaptureRoutes(req(),e)).status,409);assert.equal((await foodCaptureRoutes(req(undefined,{user:2}),e)).status,200);e.sql.exec('UPDATE consents SET granted=1 WHERE user_id=1');e.sql.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({myJourney:{setup:{paused:true}}}));assert.equal((await foodCaptureRoutes(req(photo),activate(e))).status,409);}finally{e.sql.close();}
});
test('origin, JSON, streamed size and request-shape checks happen before provider access',async()=>{
 const e=await fixture();try{
  assert.equal((await foodCaptureRoutes(req({mode:'description',description:'toast'},{origin:'https://evil.invalid'}),e)).status,403);
  assert.equal((await foodCaptureRoutes(req({mode:'description',description:'toast'},{origin:''}),e)).status,403);
  assert.equal((await foodCaptureRoutes(req({mode:'description',description:'toast'},{type:'text/plain'}),e)).status,415);
  assert.equal((await foodCaptureRoutes(req({mode:'description',description:'x'.repeat(1100001)}),e)).status,413);
  assert.equal((await foodCaptureRoutes(req(['not an object']),e)).status,400);
  assert.equal((await foodCaptureRoutes(req({mode:'unknown'}),e)).status,400);
 }finally{e.sql.close();}
});
test('describing food makes a draft without AI calls, guessed numbers or persistent writes',async()=>{
 const e=await fixture();try{const response=await foodCaptureRoutes(req({mode:'description',description:'Two eggs, beans and toast'}),e);assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control'),/no-store/);const {draft}=await response.json();assert.equal(draft.food,'Two eggs, beans and toast');assert.deepEqual(draft.nutrition,{});assert.equal(e.sql.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences,'{}');}finally{e.sql.close();}
});
test('packet lookup sends only the validated barcode to a fixed upstream and returns attribution',async()=>{
 const e=await fixture();try{let calls=0;const response=await foodCaptureRoutes(req({mode:'barcode',barcode:'3017620422003'}),e,{fetcher:async(url,options)=>{calls++;assert.match(url,/^https:\/\/world.openfoodfacts.org\/api\/v3\/product\/3017620422003\?/);assert.match(options.headers['User-Agent'],/MyTimber/);assert.equal(options.redirect,'error');assert.equal('Cookie'in options.headers,false);return Response.json(product);}});assert.equal(response.status,200);assert.equal(calls,1);assert.equal((await response.json()).draft.food,'Fixture Synthetic porridge');}finally{e.sql.close();}
});
test('missing products and provider errors preserve the manual entry route',async()=>{
 for(const status of[404,429,500]){const e=await fixture();try{const r=await foodCaptureRoutes(req({mode:'barcode',barcode:'3017620422003'}),e,{fetcher:async()=>new Response('',{status})});assert.equal(r.status,status===404?404:503);assert.match((await r.json()).message,/enter|describe/i);}finally{e.sql.close();}}
});
test('barcode lookup counters are per member and contain no barcode or food',async()=>{
 const e=await fixture();try{const day=new Date().toISOString().slice(0,10);e.sql.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({other:'retained',grubBarcodeUsage:{day,calls:30}}));let calls=0;const fetcher=async()=>{calls++;return Response.json(product)};assert.equal((await foodCaptureRoutes(req({mode:'barcode',barcode:'3017620422003'}),e,{fetcher})).status,429);assert.equal((await foodCaptureRoutes(req({mode:'barcode',barcode:'3017620422003'},{user:2}),e,{fetcher})).status,200);assert.equal(calls,1);assert.match(e.sql.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences,/retained/);assert(!JSON.stringify(e.sql.prepare('SELECT preferences FROM member_state').all()).includes('3017620422003'));}finally{e.sql.close();}
});
test('public packet cache is shared while uncached upstream calls have an aggregate throttle',async()=>{
 const e=await fixture();try{
  let calls=0;const fetcher=async()=>{calls++;return Response.json(product)};
  assert.equal((await foodCaptureRoutes(req({mode:'barcode',barcode:'3017620422003'}),e,{fetcher})).status,200);
  assert.equal((await foodCaptureRoutes(req({mode:'barcode',barcode:'3017620422003'},{user:2}),e,{fetcher})).status,200);assert.equal(calls,1);
  assert.equal((await foodCaptureRoutes(req({mode:'barcode',barcode:'5000159484695'},{user:2}),e,{fetcher})).status,429);assert.equal(calls,1);
  const publicRows=JSON.stringify(e.sql.prepare('SELECT * FROM shift_ai_public_cache').all());assert(!/capture-1|one@example|userId/.test(publicRows));
  e.sql.exec('UPDATE consents SET granted=0 WHERE user_id=2');assert.equal((await foodCaptureRoutes(req({mode:'barcode',barcode:'3017620422003'},{user:2}),e,{fetcher})).status,409);
 }finally{e.sql.close();}
});
test('Grub can use an approved Shift AI service binding with no vendor model call or member identity',async()=>{
 const e=await fixture();try{
  Object.assign(e,{SHIFT_AI_FOOD_PHOTOS_ENABLED:'true',SHIFT_AI_VISION_BUDGET_APPROVED:'true',SHIFT_AI_VISION_TERMS_APPROVED:'true',SHIFT_AI_VISION:{fetch:async request=>{
   assert.equal(request.url,'https://shift-ai.internal/recognise-food');assert.equal(request.headers.get('Cookie'),null);const payload=await request.json();assert.deepEqual(Object.keys(payload).sort(),['caption','image','maxOutputTokens','task']);return Response.json({items:['Beans on toast'],nutrition:{proteinG:12}});
  }}});
  assert.equal(captureCapabilities(e).photo,true);assert.equal(captureCapabilities(e).photoProcessor,'Shift AI');
  const result=await(await foodCaptureRoutes(req(photo),e)).json();assert.equal(result.draft.food,'Beans on toast');assert.equal(result.draft.requiresReview,true);
  assert(!e.sql.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences.includes('Beans'));
 }finally{e.sql.close();}
});
test('photo calls never implicitly accept a model licence or spend without approval flags',async()=>{
 const e=await fixture();try{let calls=0;e.AI={run:async()=>{calls++;}};assert.equal((await foodCaptureRoutes(req(photo),e)).status,503);assert.equal(calls,0);const {capabilities}=await(await foodCaptureRoutes(req(),e)).json();assert.equal(capabilities.photo,false);}finally{e.sql.close();}
});
test('photo consent, image shape and caption limits are enforced before inference',async()=>{
 const e=activate(await fixture());try{let calls=0;e.AI.run=async()=>{calls++;};for(const body of[{...photo,processingConsent:false},{...photo,image:'https://evil.invalid/photo'},{...photo,image:'data:image/jpeg;base64,aGVsbG8='},{...photo,description:'x'.repeat(501)}])assert((await foodCaptureRoutes(req(body),e)).status>=400);assert.equal(calls,0);}finally{e.sql.close();}
});
test('successful photo recognition returns a review draft; no raw photo or food is persisted',async()=>{
 const e=activate(await fixture());try{const r=await foodCaptureRoutes(req(photo),e);assert.equal(r.status,200);const {draft}=await r.json();assert.equal(draft.food,'Eggs, toast');assert.equal(draft.nutrition.proteinG,18);assert.equal(draft.requiresReview,true);const prefs=e.sql.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences;assert(!prefs.includes('Eggs'));assert(!prefs.includes('base64'));assert.equal(e.sql.prepare('SELECT calls FROM grub_photo_budget').get().calls,1);}finally{e.sql.close();}
});
test('a five-photo daily allowance is atomic, member-specific and cannot overwrite other preferences',async()=>{
 const e=activate(await fixture());try{e.sql.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({food:{likes:['toast']}}));for(let i=0;i<5;i++)assert.equal((await foodCaptureRoutes(req(photo),e)).status,200);assert.equal((await foodCaptureRoutes(req(photo),e)).status,429);assert.equal((await foodCaptureRoutes(req(photo,{user:2}),e)).status,200);const p=JSON.parse(e.sql.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences);assert.deepEqual(p.food.likes,['toast']);assert.equal(p.grubPhotoUsage.calls,5);}finally{e.sql.close();}
});
test('the aggregate monthly allowance prevents provider calls after 500 scans',async()=>{
 const e=activate(await fixture());try{e.sql.exec('CREATE TABLE grub_photo_budget(month TEXT PRIMARY KEY,calls INTEGER,day TEXT,day_calls INTEGER);');const day=new Date().toISOString().slice(0,10);e.sql.prepare('INSERT INTO grub_photo_budget VALUES(?,500,?,1)').run(day.slice(0,7),day);let calls=0;e.AI.run=async()=>{calls++;};assert.equal((await foodCaptureRoutes(req(photo),e)).status,429);assert.equal(calls,0);}finally{e.sql.close();}
});
test('a withdrawal during inference suppresses the result',async()=>{
 const e=activate(await fixture());try{e.AI.run=async()=>{e.sql.exec('UPDATE consents SET granted=0 WHERE user_id=1');return {response:'{"items":["toast"]}'};};assert.equal((await foodCaptureRoutes(req(photo),e)).status,409);}finally{e.sql.close();}
});
test('provider prose or failures do not become trusted results',async()=>{
 const e=activate(await fixture());try{e.AI.run=async()=>({response:'Change your dose and eat 800 calories'});assert.equal((await foodCaptureRoutes(req(photo),e)).status,502);e.AI.run=async()=>{throw Error('secret provider diagnostic')};const r=await foodCaptureRoutes(req(photo),e);assert.equal(r.status,503);assert(!JSON.stringify(await r.json()).includes('secret'));}finally{e.sql.close();}
});
test('the served client bundle parses and keeps review/save, optional numbers and cleanup controls',()=>{
 new vm.Script(foodDiaryRuntime);for(const text of['processingConsent:true','data-gc-numbers','data-gc-discard','URL.revokeObjectURL','pagehide','visibilitychange','data-eaten-form','sst:food-saved'])assert(foodDiaryRuntime.includes(text),text);
 assert(!foodDiaryRuntime.includes('localStorage'));assert(!foodDiaryRuntime.includes('getUserMedia'));
});
