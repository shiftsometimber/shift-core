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
 const env={TIMBER_SHED_FORUM_ENABLED:'true',TIMBER_SHED_PRIVATE_ENABLED:'true',MEMBER_EXPERIENCE_V1_ENABLED:'true',TIMBER_SHED_FORUM_PILOT_APPROVED:'true',DB:db};
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
test('mock model adds independent risk signal; high-risk post cannot be approved',async()=>{
 let calls=0;
 const t=setup(async()=>{calls++;return{ok:true,policyVersion:'bouncer-omni-2026-10-22-v1',model:'omni-moderation-latest',severity:'high',priority:1,categories:['self-harm'],flagged:true}});
 t.env.TIMBER_SHED_AI_MODERATION_ENABLED='true';
 t.env.TIMBER_SHED_AI_PROVIDER_APPROVED='true';
 await profile(t,1,'Shed Walker');
 t.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const result=await submit(t,1,'main-shed','I took a nice walk today and felt good.');
 assert.equal(result.status,202);assert.equal(calls,1);
 const pending=(await t.send(3,'moderation')).body.pending[0];
 assert.equal(pending.severity,'high');
 assert(pending.categories.includes('model:self-harm'));
 assert.equal((await t.send(3,'moderate','POST',{postId:result.body.id,action:'approve'})).status,409);
 assert.equal((await t.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,0);
});
test('mock clean model still requires human approval; model failure saves nothing',async()=>{
 const clean=setup(async()=>({ok:true,policyVersion:'bouncer-omni-2026-10-22-v1',model:'omni-moderation-latest',severity:'routine',priority:3,categories:[],flagged:false}));
 clean.env.TIMBER_SHED_AI_MODERATION_ENABLED='true';clean.env.TIMBER_SHED_AI_PROVIDER_APPROVED='true';
 await profile(clean,1,'Shed Walker');
 clean.sqlite.prepare('INSERT INTO timber_shed_forum_moderators(user_id,active,created_at) VALUES(?,?,?)').run(3,1,'now');
 const result=await submit(clean,1);
 assert.equal(result.status,202);
 assert.equal((await clean.send(2,'threads','GET',undefined,'?room=main-shed')).body.posts.length,0);
 assert.equal((await clean.send(3,'moderate','POST',{postId:result.body.id,action:'approve'})).status,200);
 const failed=setup(async()=>({ok:false,error:'model_unavailable'}));
 failed.env.TIMBER_SHED_AI_MODERATION_ENABLED='true';failed.env.TIMBER_SHED_AI_PROVIDER_APPROVED='true';
 await profile(failed,1,'Shed Walker');
 const error=await submit(failed,1);
 assert.equal(error.status,503);
 assert.equal(failed.sqlite.prepare('SELECT count(*) n FROM timber_shed_forum_posts').get().n,0);
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
