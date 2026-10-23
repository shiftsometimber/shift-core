import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createTimberShedForumRoutes} from '../member-experience/timber-shed-forum-routes.mjs';
const origin='https://shift.test';
const path='/v1/timber-shed/forum/';
function setup(modelClassifier){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON; CREATE TABLE users(id INTEGER PRIMARY KEY,date_of_birth TEXT); CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER);');
 sqlite.exec(readFileSync(new URL('../member-experience/timber-shed-forums.sql',import.meta.url),'utf8'));
 for(const [id,dob,verified] of [[1,'1985-01-01',1],[2,'1990-05-01',1],[3,'1981-08-15',1],[4,'2013-02-01',1],[5,'1980-01-01',0]]){
  sqlite.prepare('INSERT INTO users(id,date_of_birth) VALUES(?,?)').run(id,dob);
  sqlite.prepare('INSERT INTO user_auth(user_id,email_verified) VALUES(?,?)').run(id,verified);
 }
 for(const id of [1,2,3]){
  sqlite.prepare('INSERT INTO timber_shed_adult_access VALUES(?,?,?,?,?,?,NULL)').run(id,'verified-adult-account','fictional-proof-'+id,3,'2026-10-01T00:00:00.000Z','2027-10-01T00:00:00.000Z');
  sqlite.prepare('INSERT INTO timber_shed_participation VALUES(?,?,?,?,?)').run(id,'shed-pilot-governance-2026-10-23-v1','shed-pilot-governance-2026-10-23-v1','2026-10-01T00:00:00.000Z','2026-10-01T00:00:00.000Z');
 }
 sqlite.prepare('INSERT INTO timber_shed_maintenance VALUES(1,?)').run('2026-10-22T12:00:00.000Z');
 const calls=[];
 const db={
  prepare(sql){calls.push(sql);return{
   all:async()=>({results:sqlite.prepare(sql).all()}),
   bind(...values){const stmt=sqlite.prepare(sql);return{
    first:async()=>stmt.get(...values)||null,
    all:async()=>({results:stmt.all(...values)}),
    run:async()=>({meta:{changes:stmt.run(...values).changes}}),
    batchRun:()=>({meta:{changes:stmt.run(...values).changes}})
   }}
  }},
  async batch(ops){
   sqlite.exec('BEGIN');
   try{const results=ops.map(op=>op.batchRun());sqlite.exec('COMMIT');return results}
   catch(e){sqlite.exec('ROLLBACK');throw e}
  }
 };
 const auth=async request=>{const id=Number(request.headers.get('x-member'));return id?{userId:id}:{response:Response.json({error:'authentication_required'},{status:401})}};
 const route=createTimberShedForumRoutes(auth,()=>new Date('2026-10-22T12:00:00Z'),modelClassifier);
 const env={TIMBER_SHED_RETENTION_ENABLED:'true',TIMBER_SHED_GOVERNANCE_APPROVED_VERSION:'shed-pilot-governance-2026-10-23-v1',TIMBER_SHED_FORUM_ENABLED:'true',TIMBER_SHED_PRIVATE_ENABLED:'true',MEMBER_EXPERIENCE_V1_ENABLED:'true',TIMBER_SHED_FORUM_PILOT_APPROVED:'true',DB:db};
 async function send(user,resource,method='GET',body,query=''){
  const headers={'x-member':String(user)};
  if(method==='POST'){headers.Origin=origin;headers['Content-Type']='application/json'}
  const request=new Request(origin+path+resource+query,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});
  const response=await route(request,env);return{status:response.status,body:await response.json(),headers:response.headers};
 }
 return{send,env,route,sqlite,calls};
}
async function profile(t,id,name){return t.send(id,'profile/save','POST',{displayName:name})}
async function submit(t,id,roomId='main-shed',body='This is a fictional example of an everyday experience.',title='A question about the week'){return t.send(id,'submit','POST',{roomId,title,body})}
test('all flags default off, no access to the database',async()=>{
 const t=setup();t.env.TIMBER_SHED_FORUM_ENABLED='false';
 const result=await t.send(1,'rooms');assert.equal(result.status,404);assert.equal(t.calls.length,0);
});
test('unauthenticated, under-18 and unverified accounts are blocked',async()=>{
 const t=setup();assert.equal((await t.send(0,'rooms')).status,401);
 assert.equal((await t.send(4,'rooms')).status,403);
 assert.equal((await t.send(5,'rooms')).status,403);
 assert.equal((await t.send(1,'rooms')).body.rooms.length,6);
});
test('pseudonym is separate, opt-in and does not read member health records',async()=>{
 const t=setup();assert.deepEqual((await t.send(1,'profile')).body,{profile:null});
 assert.equal((await profile(t,1,'Shed Walker')).status,201);
 assert.equal((await profile(t,2,'Shed Walker')).status,409);
 assert.equal((await profile(t,2,'contact me john@example.com')).status,400);
 assert.equal((await profile(t,2,'Weekend Walker')).status,201);
 assert.deepEqual((await t.send(1,'profile')).body,{profile:{displayName:'Shed Walker'}});
 assert.deepEqual((await t.send(2,'profile')).body,{profile:{displayName:'Weekend Walker'}});
 assert(t.calls.every(s=>!/member_state|health_|treatment_|weight_|mood_/i.test(s)));
});
test('pending topics are invisible to every other member until independent moderation',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');await profile(t,2,'Weekend Walker');
 const item=await submit(t,1);assert.equal(item.status,202);assert.equal(item.body.status,'pending');
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,0);
 assert.equal((await t.send(1,'mine')).body.posts.length,1);
 assert.equal((await t.send(2,'mine')).body.posts.length,0);
 assert.equal((await t.send(2,'moderation')).status,403);
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'2026-10-22T12:00:00Z');
 assert.equal((await t.send(3,'moderation')).body.pending.length,1);
 assert.equal((await t.send(1,'moderate','POST',{postId:item.body.id,action:'approve'})).status,403);
 const approval=await t.send(3,'moderate','POST',{postId:item.body.id,action:'approve'});assert.equal(approval.status,200);
 const visible=(await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts;
 assert.equal(visible.length,1);assert.equal(visible[0].display_name,'Shed Walker');
 assert(!Object.keys(visible[0]).some(k=>/user_id|email|dob|health|weight|mood|treatment/.test(k)));
 assert.equal((await t.send(3,'moderate','POST',{postId:item.body.id,action:'approve'})).status,409);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_audit').get().n,1);
});
test('replies need an approved parent in the same room; rejection and removal hide content',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');await profile(t,2,'Weekend Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const topic=await submit(t,1);const reply={roomId:'main-shed',parentId:topic.body.id,body:'I like the small steps idea and the conversation.'};
 assert.equal((await t.send(2,'submit','POST',reply)).status,404); // parent not approved
 assert.equal((await t.send(1,'submit','POST',reply)).status,404); // parent not approved
 await t.send(3,'moderate','POST',{postId:topic.body.id,action:'approve'});
 const posted=await t.send(1,'submit','POST',reply);assert.equal(posted.status,202);
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,1);
 await t.send(3,'moderate','POST',{postId:posted.body.id,action:'reject'});
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,1);
 const report=await t.send(2,'report','POST',{postId:topic.body.id,reason:'privacy'});assert.equal(report.status,200);
 assert.equal((await t.send(3,'moderation')).body.reports.length,1);
 await t.send(3,'moderate','POST',{postId:topic.body.id,action:'remove'});
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,0);
 assert.equal((await t.send(3,'moderation')).body.reports.length,0);
});
test('no health record autofill, external links, phone numbers or contact data in submissions',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 for(const body of ['Reach me at john@example.com to talk more','Visit https://example.com for details','My mobile is 07123456789 call me please']){
  const result=await submit(t,1,'main-shed',body);assert.equal(result.status,400);
 }
 assert.equal((await t.send(1,'submit','POST',{roomId:'main-shed',title:'Test title',body:'This is a perfectly ordinary fictional message.',weight:93})).status,400);
 assert.equal((await t.send(1,'threads','GET',undefined,'?room=main-shed')).body.posts.length,0);
});
test('CSRF, limits, moderation denial and user erasure',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 const bad=new Request(origin+path+'submit',{method:'POST',headers:{'x-member':'1',Origin:'https://evil.test','Content-Type':'application/json'},body:JSON.stringify({roomId:'main-shed',title:'A valid title',body:'This is a valid fictional sample message.'})});
 assert.equal((await t.route(bad,t.env)).status,403);
 for(let i=0;i<5;i++)assert.equal((await submit(t,1,'main-shed','A fictional ordinary thought number '+i+' for this week.')).status,202);
 assert.equal((await submit(t,1)).status,429);
 t.sqlite.prepare('DELETE FROM users WHERE id=?').run(1);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_posts').get().n,0);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_profiles').get().n,0);
});
test('moderator can dismiss a report without removing a safe post; decision is audited',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const topic=await submit(t,1);
 await t.send(3,'moderate','POST',{postId:topic.body.id,action:'approve'});
 const report=await t.send(2,'report','POST',{postId:topic.body.id,reason:'other'});assert.equal(report.status,200);
 const pending=(await t.send(3,'moderation')).body.reports;
 assert.equal(pending.length,1);
 assert.equal((await t.send(2,'moderate','POST',{postId:topic.body.id,reportId:pending[0].id,action:'dismiss'})).status,403);
 const done=await t.send(3,'moderate','POST',{postId:topic.body.id,reportId:pending[0].id,action:'dismiss'});
 assert.equal(done.status,200);
 assert.equal((await t.send(3,'moderation')).body.reports.length,0);
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,1);
 assert.equal(t.sqlite.prepare("SELECT count(*) n FROM timber_shed_forum_audit WHERE action='dismiss'").get().n,1);
});
test('moderation audit failure rolls back approval and prevents publication',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const topic=await submit(t,1);
 t.sqlite.exec("CREATE TRIGGER audit_failure BEFORE INSERT ON timber_shed_forum_audit BEGIN SELECT RAISE(ABORT,'audit failed'); END;");
 const attempt=await t.send(3,'moderate','POST',{postId:topic.body.id,action:'approve'});
 assert.equal(attempt.status,503);
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,0);
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(topic.body.id).status,'pending');
});
test('moderator review exposes no private My Timber data or raw user IDs',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 await submit(t,1);
 const result=(await t.send(3,'moderation')).body;
 assert.equal(result.pending[0].display_name,'Shed Walker');
 assert(!Object.keys(result.pending[0]).some(k=>/user_id|email|date_of_birth|health|weight|treatment/i.test(k)));
 assert(t.calls.every(s=>!/member_state|health_|treatment_|weight_|mood_/i.test(s)));
});
test('each independent safety gate fails closed before any database access',async()=>{
 for(const key of ['TIMBER_SHED_FORUM_ENABLED','TIMBER_SHED_PRIVATE_ENABLED','MEMBER_EXPERIENCE_V1_ENABLED','TIMBER_SHED_FORUM_PILOT_APPROVED']){
  const t=setup();delete t.env[key];
  const result=await t.send(1,'rooms');
  assert.equal(result.status,404,key);
  assert.equal(t.calls.length,0,key);
 }
});
test('invalid route, method, cross-site request and moderator status all fail closed',async()=>{
 const t=setup();assert.equal((await t.send(1,'threads','GET',undefined,'?room=not-a-room')).status,400);
 assert.equal((await t.send(1,'profile/save','GET')).status,405);
 assert.equal((await t.send(1,'unknown')).status,404);
 assert.equal((await t.send(1,'moderation')).status,403);
});
test('Bouncer prioritises safeguarding content and holds it even from ordinary moderator approval',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');await profile(t,2,'Weekend Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const ordinary=await submit(t,1,'main-shed','A nice walk helped me reset after work.');
 const sensitive=await submit(t,2,'main-shed','I have been thinking about self-harm recently.');
 const urgent=await submit(t,1,'main-shed','I am going to end my life tonight.');
 assert.equal(ordinary.status,202);assert.equal(sensitive.status,202);assert.equal(urgent.status,202);
 assert.match(urgent.body.message,/999/);
 const queue=(await t.send(3,'moderation')).body.pending;
 assert.equal(queue.length,3);
 assert.deepEqual(queue.map(p=>p.severity),['critical','high','routine']);
 assert.deepEqual(queue.map(p=>p.priority),[0,1,3]);
 assert(queue[0].categories.includes('immediate-safety'));
 assert(queue[1].categories.includes('self-harm'));
 assert.equal((await t.send(3,'moderate','POST',{postId:urgent.body.id,action:'approve'})).body.error,'safeguarding_review_required');
 assert.equal((await t.send(3,'moderate','POST',{postId:sensitive.body.id,action:'approve'})).status,409);
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,0);
 assert.equal((await t.send(3,'moderate','POST',{postId:ordinary.body.id,action:'approve'})).status,200);
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,1);
 assert.equal(t.sqlite.prepare("SELECT count(*) n FROM timber_shed_bouncer_screenings").get().n,3);
});
test('Bouncer screening persistence failure rolls back the entire pending submission',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 t.sqlite.exec("CREATE TRIGGER bouncer_failure BEFORE INSERT ON timber_shed_bouncer_screenings BEGIN SELECT RAISE(ABORT,'screen failed'); END;");
 const attempted=await submit(t,1);
 assert.equal(attempted.status,503);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_posts').get().n,0);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_bouncer_screenings').get().n,0);
});
test('missing Bouncer screening never permits approval',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const topic=await submit(t,1);
 t.sqlite.prepare('DELETE FROM timber_shed_bouncer_screenings WHERE post_id=?').run(topic.body.id);
 assert.equal((await t.send(3,'moderate','POST',{postId:topic.body.id,action:'approve'})).status,409);
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,0);
 const queue=(await t.send(3,'moderation')).body.pending;
 assert.equal(queue[0].severity,'unreviewed');
 assert.equal(queue[0].priority,0);
});
test('Bouncer policy changes hold previously screened content until re-reviewed',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const topic=await submit(t,1);
 t.sqlite.prepare('UPDATE timber_shed_bouncer_screenings SET policy_version=? WHERE post_id=?').run('superseded-rules',topic.body.id);
 const decision=await t.send(3,'moderate','POST',{postId:topic.body.id,action:'approve'});
 assert.equal(decision.status,409);
 assert.equal(decision.body.error,'safeguarding_review_required');
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,0);
});
test('member can withdraw own pending or approved post and clear the stored text',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 const topic=await submit(t,1);
 assert.equal((await t.send(2,'withdraw','POST',{postId:topic.body.id})).status,404);
 const withdrawn=await t.send(1,'withdraw','POST',{postId:topic.body.id});
 assert.equal(withdrawn.status,200);assert.equal(withdrawn.body.status,'withdrawn');
 const stored=t.sqlite.prepare('SELECT status,title,body FROM timber_shed_forum_posts WHERE id=?').get(topic.body.id);
 assert.equal(stored.status,'withdrawn');assert.equal(stored.title,null);assert.equal(stored.body,'[withdrawn by member]');
 assert.equal((await t.send(1,'mine')).body.posts[0].body,'[withdrawn by member]');
 assert.equal((await t.send(1,'withdraw','POST',{postId:topic.body.id})).status,404);
 assert.equal(t.sqlite.prepare("SELECT count(*) n FROM timber_shed_forum_audit WHERE action='withdraw'").get().n,1);
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,0);
});
test('withdrawal of approved parent hides its approved replies',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');await profile(t,2,'Weekend Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const topic=await submit(t,1);await t.send(3,'moderate','POST',{postId:topic.body.id,action:'approve'});
 const reply=await t.send(2,'submit','POST',{roomId:'main-shed',parentId:topic.body.id,body:'A fictional reply with no private details.'});
 assert.equal(reply.status,202);
 await t.send(3,'moderate','POST',{postId:reply.body.id,action:'approve'});
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,2);
 assert.equal((await t.send(1,'withdraw','POST',{postId:topic.body.id})).status,200);
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,0);
});
test('withdrawal audit failure rolls back the removal',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');const topic=await submit(t,1);
 t.sqlite.exec("CREATE TRIGGER withdrawal_audit_failure BEFORE INSERT ON timber_shed_forum_audit BEGIN SELECT RAISE(ABORT,'audit failed'); END;");
 assert.equal((await t.send(1,'withdraw','POST',{postId:topic.body.id})).status,503);
 const stored=t.sqlite.prepare('SELECT status,body FROM timber_shed_forum_posts WHERE id=?').get(topic.body.id);
 assert.equal(stored.status,'pending');assert.match(stored.body,/fictional example/);
});
test('safeguarding reports appear ahead of routine reports in moderator queue',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const first=await submit(t,1,'main-shed','A quiet evening and a nice walk were helpful.','First friendly question');
 const second=await submit(t,1,'main-shed','Some simple routines helped me through the week.','Second friendly question');
 await t.send(3,'moderate','POST',{postId:first.body.id,action:'approve'});
 await t.send(3,'moderate','POST',{postId:second.body.id,action:'approve'});
 await t.send(2,'report','POST',{postId:first.body.id,reason:'spam'});
 await t.send(2,'report','POST',{postId:second.body.id,reason:'self-harm-risk'});
 const reports=(await t.send(3,'moderation')).body.reports;
 assert.equal(reports.length,2);
 assert.equal(reports[0].reason,'self-harm-risk');
 assert.equal(reports[1].reason,'spam');
});
test('AI model mode cannot run without separately approved data-processing gate',async()=>{
 let calls=0;const t=setup(async()=>{calls++;return {ok:true}});
 t.env.TIMBER_SHED_AI_MODERATION_ENABLED='true';
 await profile(t,1,'Shed Walker');
 const result=await submit(t,1);
 assert.equal(result.status,503);
 assert.equal(result.body.error,'model_not_authorised');
 assert.equal(calls,0);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_posts').get().n,0);
});
test('provider flags cannot override the v1 member notice excluding external AI',async()=>{
 let calls=0;const t=setup(async()=>{calls++;return {ok:true}});
 t.env.TIMBER_SHED_AI_MODERATION_ENABLED='true';t.env.TIMBER_SHED_AI_PROVIDER_APPROVED='true';
 await profile(t,1,'Shed Walker');
 const result=await submit(t,1);
 assert.equal(result.status,503);assert.equal(result.body.error,'external_ai_not_in_pilot_policy');assert.equal(calls,0);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_posts').get().n,0);
});
test('v1 deterministic mode still screens and requires human approval when external AI is off',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators VALUES(3,1,?)').run('2026-10-22');
 const result=await submit(t,1);assert.equal(result.status,202);
 assert.equal((await t.send(2,'latest')).body.posts.length,0);
 assert.equal((await t.send(3,'moderate','POST',{postId:result.body.id,action:'approve'})).status,200);
 assert.equal((await t.send(2,'latest')).body.posts.length,1);
});
test('suspected trial-stage product sales cannot pass ordinary moderator approval',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const item=await submit(t,1,'main-shed','I have a spare Mounjaro pen for £80, message me.','An available pen');
 assert.equal(item.status,202);
 const pending=(await t.send(3,'moderation')).body.pending;
 assert.equal(pending[0].severity,'high');
 assert(pending[0].categories.includes('medication-trading'));
 assert.equal((await t.send(3,'moderate','POST',{postId:item.body.id,action:'approve'})).status,409);
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,0);
});
test('latest conversations show only approved top-level posts, never pending or rejected',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');await profile(t,2,'Weekend Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const first=await submit(t,1);
 const held=await submit(t,2,'main-shed','Another fictional discussion, still pending.','Unapproved conversation');
 assert.equal((await t.send(2,'latest')).body.posts.length,0);
 await t.send(3,'moderate','POST',{postId:first.body.id,action:'approve'});
 const feed=(await t.send(2,'latest')).body.posts;
 assert.equal(feed.length,1);assert.equal(feed[0].id,first.body.id);
 assert.equal(feed[0].display_name,'Shed Walker');assert.equal(feed[0].reply_count,0);
 assert(!Object.keys(feed[0]).some(k=>/user_id|email|dob|health|weight/i.test(k)));
 assert(!JSON.stringify(feed).includes(held.body.id));
});
test('only authors get in-app decisions; only parent author gets approved reply alert',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');await profile(t,2,'Weekend Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const topic=await submit(t,1);
 assert.equal((await t.send(1,'notifications')).body.unreadCount,0);
 await t.send(3,'moderate','POST',{postId:topic.body.id,action:'approve'});
 const own=(await t.send(1,'notifications')).body;
 assert.equal(own.unreadCount,1);assert.equal(own.notifications[0].kind,'approved');
 assert.equal(own.notifications[0].thread_id,topic.body.id);
 assert(!JSON.stringify(own).includes('fictional example'));
 assert.equal((await t.send(2,'notifications')).body.unreadCount,0);
 const reply=await t.send(2,'submit','POST',{roomId:'main-shed',parentId:topic.body.id,body:'This is a fictional reply to the original discussion.'});
 assert.equal((await t.send(1,'notifications')).body.unreadCount,1);
 await t.send(3,'moderate','POST',{postId:reply.body.id,action:'approve'});
 const parent=(await t.send(1,'notifications')).body;
 assert.equal(parent.unreadCount,2);
 assert(parent.notifications.some(n=>n.kind==='reply'&&n.thread_id===topic.body.id));
 const replier=(await t.send(2,'notifications')).body;
 assert.equal(replier.unreadCount,1);
 assert.equal(replier.notifications[0].kind,'approved');
 assert.equal((await t.send(3,'notifications')).body.unreadCount,0);
 assert.equal((await t.send(1,'latest')).body.posts[0].reply_count,1);
});
test('in-app notifications cannot be read or marked by another account',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const topic=await submit(t,1);await t.send(3,'moderate','POST',{postId:topic.body.id,action:'approve'});
 const note=(await t.send(1,'notifications')).body.notifications[0];
 assert.equal((await t.send(2,'notifications/read','POST',{notificationId:note.id})).status,404);
 assert.equal((await t.send(1,'notifications')).body.unreadCount,1);
 assert.equal((await t.send(1,'notifications/read','POST',{notificationId:note.id})).status,200);
 assert.equal((await t.send(1,'notifications')).body.unreadCount,0);
 assert.equal((await t.send(1,'notifications/read','POST',{notificationId:note.id})).status,200);
 assert.equal((await t.send(1,'notifications')).body.unreadCount,0);
});
test('rejected and removed posts produce only private generic author notices',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const rejected=await submit(t,1);await t.send(3,'moderate','POST',{postId:rejected.body.id,action:'reject'});
 assert.deepEqual((await t.send(1,'notifications')).body.notifications.map(n=>n.kind),['rejected']);
 assert.equal((await t.send(2,'notifications')).body.unreadCount,0);
 const approved=await submit(t,1);await t.send(3,'moderate','POST',{postId:approved.body.id,action:'approve'});
 await t.send(3,'moderate','POST',{postId:approved.body.id,action:'remove'});
 assert.deepEqual((await t.send(1,'notifications')).body.notifications.map(n=>n.kind).sort(),['rejected','removed']);
});
test('failed moderation audit or notification insert cannot leave a published post',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const topic=await submit(t,1);
 t.sqlite.exec("CREATE TRIGGER notification_failure BEFORE INSERT ON timber_shed_forum_notifications BEGIN SELECT RAISE(ABORT,'no notification'); END;");
 assert.equal((await t.send(3,'moderate','POST',{postId:topic.body.id,action:'approve'})).status,503);
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(topic.body.id).status,'pending');
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_audit').get().n,0);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_notifications').get().n,0);
});
test('withdrawal does not leave a notification linking to hidden content',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');await profile(t,2,'Weekend Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const topic=await submit(t,1);await t.send(3,'moderate','POST',{postId:topic.body.id,action:'approve'});
 const reply=await t.send(2,'submit','POST',{roomId:'main-shed',parentId:topic.body.id,body:'This is a fictional reply to a conversation.'});
 await t.send(3,'moderate','POST',{postId:reply.body.id,action:'approve'});
 assert.equal((await t.send(1,'notifications')).body.unreadCount,2);
 await t.send(1,'withdraw','POST',{postId:topic.body.id});
 assert.equal((await t.send(1,'latest')).body.posts.length,0);
 // In-app alert content is generic, but links must not reveal withdrawn discussions.
 assert.equal((await t.send(1,'notifications')).body.notifications.filter(n=>n.kind==='reply').length,0);
});
test('opening a specific approved discussion returns only that root and its approved replies',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');await profile(t,2,'Weekend Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const first=await submit(t,1,'main-shed','The first fictional conversation has been started.','First discussion');
 const second=await submit(t,2,'main-shed','Another fictional conversation has been started.','Second discussion');
 await t.send(3,'moderate','POST',{postId:first.body.id,action:'approve'});
 await t.send(3,'moderate','POST',{postId:second.body.id,action:'approve'});
 const reply=await t.send(2,'submit','POST',{roomId:'main-shed',parentId:first.body.id,body:'A fictional reply to the first conversation.'});
 await t.send(3,'moderate','POST',{postId:reply.body.id,action:'approve'});
 const scoped=(await t.send(1,'threads','GET',undefined,'?room=main-shed&threadId='+first.body.id)).body.posts;
 assert.equal(scoped.length,2);
 assert(scoped.every(x=>x.id===first.body.id||x.parent_id===first.body.id));
 assert(!JSON.stringify(scoped).includes(second.body.id));
 assert.equal((await t.send(1,'threads','GET',undefined,'?room=main-shed&threadId=bad')).status,400);
 assert.equal((await t.send(1,'threads','GET',undefined,'?room=grub-fit&threadId='+first.body.id)).body.posts.length,0);
});
test('self replies do not generate a redundant parent-author reply notification',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const root=await submit(t,1);await t.send(3,'moderate','POST',{postId:root.body.id,action:'approve'});
 const reply=await t.send(1,'submit','POST',{roomId:'main-shed',parentId:root.body.id,body:'A fictional follow-up from the same author.'});
 await t.send(3,'moderate','POST',{postId:reply.body.id,action:'approve'});
 const notices=(await t.send(1,'notifications')).body.notifications;
 assert.equal(notices.length,2);
 assert(notices.every(x=>x.kind==='approved'));
});
test('notifications do not store post text, email, names or private health data',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const topic=await submit(t,1);await t.send(3,'moderate','POST',{postId:topic.body.id,action:'approve'});
 const columns=t.sqlite.prepare('PRAGMA table_info(timber_shed_forum_notifications)').all().map(x=>x.name);
 assert(!columns.some(k=>/body|title|email|name|health|treatment|phone|device_token/i.test(k)));
 const visible=(await t.send(1,'notifications')).body.notifications[0];
 assert.deepEqual(Object.keys(visible).sort(),['created_at','id','kind','read_at','room_id','thread_id']);
});
test('room browsing paginates approved top-level discussions without duplicates or pending leaks',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 const insert=t.sqlite.prepare("INSERT INTO timber_shed_forum_posts(id,user_id,room_id,parent_id,title,body,status,created_at,reviewed_at) VALUES(?,1,'main-shed',NULL,?,?,'approved',?,?)");
 for(let i=0;i<25;i++){
  const date='2026-10-22T12:'+String(i).padStart(2,'0')+':00Z';
  insert.run('synthetic-room-topic-'+i,'Fictional conversation '+i,'A synthetic post for pagination.',date,date);
 }
 t.sqlite.prepare("INSERT INTO timber_shed_forum_posts(id,user_id,room_id,title,body,status,created_at) VALUES('synthetic-hidden',1,'main-shed','Unapproved','Invisible to members','pending','2026-10-22T13:00:00Z')").run();
 const first=(await t.send(2,'room-topics','GET',undefined,'?room=main-shed&offset=0')).body;
 const second=(await t.send(2,'room-topics','GET',undefined,'?room=main-shed&offset=20')).body;
 assert.equal(first.posts.length,20);assert.equal(first.hasMore,true);
 assert.equal(second.posts.length,5);assert.equal(second.hasMore,false);
 assert.equal(new Set([...first.posts,...second.posts].map(x=>x.id)).size,25);
 assert(!JSON.stringify(first.posts).includes('synthetic-hidden'));
 assert.equal((await t.send(2,'room-topics','GET',undefined,'?room=main-shed&offset=-1')).status,400);
 assert.equal((await t.send(2,'room-topics','GET',undefined,'?room=main-shed&offset=2001')).status,400);
});
test('reply cannot be approved after its parent discussion is withdrawn',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');await profile(t,2,'Weekend Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const root=await submit(t,1);await t.send(3,'moderate','POST',{postId:root.body.id,action:'approve'});
 const reply=await t.send(2,'submit','POST',{roomId:'main-shed',parentId:root.body.id,body:'A fictional reply waiting for moderator approval.'});
 await t.send(1,'withdraw','POST',{postId:root.body.id});
 const decision=await t.send(3,'moderate','POST',{postId:reply.body.id,action:'approve'});
 assert.equal(decision.status,409);
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(reply.body.id).status,'pending');
 assert.equal((await t.send(1,'notifications')).body.unreadCount,0);
});
test('removing an approved parent clears old reply alerts and leaves only the removal notice',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');await profile(t,2,'Weekend Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const root=await submit(t,1);await t.send(3,'moderate','POST',{postId:root.body.id,action:'approve'});
 const reply=await t.send(2,'submit','POST',{roomId:'main-shed',parentId:root.body.id,body:'A fictional reply from a second member.'});
 await t.send(3,'moderate','POST',{postId:reply.body.id,action:'approve'});
 assert.equal((await t.send(1,'notifications')).body.unreadCount,2);
 assert.equal((await t.send(3,'moderate','POST',{postId:root.body.id,action:'remove'})).status,200);
 assert.deepEqual((await t.send(1,'notifications')).body.notifications.map(x=>x.kind),['removed']);
 assert.equal((await t.send(1,'latest')).body.posts.length,0);
});
test('in-app notification history paginates privately with global unread count',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');
 const post=t.sqlite.prepare("INSERT INTO timber_shed_forum_posts(id,user_id,room_id,title,body,status,created_at,reviewed_at) VALUES(?,1,'main-shed','Fictional post','A fictional message','approved',?,?)");
 const note=t.sqlite.prepare("INSERT INTO timber_shed_forum_notifications(id,recipient_id,post_id,thread_id,room_id,kind,created_at) VALUES(?,1,?,?,'main-shed','approved',?)");
 for(let i=0;i<25;i++){
  const id='synthetic-notice-post-'+i,date='2026-10-22T12:'+String(i).padStart(2,'0')+':00Z';
  post.run(id,date,date);note.run('synthetic-notification-'+i,id,id,date);
 }
 const first=(await t.send(1,'notifications')).body;
 const second=(await t.send(1,'notifications','GET',undefined,'?offset=20')).body;
 assert.equal(first.notifications.length,20);assert.equal(first.hasMore,true);assert.equal(first.unreadCount,25);
 assert.equal(second.notifications.length,5);assert.equal(second.hasMore,false);assert.equal(second.unreadCount,25);
 assert.equal(new Set([...first.notifications,...second.notifications].map(x=>x.id)).size,25);
 assert.equal((await t.send(2,'notifications')).body.notifications.length,0);
 assert.equal((await t.send(1,'notifications','GET',undefined,'?offset=2001')).status,400);
});

function appealModerators(t){
 for(const id of [2,3])t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(id,1,'now');
}
async function rejectedAppeal(t){
 await profile(t,1,'Shed Walker');appealModerators(t);
 const post=await submit(t,1);
 assert.equal((await t.send(3,'moderate','POST',{postId:post.body.id,action:'reject'})).status,200);
 const appeal=await t.send(1,'appeal','POST',{postId:post.body.id,reason:'missed-context'});
 return{postId:post.body.id,appeal};
}
test('appeals require adult authenticated same-origin session and preserve default-off gates',async()=>{
 const t=setup();
 assert.equal((await t.send(0,'appeals')).status,401);
 assert.equal((await t.send(4,'appeals')).status,403);
 assert.equal((await t.send(5,'appeals')).status,403);
 const req=new Request(origin+path+'appeal',{method:'POST',headers:{'x-member':'1','Origin':'https://other.test','Content-Type':'application/json'},body:JSON.stringify({postId:'synthetic-post',reason:'other'})});
 assert.equal((await t.route(req,t.env)).status,403);
 t.env.TIMBER_SHED_FORUM_ENABLED='false';const before=t.calls.length;
 assert.equal((await t.send(1,'appeals')).status,404);assert.equal(t.calls.length,before);
});
test('only the author can appeal rejected or removed content; no appeal of pending or approved posts',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');appealModerators(t);
 const post=await submit(t,1);
 assert.equal((await t.send(1,'appeal','POST',{postId:post.body.id,reason:'other'})).status,404);
 await t.send(3,'moderate','POST',{postId:post.body.id,action:'approve'});
 assert.equal((await t.send(1,'appeal','POST',{postId:post.body.id,reason:'other'})).status,404);
 await t.send(3,'moderate','POST',{postId:post.body.id,action:'remove'});
 assert.equal((await t.send(2,'appeal','POST',{postId:post.body.id,reason:'other'})).status,404);
 assert.equal((await t.send(1,'appeal','POST',{postId:post.body.id,reason:'other'})).status,202);
 assert.equal((await t.send(1,'latest')).body.posts.length,0);
});
test('appeals are private, enum-only, deduplicated and atomically audited',async()=>{
 const t=setup();const {postId,appeal}=await rejectedAppeal(t);
 assert.equal(appeal.status,202);
 assert.equal((await t.send(1,'appeal','POST',{postId,reason:'other'})).body.id,appeal.body.id);
 assert.equal((await t.send(1,'appeal','POST',{postId,reason:'other',body:'Private details'})).status,400);
 assert.equal((await t.send(1,'appeal','POST',{postId,reason:'arbitrary text'})).status,400);
 const own=(await t.send(1,'appeals')).body.appeals;
 assert.equal(own.length,1);assert.equal((await t.send(2,'appeals')).body.appeals.length,0);
 assert(!JSON.stringify(own).includes('fictional example'));
 assert(!Object.keys(own[0]).some(k=>/user_id|decision_by|resolved_by|body|email|name/.test(k)));
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_appeal_audit').get().n,1);
 assert.equal((await t.send(1,'moderation')).status,403);
 assert.equal((await t.send(2,'moderation')).body.appeals.length,1);
});
test('appeal review excludes original moderator and post author; inactive moderators have no authority',async()=>{
 const t=setup();const {appeal}=await rejectedAppeal(t);
 const payload={appealId:appeal.body.id,outcome:'reconsider'};
 assert.equal((await t.send(1,'appeal/review','POST',payload)).status,403);
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(1,1,?)').run('now');
 assert.equal((await t.send(1,'appeal/review','POST',payload)).body.error,'independent_reviewer_required');
 assert.equal((await t.send(3,'appeal/review','POST',payload)).body.error,'independent_reviewer_required');
 t.sqlite.prepare('UPDATE timber_shed_forum_moderators SET active=0 WHERE user_id=2').run();
 assert.equal((await t.send(2,'appeal/review','POST',payload)).body.error,'moderator_only');
});
test('upholding an appeal leaves the post hidden and prevents a second review',async()=>{
 const t=setup();const {postId,appeal}=await rejectedAppeal(t);
 const review=await t.send(2,'appeal/review','POST',{appealId:appeal.body.id,outcome:'upheld'});
 assert.equal(review.status,200);assert.equal(review.body.status,'upheld');
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(postId).status,'rejected');
 assert.equal((await t.send(1,'appeals')).body.appeals[0].status,'upheld');
 assert.equal((await t.send(2,'moderation')).body.appeals.length,0);
 assert.equal((await t.send(2,'appeal/review','POST',{appealId:appeal.body.id,outcome:'reconsider'})).status,409);
 assert.equal((await t.send(1,'latest')).body.posts.length,0);
});
test('successful appeal returns to pending; only a separate normal moderation action can publish',async()=>{
 const t=setup();const {postId,appeal}=await rejectedAppeal(t);
 assert.equal((await t.send(2,'appeal/review','POST',{appealId:appeal.body.id,outcome:'reconsider'})).status,200);
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(postId).status,'pending');
 assert.equal((await t.send(1,'latest')).body.posts.length,0);
 assert.equal((await t.send(1,'notifications')).body.notifications.filter(n=>n.kind==='approved').length,0);
 assert.equal((await t.send(2,'moderation')).body.pending.length,1);
 assert.equal((await t.send(3,'moderate','POST',{postId,action:'approve'})).status,200);
 assert.equal((await t.send(1,'latest')).body.posts.length,1);
});
test('appeal cannot override high-risk or obsolete screening approval holds',async()=>{
 for(const change of ['high','outdated']){
  const t=setup();const {postId,appeal}=await rejectedAppeal(t);
  t.sqlite.prepare(change==='high'?"UPDATE timber_shed_bouncer_screenings SET severity='high' WHERE post_id=?":"UPDATE timber_shed_bouncer_screenings SET policy_version='old' WHERE post_id=?").run(postId);
  assert.equal((await t.send(2,'appeal/review','POST',{appealId:appeal.body.id,outcome:'reconsider'})).status,200);
  assert.equal((await t.send(3,'moderate','POST',{postId,action:'approve'})).body.error,'safeguarding_review_required');
  assert.equal((await t.send(1,'latest')).body.posts.length,0);
 }
});
test('appeal audit failure rolls back submission and reconsideration',async()=>{
 const first=setup();await profile(first,1,'Shed Walker');appealModerators(first);const post=await submit(first,1);
 await first.send(3,'moderate','POST',{postId:post.body.id,action:'reject'});
 first.sqlite.exec("CREATE TRIGGER appeal_audit_failure BEFORE INSERT ON timber_shed_forum_appeal_audit BEGIN SELECT RAISE(ABORT,'audit unavailable'); END;");
 assert.equal((await first.send(1,'appeal','POST',{postId:post.body.id,reason:'other'})).status,503);
 assert.equal(first.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_appeals').get().n,0);
 const t=setup();const {postId,appeal}=await rejectedAppeal(t);
 t.sqlite.exec("CREATE TRIGGER appeal_audit_failure BEFORE INSERT ON timber_shed_forum_appeal_audit BEGIN SELECT RAISE(ABORT,'audit unavailable'); END;");
 assert.equal((await t.send(2,'appeal/review','POST',{appealId:appeal.body.id,outcome:'reconsider'})).status,503);
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_appeals').get().status,'open');
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(postId).status,'rejected');
});
test('post-update failure rolls back appeal resolution and its audit',async()=>{
 const t=setup();const {postId,appeal}=await rejectedAppeal(t);
 t.sqlite.exec("CREATE TRIGGER appeal_post_failure BEFORE UPDATE ON timber_shed_forum_posts WHEN NEW.status='pending' BEGIN SELECT RAISE(ABORT,'post unavailable'); END;");
 assert.equal((await t.send(2,'appeal/review','POST',{appealId:appeal.body.id,outcome:'reconsider'})).status,503);
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_appeals').get().status,'open');
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_appeal_audit').get().n,1);
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(postId).status,'rejected');
});
test('withdrawal clears removed content and closes open appeal without restoring its text',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');appealModerators(t);const post=await submit(t,1);
 await t.send(3,'moderate','POST',{postId:post.body.id,action:'approve'});
 await t.send(3,'moderate','POST',{postId:post.body.id,action:'remove'});
 const appeal=await t.send(1,'appeal','POST',{postId:post.body.id,reason:'other'});
 assert.equal((await t.send(1,'withdraw','POST',{postId:post.body.id})).status,200);
 const stored=t.sqlite.prepare('SELECT status,body FROM timber_shed_forum_posts WHERE id=?').get(post.body.id);
 assert.equal(stored.status,'withdrawn');assert.equal(stored.body,'[withdrawn by member]');
 assert.equal((await t.send(1,'appeals')).body.appeals[0].status,'withdrawn');
 assert.equal((await t.send(2,'moderation')).body.appeals.length,0);
 assert.equal((await t.send(2,'appeal/review','POST',{appealId:appeal.body.id,outcome:'reconsider'})).status,409);
});
test('account deletion cascades own appeals and audit without orphaning post content',async()=>{
 const t=setup();await rejectedAppeal(t);t.sqlite.prepare('DELETE FROM users WHERE id=1').run();
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_appeals').get().n,0);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_appeal_audit').get().n,0);
});

test('decision changed during appeal review aborts the entire resolution batch',async()=>{
 const t=setup();const {postId,appeal}=await rejectedAppeal(t),batch=t.env.DB.batch.bind(t.env.DB);
 t.env.DB.batch=async ops=>{
  t.sqlite.prepare("UPDATE timber_shed_forum_posts SET reviewed_at='2026-10-23T09:00:00Z' WHERE id=?").run(postId);
  return batch(ops);
 };
 assert.equal((await t.send(2,'appeal/review','POST',{appealId:appeal.body.id,outcome:'reconsider'})).status,503);
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_appeals').get().status,'open');
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_appeal_audit').get().n,1);
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(postId).status,'rejected');
});
test('an appeal may address a later independent decision without replaying the old appeal',async()=>{
 const t=setup();const {postId,appeal}=await rejectedAppeal(t);
 await t.send(2,'appeal/review','POST',{appealId:appeal.body.id,outcome:'reconsider'});
 await t.send(3,'moderate','POST',{postId,action:'reject'});
 t.sqlite.prepare("UPDATE timber_shed_forum_posts SET reviewed_at='2026-10-23T09:00:00Z' WHERE id=?").run(postId);
 const second=await t.send(1,'appeal','POST',{postId,reason:'incorrect-rule'});
 assert.equal(second.status,202);assert.notEqual(second.body.id,appeal.body.id);
 assert.equal((await t.send(1,'mine')).body.posts[0].reviewed_at,'2026-10-23T09:00:00Z');
 assert.equal((await t.send(1,'appeals')).body.appeals.length,2);
 assert.equal((await t.send(2,'moderation')).body.appeals.length,1);
});

async function approvedPair(t){
 await profile(t,1,'Shed Walker');await profile(t,2,'Weekend Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(3,1,?)').run('now');
 const a=await submit(t,1),b=await submit(t,2);
 await t.send(3,'moderate','POST',{postId:a.body.id,action:'approve'});
 await t.send(3,'moderate','POST',{postId:b.body.id,action:'approve'});
 return{a:a.body.id,b:b.body.id};
}
test('blocking hides each other across all feeds, direct threads and nested replies',async()=>{
 const t=setup();const {a,b}=await approvedPair(t);
 const reply=await t.send(2,'submit','POST',{roomId:'main-shed',parentId:a,body:'A fictional reply from a second account.'});
 await t.send(3,'moderate','POST',{postId:reply.body.id,action:'approve'});
 assert.equal((await t.send(1,'latest')).body.posts.length,2);
 assert.equal((await t.send(1,'block','POST',{postId:b})).status,200);
 for(const [user,expected] of [[1,a],[2,b]]){
  assert.deepEqual((await t.send(user,'latest')).body.posts.map(p=>p.id),[expected]);
  assert.deepEqual((await t.send(user,'room-topics','GET',undefined,'?room=main-shed')).body.posts.map(p=>p.id),[expected]);
  const thread=(await t.send(user,'threads','GET',undefined,'?room=main-shed')).body.posts;
  assert.deepEqual(thread.map(p=>p.id),[expected]);
 }
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed&threadId='+a)).body.posts.length,0);
 assert.equal((await t.send(1,'latest')).body.posts[0].reply_count,0);
 assert.equal((await t.send(1,'notifications')).body.notifications.some(n=>n.kind==='reply'),false);
});
test('blocked members cannot submit replies or report invisible posts; blocks do not hide moderation evidence',async()=>{
 const t=setup();const {a,b}=await approvedPair(t);
 await t.send(1,'report','POST',{postId:b,reason:'harassment'});
 await t.send(1,'block','POST',{postId:b});
 assert.equal((await t.send(2,'submit','POST',{roomId:'main-shed',parentId:a,body:'An attempted reply after blocking.'})).status,404);
 assert.equal((await t.send(2,'report','POST',{postId:a,reason:'spam'})).status,404);
 assert.equal((await t.send(3,'moderation')).body.reports.length,1);
 assert.equal((await t.send(1,'mine')).body.posts.length,1);
});
test('only the blocker can list and remove their block; no account identifiers exposed',async()=>{
 const t=setup();const {b}=await approvedPair(t);await t.send(1,'block','POST',{postId:b});
 await t.send(1,'block','POST',{postId:b});
 const blocks=(await t.send(1,'blocks')).body.blocks;
 assert.equal(blocks.length,1);assert.equal(blocks[0].display_name,'Weekend Walker');
 assert.deepEqual(Object.keys(blocks[0]).sort(),['created_at','display_name','id']);
 assert.equal((await t.send(2,'blocks')).body.blocks.length,0);
 await t.send(2,'unblock','POST',{blockId:blocks[0].id});
 assert.equal((await t.send(1,'blocks')).body.blocks.length,1);
 await t.send(1,'unblock','POST',{blockId:blocks[0].id});
 assert.equal((await t.send(1,'latest')).body.posts.length,2);
});
test('blocking your own or a private pending post is unavailable; injected identities rejected',async()=>{
 const t=setup();const {a}=await approvedPair(t);const pending=await submit(t,2);
 assert.equal((await t.send(1,'block','POST',{postId:a})).status,404);
 assert.equal((await t.send(1,'block','POST',{postId:pending.body.id})).status,404);
 assert.equal((await t.send(1,'block','POST',{postId:a,userId:2})).status,400);
});
test('only active moderators can suspend or ban; self and moderator targeting are blocked',async()=>{
 const t=setup();const {a,b}=await approvedPair(t);
 const payload={postId:a,kind:'banned',reason:'medication-trading'};
 assert.equal((await t.send(2,'restrict','POST',payload)).status,403);
 t.sqlite.prepare('UPDATE timber_shed_forum_moderators SET active=0 WHERE user_id=3').run();
 assert.equal((await t.send(3,'restrict','POST',payload)).status,403);
 t.sqlite.prepare('UPDATE timber_shed_forum_moderators SET active=1 WHERE user_id=3').run();
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(2,1,?)').run('now');
 assert.equal((await t.send(3,'restrict','POST',{...payload,postId:b})).body.error,'independent_admin_required');
 assert.equal((await t.send(2,'restrict','POST',{...payload,postId:b})).status,403);
 assert.equal((await t.send(3,'restrict','POST',{...payload,days:30})).status,400);
 assert.equal((await t.send(3,'restrict','POST',{...payload,kind:'suspended',days:365})).status,400);
});
test('community restriction blocks reading, posting and staff actions but preserves private appeals and withdrawal',async()=>{
 const t=setup();const {a}=await approvedPair(t);
 const pending=await submit(t,1);
 const restriction=await t.send(3,'restrict','POST',{postId:a,kind:'suspended',days:7,reason:'harassment'});
 assert.equal(restriction.status,201);
 for(const resource of ['rooms','latest','threads','profile','notifications','moderation','blocks'])assert.equal((await t.send(1,resource)).status,403);
 assert.equal((await submit(t,1)).body.error,'community_access_restricted');
 assert.equal((await t.send(1,'access')).body.restriction.kind,'suspended');
 assert.equal((await t.send(1,'mine')).status,200);
 assert.equal((await t.send(1,'withdraw','POST',{postId:pending.body.id})).status,200);
 assert.equal((await t.send(1,'restriction/appeal','POST',{restrictionId:restriction.body.id,reason:'incorrect-rule'})).status,202);
 assert.equal((await t.send(2,'restriction/appeal','POST',{restrictionId:restriction.body.id,reason:'other'})).status,404);
 assert.equal((await t.send(3,'moderate','POST',{postId:a,action:'remove'})).status,200);
});
test('restriction never publishes or removes historic posts and pending authors cannot be approved while restricted',async()=>{
 const t=setup();const {a}=await approvedPair(t);const pending=await submit(t,1);
 await t.send(3,'restrict','POST',{postId:a,kind:'banned',reason:'medication-trading'});
 assert.equal((await t.send(2,'latest')).body.posts.some(p=>p.id===a),true);
 assert.equal((await t.send(3,'moderate','POST',{postId:pending.body.id,action:'approve'})).body.error,'author_access_restricted');
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(pending.body.id).status,'pending');
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_access_audit').get().n,1);
});
test('restriction review is independent and reinstatement restores access without changing posts',async()=>{
 const t=setup();const {a}=await approvedPair(t);
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(2,1,?)').run('now');
 const r=await t.send(3,'restrict','POST',{postId:a,kind:'banned',reason:'other'});
 const appeal=await t.send(1,'restriction/appeal','POST',{restrictionId:r.body.id,reason:'other'});
 assert.equal((await t.send(1,'restriction/appeal','POST',{restrictionId:r.body.id,reason:'other'})).body.id,appeal.body.id);
 assert.equal((await t.send(3,'restriction/review','POST',{appealId:appeal.body.id,outcome:'reinstated'})).body.error,'independent_reviewer_required');
 assert.equal((await t.send(2,'restriction/review','POST',{appealId:appeal.body.id,outcome:'reinstated'})).status,200);
 assert.equal((await t.send(1,'latest')).status,200);
 assert.equal((await t.send(1,'access')).body.restriction,null);
 assert.equal((await t.send(1,'access')).body.appeals[0].status,'reinstated');
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(a).status,'approved');
});
test('human lift closes any open restriction appeal and inactive bans cannot be replayed',async()=>{
 const t=setup();const {a}=await approvedPair(t);const r=await t.send(3,'restrict','POST',{postId:a,kind:'banned',reason:'other'});
 await t.send(1,'restriction/appeal','POST',{restrictionId:r.body.id,reason:'other'});
 assert.equal((await t.send(3,'restriction/lift','POST',{restrictionId:r.body.id})).status,200);
 assert.equal((await t.send(1,'access')).body.restriction,null);
 assert.equal((await t.send(1,'access')).body.appeals[0].status,'reinstated');
 assert.equal((await t.send(3,'restriction/lift','POST',{restrictionId:r.body.id})).status,404);
});
test('expired suspensions cease blocking access; a later manual sanction is separately audited',async()=>{
 const t=setup();const {a}=await approvedPair(t);
 const first=await t.send(3,'restrict','POST',{postId:a,kind:'suspended',days:1,reason:'spam'});
 t.sqlite.prepare("UPDATE timber_shed_forum_restrictions SET expires_at='2026-10-21T12:00:00Z' WHERE id=?").run(first.body.id);
 assert.equal((await t.send(1,'latest')).status,200);
 const second=await t.send(3,'restrict','POST',{postId:a,kind:'banned',reason:'spam'});
 assert.equal(second.status,201);assert.notEqual(second.body.id,first.body.id);
 assert.equal(t.sqlite.prepare("SELECT count(*) n FROM timber_shed_access_audit WHERE action='expired'").get().n,1);
});
test('restriction audit failure rolls back ban, appeal and lift with no partial access change',async()=>{
 const t=setup();const {a}=await approvedPair(t);
 t.sqlite.exec("CREATE TRIGGER access_audit_failure BEFORE INSERT ON timber_shed_access_audit BEGIN SELECT RAISE(ABORT,'audit failed'); END;");
 assert.equal((await t.send(3,'restrict','POST',{postId:a,kind:'banned',reason:'other'})).status,503);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_restrictions').get().n,0);
 t.sqlite.exec('DROP TRIGGER access_audit_failure');
 const r=await t.send(3,'restrict','POST',{postId:a,kind:'banned',reason:'other'});
 t.sqlite.exec("CREATE TRIGGER access_audit_failure BEFORE INSERT ON timber_shed_access_audit BEGIN SELECT RAISE(ABORT,'audit failed'); END;");
 assert.equal((await t.send(1,'restriction/appeal','POST',{restrictionId:r.body.id,reason:'other'})).status,503);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_restriction_appeals').get().n,0);
 assert.equal((await t.send(3,'restriction/lift','POST',{restrictionId:r.body.id})).status,503);
 assert.equal((await t.send(1,'access')).body.restriction.kind,'banned');
});

test('forum export contains only own contributions, decisions and generic account-scoped records',async()=>{
 const t=setup();const {a,b}=await approvedPair(t);
 await t.send(1,'report','POST',{postId:b,reason:'privacy'});
 const data=(await t.send(1,'export')).body.forum;
 assert.equal(data.profile.display_name,'Shed Walker');
 assert.deepEqual(data.posts.map(p=>p.id),[a]);
 assert.equal(data.reports.length,1);
 assert(!JSON.stringify(data).includes('Weekend Walker'));
 for(const rows of Object.values(data))if(Array.isArray(rows))for(const row of rows)assert(!Object.keys(row).some(k=>/user_id|created_by|reviewed_by|actor_id|moderator_id|token_hash|email/.test(k)));
 assert.equal((await t.send(0,'export')).status,401);
});
test('leaving the community clears author text and profile, hides child replies and clears stale alerts',async()=>{
 const t=setup();const {a,b}=await approvedPair(t);
 const reply=await t.send(2,'submit','POST',{roomId:'main-shed',parentId:a,body:'A fictional reply on another member thread.'});
 await t.send(3,'moderate','POST',{postId:reply.body.id,action:'approve'});
 const rejected=await submit(t,1);await t.send(3,'moderate','POST',{postId:rejected.body.id,action:'reject'});
 await t.send(1,'appeal','POST',{postId:rejected.body.id,reason:'other'});
 assert.equal((await t.send(1,'leave','POST',{})).status,400);
 assert.equal((await t.send(1,'leave','POST',{confirm:'leave-community'})).status,200);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_profiles WHERE user_id=1').get().n,0);
 assert(t.sqlite.prepare('SELECT body,status FROM timber_shed_forum_posts WHERE user_id=1').all().every(p=>p.status==='withdrawn'&&p.body==='[withdrawn by member]'));
 assert.deepEqual((await t.send(2,'latest')).body.posts.map(p=>p.id),[b]);
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed&threadId='+a)).body.posts.length,0);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_appeals').get().n,0);
 assert.equal((await t.send(2,'mine')).body.posts.length,2);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM users WHERE id=1').get().n,1);
});
test('leaving cannot evade a ban and does not change other member records',async()=>{
 const t=setup();const {a,b}=await approvedPair(t);
 await t.send(3,'restrict','POST',{postId:a,kind:'banned',reason:'spam'});
 assert.equal((await t.send(1,'leave','POST',{confirm:'leave-community'})).status,200);
 assert.equal((await t.send(1,'access')).body.restriction.kind,'banned');
 assert.equal((await t.send(1,'export')).status,200);
 assert.equal((await profile(t,1,'Another Alias')).status,403);
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(b).status,'approved');
});
test('failed departure audit rolls back content clearing and profile deletion',async()=>{
 const t=setup();const {a}=await approvedPair(t);
 t.sqlite.exec("CREATE TRIGGER departure_failure BEFORE INSERT ON timber_shed_forum_audit BEGIN SELECT RAISE(ABORT,'audit unavailable'); END;");
 assert.equal((await t.send(1,'leave','POST',{confirm:'leave-community'})).status,503);
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(a).status,'approved');
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_profiles WHERE user_id=1').get().n,1);
});
test('a block created during submission prevents a stale reply being saved',async()=>{
 const t=setup();const {a}=await approvedPair(t),batch=t.env.DB.batch.bind(t.env.DB);
 t.env.DB.batch=async ops=>{
  t.sqlite.prepare("INSERT INTO timber_shed_forum_blocks(id,blocker_id,blocked_id,created_at) VALUES('synthetic-late-block',1,2,'now')").run();
  return batch(ops);
 };
 assert.equal((await t.send(2,'submit','POST',{roomId:'main-shed',parentId:a,body:'A fictional reply racing a block.'})).status,503);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_posts WHERE parent_id=?').get(a).n,0);
});

test('governance adoption is exact and default-closed before any member read',async()=>{
 const t=setup();delete t.env.TIMBER_SHED_GOVERNANCE_APPROVED_VERSION;
 assert.equal((await t.send(1,'latest')).status,404);assert.equal(t.calls.length,0);
 t.env.TIMBER_SHED_GOVERNANCE_APPROVED_VERSION='old-policy';
 assert.equal((await t.send(1,'latest')).status,404);
});
test('DOB alone cannot enter pilot; expired and revoked adult clearances deny browsing',async()=>{
 const t=setup();t.sqlite.prepare('DELETE FROM timber_shed_adult_access WHERE user_id=1').run();
 assert.equal((await t.send(1,'latest')).body.error,'adult_access_review_required');
 const state=await t.send(1,'participation');assert.equal(state.body.adultAccess,false);
 assert.equal((await t.send(1,'export')).status,200);
 t.sqlite.prepare("UPDATE timber_shed_adult_access SET expires_at='2026-10-20T00:00:00.000Z' WHERE user_id=2").run();
 assert.equal((await t.send(2,'latest')).status,403);
 t.sqlite.prepare("UPDATE timber_shed_adult_access SET revoked_at='2026-10-21' WHERE user_id=3").run();
 assert.equal((await t.send(3,'latest')).status,403);
});
test('participation is current, affirmative, account-scoped and permits reading without health consent',async()=>{
 const t=setup();t.sqlite.prepare('DELETE FROM timber_shed_participation WHERE user_id=1').run();
 assert.equal((await t.send(1,'latest')).body.error,'community_agreement_required');
 const input={version:'shed-pilot-governance-2026-10-23-v1',rulesAccepted:true,privacyAcknowledged:true,healthConsent:false};
 for(const bad of [{...input,rulesAccepted:false},{...input,version:'old'},{...input,userId:2},{...input,healthConsent:'true'}])
  assert.equal((await t.send(1,'participation/consent','POST',bad)).status,400);
 assert.equal((await t.send(1,'participation/consent','POST',input)).status,200);
 assert.equal((await t.send(1,'latest')).status,200);
 assert.equal((await submit(t,1)).body.error,'explicit_health_consent_required');
 assert.equal((await t.send(1,'participation/consent','POST',{...input,healthConsent:true})).status,200);
 assert.equal((await t.send(1,'participation')).body.healthConsent,true);
 assert.equal((await t.send(2,'participation')).body.healthConsent,true);
 assert.equal((await t.send(1,'participation/consent','POST',input)).body.error,'withdraw_consent_using_leave_community');
});
test('stale agreement needs renewal and uncleared adult cannot manufacture consent',async()=>{
 const t=setup();t.sqlite.prepare("UPDATE timber_shed_participation SET privacy_version='old' WHERE user_id=1").run();
 assert.equal((await t.send(1,'latest')).body.error,'community_agreement_required');
 t.sqlite.prepare('DELETE FROM timber_shed_adult_access WHERE user_id=1').run();
 assert.equal((await t.send(1,'participation/consent','POST',{version:'shed-pilot-governance-2026-10-23-v1',rulesAccepted:true,privacyAcknowledged:true,healthConsent:true})).status,403);
});
test('leaving withdraws consent and removes derived screening and incoming report categories',async()=>{
 const t=setup();await profile(t,1,'Shed Walker');const item=await submit(t,1);
 t.sqlite.prepare("INSERT INTO timber_shed_forum_reports VALUES('fictional-report',?,?, 'self-harm-risk','open','2026-10-22')").run(item.body.id,2);
 assert.equal((await t.send(1,'leave','POST',{confirm:'leave-community'})).status,200);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_participation WHERE user_id=1').get().n,0);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_bouncer_screenings WHERE post_id=?').get(item.body.id).n,0);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_reports WHERE post_id=?').get(item.body.id).n,0);
 assert.equal((await t.send(1,'latest')).body.error,'community_agreement_required');
 assert.equal((await t.send(1,'export')).status,200);
});
test('own consent export excludes adult evidence references and reviewer identity; own erasure survives changed eligibility',async()=>{
 const t=setup();const data=(await t.send(1,'export')).body.forum;
 assert.equal(data.participation.length,1);assert.equal(data.adultAccess.length,1);
 assert(!JSON.stringify(data).includes('fictional-proof'));assert(!JSON.stringify(data).includes('verified_by'));
 t.sqlite.prepare("UPDATE users SET date_of_birth='2013-01-01' WHERE id=1").run();
 assert.equal((await t.send(1,'latest')).status,403);
 assert.equal((await t.send(1,'export')).status,200);
 assert.equal((await t.send(1,'leave','POST',{confirm:'leave-community'})).status,200);
});
test('retention is default-off and never reads DB without exact adoption',async()=>{
 const {runTimberShedRetention}=await import('../member-experience/timber-shed-retention.mjs');
 const t=setup();delete t.env.TIMBER_SHED_GOVERNANCE_APPROVED_VERSION;
 assert.deepEqual(await runTimberShedRetention(t.env),{enabled:false});assert.equal(t.calls.length,0);
});
test('retention clears expired text and sensitive signals, preserves appeal window and current content, and is idempotent',async()=>{
 const {runTimberShedRetention}=await import('../member-experience/timber-shed-retention.mjs');
 const t=setup();await profile(t,1,'Shed Walker');const a=await submit(t,1),b=await submit(t,1),c=await submit(t,1),d=await submit(t,1);
 t.sqlite.prepare("UPDATE timber_shed_forum_posts SET created_at='2026-10-01T00:00:00.000Z' WHERE id=?").run(a.body.id);
 t.sqlite.prepare("UPDATE timber_shed_forum_posts SET status='rejected',reviewed_by=3,reviewed_at='2026-09-01T00:00:00.000Z' WHERE id=?").run(b.body.id);
 await t.send(1,'appeal','POST',{postId:b.body.id,reason:'missed-context'});
 t.sqlite.prepare("UPDATE timber_shed_forum_posts SET status='approved',created_at='2025-01-01T00:00:00.000Z' WHERE id=?").run(c.body.id);
 const first=await runTimberShedRetention(t.env,new Date('2026-10-22T12:00:00Z'));assert.equal(first.expiredPosts,2);
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(a.body.id).status,'withdrawn');
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(b.body.id).status,'rejected');
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(d.body.id).status,'pending');
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_bouncer_screenings WHERE post_id=?').get(a.body.id).n,0);
 assert.equal((await runTimberShedRetention(t.env,new Date('2026-10-22T12:00:00Z'))).expiredPosts,0);
 await runTimberShedRetention(t.env,new Date('2027-01-01T12:00:00Z'));
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(b.body.id).status,'withdrawn');
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_appeals WHERE post_id=?').get(b.body.id).status,'withdrawn');
});
test('failed retention text update rolls back cleared report/screening data',async()=>{
 const {runTimberShedRetention}=await import('../member-experience/timber-shed-retention.mjs');
 const t=setup();await profile(t,1,'Shed Walker');const a=await submit(t,1);
 t.sqlite.prepare("UPDATE timber_shed_forum_posts SET created_at='2026-10-01T00:00:00.000Z' WHERE id=?").run(a.body.id);
 t.sqlite.exec("CREATE TRIGGER reject_retention BEFORE UPDATE OF body ON timber_shed_forum_posts BEGIN SELECT RAISE(ABORT,'fictional write failure'); END");
 await assert.rejects(runTimberShedRetention(t.env,new Date('2026-10-22T12:00:00Z')));
 assert.equal(t.sqlite.prepare('SELECT status FROM timber_shed_forum_posts WHERE id=?').get(a.body.id).status,'pending');
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_bouncer_screenings WHERE post_id=?').get(a.body.id).n,1);
});

test('failed or missing maintenance pauses participation while own export and departure remain available',async()=>{
 const t=setup();t.sqlite.prepare("UPDATE timber_shed_maintenance SET completed_at='2026-10-22T09:00:00.000Z'").run();
 assert.equal((await t.send(1,'latest')).body.error,'community_maintenance_unavailable');
 assert.equal((await t.send(1,'export')).status,200);
 assert.equal((await t.send(1,'leave','POST',{confirm:'leave-community'})).status,200);
});
test('pilot limit cannot be bypassed by adding more adult-clearance rows',async()=>{
 const t=setup();
 for(let id=10;id<18;id++){
  t.sqlite.prepare("INSERT INTO users VALUES(?,'1980-01-01')").run(id);
  t.sqlite.prepare('INSERT INTO timber_shed_adult_access VALUES(?,?,?,?,?,?,NULL)').run(id,'verified-adult-account','fictional-proof-'+id,3,'2026-10-01T00:00:00.000Z','2027-10-01T00:00:00.000Z');
 }
 assert.equal((await t.send(1,'latest')).body.error,'adult_access_review_required');
});
test('retention continues when community access is switched off and renews its heartbeat only on success',async()=>{
 const {runTimberShedRetention}=await import('../member-experience/timber-shed-retention.mjs');
 const t=setup();t.env.TIMBER_SHED_FORUM_ENABLED='false';
 const now=new Date('2026-10-22T13:00:00Z');
 assert.equal((await runTimberShedRetention(t.env,now)).enabled,true);
 assert.equal(t.sqlite.prepare('SELECT completed_at FROM timber_shed_maintenance').get().completed_at,now.toISOString());
 t.sqlite.exec("CREATE TRIGGER reject_heartbeat BEFORE UPDATE ON timber_shed_maintenance BEGIN SELECT RAISE(ABORT,'fictional heartbeat failure'); END");
 await assert.rejects(runTimberShedRetention(t.env,new Date('2026-10-22T14:00:00Z')));
 assert.equal(t.sqlite.prepare('SELECT completed_at FROM timber_shed_maintenance').get().completed_at,now.toISOString());
});

const routineVersion='shed-pilot-governance-2026-10-23-v2';
async function routineMode(t){
 t.env.TIMBER_SHED_ROUTINE_AUTOPUBLISH_ENABLED='true';t.env.TIMBER_SHED_GOVERNANCE_APPROVED_VERSION=routineVersion;
 for(const id of [1,2,3])assert.equal((await t.send(id,'participation/consent','POST',{version:routineVersion,rulesAccepted:true,privacyAcknowledged:true,healthConsent:true})).status,200);
}
const routineBody='I went for a walk today. It felt good to get outside.';
test('automatic routine lane requires exact new governance and fresh explicit member agreement',async()=>{
 const t=setup();t.env.TIMBER_SHED_ROUTINE_AUTOPUBLISH_ENABLED='true';
 assert.equal((await t.send(1,'latest')).body.error,'governance_not_approved');
 t.env.TIMBER_SHED_GOVERNANCE_APPROVED_VERSION=routineVersion;
 const p=(await t.send(1,'participation')).body;assert.equal(p.joined,false);assert.equal(p.healthConsent,false);assert.equal(p.routineAutoPublish,true);assert.equal(p.policy.version,routineVersion);
 assert(p.policy.rules.some(s=>s.includes('automatically')));
 assert.equal((await t.send(1,'latest')).body.error,'community_agreement_required');
 assert.equal((await t.send(1,'participation/consent','POST',{version:'shed-pilot-governance-2026-10-23-v1',rulesAccepted:true,privacyAcknowledged:true,healthConsent:true})).status,400);
});
test('recognised routine topic publishes atomically with explicit system provenance and own notice',async()=>{
 const t=setup();await routineMode(t);await profile(t,1,'Weekend Walker');await profile(t,2,'Shed Regular');
 const r=await submit(t,1,'main-shed',routineBody,'Weekend plans');assert.equal(r.status,201);assert.equal(r.body.status,'approved');assert.equal(r.body.publication,'automated-routine');
 assert.equal((await t.send(2,'latest')).body.posts.length,1);
 const row=t.sqlite.prepare('SELECT reviewed_by,reviewed_at FROM timber_shed_forum_posts WHERE id=?').get(r.body.id);assert.equal(row.reviewed_by,null);assert(row.reviewed_at);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_auto_publications').get().n,1);
 assert.equal(t.sqlite.prepare("SELECT count(*) n FROM timber_shed_forum_audit WHERE action='approve' AND moderator_id IS NULL").get().n,1);
 assert.equal((await t.send(1,'notifications')).body.unreadCount,1);
 assert.equal((await t.send(1,'export')).body.forum.publications.length,1);assert.equal((await t.send(2,'export')).body.forum.publications.length,0);
});
test('unrecognised routine wording and sensitive topics stay pending; no inferred safety from missing keywords',async()=>{
 const t=setup();await routineMode(t);await profile(t,1,'Weekend Walker');await profile(t,2,'Shed Regular');
 for(const [title,body] of [['Weekend plans','I have an unusual situation and want to discuss it.'],['Weekend plans','My anxiety has been difficult this week.'],['Weekend plans','I have spare Mounjaro pens to sell. Message me to buy them.']]){
  const r=await submit(t,1,'main-shed',body,title);assert.equal(r.status,202);assert.equal(r.body.status,'pending');
 }
 assert.equal((await t.send(2,'latest')).body.posts.length,0);assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_auto_publications').get().n,0);
});
test('automatic routine replies require visible approved parent and notify only its owner after publication',async()=>{
 const t=setup();await routineMode(t);await profile(t,1,'Weekend Walker');await profile(t,2,'Shed Regular');
 const root=await submit(t,1,'main-shed',routineBody,'Weekend plans');
 const reply=await t.send(2,'submit','POST',{roomId:'main-shed',parentId:root.body.id,body:'Sounds like a good plan. Hope you have a lovely weekend.'});assert.equal(reply.status,201);
 assert.equal((await t.send(1,'threads','GET',undefined,'?room=main-shed&threadId='+root.body.id)).body.posts.length,2);
 assert((await t.send(1,'notifications')).body.notifications.some(n=>n.kind==='reply'));
 await t.send(1,'withdraw','POST',{postId:root.body.id});
 assert.equal((await t.send(2,'submit','POST',{roomId:'main-shed',parentId:root.body.id,body:'Thanks for sharing.'})).status,404);
});
test('system provenance write failure rolls back automatic post, screening, audit and notices',async()=>{
 const t=setup();await routineMode(t);await profile(t,1,'Weekend Walker');
 t.sqlite.exec("CREATE TRIGGER fail_auto BEFORE INSERT ON timber_shed_auto_publications BEGIN SELECT RAISE(ABORT,'fictional failure'); END");
 assert.equal((await submit(t,1,'main-shed',routineBody,'Weekend plans')).status,503);
 for(const table of ['timber_shed_forum_posts','timber_shed_bouncer_screenings','timber_shed_forum_audit','timber_shed_auto_publications','timber_shed_forum_notifications'])assert.equal(t.sqlite.prepare('SELECT count(*) n FROM '+table).get().n,0);
});
test('automatic notification write failure cannot leave a published post',async()=>{
 const t=setup();await routineMode(t);await profile(t,1,'Weekend Walker');
 t.sqlite.exec("CREATE TRIGGER fail_auto_notice BEFORE INSERT ON timber_shed_forum_notifications BEGIN SELECT RAISE(ABORT,'fictional failure'); END");
 assert.equal((await submit(t,1,'main-shed',routineBody,'Weekend plans')).status,503);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_posts').get().n,0);
});
test('reports and removal of an automatic post still require humans and permit independent appeal',async()=>{
 const t=setup();await routineMode(t);await profile(t,1,'Weekend Walker');await profile(t,2,'Shed Regular');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators VALUES(3,1,?)').run('now');
 const r=await submit(t,1,'main-shed',routineBody,'Weekend plans');
 assert.equal((await t.send(2,'report','POST',{postId:r.body.id,reason:'other'})).status,200);
 assert.equal((await t.send(2,'moderate','POST',{postId:r.body.id,action:'remove'})).status,403);
 assert.equal((await t.send(3,'moderate','POST',{postId:r.body.id,action:'remove'})).status,200);
 assert.equal((await t.send(2,'latest')).body.posts.length,0);
 const appeal=await t.send(1,'appeal','POST',{postId:r.body.id,reason:'missed-context'});assert.equal(appeal.status,202);
 assert.equal((await t.send(3,'appeal/review','POST',{appealId:appeal.body.id,outcome:'reconsider'})).status,403);
});
test('turning off automatic lane preserves the original human-review model',async()=>{
 const t=setup();await profile(t,1,'Weekend Walker');
 const r=await submit(t,1,'main-shed',routineBody,'Weekend plans');assert.equal(r.status,202);assert.equal(r.body.status,'pending');
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_auto_publications').get().n,0);
});

test('automatic-lane kill switch keeps v2 consent, maintenance and manual participation available',async()=>{
 const t=setup();await routineMode(t);await profile(t,1,'Weekend Walker');
 t.env.TIMBER_SHED_ROUTINE_AUTOPUBLISH_ENABLED='false';
 assert.equal((await t.send(1,'participation')).body.joined,true);
 assert.equal((await t.send(1,'participation')).body.routineAutoPublish,false);
 assert.equal((await submit(t,1,'main-shed',routineBody,'Weekend plans')).body.status,'pending');
 const {runTimberShedRetention}=await import('../member-experience/timber-shed-retention.mjs');
 assert.equal((await runTimberShedRetention(t.env,new Date('2026-10-22T12:00:00Z'))).enabled,true);
});

test('a silently ignored automatic approval rolls back rather than fabricating a publication receipt',async()=>{
 const t=setup();await routineMode(t);await profile(t,1,'Weekend Walker');
 t.sqlite.exec("CREATE TRIGGER ignore_auto BEFORE UPDATE OF status ON timber_shed_forum_posts WHEN NEW.status='approved' BEGIN SELECT RAISE(IGNORE); END");
 assert.equal((await submit(t,1,'main-shed',routineBody,'Weekend plans')).status,503);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_posts').get().n,0);
 assert.equal(t.sqlite.prepare('SELECT count(*) n FROM timber_shed_auto_publications').get().n,0);
});
