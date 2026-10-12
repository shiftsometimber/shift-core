import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {treatmentRoutes} from '../treatment-routes.mjs';
import {INJECTION_SITES,describeTreatmentEvent} from '../treatment-detail.mjs';
import {treatmentRuntime} from '../treatment-page.mjs';
function setup(){
 const sql=new DatabaseSync(':memory:');
 sql.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT);CREATE TABLE user_sessions(id TEXT,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);CREATE TABLE consents(id INTEGER PRIMARY KEY,user_id INTEGER,consent_type TEXT,granted INTEGER);INSERT INTO users VALUES(1,'one@example.invalid'),(2,'two@example.invalid');INSERT INTO consents VALUES(1,1,'my_shift_health_tracking',1),(2,2,'my_shift_health_tracking',1);");
 sql.exec(readFileSync(new URL('../treatment.sql',import.meta.url),'utf8'));
 const DB={prepare(query){let values=[];return{bind(...args){values=args;return this;},async first(){return sql.prepare(query).get(...values)||null;},async all(){return{results:sql.prepare(query).all(...values)};},async run(){return{meta:{changes:Number(sql.prepare(query).run(...values).changes)}}}}},async batch(stmts){sql.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());sql.exec('COMMIT');return out;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 return{sql,DB,MY_TREATMENT_ENABLED:'true'};
}
async function token(env,user){const value='detail-token-'+user,hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))).toString('hex');env.sql.prepare('INSERT INTO user_sessions VALUES(?,?,?,?,NULL,NULL)').run('s'+user,user,hash,'2099-01-01');return value;}
const req=(path,token,body)=>new Request('https://preview.invalid/v1/member/treatment'+path,{method:body?'POST':'GET',headers:{Cookie:'sst_session='+token,Origin:'https://preview.invalid','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
async function fixture(medicine='Mounjaro'){const env=setup(),one=await token(env,1),two=await token(env,2);const result=await treatmentRoutes(req('/records',one,{medicine,prescriptionDetails:'Follow original prescription',supply:4,nextAt:null}),env);const{id}=await result.json();const event={treatmentId:id,kind:'dose_taken',note:'Member report',occurredAt:new Date(Date.now()-60000).toISOString(),operationId:crypto.randomUUID()};return{env,one,two,id,event};}
test('all recorded sites persist with a dose; replay does not consume supply twice or change the prescription',async()=>{
 for(const site of INJECTION_SITES){const {env,one,event}=await fixture();const body={...event,injectionSite:site.value};assert.equal((await treatmentRoutes(req('/events',one,body),env)).status,201);assert.equal((await treatmentRoutes(req('/events',one,body),env)).status,200);const data=await(await treatmentRoutes(req('',one),env)).json();assert.equal(data.events.find(e=>e.kind==='dose_taken').details.injectionSite,site.value);assert.equal(data.treatments[0].supply,3);assert.equal(data.treatments[0].prescription_details,'Follow original prescription');assert.equal(data.treatments[0].next_at,null);}
});
test('legacy doses without a site remain supported and a changed replay conflicts',async()=>{
 const {env,one,event}=await fixture();assert.equal((await treatmentRoutes(req('/events',one,event),env)).status,201);assert.equal((await treatmentRoutes(req('/events',one,{...event,injectionSite:'thigh_left'}),env)).status,409);assert.equal((await(await treatmentRoutes(req('',one),env)).json()).events.find(e=>e.kind==='dose_taken').details.injectionSite,undefined);
});
test('site validation rejects unknown locations, non-dose events and non-injection records',async()=>{
 const {env,one,event}=await fixture();for(const body of [{...event,injectionSite:'neck'},{...event,injectionSite:null},{...event,kind:'note',injectionSite:'thigh_left'}])assert.equal((await treatmentRoutes(req('/events',one,body),env)).status,400);
 for(const medicine of ['Orlistat','Prescribed testosterone','Blood test','Health appointment']){const f=await fixture(medicine);assert.equal((await treatmentRoutes(req('/events',f.one,{...f.event,injectionSite:'thigh_left'}),f.env)).status,400);}
});
test('another account cannot write or read injection locations or symptom details',async()=>{
 const {env,one,two,event}=await fixture();assert.equal((await treatmentRoutes(req('/events',two,{...event,injectionSite:'thigh_left'}),env)).status,404);await treatmentRoutes(req('/events',one,{...event,injectionSite:'thigh_left'}),env);const data=await(await treatmentRoutes(req('',two),env)).json();assert.deepEqual(data.events,[]);assert.deepEqual(data.treatments,[]);
});
test('symptom impact and onset survive read-back and PDF without asserting a cause',async()=>{
 const {env,one,id,event}=await fixture();const started=new Date(Date.now()-3600000).toISOString();const body={...event,kind:'checkin',checkin:{weight:93.2,appetite:'Low',energy:'Usual',sideEffects:'Synthetic symptom note',symptomImpact:'Some',symptomStartedAt:started}};assert.equal((await treatmentRoutes(req('/events',one,body),env)).status,201);const data=await(await treatmentRoutes(req('',one),env)).json();assert.deepEqual(data.events.find(e=>e.kind==='checkin').details.checkin,body.checkin);const pdf=await(await treatmentRoutes(req('/summary.pdf?period=all&treatment='+id,one),env)).text();assert.match(pdf,/Synthetic symptom note/);assert.match(pdf,/Effect on your day: Some/);assert.match(pdf,/Reported symptom start:/);assert.match(pdf,/not a clinical assessment/);
});
test('symptom additions are optional; invalid impact and impossible onset fail before writing',async()=>{
 const {env,one,event}=await fixture();const checkin={weight:null,appetite:'Usual',energy:'Low',sideEffects:'Synthetic'};for(const extra of [{symptomImpact:'critical'},{symptomStartedAt:'bad date'},{symptomStartedAt:new Date(Date.now()+3600000).toISOString()}])assert.equal((await treatmentRoutes(req('/events',one,{...event,kind:'checkin',checkin:{...checkin,...extra}}),env)).status,400);assert.equal((await treatmentRoutes(req('/events',one,{...event,kind:'checkin',checkin}),env)).status,201);
});
test('symptom start or affected-day impact requires a symptom report',async()=>{
 const {env,one,event}=await fixture();for(const extra of [{symptomImpact:'Some'},{symptomStartedAt:new Date(Date.now()-3600000).toISOString()}])assert.equal((await treatmentRoutes(req('/events',one,{...event,kind:'checkin',checkin:{weight:null,appetite:'Usual',energy:'Usual',sideEffects:'',...extra}}),env)).status,400);
});
test('site and symptom records retain consent and origin protections',async()=>{
 const {env,one,event}=await fixture();const body={...event,injectionSite:'abdomen_right'};const cross=new Request('https://preview.invalid/v1/member/treatment/events',{method:'POST',headers:{Cookie:'sst_session='+one,Origin:'https://other.invalid','Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal((await treatmentRoutes(cross,env)).status,403);env.sql.exec('UPDATE consents SET granted=0 WHERE user_id=1');assert.equal((await treatmentRoutes(req('/events',one,body),env)).status,409);assert.equal((await treatmentRoutes(req('/events','',body),env)).status,401);
});
test('injection site is included in the owned PDF and excluded from another account',async()=>{
 const {env,one,two,id,event}=await fixture();await treatmentRoutes(req('/events',one,{...event,injectionSite:'upper_arm_right'}),env);assert.match(await(await treatmentRoutes(req('/summary.pdf?period=all&treatment='+id,one),env)).text(),/Upper arm/);assert.equal((await treatmentRoutes(req('/summary.pdf?period=all&treatment='+id,two),env)).status,404);
});
test('shared descriptions preserve missing weight, notes and every new reported detail',()=>{
 assert.equal(describeTreatmentEvent({kind:'note',details:{note:'<private note>'}},INJECTION_SITES),'<private note>');const text=describeTreatmentEvent({kind:'checkin',details:{checkin:{weight:null,appetite:'Low',energy:'Usual',sideEffects:'Synthetic',symptomImpact:'A little'}}},INJECTION_SITES);assert.match(text,/Weight: Not recorded/);assert.match(text,/Effect on your day: A little/);assert.doesNotMatch(text,/0 kg/);
});
test('compiled browser asset parses after shared helper serialisation',()=>{assert.doesNotThrow(()=>new vm.Script(treatmentRuntime));assert(!treatmentRuntime.includes('${'));});

test('food, protein and water snapshots preserve actual zero, missing values and replay identity',async()=>{
 const {env,one,event}=await fixture();const checkin={weight:null,appetite:'Low',energy:'Usual',sideEffects:'',foodNote:'Synthetic meal note',proteinGrams:0,waterMl:250};const body={...event,kind:'checkin',checkin};assert.equal((await treatmentRoutes(req('/events',one,body),env)).status,201);assert.equal((await treatmentRoutes(req('/events',one,body),env)).status,200);const data=await(await treatmentRoutes(req('',one),env)).json();assert.deepEqual(data.events.find(e=>e.kind==='checkin').details.checkin,checkin);assert.equal(data.treatments[0].supply,4);const text=describeTreatmentEvent(data.events.find(e=>e.kind==='checkin'),INJECTION_SITES);assert.match(text,/Protein so far that day: 0 g/);assert.match(text,/Water so far that day: 250 ml/);assert.match(text,/Synthetic meal note/);
 const legacy=describeTreatmentEvent({kind:'checkin',details:{checkin:{weight:null,appetite:'Low',energy:'Low',sideEffects:''}}},INJECTION_SITES);assert.doesNotMatch(legacy,/Protein|Water/);
});
test('nutrition snapshots reject unknown, nonnumeric, negative and excessive entries',async()=>{
 const {env,one,event}=await fixture();const checkin={weight:null,appetite:'Low',energy:'Usual',sideEffects:''};for(const extra of [{proteinGrams:-1},{proteinGrams:501},{proteinGrams:'20'},{waterMl:-1},{waterMl:10001},{waterMl:'250'},{foodNote:'x'.repeat(2001)},{calorieGoal:1200}])assert.equal((await treatmentRoutes(req('/events',one,{...event,kind:'checkin',checkin:{...checkin,...extra}}),env)).status,400);
});
test('nutrition snapshots appear in the owned PDF and privacy export, not in another member record',async()=>{
 const {appendTreatmentExport}=await import('../treatment-privacy.mjs');const {env,one,two,id,event}=await fixture();const checkin={weight:null,appetite:'Usual',energy:'Usual',sideEffects:'',foodNote:'PRIVATE FOOD SNAPSHOT',proteinGrams:20,waterMl:250};await treatmentRoutes(req('/events',one,{...event,kind:'checkin',checkin}),env);const pdf=await(await treatmentRoutes(req('/summary.pdf?period=all&treatment='+id,one),env)).text();assert.match(pdf,/PRIVATE FOOD SNAPSHOT/);assert.match(pdf,/Protein so far that day: 20 g/);assert.match(pdf,/Water so far that day: 250 ml/);const exportRequest=new Request('https://preview.invalid/v1/privacy/export',{method:'POST',headers:{Cookie:'sst_session='+one}});const exported=await(await appendTreatmentExport(exportRequest,env,Response.json({}))).json();assert.deepEqual(exported.myTreatment.events.find(e=>e.kind==='checkin').details.checkin,checkin);assert.equal((await(await treatmentRoutes(req('',two),env)).json()).events.length,0);
});

test('one-item logs save without unrelated appetite or energy questions',async()=>{
 for(const checkin of [{weight:93.2},{waterMl:250},{proteinGrams:0},{foodNote:'Synthetic meal'},{appetite:'Low'},{energy:'Usual'},{sideEffects:'Synthetic symptom'},{sideEffects:'',symptomImpact:'None'}]){
  const {env,one,event}=await fixture();const body={...event,kind:'checkin',checkin};assert.equal((await treatmentRoutes(req('/events',one,body),env)).status,201);assert.equal((await treatmentRoutes(req('/events',one,body),env)).status,200);const data=await(await treatmentRoutes(req('',one),env)).json();assert.deepEqual(data.events.find(e=>e.kind==='checkin').details.checkin,checkin);assert.equal(data.treatments[0].supply,4);
 }
});
test('empty one-item logs do not create a false check-in',async()=>{
 for(const checkin of [{},{weight:null},{foodNote:' '},{sideEffects:''},{symptomImpact:'None'}]){const {env,one,event}=await fixture();const r=await treatmentRoutes(req('/events',one,{...event,kind:'checkin',checkin}),env);assert.equal(r.status,400);assert.equal((await(await treatmentRoutes(req('',one),env)).json()).events.length,1);}
});
test('a water-only record preserves unknown symptom, appetite and energy values',()=>{
 const text=describeTreatmentEvent({kind:'checkin',details:{checkin:{waterMl:250}}},INJECTION_SITES);assert.match(text,/Appetite: Not recorded/);assert.match(text,/Energy: Not recorded/);assert.match(text,/Reported side effects: Not recorded/);assert.doesNotMatch(text,/None reported/);
});
