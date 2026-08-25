import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {shiftAiLiveTodayRoutes} from '../shift-ai-live-today-v1.js';
import {fitDailyContext} from '../member-product-v8.js';

class D1Statement{
  constructor(db,sql,args=[]){this.db=db;this.sql=sql;this.args=args}
  bind(...args){return new D1Statement(this.db,this.sql,args)}
  async first(){return this.db.prepare(this.sql).get(...this.args)||null}
  async all(){return{results:this.db.prepare(this.sql).all(...this.args)}}
  async run(){return this.db.prepare(this.sql).run(...this.args)}
}
class D1{
  constructor(){this.db=new DatabaseSync(':memory:')}
  prepare(sql){return new D1Statement(this.db,sql)}
  async batch(statements){this.db.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());this.db.exec('COMMIT');return results}catch(error){this.db.exec('ROLLBACK');throw error}}
  exec(sql){this.db.exec(sql);return Promise.resolve()}
}
async function tokenHash(value){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function accepted(type,extra={}){return JSON.stringify({provenance:{final_v1_acceptance:{accepted:true}},...(type==='recipe'?{meal_type:'dinner',prep_minutes:5,cook_minutes:7,tags:['quick'],ingredients:[{item:'chicken'}],nutrition:{status:'validated'}}:{minutes:10,movement_group:'walking',serving_groups:['walking'],visual:{status:'approved'}}),...extra})}
async function fixture({AI=null,model=false}={}){
  const DB=new D1(),session='route-test-session',hash=await tokenHash(session),expires=new Date(Date.now()+86400000).toISOString();
  await DB.exec(`
    CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,first_name TEXT,last_name TEXT,date_of_birth TEXT,postcode TEXT);
    CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);
    CREATE TABLE member_status(user_id INTEGER PRIMARY KEY,lifecycle_stage TEXT,membership_status TEXT,source TEXT,last_activity_at TEXT);
    CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,my_why TEXT,roadmap TEXT,treatment_finder TEXT,decision_readiness TEXT,preferences TEXT);
    CREATE TABLE shift_personal_state(user_id INTEGER PRIMARY KEY,profile_json TEXT,inventory_json TEXT);
    CREATE TABLE progress_entries(id INTEGER PRIMARY KEY,user_id INTEGER,recorded_on TEXT,weight_kg REAL,waist_cm REAL,steps INTEGER,protein_g REAL,sleep_hours REAL,mood_score REAL);
    CREATE TABLE shift_today_checkins(user_id INTEGER,local_date TEXT,mood TEXT,guts TEXT,energy TEXT);
    CREATE TABLE shift_today_choices(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,local_date TEXT,domain TEXT,choice_key TEXT,choice_json TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,local_date,domain));
    CREATE TABLE shift_plans(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,plan_type TEXT,starts_on TEXT,status TEXT,plan_json TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE structured_content(id TEXT PRIMARY KEY,content_type TEXT,title TEXT,status TEXT,data_json TEXT,review_json TEXT,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE shift_ai_pilot_control(id INTEGER PRIMARY KEY,enabled INTEGER,phase INTEGER,max_members INTEGER,consent_version TEXT,starts_at TEXT,ends_at TEXT,stopped_at TEXT,stop_reason TEXT,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE shift_ai_pilot_access(user_id INTEGER PRIMARY KEY,status TEXT,cohort INTEGER,consent_version TEXT,consented_at TEXT,consent_evidence_ref TEXT,starts_at TEXT,ends_at TEXT,activated_by TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
  `);
  DB.db.prepare('INSERT INTO users VALUES(1,?,?,?,?,?)').run('member@example.test','Billy','Timber','1980-01-01','M1');
  DB.db.prepare('INSERT INTO user_auth VALUES(1,1)').run();
  DB.db.prepare('INSERT INTO user_sessions VALUES(1,1,?,?,NULL,NULL)').run(hash,expires);
  DB.db.prepare('INSERT INTO member_status VALUES(1,?,?,?,?)').run('active','member','direct',new Date().toISOString());
  DB.db.prepare('INSERT INTO member_state VALUES(1,?,?,?,?,?)').run(JSON.stringify({text:'Get life back'}),JSON.stringify({protein_target:120}),JSON.stringify({}),JSON.stringify({stage:'ready'}),JSON.stringify({food:{quick:true},lifeBack:{priorities:['family time'],entries:[{date:'2026-08-16',scores:{energy:2}},{date:'2026-08-24',scores:{energy:3}}]}}));
  DB.db.prepare('INSERT INTO shift_personal_state VALUES(1,?,?)').run(JSON.stringify({routine:{late_finish:true}}),'[]');
  DB.db.prepare('INSERT INTO progress_entries VALUES(1,1,?,?,?,?,?,?,?)').run('2026-08-24',101,110,5000,90,6,3);
  DB.db.prepare('INSERT INTO shift_today_checkins VALUES(1,?,?,?,?)').run('2026-08-24','okay','fine','good');
  DB.db.prepare('INSERT INTO shift_today_choices(user_id,local_date,domain,choice_key,choice_json) VALUES(1,?,?,?,?)').run('2026-08-20','day_change','working_late','{}');
  DB.db.prepare('INSERT INTO structured_content VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)').run('recipe-1','recipe','Chicken wrap','published',accepted('recipe'),JSON.stringify({status:'approved',final_v1:true}));
  DB.db.prepare('INSERT INTO structured_content VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)').run('exercise-1','exercise','Ten-minute walk','published',accepted('exercise'),JSON.stringify({status:'approved',final_v1:true}));
  DB.db.prepare('INSERT INTO shift_plans(user_id,plan_type,starts_on,status,plan_json) VALUES(1,?,?,?,?)').run('grub','2026-08-24','active',JSON.stringify({days:[{meals:[{id:'recipe-1',name:'Chicken wrap'}]}]}));
  DB.db.prepare('INSERT INTO shift_plans(user_id,plan_type,starts_on,status,plan_json) VALUES(1,?,?,?,?)').run('fit','2026-08-24','active',JSON.stringify({sessions:[{exercises:[{id:'exercise-1',name:'Ten-minute walk'}]}]}));
  const pilotStart=new Date(Date.now()-3600000).toISOString(),pilotEnd=new Date(Date.now()+13*86400000).toISOString(),consentedAt=new Date(Date.now()-1800000).toISOString();DB.db.prepare('INSERT INTO shift_ai_pilot_control VALUES(1,1,1,5,?,?,?,?,?,CURRENT_TIMESTAMP)').run('shift-ai-r4-pilot-consent-v1',pilotStart,pilotEnd,null,null);DB.db.prepare('INSERT INTO shift_ai_pilot_access(user_id,status,cohort,consent_version,consented_at,consent_evidence_ref,starts_at,ends_at,activated_by) VALUES(1,?,?,?,?,?,?,?,?)').run('active',1,'shift-ai-r4-pilot-consent-v1',consentedAt,'consent-test-1',pilotStart,pilotEnd,'test-operator');
  return{env:{DB,AI,SHIFT_TODAY_MODEL_ENABLED:model?'true':'false',SHIFT_AI_R4_PILOT_ENABLED:'true'},headers:{Cookie:`sst_session=${session}`,'Content-Type':'application/json','X-Shift-Local-Date':'2026-08-24','X-Shift-Local-Hour':'18'}};
}
const req=(path,{method='GET',headers={},body}={})=>new Request(`https://api.shiftsometimber.co.uk${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});

test('master environment flag keeps the pilot dark by default',async()=>{
  const {env,headers}=await fixture();delete env.SHIFT_AI_R4_PILOT_ENABLED;const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/bootstrap',{headers}),env);assert.equal(response.status,404);assert.equal(env.DB.db.prepare('SELECT COUNT(*) c FROM shift_ai_today_proposals').get().c,0);
});

test('all-current-members audience admits a current member without an invite row',async()=>{
  const {env,headers}=await fixture();
  env.SHIFT_AI_R4_AUDIENCE='all_current_members';
  env.DB.db.prepare('DELETE FROM shift_ai_pilot_access WHERE user_id=1').run();
  const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/bootstrap',{headers}),env),result=await response.json();
  assert.equal(response.status,200);assert.equal(result.ok,true);
});

test('all-current-members audience blocks non-members and audits the denial',async()=>{
  const {env,headers}=await fixture();
  env.SHIFT_AI_R4_AUDIENCE='all_current_members';
  env.DB.db.prepare("UPDATE user_auth SET email_verified=0 WHERE user_id=1").run();
  const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/bootstrap',{headers}),env),result=await response.json();
  assert.equal(response.status,403);assert.equal(result.error,'current_membership_required');
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_ai_today_audit WHERE outcome='current_membership_required'").get().c,1);
});

test('global kill switch stops the all-current-members audience',async()=>{
  const {env,headers}=await fixture();env.SHIFT_AI_R4_AUDIENCE='all_current_members';
  env.DB.db.prepare("UPDATE shift_ai_pilot_control SET enabled=0,stop_reason='all_members_kill_test' WHERE id=1").run();
  const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/bootstrap',{headers}),env),result=await response.json();
  assert.equal(response.status,404);assert.equal(result.error,'pilot_off');
});

test('one control-table update kills bootstrap, proposal and pending confirmation',async()=>{
  const {env,headers}=await fixture(),proposed=await (await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I am working late'}}),env)).json();assert.ok(proposed.proposal_id);env.DB.db.prepare("UPDATE shift_ai_pilot_control SET enabled=0,stopped_at=CURRENT_TIMESTAMP,stop_reason='operator_test' WHERE id=1").run();for(const [path,options] of [['/v1/shift-ai/today/bootstrap',{headers}],['/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I am working late'}}],['/v1/shift-ai/today/rebuild/confirm',{method:'POST',headers,body:{proposal_id:proposed.proposal_id,confirmed:true}}]]){const response=await shiftAiLiveTodayRoutes(req(path,options),env);assert.equal(response.status,404)}assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_today_choices WHERE domain='ai_rebuild'").get().c,0);
});

for(const [label,sql] of [
  ['missing consent timestamp',"UPDATE shift_ai_pilot_access SET consented_at=NULL WHERE user_id=1"],
  ['missing consent evidence',"UPDATE shift_ai_pilot_access SET consent_evidence_ref=NULL WHERE user_id=1"],
  ['wrong consent version',"UPDATE shift_ai_pilot_access SET consent_version='old' WHERE user_id=1"],
  ['revoked member',"UPDATE shift_ai_pilot_access SET status='revoked' WHERE user_id=1"],
  ['phase-two member during phase one',"UPDATE shift_ai_pilot_access SET cohort=2 WHERE user_id=1"],
  ['expired member window',"UPDATE shift_ai_pilot_access SET ends_at='2026-01-01T00:00:00.000Z' WHERE user_id=1"]
])test(`pilot access fails closed for ${label}`,async()=>{const {env,headers}=await fixture();env.DB.db.exec(sql);const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/bootstrap',{headers}),env),result=await response.json();assert.equal(response.status,403);assert.equal(result.error,'pilot_access_required');assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_ai_today_audit WHERE outcome='pilot_access_required'").get().c,1)});

test('phase two permits a consented cohort-two member only at the exact ten-member limit',async()=>{
  const {env,headers}=await fixture();env.DB.db.prepare('UPDATE shift_ai_pilot_control SET phase=2,max_members=10 WHERE id=1').run();env.DB.db.prepare('UPDATE shift_ai_pilot_access SET cohort=2 WHERE user_id=1').run();const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/bootstrap',{headers}),env),result=await response.json();assert.equal(response.status,200);assert.equal(result.ok,true);
});

test('phase one hard-stops if more than five active members are configured',async()=>{
  const {env,headers}=await fixture(),row=env.DB.db.prepare('SELECT * FROM shift_ai_pilot_access WHERE user_id=1').get();for(let id=2;id<=6;id++)env.DB.db.prepare('INSERT INTO shift_ai_pilot_access(user_id,status,cohort,consent_version,consented_at,consent_evidence_ref,starts_at,ends_at,activated_by) VALUES(?,?,?,?,?,?,?,?,?)').run(id,'active',1,row.consent_version,row.consented_at,`consent-${id}`,row.starts_at,row.ends_at,'test-operator');const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/bootstrap',{headers}),env),result=await response.json();assert.equal(response.status,503);assert.equal(result.error,'pilot_cohort_limit');assert.equal(env.DB.db.prepare('SELECT COUNT(*) c FROM shift_ai_today_proposals').get().c,0);
});

test('pilot control requires exact phase limits and a maximum fourteen-day window',async()=>{
  for(const [sql,status,error] of [["UPDATE shift_ai_pilot_control SET max_members=6 WHERE id=1",503,'pilot_control_invalid'],["UPDATE shift_ai_pilot_control SET ends_at=datetime(starts_at,'+15 day') WHERE id=1",403,'pilot_window_closed']]){const {env,headers}=await fixture();env.DB.db.exec(sql);const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/bootstrap',{headers}),env),result=await response.json();assert.equal(response.status,status);assert.equal(result.error,error)}
});

test('authenticated live journey reads governed data, proposes without writing, then confirms into My Timber',async()=>{
  const {env,headers}=await fixture();
  const bootstrap=await (await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/bootstrap',{headers}),env)).json();
  assert.equal(bootstrap.recognition_starts.length,5);
  assert.equal(bootstrap.availability.grub,1);
  assert.equal(bootstrap.availability.fit,1);
  assert.equal(bootstrap.feature.model_enabled,false);
  assert.equal(bootstrap.plan_context.status,'sparse_retained_plan');
  assert.equal(bootstrap.recognition_starts[0].governed_draft.meal.title,'Chicken wrap');
  assert.equal(bootstrap.recognition_starts[0].governed_draft.movement.title,'Ten-minute walk');
  const proposed=await (await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'Dinner is late and the gym has gone.',requested_route:'working-late',available_minutes:15}}),env)).json();
  assert.equal(proposed.ok,true);
  assert.equal(proposed.proposal.requires_confirmation,true);
  assert.deepEqual(proposed.proposal.plan.selected_meal_ids,['recipe-1']);
  assert.deepEqual(proposed.proposal.plan.selected_movement_ids,['exercise-1']);
  assert.ok(proposed.proposal.plan.amnesty);
  assert.equal(proposed.proposal.plan.no_guilt.passed,true);
  assert.deepEqual(proposed.proposal.plan.life_back.member_priorities,['family time']);
  assert.deepEqual(proposed.proposal.plan.life_back.observed_evidence,['energy']);
  assert.deepEqual(proposed.proposal.plan.life_back.intended_protection,['family time']);
  assert.equal(proposed.proposal.plan.life_back.causal_claim,false);
  assert.equal(proposed.proposal.plan.life_back.scale.role,'supporting_context_only');
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_today_choices WHERE domain='ai_rebuild'").get().c,0);
  const confirmed=await (await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/confirm',{method:'POST',headers,body:{proposal_id:proposed.proposal_id,confirmed:true}}),env)).json();
  assert.equal(confirmed.written,true);
  assert.equal(confirmed.canonical_today,true);
  assert.equal(confirmed.change_summary.meal.title,'Chicken wrap');
  assert.equal(confirmed.change_summary.movement.title,'Ten-minute walk');
  assert.equal(confirmed.audit_reference,proposed.proposal_id);
  assert.deepEqual(confirmed.approved_catalogue_ids,['recipe-1','exercise-1']);
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_today_choices WHERE domain='ai_rebuild'").get().c,1);
  assert.equal(env.DB.db.prepare("SELECT status FROM shift_ai_today_proposals WHERE id=?").get(proposed.proposal_id).status,'confirmed');
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_ai_today_audit").get().c,3);
  const confirmedAudit=JSON.parse(env.DB.db.prepare("SELECT result_json FROM shift_ai_today_audit WHERE event_name='rebuild_confirmed'").get().result_json);assert.equal(confirmedAudit.canonical_today,true);assert.equal(confirmedAudit.change_summary.meal.id,'recipe-1');assert.equal(confirmedAudit.no_guilt.passed,true);
  const repeated=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/confirm',{method:'POST',headers,body:{proposal_id:proposed.proposal_id,confirmed:true}}),env);
  assert.equal(repeated.status,409);
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_today_choices WHERE domain='ai_rebuild'").get().c,1);
});

test('confirmation requires a literal true member decision',async()=>{
  const {env,headers}=await fixture(),proposed=await (await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I am working late'}}),env)).json();
  const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/confirm',{method:'POST',headers,body:{proposal_id:proposed.proposal_id,confirmed:'true'}}),env);
  assert.equal(response.status,400);
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_today_choices WHERE domain='ai_rebuild'").get().c,0);
});

test('urgent language is rejected before any available model binding is called',async()=>{
  let calls=0;const AI={run:async()=>{calls++;return{response:'{}'}}},{env,headers}=await fixture({AI,model:false});
  const result=await (await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I have chest pain',requested_route:'working-late'}}),env)).json();
  assert.equal(result.proposal.classification,'urgent');
  assert.equal(calls,0);
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_today_choices WHERE domain='ai_rebuild'").get().c,0);
});

test('pilot fails closed before planning if the model flag is switched on',async()=>{
  let calls=0;const AI={run:async()=>{calls++;return{response:'{}'}}},{env,headers}=await fixture({AI,model:true}),response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I am working late'}}),env),result=await response.json();assert.equal(response.status,503);assert.equal(result.error,'pilot_model_lock');assert.equal(calls,0);assert.equal(env.DB.db.prepare('SELECT COUNT(*) c FROM shift_ai_today_proposals').get().c,0);assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_ai_today_audit WHERE outcome='pilot_model_lock'").get().c,1);
});

test('confirmation fails closed when an approved catalogue record changes after proposal',async()=>{
  const {env,headers}=await fixture(),proposed=await (await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I am working late'}}),env)).json();
  env.DB.db.prepare("UPDATE structured_content SET status='draft' WHERE id='recipe-1'").run();
  const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/confirm',{method:'POST',headers,body:{proposal_id:proposed.proposal_id,confirmed:true}}),env),result=await response.json();
  assert.equal(response.status,409);
  assert.equal(result.error,'live_context_incomplete');
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_today_choices WHERE domain='ai_rebuild'").get().c,0);
});

test('recorded dietary conflict fails closed before proposal',async()=>{
  const {env,headers}=await fixture();env.DB.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({food:{vegetarian:true,allergies:['chicken']},lifeBack:{priorities:['family time']}}));
  const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I am working late'}}),env),result=await response.json();
  assert.equal(response.status,409);
  assert.equal(result.error,'live_context_incomplete');
  assert.ok(result.details.missing.includes('no_member_compatible_grub'));
  assert.equal(result.details.compatibility_conflicts[0].reason,'vegetarian_conflict');
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_ai_today_proposals").get().c,0);
});

test('recorded movement location conflict fails closed before proposal',async()=>{
  const {env,headers}=await fixture();env.DB.db.prepare("UPDATE structured_content SET data_json=? WHERE id='exercise-1'").run(accepted('exercise',{locations:['gym'],equipment:['barbell']}));env.DB.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({food:{quick:true},movement:{locations:['home']},lifeBack:{priorities:['family time']}}));
  const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I am working late'}}),env),result=await response.json();assert.equal(response.status,409);assert.ok(result.details.missing.includes('no_member_compatible_fit'));assert.equal(result.details.compatibility_conflicts[0].kind,'movement');assert.equal(result.experience.generic_fallback_used,false);assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_ai_today_proposals").get().c,0);
});

test('recorded no-equipment rule rejects equipment-dependent movement',async()=>{
  const {env,headers}=await fixture();env.DB.db.prepare("UPDATE structured_content SET data_json=? WHERE id='exercise-1'").run(accepted('exercise',{equipment:['dumbbells']}));env.DB.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({food:{quick:true},movement:{equipment:['none']},lifeBack:{priorities:['family time']}}));const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I have no time'}}),env),result=await response.json();assert.equal(response.status,409);assert.equal(result.details.compatibility_conflicts[0].reason,'movement_equipment_conflict');
});

for(const [constraint,preferences,reason] of [
  ['location',{movement:{locations:['home']}},'missing_movement_location_metadata'],
  ['equipment',{movement:{equipment:['dumbbells']}},'missing_movement_equipment_metadata']
])test(`missing ${constraint} metadata fails closed when the member has that constraint`,async()=>{
  const {env,headers}=await fixture();env.DB.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({...preferences,food:{quick:true},lifeBack:{priorities:['family time']}}));const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I have no time'}}),env),result=await response.json();assert.equal(response.status,409);assert.equal(result.details.compatibility_conflicts[0].reason,reason);assert.equal(result.experience.reason,'no_member_compatible_fit');assert.equal(result.experience.actions[0].href,'/member/fit');
});

test('movement equipment must match the equipment the member actually has',async()=>{
  const {env,headers}=await fixture();env.DB.db.prepare("UPDATE structured_content SET data_json=? WHERE id='exercise-1'").run(accepted('exercise',{equipment:['barbell']}));env.DB.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({food:{quick:true},movement:{equipment:['dumbbells']},lifeBack:{priorities:['family time']}}));const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I have no time'}}),env),result=await response.json();assert.equal(response.status,409);assert.equal(result.details.compatibility_conflicts[0].reason,'movement_equipment_conflict');
});

for(const [label,food] of [['dislike',{dislikes:['chicken']}],['allergy text',{dietaryRequirements:['chicken allergy']}],['vegan flag',{dietaryRequirements:['vegan']}],['gluten-free flag',{dietaryRequirements:['gluten-free']}]])test(`recorded ${label} is enforced`,async()=>{
  const {env,headers}=await fixture();env.DB.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({food,lifeBack:{priorities:['family time']}}));const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I am working late'}}),env);assert.equal(response.status,409);assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_ai_today_proposals").get().c,0);
});

test('preference change after proposal is revalidated and blocks confirmation',async()=>{
  const {env,headers}=await fixture(),proposed=await (await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I am working late'}}),env)).json();env.DB.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({food:{allergies:['chicken']},lifeBack:{priorities:['family time']}}));
  const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/confirm',{method:'POST',headers,body:{proposal_id:proposed.proposal_id,confirmed:true}}),env),result=await response.json();
  assert.equal(response.status,409);
  assert.equal(result.error,'live_context_incomplete');
  assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_today_choices WHERE domain='ai_rebuild'").get().c,0);
});

test('missing retained Grub or Fit plan fails closed without global fallback',async()=>{
  for(const type of ['grub','fit']){const {env,headers}=await fixture();env.DB.db.prepare('DELETE FROM shift_plans WHERE plan_type=?').run(type);const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I am working late'}}),env),result=await response.json();assert.equal(response.status,409);assert.equal(result.error,'live_context_incomplete');assert.ok(result.details.missing.includes(`active_${type}_plan`));assert.equal(result.experience.status,'action_required');assert.equal(result.experience.reason,`active_${type}_plan`);assert.equal(result.experience.generic_fallback_used,false);assert.deepEqual(result.experience.actions.map(x=>x.href),[`/member/${type}`]);assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_ai_today_proposals").get().c,0)}
});

test('partial live catalogue fails closed instead of serving a partial rebuild',async()=>{
  const {env,headers}=await fixture();env.DB.db.prepare("DELETE FROM structured_content WHERE content_type='exercise'").run();const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/bootstrap',{headers}),env),result=await response.json();assert.equal(response.status,409);assert.ok(result.details.missing.includes('unresolved_retained_catalogue_ids'));assert.equal(result.experience.generic_fallback_used,false);
});

test('empty today check-in is incomplete context rather than a successful empty read',async()=>{
  const {env,headers}=await fixture();env.DB.db.prepare('DELETE FROM shift_today_checkins').run();const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/bootstrap',{headers}),env),result=await response.json();assert.equal(response.status,409);assert.ok(result.details.missing.includes('today_check_in'));assert.equal(result.experience.status,'action_required');assert.equal(result.experience.reason,'today_check_in');assert.equal(result.experience.actions[0].label,'Add today’s check-in');assert.equal(result.experience.actions[0].href,'/member/dashboard#today');
});

test('missing progress gets its own smallest useful recovery action',async()=>{
  const {env,headers}=await fixture();env.DB.db.prepare('DELETE FROM progress_entries').run();const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/bootstrap',{headers}),env),result=await response.json();assert.equal(response.status,409);assert.equal(result.experience.reason,'recent_progress');assert.equal(result.experience.actions[0].href,'/member/dashboard#visualise');assert.match(result.experience.message,/progress entry/i);
});

test('recognition explains which live signals make each start fit',async()=>{
  const {env,headers}=await fixture();env.DB.db.prepare("UPDATE shift_today_checkins SET guts='rough',energy='low'").run();const result=await (await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/bootstrap',{headers}),env)).json(),byRoute=new Map(result.recognition_starts.map(x=>[x.route,x]));assert.match(byRoute.get('working-late').why_this_fits.join(' '),/Late finishes/i);assert.match(byRoute.get('plans-changed').why_this_fits.join(' '),/recent plan change/i);assert.match(byRoute.get('feeling-rough').why_this_fits.join(' '),/stomach|energy is low/i);assert.equal(byRoute.get('no-time').context_used.today_check_in,true);assert.equal(byRoute.get('eating-out').context_used.life_back_priority,true);assert.match(byRoute.get('working-late').member_intro,/Billy/);
});

test('Life Back keeps priorities, observations and intended support separate',async()=>{
  const {env,headers}=await fixture();const proposed=await (await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I am working late'}}),env)).json(),life=proposed.proposal.plan.life_back;assert.deepEqual(life.member_priorities,['family time']);assert.deepEqual(life.observed_evidence,['energy']);assert.deepEqual(life.intended_protection,['family time']);assert.equal(life.causal_claim,false);assert.doesNotMatch(life.headline,/this change protects/i);
});

test('missing required My Timber table returns 503 and no proposal',async()=>{
  const {env,headers}=await fixture();env.DB.db.exec('DROP TABLE progress_entries');const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I am working late'}}),env),result=await response.json();assert.equal(response.status,503);assert.equal(result.error,'live_context_unavailable');assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_ai_today_proposals").get().c,0);
});

test('confirmed rebuild becomes canonical Today meal and movement',async()=>{
  const {env,headers}=await fixture();env.DB.db.prepare('INSERT INTO structured_content VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)').run('recipe-slow','recipe','Slow dinner','published',accepted('recipe',{prep_minutes:30,cook_minutes:45,tags:['dinner'],ingredients:[{item:'beef'}]}),JSON.stringify({status:'approved',final_v1:true}));env.DB.db.prepare("UPDATE shift_plans SET plan_json=? WHERE plan_type='grub'").run(JSON.stringify({days:[{meals:[{id:'recipe-slow',type:'Dinner',name:'Slow dinner',minutes:75},{id:'recipe-1',type:'Dinner',name:'Chicken wrap',minutes:12}]}]}));
  const proposed=await (await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I am working late',available_minutes:15}}),env)).json();assert.deepEqual(proposed.proposal.plan.selected_meal_ids,['recipe-1']);await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/confirm',{method:'POST',headers,body:{proposal_id:proposed.proposal_id,confirmed:true}}),env);const daily=await fitDailyContext(req('/v1/shift/daily-plan',{headers}),env,1);assert.equal(daily.confirmed_rebuild.selected_meals[0].id,'recipe-1');assert.equal(daily.daily_output.meal.id,'recipe-1');assert.equal(daily.daily_output.workout.exercises[0],'Ten-minute walk');assert.equal(daily.daily_output.confirmed_rebuild,true);assert.equal(daily.daily_output.canonical_today,true);assert.equal(daily.daily_output.audit_reference,proposed.proposal_id);assert.deepEqual(daily.daily_output.life_back.member_priorities,['family time']);assert.deepEqual(daily.daily_output.life_back.observed_evidence,['energy']);assert.equal(daily.daily_output.life_back.causal_claim,false);assert.equal(daily.daily_output.monday_amnesty.status,'offered_not_applied');assert.equal(daily.confirmed_rebuild.change_summary.meal.id,daily.daily_output.meal.id);assert.equal(daily.confirmed_rebuild.change_summary.movement.title,daily.daily_output.workout.title);
});

test('member suitability change for movement is revalidated at confirmation',async()=>{
  const {env,headers}=await fixture();env.DB.db.prepare("UPDATE structured_content SET data_json=? WHERE id='exercise-1'").run(accepted('exercise',{locations:['gym'],equipment:['barbell']}));const proposed=await (await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/propose',{method:'POST',headers,body:{message:'I am working late'}}),env)).json();env.DB.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({food:{quick:true},movement:{locations:['home']},lifeBack:{priorities:['family time']}}));const response=await shiftAiLiveTodayRoutes(req('/v1/shift-ai/today/rebuild/confirm',{method:'POST',headers,body:{proposal_id:proposed.proposal_id,confirmed:true}}),env);assert.equal(response.status,409);assert.equal(env.DB.db.prepare("SELECT COUNT(*) c FROM shift_today_choices WHERE domain='ai_rebuild'").get().c,0);
});
