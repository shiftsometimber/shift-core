import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createTimberShedForumRoutes} from '../member-experience/timber-shed-forum-routes.mjs';
const origin='https://shift.test';
const path='/v1/timber-shed/forum/';
function setup(){
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
 const route=createTimberShedForumRoutes(auth,()=>new Date('2026-10-22T12:00:00Z'));
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
