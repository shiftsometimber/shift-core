import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import core from '../worker.js';
import {memberDailyV3Routes,ensureTodaySchema,resolveTreatmentSetup,normaliseRecordedTreatmentContext,treatmentCard} from '../member-daily-v3.js';

class Statement{
  constructor(db,sql){this.db=db;this.sql=sql;this.args=[]}
  bind(...args){this.args=args;return this}
  async first(){return this.db.sqlite.prepare(this.sql).get(...this.args)||null}
  async all(){return{results:this.db.sqlite.prepare(this.sql).all(...this.args)}}
  async run(){const r=this.db.sqlite.prepare(this.sql).run(...this.args);return{success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}}
}
class D1{
  constructor(){this.sqlite=new DatabaseSync(':memory:')}
  prepare(sql){return new Statement(this,sql)}
  async exec(sql){this.sqlite.exec(sql)}
  async batch(statements){this.sqlite.exec('BEGIN');try{const rows=[];for(const s of statements)rows.push(await s.run());this.sqlite.exec('COMMIT');return rows}catch(e){this.sqlite.exec('ROLLBACK');throw e}}
}
const bootstrap=new D1();
bootstrap.sqlite.exec(`
 CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,first_name TEXT,last_name TEXT,phone TEXT,date_of_birth TEXT,postcode TEXT,created_at TEXT,updated_at TEXT);
 CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER,last_login_at TEXT);
 CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);
 CREATE TABLE member_status(user_id INTEGER PRIMARY KEY,lifecycle_stage TEXT,membership_status TEXT,source TEXT,last_activity_at TEXT,updated_at TEXT);
 CREATE TABLE cases(id INTEGER PRIMARY KEY,user_id INTEGER,reference TEXT,status TEXT,service_type TEXT,pharmacy_status TEXT,payment_status TEXT,created_at TEXT,updated_at TEXT);
 CREATE TABLE pharmacy_orders(id INTEGER PRIMARY KEY,user_id INTEGER);
`);
assert.equal((await core.fetch(new Request('https://api.shiftsometimber.co.uk/v1/me'),{DB:bootstrap})).status,401);
await ensureTodaySchema(bootstrap);
const schema=bootstrap.sqlite.prepare("SELECT sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END,name").all().map(r=>r.sql+';').join('\n');
bootstrap.sqlite.close();
function fixture(t){
  const DB=new D1();DB.sqlite.exec(schema);t.after(()=>DB.sqlite.close());
  DB.sqlite.exec(`INSERT INTO users VALUES(1,'synthetic@example.invalid','Synthetic','Member',NULL,NULL,NULL,'2026-01-01','2026-01-01');INSERT INTO user_auth VALUES(1,1,'2026-01-01');INSERT INTO member_status VALUES(1,'member','active','synthetic','2026-01-01','2026-01-01');`);
  DB.sqlite.prepare('INSERT INTO user_sessions VALUES(1,1,?,?,NULL,NULL)').run(createHash('sha256').update('treatment-integrity-session').digest('hex'),'2099-01-01T00:00:00Z');
  return{DB,env:{DB}};
}
const request=(path,method='GET',body)=>new Request('https://api.shiftsometimber.co.uk'+path,{method,headers:{Cookie:'sst_session=treatment-integrity-session',Origin:'https://shiftsometimber.co.uk','Content-Type':'application/json','X-Shift-Local-Date':'2026-09-16'},...(body?{body:JSON.stringify(body)}:{})});

for(const durationKey of ['started','weeks','months','longer'])test(`${durationKey} never becomes an exact treatment week`,()=>{
  const value=resolveTreatmentSetup({medicineKey:'mounjaro',doseKey:'5mg',durationKey});
  assert.equal(value.week,null);
});
test('only an explicit Orlistat selection creates an Orlistat record',()=>{
  for(const doseKey of ['60mg','120mg']){
    const specified=resolveTreatmentSetup({medicineKey:'orlistat',doseKey});
    assert.equal(specified.medicine,'Orlistat');assert.equal(specified.route,'oral');assert.equal(specified.dose,doseKey);
    const legacy=resolveTreatmentSetup({medicineKey:'tablet',doseKey,durationKey:'months'});
    assert.equal(legacy.medicine,'Unspecified tablet');assert.equal(legacy.dose,doseKey);assert.equal(legacy.week,null);
  }
  assert.equal(resolveTreatmentSetup({medicineKey:'orlistat',doseKey:'5mg'}),null);
  assert.equal(resolveTreatmentSetup({medicineKey:'mounjaro',doseKey:'60mg'}),null);
});
test('unknown identity and dose stay unknown',()=>{
  assert.deepEqual(resolveTreatmentSetup({medicineKey:'unspecified',doseKey:'120mg'}),{medicine:'Medicine not specified',route:'unknown',dose:'Not specified',week:null,status:'active'});
  assert.equal(resolveTreatmentSetup({medicineKey:'wegovy',doseKey:'unknown'}).dose,'Not specified');
  assert.equal(resolveTreatmentSetup({medicineKey:'add-later'}).status,'add_later');
  assert.equal(resolveTreatmentSetup({medicineKey:'not-taking'}).status,'not_taking');
});
test('historical approximate records render as approximate without mutating them',()=>{
  const stored={medicine:'A tablet',route:'tablet',dose:'120mg',week_number:8,status:'active'};
  const context=normaliseRecordedTreatmentContext(stored);
  assert.equal(stored.medicine,'A tablet');assert.equal(stored.week_number,8);
  assert.equal(context.medicine,'Unspecified tablet');assert.equal(context.medicine_specified,false);assert.equal(context.week_number,null);
  const card=treatmentCard({guts:'fine'},{},context);
  assert.match(card.headline,/A few months \(approximate\)/);assert.doesNotMatch(card.headline,/Week 8|Orlistat/);
  assert.equal(card.actions.find(([key])=>key==='record-support-need')[1],'Record that I need prescriber support');
  assert.ok(!card.actions.some(([,label])=>/Message the clinical team/.test(label)));
});
test('authenticated setup saves unknown precision and preserves medicine identity on reload',async t=>{
  const{DB,env}=fixture(t);
  const response=await memberDailyV3Routes(request('/v1/shift/treatment-context','PATCH',{medicineKey:'orlistat',doseKey:'120mg',durationKey:'weeks'}),env);
  const body=await response.json();assert.equal(response.status,200,JSON.stringify(body));
  assert.equal(body.context.medicine,'Orlistat');assert.equal(body.context.week_number,null);
  const stored=DB.sqlite.prepare('SELECT medicine,week_number FROM shift_treatment_context WHERE user_id=1').get();
  assert.equal(stored.medicine,'Orlistat');assert.equal(stored.week_number,null);
  const reload=await memberDailyV3Routes(request('/v1/shift/today/help?need=treatment'),env);
  assert.equal((await reload.json()).solution.title,'Orlistat · 120mg');
});
test('reading a historical tablet row does not relabel or rewrite its stored record',async t=>{
  const{DB,env}=fixture(t);
  DB.sqlite.prepare("INSERT INTO shift_treatment_context(user_id,medicine,route,dose,week_number) VALUES(1,'A tablet','tablet','60mg',3)").run();
  const response=await memberDailyV3Routes(request('/v1/shift/today/help?need=treatment'),env);
  assert.equal((await response.json()).solution.title,'Unspecified tablet · 60mg');
  const stored=DB.sqlite.prepare('SELECT medicine,week_number FROM shift_treatment_context WHERE user_id=1').get();
  assert.equal(stored.medicine,'A tablet');assert.equal(stored.week_number,3);
});
for(const choiceKey of ['record-support-need','message-clinical'])test(`${choiceKey} retains a local case but never claims clinical delivery`,async t=>{
  const{DB,env}=fixture(t),pending=[];
  const response=await memberDailyV3Routes(request('/v1/shift/today/treatment','POST',{choiceKey,note:'Synthetic support note to discuss with my own prescriber.'}),env,{waitUntil:p=>pending.push(p)});
  await Promise.all(pending);
  const body=await response.json();assert.equal(response.status,200,JSON.stringify(body));
  assert.ok(body.caseReference);assert.equal(body.deliveryStatus,'not_sent');assert.equal(body.action.deliveryStatus,'not_sent');
  assert.match(body.message,/No message has been sent/);assert.match(body.message,/no clinical response is scheduled/);
  assert.equal(body.next,'contact_prescriber_directly');
  const row=DB.sqlite.prepare('SELECT * FROM cases WHERE reference=?').get(body.caseReference);
  assert.equal(row.user_id,1);assert.equal(row.pharmacy_status,'not_sent');assert.equal(row.payment_status,'not_required');
  const saved=JSON.parse(DB.sqlite.prepare("SELECT choice_json FROM shift_today_choices WHERE user_id=1 AND domain='treatment'").get().choice_json);
  assert.deepEqual(saved,{key:choiceKey,label:'Prescriber support needed — not sent',deliveryStatus:'not_sent'});
  assert.doesNotMatch(JSON.stringify(body),/Synthetic support note|\"note\"/);
  assert.doesNotMatch(JSON.stringify(row),/Synthetic support note/);
  assert.doesNotMatch(DB.sqlite.prepare("SELECT choice_json FROM shift_today_choices WHERE user_id=1 AND domain='treatment'").get().choice_json,/Synthetic support note/);
  const event=DB.sqlite.prepare("SELECT properties_json FROM product_events WHERE user_id=1 AND event_name='my_timber_treatment_action'").get();
  assert.deepEqual(JSON.parse(event.properties_json),{date:'2026-09-16'},'treatment choices and notes stay out of usage analytics');
});
