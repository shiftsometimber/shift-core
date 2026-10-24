import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {notificationEventStatements,NOTIFICATION_KINDS,prepareEventChannels,orderEventStatements} from './notification-events.mjs';
import {notificationManagementRoute,channelOutcome} from './notification-management.mjs';
import {prepareInvitation} from './invitation-drafts.mjs';
import {eventDeliveryEligibility,intentSourceEligibility as careIntentEligibility} from '../../partner-proof/contracts/central-delivery-eligibility-be44a.mjs';
const careChannelEligibility=(DB,item,payload,draftId,recipient)=>eventDeliveryEligibility(DB,payload,draftId,recipient);
import {partnerRoute} from './api.mjs';
const at='2026-10-24T18:00:00.000Z',record={id:'11111111-1111-4111-8111-111111111111',user_id:44,order_number:'SHIFT-1042'};
function setup(t){
 const db=new DatabaseSync(':memory:');
 for(const path of ['../../migrations/clinical-member-records-v1.sql','../../migrations/clinical-casework-v1.sql','./schema.sql','./notification-events.sql','./invitation-drafts.sql'])db.exec(readFileSync(new URL(path,import.meta.url),'utf8'));
 db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT);CREATE TABLE user_auth(user_id INTEGER,email_verified INTEGER);
 CREATE TABLE hq_users(id INTEGER PRIMARY KEY,role TEXT,status TEXT,mfa_enabled INTEGER);CREATE TABLE hq_sessions(hq_user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT);
 CREATE TABLE hq_comms_drafts(id TEXT PRIMARY KEY,hash TEXT NOT NULL,payload_json TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'draft',scheduled_at TEXT NOT NULL,created_by INTEGER NOT NULL,approved_by INTEGER,created_at TEXT NOT NULL,approved_at TEXT,cancelled_at TEXT);
 CREATE TABLE hq_comms_recipients(draft_id TEXT NOT NULL,email TEXT NOT NULL,user_id INTEGER,status TEXT NOT NULL DEFAULT 'pending',provider_id TEXT,error_code TEXT,at TEXT,read_at TEXT,PRIMARY KEY(draft_id,email));
 CREATE TABLE hq_comms_audit(id INTEGER PRIMARY KEY AUTOINCREMENT,draft_id TEXT,actor_id INTEGER,action TEXT NOT NULL,at TEXT NOT NULL);
 CREATE TABLE hq_notification_intents(event_key TEXT PRIMARY KEY,source TEXT NOT NULL,source_id TEXT NOT NULL,occurred_at TEXT NOT NULL,recipient_kind TEXT NOT NULL,recipient_user_id INTEGER,template TEXT NOT NULL,link TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'awaiting_review',draft_id TEXT,reason TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 INSERT INTO users VALUES(44,'member@example.invalid');INSERT INTO user_auth VALUES(44,1);
 INSERT INTO hq_users VALUES(1,'owner','active',1);`);
 db.prepare('INSERT INTO hq_sessions VALUES(1,?,?,NULL)').run(createHash('sha256').update('fixture-owner').digest('hex'),'2099-01-01');
 db.prepare('INSERT INTO clinical_member_records(id,user_id,order_number,schema_version,created_at,updated_at) VALUES(?,?,?,?,?,?)').run(record.id,44,record.order_number,'TEST',at,at);db.exec('UPDATE clinical_member_records SET review_sharing=1');db.prepare('INSERT INTO partner_fulfilment VALUES(?,?,?,0,?,?)').run(record.order_number,'fixture-pharmacy',44,JSON.stringify({status:'query'}),at);
 const env={NOTIFICATION_EVENTS_ENABLED:'true',PARTNER_OPERATIONS_ENABLED:'true',PARTNER_INTERNAL_SETUP_ONLY:'true',DB:{prepare(sql){return{args:[],bind(...args){this.args=args;return this;},async first(){return db.prepare(sql).get(...this.args)||null;},async all(){return{results:db.prepare(sql).all(...this.args)};},async run(){return{meta:{changes:Number(db.prepare(sql).run(...this.args).changes)}};}};},async batch(ss){db.exec('BEGIN');try{const out=[];for(const s of ss)out.push(await s.run());db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}}}};
 const actor={id:1,role:'owner',mfa:true},guard=()=>({sql:"EXISTS(SELECT 1 FROM hq_sessions s JOIN hq_users h ON h.id=s.hq_user_id WHERE h.id=1 AND h.status='active' AND h.mfa_enabled=1 AND s.revoked_at IS NULL AND julianday(s.expires_at)>julianday(?))",args:[at]}),auth=async()=>({user:{id:1,role:'owner',mfaEnabled:true}});
 const source=(id,kind='fulfilment_query')=>db.prepare('INSERT INTO partner_audit VALUES(?,?,?,?,?,?,?,?)').run(id,'order',record.order_number,db.prepare('SELECT COUNT(*) n FROM partner_audit').get().n,'12',kind,'{}',at);
 const event=async(id='e1',kind='fulfilment_query')=>{source(id,kind);await env.DB.batch(notificationEventStatements(env,record,{id:'partner:'+id,kind,source:'partner',sourceId:id,at}));};
 const call=(path='',data,headers={})=>notificationManagementRoute(new Request('https://api.shiftsometimber.co.uk/v1/hq/clinical/notifications'+path,{method:data===undefined?'GET':'POST',headers:{Origin:'https://hq.shiftsometimber.co.uk',Cookie:'sst_hq_session=fixture-owner',...headers},body:data===undefined?undefined:JSON.stringify(data)}),env,auth);
 t.after(()=>db.close());return{db,env,actor,guard,auth,source,event,call};
}
test('every allowlisted member event gets exactly three idempotent channel records; private/audit events get none',async t=>{
 const f=setup(t);let n=0;
 for(const kind of NOTIFICATION_KINDS){const id='event-'+n++;f.source(id,kind);const statements=()=>notificationEventStatements(f.env,record,{id,kind,source:'partner',sourceId:id,at});await f.env.DB.batch(statements());await f.env.DB.batch(statements());assert.equal(f.db.prepare('SELECT COUNT(*) n FROM clinical_notification_channels WHERE event_id=?').get(id).n,3);}
 for(const kind of ['internal_note','evidence_viewed','case_viewed'])assert.deepEqual(notificationEventStatements(f.env,record,{id:'private',kind,at}),[]);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM hq_comms_drafts').get().n,0);
 assert.throws(()=>f.db.exec('DELETE FROM clinical_notification_events'),/immutable/);
});
test('missing source, wrong member and rolled-back source transaction cannot create notification work',async t=>{
 const f=setup(t);const writes=()=>notificationEventStatements(f.env,record,{id:'missing',kind:'review_started',source:'partner',sourceId:'missing',at});await f.env.DB.batch(writes());assert.equal(f.db.prepare('SELECT COUNT(*) n FROM clinical_notification_events').get().n,0);
 f.source('source');await f.env.DB.batch(notificationEventStatements(f.env,{...record,user_id:45},{id:'cross-member',kind:'review_started',source:'partner',sourceId:'source',at}));assert.equal(f.db.prepare('SELECT COUNT(*) n FROM clinical_notification_events').get().n,0);
 f.db.exec("CREATE TRIGGER reject_channels BEFORE INSERT ON clinical_notification_channels BEGIN SELECT RAISE(ABORT,'outbox_outage');END;");await assert.rejects(f.env.DB.batch(notificationEventStatements(f.env,record,{id:'rollback',kind:'review_started',source:'partner',sourceId:'source',at})),/outbox_outage/);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM clinical_notification_events').get().n,0);
});
test('email and app preparation uses existing Communications drafts/intents; never approval, schedule, send or publication',async t=>{
 const f=setup(t);await f.event();const result=await prepareEventChannels(f.env,'partner:e1',f.actor,f.guard,at);assert.equal(result.sent,false);assert.equal(result.drafts.length,2);assert.match(result.whatsapp.status,/opt_in/);
 assert.deepEqual(f.db.prepare('SELECT status,approved_at FROM hq_comms_drafts').all().map(r=>[r.status,r.approved_at]),[['draft',null],['draft',null]]);
 for(const draft of result.drafts){assert.equal(draft.payload.recipients[0].userId,44);assert.equal(draft.payload.recipients[0].email,'member@example.invalid');assert.equal(draft.payload.notificationEvent,'clinical:channel:partner:e1:'+draft.channel);assert.equal(f.db.prepare('SELECT draft_id FROM hq_notification_intents WHERE event_key=?').get(draft.payload.notificationEvent).draft_id,draft.id);const intent=f.db.prepare('SELECT * FROM hq_notification_intents WHERE draft_id=?').get(draft.id);assert.equal(intent.source,'clinical_case_outbox');assert.equal(f.db.prepare('SELECT status FROM clinical_case_outbox WHERE id=?').get(intent.source_id).status,'pending');assert.equal((await careChannelEligibility(f.env.DB,intent,draft.payload,draft.id,{user_id:44,email:'member@example.invalid'})).eligible,true);assert.equal((await careIntentEligibility(f.env.DB,intent)).eligible,true);}
 assert.equal(f.db.prepare("SELECT COUNT(*) n FROM hq_comms_recipients WHERE status='available_in_app'").get().n,0);
 assert.equal((await prepareEventChannels(f.env,'partner:e1',f.actor,f.guard,at)).drafts.length,0);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM hq_comms_drafts').get().n,2);
});
test('answered or superseded action requests withdraw stale email/app sources, but failed replies do not',async t=>{
 const f=setup(t);await f.event();await prepareEventChannels(f.env,'partner:e1',f.actor,f.guard,at);
 await f.env.DB.batch(notificationEventStatements(f.env,record,{id:'partner:failed',kind:'member_fulfilment_reply',source:'partner',sourceId:'absent',at}));assert.equal(f.db.prepare("SELECT COUNT(*) n FROM clinical_notification_channels WHERE event_id='partner:e1' AND status='prepared'").get().n,2);
 await f.event('reply','member_fulfilment_reply');assert.equal(f.db.prepare("SELECT COUNT(*) n FROM clinical_case_outbox WHERE status='pending'").get().n,0);assert.equal(f.db.prepare("SELECT COUNT(*) n FROM clinical_notification_channels WHERE event_id='partner:e1' AND status='superseded'").get().n,3);
 assert.equal((await prepareEventChannels(f.env,'partner:e1',f.actor,f.guard,at)).drafts.length,0);
 const draft=f.db.prepare('SELECT * FROM hq_comms_drafts LIMIT 1').get(),intent=f.db.prepare('SELECT * FROM hq_notification_intents WHERE draft_id=?').get(draft.id);assert.equal((await careChannelEligibility(f.env.DB,intent,JSON.parse(draft.payload_json),draft.id,{user_id:44,email:'member@example.invalid'})).eligible,false);
});
test('notification management enforces owner/MFA/current session/origin and no generic send route exists',async t=>{
 const f=setup(t);await f.event();assert.equal((await f.call()).status,200);assert.equal((await f.call('',undefined,{Origin:'https://evil.invalid'})).status,403);assert.equal((await f.call('/send',{})).status,404);
 assert.equal((await f.call('/prepare',{eventId:'partner:e1',send:true})).status,422);f.db.exec("UPDATE hq_sessions SET revoked_at='2026-01-01'");assert.equal((await f.call()).status,403);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM hq_comms_drafts').get().n,0);
 await assert.rejects(prepareEventChannels(f.env,'partner:e1',{...f.actor,role:'clinical'},f.guard,at),/owner_mfa/);
});
test('email verification and channel outcomes distinguish review, publication, receipt and failure',async t=>{
 const f=setup(t);await f.event();f.db.exec('UPDATE user_auth SET email_verified=0');await assert.rejects(prepareEventChannels(f.env,'partner:e1',f.actor,f.guard,at),/verified_member/);
 assert.equal(channelOutcome({channel:'app',delivery_status:'available_in_app'}),'published_in_app');assert.equal(channelOutcome({channel:'email',delivery_status:'sent',provider_id:'receipt'}),'provider_accepted');assert.equal(channelOutcome({channel:'email',status:'prepared',delivery_status:'sent'}),'prepared');assert.equal(channelOutcome({channel:'email',error_code:'provider_timeout'}),'failed_or_unknown');
});
test('order notification lookup requires both member and order identity',async t=>{const f=setup(t);assert.deepEqual(await orderEventStatements(f.env,{orderNumber:record.order_number,memberId:45},{id:'x',action:'fulfilment_dispatch',at}),[]);});
function seedInvitation(f){const org={id:'clinical-org',kind:'clinical',name:'Fictional Clinical Partner',version:0},staff={id:'clinician-1',kind:'clinician',orgId:org.id,version:0,status:'draft',details:{name:'Dr Example',email:'doctor@example.invalid'}};f.db.prepare('INSERT INTO partner_organisations VALUES(?,0,?,?)').run(org.id,JSON.stringify(org),at);f.db.prepare('INSERT INTO partner_staff VALUES(?,NULL,NULL,?,?,0,?,?)').run(staff.id,staff.kind,org.id,JSON.stringify(staff),at);return{org,staff};}
test('clinician/GP and partner invitations are durable audited drafts only, with no credentials or authority',async t=>{
 const f=setup(t),{org,staff}=seedInvitation(f),input={kind:'clinician',orgId:org.id,staffId:staff.id,profileVersion:0};const result=await prepareInvitation(f.env,input,f.actor,f.guard,at);assert.equal(result.sent,false);assert.equal(result.accessGranted,false);assert.equal(result.draft.recipient_email,staff.details.email);assert.match(result.draft.body,/approved scope/);assert.match(result.draft.body,/not open yet/);assert.equal((await prepareInvitation(f.env,input,f.actor,f.guard,at)).draft.id,result.draft.id);
 const partner=await prepareInvitation(f.env,{kind:'partner',orgId:org.id,name:'Partner Contact',email:'contact@example.invalid'},f.actor,f.guard,at);assert.equal(partner.draft.kind,'partner');assert.equal(f.db.prepare('SELECT COUNT(*) n FROM partner_access_tokens').get().n,0);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM hq_comms_drafts').get().n,0);assert.equal(f.db.prepare("SELECT COUNT(*) n FROM partner_audit WHERE action='invitation_draft_prepared'").get().n,2);assert.throws(()=>f.db.exec('DELETE FROM partner_invitation_drafts'),/immutable/);
});
test('invitation routes are private and cannot confuse dispensing profiles, changed records or revoked access with clinician invitations',async t=>{
 const f=setup(t),{org,staff}=seedInvitation(f),input={kind:'clinician',orgId:org.id,staffId:staff.id,profileVersion:0};await assert.rejects(prepareInvitation(f.env,{...input,profileVersion:2},f.actor,f.guard,at),/profile_changed/);await assert.rejects(prepareInvitation(f.env,{kind:'partner',orgId:org.id,name:'Bad',email:'not-email'},f.actor,f.guard,at),/valid_email/);
 const req=(origin='https://hq.shiftsometimber.co.uk')=>new Request('https://api.shiftsometimber.co.uk/v1/hq/clinical/partners/invitations',{headers:{Origin:origin,Cookie:'sst_hq_session=fixture-owner'}});assert.equal((await partnerRoute(req(),f.env,f.auth)).status,200);assert.equal((await partnerRoute(req('https://evil.invalid'),f.env,f.auth)).status,403);assert.equal((await partnerRoute(req(),f.env,async()=>({user:{id:1,role:'clinical',mfaEnabled:true}}))).status,403);
 f.db.exec("UPDATE hq_sessions SET revoked_at='2026-01-01'");await assert.rejects(prepareInvitation(f.env,input,f.actor,f.guard,at),/access_revoked/);
});

test('prepared drafts pass the actual shared source checker and fail when consent, account, ownership or source changes',async t=>{
 for(const change of ['sharing','verification','email','ownership','outbox','intent','draft'])await t.test(change,async t=>{
  const f=setup(t);await f.event('receipt','fulfilment_dispatch');const result=await prepareEventChannels(f.env,'partner:receipt',f.actor,f.guard,at),draft=result.drafts[0],recipient={user_id:44,email:'member@example.invalid'};
  assert.equal((await eventDeliveryEligibility(f.env.DB,draft.payload,draft.id,recipient)).eligible,true);
  if(change==='sharing')f.db.exec('UPDATE clinical_member_records SET review_sharing=0');
  if(change==='verification')f.db.exec('UPDATE user_auth SET email_verified=0');
  if(change==='email')f.db.exec("UPDATE users SET email='changed@example.invalid'");
  if(change==='ownership')f.db.exec('UPDATE clinical_member_records SET user_id=45');
  if(change==='outbox')f.db.prepare("UPDATE clinical_case_outbox SET status='superseded' WHERE id=?").run('channel:partner:receipt:email');
  if(change==='intent')f.db.prepare("UPDATE hq_notification_intents SET draft_id='wrong-draft' WHERE event_key=?").run(draft.payload.notificationEvent);
  if(change==='draft')f.db.prepare("UPDATE clinical_notification_channels SET draft_id='wrong-draft' WHERE event_id=? AND channel='email'").run('partner:receipt');
  assert.equal((await eventDeliveryEligibility(f.env.DB,draft.payload,draft.id,recipient)).eligible,false);
 });
});
test('actual shared gate suppresses an outdated pharmacy question and the duplicate legacy email route',async t=>{
 const f=setup(t);await f.event();const result=await prepareEventChannels(f.env,'partner:e1',f.actor,f.guard,at),draft=result.drafts[0],recipient={user_id:44,email:'member@example.invalid'};
 assert.equal((await eventDeliveryEligibility(f.env.DB,draft.payload,draft.id,recipient)).eligible,true);
 f.db.exec("UPDATE partner_fulfilment SET state_json='{\"status\":\"accepted\"}'");
 assert.equal((await eventDeliveryEligibility(f.env.DB,draft.payload,draft.id,recipient)).eligible,false);
 f.db.prepare('INSERT INTO partner_notification_outbox VALUES(?,?,?,?,?,?,?)').run('legacy-event','e1',record.order_number,44,'order_status_update','draft',at);
 f.db.prepare("INSERT INTO hq_notification_intents(event_key,source,source_id,occurred_at,recipient_kind,recipient_user_id,template,link,state,draft_id,created_at,updated_at) VALUES(?,'partner_notification_outbox',?,?,'member',?,'member_order_update','/member/dashboard','prepared',?,?,?)").run('partner:legacy-event','legacy-event',at,44,'legacy-draft',at,at);
 const legacy=await eventDeliveryEligibility(f.env.DB,{notificationEvent:'partner:legacy-event'},'legacy-draft',recipient);assert.equal(legacy.eligible,false);assert.equal(legacy.reason,'canonical_channel_review_supersedes_legacy');
});
test('a failure preparing the app channel preserves the one email draft; retry creates only the missing channel',async t=>{
 const f=setup(t);await f.event();f.db.exec("CREATE TRIGGER reject_app_draft BEFORE INSERT ON hq_comms_drafts WHEN json_extract(NEW.payload_json,'$.channel')='notification' BEGIN SELECT RAISE(ABORT,'app_draft_outage');END;");
 await assert.rejects(prepareEventChannels(f.env,'partner:e1',f.actor,f.guard,at),/app_draft_outage/);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM hq_comms_drafts').get().n,1);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM clinical_case_outbox').get().n,1);
 f.db.exec('DROP TRIGGER reject_app_draft');const retry=await prepareEventChannels(f.env,'partner:e1',f.actor,f.guard,at);assert.equal(retry.drafts.length,1);assert.equal(retry.drafts[0].channel,'app');
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM hq_comms_drafts').get().n,2);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM clinical_case_outbox').get().n,2);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM hq_notification_intents').get().n,2);assert.equal((await prepareEventChannels(f.env,'partner:e1',f.actor,f.guard,at)).drafts.length,0);
 assert.equal(f.db.prepare("SELECT COUNT(*) n FROM hq_comms_drafts WHERE approved_at IS NOT NULL OR status<>'draft'").get().n,0);
});
test('existing app-feed query exposes only the approved published owned app update, not prepared drafts or another member',async t=>{
 const f=setup(t);await f.event();const {drafts}=await prepareEventChannels(f.env,'partner:e1',f.actor,f.guard,at),app=drafts.find(d=>d.channel==='app');
 const feed=id=>f.db.prepare("SELECT d.id,d.payload_json,d.scheduled_at,r.read_at FROM hq_comms_recipients r JOIN hq_comms_drafts d ON d.id=r.draft_id WHERE r.user_id=? AND r.status='available_in_app' AND d.status IN ('scheduled','processed') AND d.approved_at IS NOT NULL AND d.scheduled_at<=? ORDER BY d.scheduled_at DESC LIMIT 100").all(id,at);
 assert.equal(feed(44).length,0);f.db.prepare("UPDATE hq_comms_recipients SET status='available_in_app' WHERE draft_id=?").run(app.id);assert.equal(feed(44).length,0);
 // Local fixture approval/publication only. No live API or transport is called.
 f.db.prepare("UPDATE hq_comms_drafts SET status='processed',approved_at=? WHERE id=?").run(at,app.id);assert.equal(feed(44).length,1);assert.equal(feed(45).length,0);assert.equal(feed(44)[0].id,app.id);assert.equal(JSON.parse(feed(44)[0].payload_json).channel,'notification');
});
test('TBC provider assignments are visible configuration placeholders, not accounts, verification or permissions',async t=>{
 const f=setup(t),request=new Request('https://api.shiftsometimber.co.uk/v1/hq/clinical/partners',{headers:{Origin:'https://hq.shiftsometimber.co.uk',Cookie:'sst_hq_session=fixture-owner'}}),result=await partnerRoute(request,f.env,f.auth);assert.equal(result.status,200);const b=await result.json();
 for(const key of ['prescribingClinicianOrGP','dispensingPharmacy'])assert.deepEqual(b.providerAssignments[key],{displayName:'TBC',status:'unassigned',verified:false});assert.equal(f.db.prepare('SELECT COUNT(*) n FROM partner_staff').get().n,0);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM partner_organisations').get().n,0);
});
