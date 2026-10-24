import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {prescriptionEventEligibility,prescriptionOutboxEligibility} from '../hq-prescription-event-eligibility.mjs';
import {eventDeliveryEligibility,intentSourceEligibility} from '../hq-event-delivery-eligibility.mjs';
const now=new Date('2026-10-24T20:00:00.000Z'),future='2026-10-25T20:00:00.000Z',past='2026-10-23T20:00:00.000Z';
const record='11111111-1111-4111-8111-111111111111',event='22222222-2222-4222-8222-222222222222';
function fixture(t,{kind='prescription_proposed',status='awaiting_member'}={}){
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());
 db.exec(`CREATE TABLE clinical_prescription_events(id TEXT,record_id TEXT,version INTEGER,kind TEXT,created_at TEXT);
 CREATE TABLE clinical_prescription_requests(record_id TEXT,member_id INTEGER,order_number TEXT,version INTEGER,state_json TEXT);
 CREATE TABLE clinical_prescription_versions(record_id TEXT,version INTEGER,state_json TEXT);
 CREATE TABLE clinical_member_records(id TEXT,user_id INTEGER,order_number TEXT,review_sharing INTEGER,revision INTEGER);
 CREATE TABLE clinical_member_versions(record_id TEXT,version INTEGER,digest TEXT,submitted INTEGER);
 CREATE TABLE clinical_case_state(record_id TEXT,version INTEGER,assessment_version INTEGER,status TEXT);
 CREATE TABLE medicine_orders(order_number TEXT,user_id INTEGER,medicine_id INTEGER,variant_id INTEGER,currency TEXT,total_pence INTEGER,status TEXT,updated_at TEXT,discount_pence INTEGER,discount_code TEXT);
 CREATE TABLE medicine_variants(id INTEGER,medicine_id INTEGER,status TEXT,selling_price_pence INTEGER,updated_at TEXT);
 CREATE TABLE hq_users(id INTEGER,role TEXT,status TEXT,mfa_enabled INTEGER,email TEXT);
 CREATE TABLE partner_staff(id TEXT,hq_user_id INTEGER,kind TEXT,org_id TEXT,version INTEGER,state_json TEXT);
 CREATE TABLE partner_organisations(id TEXT,version INTEGER,state_json TEXT);
 CREATE TABLE clinical_case_assignments(record_id TEXT,hq_user_id INTEGER,active INTEGER,expires_at TEXT);
 CREATE TABLE clinical_hq_staff(user_id INTEGER,active INTEGER,role TEXT,expires_at TEXT,verified_by TEXT,registration_body TEXT,registration_number TEXT);
 CREATE TABLE clinical_prescription_signatures(id TEXT,record_id TEXT,version INTEGER,key_id TEXT);
 CREATE TABLE clinical_prescriber_signing_keys(id TEXT,hq_user_id INTEGER,status TEXT,expires_at TEXT,profile_version INTEGER,organisation_version INTEGER,reviewed_by INTEGER,verification_reference TEXT);
 CREATE TABLE partner_fulfilment(order_number TEXT,member_id INTEGER,partner_id TEXT,state_json TEXT);
 CREATE TABLE clinical_case_outbox(id TEXT,event_id TEXT,recipient_user_id INTEGER,recipient_kind TEXT,template TEXT,status TEXT);
 CREATE TABLE clinical_notification_events(id TEXT,member_id INTEGER,record_id TEXT,order_number TEXT,kind TEXT);
 CREATE TABLE clinical_notification_channels(event_id TEXT,channel TEXT,status TEXT,draft_id TEXT);
 CREATE TABLE hq_notification_intents(event_key TEXT,source TEXT,source_id TEXT,recipient_kind TEXT,recipient_user_id INTEGER,draft_id TEXT,state TEXT);
 CREATE TABLE users(id INTEGER,email TEXT);CREATE TABLE user_auth(user_id INTEGER,email_verified INTEGER);`);
 const s={recordId:record,memberId:44,orderNumber:'TEST-ORDER',version:1,status,expiresAt:future,recordRevision:1,assessmentVersion:1,assessmentDigest:'synthetic-digest',caseVersion:1,partnerId:'pharmacy',prescriber:{id:7,profileId:'clinician',profileVersion:0,organisationId:'clinic',organisationVersion:0},treatment:{variantId:1,medicine:'TEST MEDICINE — NOT FOR SUPPLY'},quote:{originalTotalPence:20000,originalVariantId:2,orderStatus:'paid',orderUpdatedAt:past,originalDiscountPence:0,originalDiscountCode:null,unitPricePence:17000,catalogueUpdatedAt:past},prescriptionId:'TEST-RX'};
 const state=JSON.stringify(s);db.prepare('INSERT INTO clinical_prescription_events VALUES(?,?,1,?,?)').run(event,record,kind,past);db.prepare('INSERT INTO clinical_prescription_requests VALUES(?,44,?,1,?)').run(record,s.orderNumber,state);db.prepare('INSERT INTO clinical_prescription_versions VALUES(?,1,?)').run(record,state);
 db.prepare('INSERT INTO clinical_member_records VALUES(?,44,?,1,1)').run(record,s.orderNumber);db.prepare('INSERT INTO clinical_member_versions VALUES(?,1,?,1)').run(record,s.assessmentDigest);db.prepare("INSERT INTO clinical_case_state VALUES(?,1,1,'ready_for_prescription')").run(record);
 db.prepare("INSERT INTO medicine_orders VALUES(?,44,1,2,'GBP',20000,'paid',?,0,NULL)").run(s.orderNumber,past);db.prepare("INSERT INTO medicine_variants VALUES(1,1,'active',17000,?)").run(past);
 const verification=['identity','registration','indemnity','agreements','competence'].map(kind=>({kind,outcome:'verified',credentialVersion:0,expiresAt:future}));
 for(const[id,kind,org,user,actions]of [['clinician','clinician','clinic',7,['issue_prescription']],['dispenser','dispensing','pharmacy',12,['view_fulfilment']]]){
  db.prepare('INSERT INTO partner_staff VALUES(?,?,?,?,0,?)').run(id,user,kind,org,JSON.stringify({status:'active',credentialVersion:0,checks:verification,grants:[{credentialVersion:0,area:'weight_management',actions,startsAt:past,expiresAt:future,medicines:[]}]}));
  db.prepare("INSERT INTO hq_users VALUES(?,'clinical','active',1,?)").run(user,user===7?'clinician@example.invalid':'pharmacy@example.invalid');
 }
 for(const[id,kind]of [['clinic','clinical'],['pharmacy','pharmacy']])db.prepare('INSERT INTO partner_organisations VALUES(?,0,?)').run(id,JSON.stringify({status:'approved',kind,expiresAt:future}));
 db.prepare('INSERT INTO clinical_case_assignments VALUES(?,7,1,?)').run(record,future);db.prepare("INSERT INTO clinical_hq_staff VALUES(7,1,'clinician',?,'synthetic-reviewer','TEST','TEST-7')").run(future);
 db.prepare("INSERT INTO clinical_prescriber_signing_keys VALUES('key',7,'approved',?,0,0,8,'SYNTHETIC REVIEW')").run(future);db.prepare("INSERT INTO clinical_prescription_signatures VALUES('TEST-RX',?,1,'key')").run(record);
 db.prepare('INSERT INTO partner_fulfilment VALUES(?,44,?,?)').run(s.orderNumber,s.partnerId,JSON.stringify({recordId:record,prescriptionId:s.prescriptionId,prescriptionVersion:1,status:'received'}));
 const notificationId='prescription:'+event,sourceId='channel:'+notificationId+':email',payload={notificationEvent:'clinical:'+sourceId};
 db.prepare('INSERT INTO clinical_notification_events VALUES(?,44,?,?,?)').run(notificationId,record,s.orderNumber,kind);db.prepare("INSERT INTO clinical_notification_channels VALUES(?,'email','prepared','draft')").run(notificationId);db.prepare("INSERT INTO clinical_case_outbox VALUES(?,?,44,'member','member_case_update','pending')").run(sourceId,sourceId);db.prepare("INSERT INTO hq_notification_intents VALUES(?,'clinical_case_outbox',?,'member',44,'draft','prepared')").run(payload.notificationEvent,sourceId);
 db.exec("INSERT INTO users VALUES(44,'member@example.invalid');INSERT INTO user_auth VALUES(44,1)");
 const DB={prepare(sql){return{args:[],bind(...args){this.args=args;return this;},async first(){return db.prepare(sql).get(...this.args)||null;}}}};
 const target={eventId:event,recordId:record,memberId:44,orderNumber:s.orderNumber,kind,recipientKind:'member',recipientId:44};
 const eligible=()=>prescriptionEventEligibility(DB,target,now),deliver=()=>eventDeliveryEligibility(DB,payload,'draft',{user_id:44,email:'member@example.invalid'},now);
 return{db,DB,s,target,eligible,deliver,payload,sourceId};
}
test('current owned proposal passes actual canonical delivery and intent gates',async t=>{
 const f=fixture(t);assert.equal((await f.eligible()).eligible,true);assert.equal((await f.deliver()).eligible,true);
 const item=f.db.prepare('SELECT * FROM hq_notification_intents').get();assert.equal((await intentSourceEligibility(f.DB,item,now)).eligible,true);
 assert.equal((await eventDeliveryEligibility(f.DB,f.payload,'draft',{user_id:45,email:'member@example.invalid'},now)).eligible,false);
 assert.equal((await eventDeliveryEligibility(f.DB,f.payload,'draft',{user_id:44,email:'changed@example.invalid'},now)).eligible,false);
});
test('currentness changes suppress actionable prescription alerts',async t=>{
 const changes={price:"UPDATE medicine_variants SET selling_price_pence=18000",order:"UPDATE medicine_orders SET status='cancelled'",ownership:'UPDATE clinical_member_records SET user_id=45',consent:'UPDATE clinical_member_records SET review_sharing=0',revision:'UPDATE clinical_member_records SET revision=2',assessment:"UPDATE clinical_member_versions SET digest='changed'",case_version:'UPDATE clinical_case_state SET version=2',request_version:'UPDATE clinical_prescription_requests SET version=2',snapshot:"UPDATE clinical_prescription_requests SET state_json=json_set(state_json,'$.status','cancelled')",expiry:"UPDATE clinical_prescription_requests SET state_json=json_set(state_json,'$.expiresAt','2026-10-24T19:00:00.000Z');UPDATE clinical_prescription_versions SET state_json=(SELECT state_json FROM clinical_prescription_requests)",assignment:'UPDATE clinical_case_assignments SET active=0',mfa:'UPDATE hq_users SET mfa_enabled=0 WHERE id=7',staff:"UPDATE partner_staff SET state_json=json_set(state_json,'$.status','suspended') WHERE id='clinician'",grant:"UPDATE partner_staff SET state_json=json_set(state_json,'$.grants[0].revokedAt','2026-10-24T19:00:00.000Z') WHERE id='clinician'",checks:"UPDATE partner_staff SET state_json=json_set(state_json,'$.checks[0].expiresAt','2026-10-24T19:00:00.000Z') WHERE id='clinician'",organisation:'UPDATE partner_organisations SET version=1 WHERE id=\'clinic\''};
 for(const[name,sql]of Object.entries(changes))await t.test(name,async t=>{const f=fixture(t);assert.equal((await f.deliver()).eligible,true);f.db.exec(sql);assert.equal((await f.deliver()).eligible,false);});
});
test('member questions and cancellations can reach current clinician after a quote changes',async t=>{
 for(const[kind,status]of [['prescription_question','member_question'],['prescription_cancelled','cancelled'],['prescription_accepted','accepted']])await t.test(kind,async t=>{
  const f=fixture(t,{kind,status}),id='prescription:'+event;f.db.prepare("INSERT INTO clinical_case_outbox VALUES(?,?,7,'hq','reviewer_case_update','pending')").run(id,event);const item={source_id:id,recipient_kind:'hq_user',recipient_user_id:7};assert.equal((await prescriptionOutboxEligibility(f.DB,item,now)).eligible,true);
  f.db.exec("UPDATE medicine_orders SET updated_at='changed'");assert.equal((await prescriptionOutboxEligibility(f.DB,item,now)).eligible,kind!=='prescription_accepted');
  f.db.exec('UPDATE clinical_case_assignments SET active=0');assert.equal((await prescriptionOutboxEligibility(f.DB,item,now)).eligible,false);
 });
});
test('pharmacy alerts require exact signed handover, current signing authority and assigned staff',async t=>{
 for(const sql of ['',"UPDATE clinical_prescriber_signing_keys SET status='revoked'","DELETE FROM clinical_prescription_signatures","UPDATE partner_fulfilment SET partner_id='other'","UPDATE partner_fulfilment SET state_json=json_set(state_json,'$.status','accepted')","UPDATE partner_staff SET org_id='other' WHERE id='dispenser'","UPDATE hq_users SET status='suspended' WHERE id=12"])await t.test(sql||'valid',async t=>{
  const f=fixture(t,{kind:'prescription_issued',status:'issued'}),id='pharmacy:'+event+':12';f.db.prepare("INSERT INTO clinical_case_outbox VALUES(?,?,12,'hq','dispensing_action_needed','pending')").run(id,event);const item={source_id:id,recipient_kind:'hq_user',recipient_user_id:12};assert.equal((await prescriptionOutboxEligibility(f.DB,item,now)).eligible,true);if(sql)f.db.exec(sql);assert.equal((await prescriptionOutboxEligibility(f.DB,item,now)).eligible,!sql);
 });
});
test('unknown prescription events fail closed; unavailable tables defer; ordinary manual drafts remain unchanged',async t=>{
 const f=fixture(t);f.db.exec("UPDATE clinical_prescription_events SET kind='prescription_unknown'");assert.equal((await f.eligible()).eligible,false);f.db.exec('DROP TABLE clinical_prescription_events');assert.equal((await f.eligible()).eligible,null);assert.equal((await eventDeliveryEligibility(f.DB,{},'manual',{},now)).eligible,true);
});
test('legacy prescription_received partner events retain existing channel behaviour',async t=>{
 const f=fixture(t,{kind:'prescription_received',status:'issued'});const id='partner:legacy';f.db.prepare("UPDATE clinical_notification_events SET id=?,kind='prescription_received'").run(id);f.db.prepare('UPDATE clinical_notification_channels SET event_id=?').run(id);const source='channel:'+id+':email';f.db.prepare('UPDATE clinical_case_outbox SET id=?,event_id=?').run(source,source);f.db.prepare('UPDATE hq_notification_intents SET source_id=?,event_key=?').run(source,'clinical:'+source);assert.equal((await eventDeliveryEligibility(f.DB,{notificationEvent:'clinical:'+source},'draft',{user_id:44,email:'member@example.invalid'},now)).eligible,true);
});
