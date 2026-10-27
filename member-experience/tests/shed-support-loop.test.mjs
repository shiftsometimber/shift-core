import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fixture} from '../../health-passport/fixture.mjs';
import {shedSupportRoutes,shedSupportSchema,shedThreshold,shedDatabase,starterThreads,publicTip,attachShedEvidence} from '../shed-support-loop.mjs';
import {SHED_MEMBER_SUPPORT_POLICY as SHED_POLICY} from '../timber-shed-governance.mjs';
function setup(t){
 const f=fixture({seed:false});t.after(()=>f.close());
 f.db.exec(`ALTER TABLE users ADD COLUMN date_of_birth TEXT;CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER);CREATE TABLE member_status(user_id INTEGER PRIMARY KEY,source TEXT);CREATE TABLE hq_users(id INTEGER PRIMARY KEY,email TEXT);`);
 f.db.prepare('INSERT INTO users(id,email,first_name,date_of_birth) VALUES(?,?,?,?)').run(3,'my-timber-v6-moderator@example.invalid','Fictional moderator','1990-01-01');
 for(const [id,name]of [[1,'dan'],[2,'lee'],[3,'moderator']]){
  f.db.prepare('UPDATE users SET email=?,date_of_birth=? WHERE id=?').run('my-timber-v6-'+name+'@example.invalid','1990-01-01',id);
  f.db.prepare('INSERT INTO consents(user_id,consent_type,granted) VALUES(?,?,1)').run(id,'my_shift_health_tracking');
  f.db.prepare('INSERT INTO member_status VALUES(?,?)').run(id,'my_timber_release_test_v6');f.db.prepare('INSERT INTO user_auth VALUES(?,1)').run(id);
 }
 f.db.prepare('INSERT INTO user_sessions(id,user_id,token_hash,expires_at) VALUES(?,?,?,?)').run(3,3,createHash('sha256').update('test-only-member-3').digest('hex'),'2099-01-01T00:00:00Z');
 const schema=fs.readFileSync(new URL('../timber-shed-forums.sql',import.meta.url),'utf8')+fs.readFileSync(new URL('../timber-shed-private.sql',import.meta.url),'utf8')+shedSupportSchema;
 f.db.exec(schema.replace(/\btimber_shed_/g,'timber_shed_v6test_'));
 f.db.prepare('INSERT INTO timber_shed_v6test_forum_moderators VALUES(?,1,?)').run(3,new Date().toISOString());
 const offer={id:'own-helpful-offer',title:'A useful dinner',practical:{name:'Eggs on toast',key:'eggs',memoryId:'own-memory'},reviews:[{operationId:'own-helpful-feedback',outcome:'helped',at:new Date().toISOString()}]};
 f.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run(JSON.stringify({weight:123,medicine:'PRIVATE MEDICINE',lifeBack:{progress:{goal:'PRIVATE GOAL',memberSupport:{memories:[{id:'own-memory',choice:'late',text:'PRIVATE OWN WORDS'}]},shiftHistory:[offer]}}}));
 const req=(input,uid=1,suffix='')=>new Request('https://shiftsometimber.co.uk/v1/life-back/shed'+suffix,{method:input?'POST':'GET',headers:{Origin:'https://shiftsometimber.co.uk',Cookie:'sst_session=test-only-member-'+uid,'Content-Type':'application/json'},...(input?{body:JSON.stringify({...input,...(!suffix?{expectedAccount:uid}:{})})}:{})});
 const call=async(input,uid=1,suffix='')=>{const r=await shedSupportRoutes(req(input,uid,suffix),f.env);return {status:r.status,body:await r.json()};};
 const join=uid=>call({action:'join',version:SHED_POLICY.version,displayName:'FictionalPeer'+uid,rulesAccepted:true,privacyAcknowledged:true,healthConsent:true},uid);
 return {...f,call,req,join};
}
test('S1/S3/S8: cold start is SHIFT-labelled, matches privately and remains signed-in only',async t=>{
 const f=setup(t);assert.equal((await f.join(1)).status,201);
 const own=await f.call();assert.equal(own.status,200);assert.equal(own.body.starter.source,'from SHIFT');assert.equal(own.body.starter.title,starterThreads.late.title);
 assert.doesNotMatch(JSON.stringify(own.body),/PRIVATE OWN WORDS|PRIVATE MEDICINE|PRIVATE GOAL/);
 const budget=await f.call(undefined,1,'?tab=ask&topic=budget');assert.equal(budget.body.starter.title,starterThreads.budget.title);
 const move=await f.call(undefined,1,'?tab=fit');assert.equal(move.body.starter.title,starterThreads.movement.title);
 const care=await f.call(undefined,1,'?tab=ask&topic=care');assert.equal(care.body.careOnly,true);assert.deepEqual(care.body.posts,[]);assert.equal(care.body.starter,null);
 const anonymous=await shedSupportRoutes(new Request('https://shiftsometimber.co.uk/v1/life-back/shed'),f.env);assert.equal(anonymous.status,401);
 const wrong=await shedSupportRoutes(new Request('https://shiftsometimber.co.uk/v1/life-back/shed',{method:'POST',headers:{Origin:'https://shiftsometimber.co.uk',Cookie:'sst_session=test-only-member-1','Content-Type':'application/json'},body:JSON.stringify({action:'peer',expectedAccount:2,visible:true,topic:'general'})}),f.env);assert.equal(wrong.status,409);
});
test('S4/S6: exact deliberate preview, no attached health record, approval, report and block',async t=>{
 const f=setup(t);for(const id of [1,2,3])assert.equal((await f.join(id)).status,201);
 const title='An earlier dinner shortcut',body='I put the everyday dinner ingredients together before work. That took one decision out of a late finish.';
 const preview=await f.call({action:'preview',offerId:'own-helpful-offer',category:'meal',title,body});assert.equal(preview.status,200);assert.deepEqual({title:preview.body.preview.title,body:preview.body.preview.body},{title,body});
 const id=preview.body.preview.id;assert.equal((await f.call({action:'publish',draftId:id,confirmed:false})).status,400);
 assert.equal((await f.call({action:'publish',draftId:id,confirmed:true})).status,201);
 assert.equal((await f.call({action:'publish',draftId:id,confirmed:true})).body.duplicate,true);
 let row=f.db.prepare('SELECT * FROM timber_shed_v6test_forum_posts WHERE id=?').get(id);assert.equal(row.title,title);assert.equal(row.body,body);assert.equal(row.status,'pending');assert.doesNotMatch(row.body,/PRIVATE/);
 assert.equal((await f.call(null,2)).body.posts.length,0);assert.equal((await f.call({action:'review-tip',postId:id},3)).status,409);
 assert.equal((await f.call({postId:id,action:'approve'},3,'/forum/moderate')).status,200);
 assert.equal((await f.call({action:'review-tip',postId:id},3)).status,200);
 // Lee's selected context is general. Read the actual thread through its room.
 const thread=await f.call(null,2,'/forum/threads?room=grub-fit&threadId='+id);assert.equal(thread.status,200);assert.equal(thread.body.posts[0].body,body);
 assert.equal((await f.call({postId:id,reason:'other'},2,'/forum/report')).status,200);
 assert.equal((await f.call(null,3,'/forum/moderation')).body.reports.length,1);
 assert.equal((await f.call({postId:id},2,'/forum/block')).status,200);assert.equal((await f.call(null,2,'/forum/threads?room=grub-fit&threadId='+id)).body.posts.length,0);
 assert.equal((await f.call({postId:id},2,'/forum/withdraw')).status,404);
 assert.equal((await f.call({postId:id},1,'/forum/withdraw')).status,200);assert.equal(f.db.prepare('SELECT body FROM timber_shed_v6test_forum_posts WHERE id=?').get(id).body,'[withdrawn by member]');
});
test('S2/S5: threshold uses distinct, consented, current real marks; tests, staff and self marks do not count',async t=>{
 const f=setup(t);for(const id of [1,2,3])await f.join(id);
 f.db.prepare('UPDATE member_state SET preferences=? WHERE user_id=2').run(JSON.stringify({lifeBack:{progress:{memberSupport:{memories:[{choice:'late'}]}}}}));
 const draft=(await f.call({action:'preview',offerId:'own-helpful-offer',category:'routine',title:'An everyday planning shortcut',body:'Put the ingredients together before work and keep a familiar fallback for the late finish.'})).body.preview;
 await f.call({action:'publish',draftId:draft.id,confirmed:true});await f.call({postId:draft.id,action:'approve'},3,'/forum/moderate');await f.call({action:'review-tip',postId:draft.id},3);
 assert.equal((await f.call({action:'tip-feedback',postId:draft.id,outcome:'helped',consent:true},2)).status,200);
 let author=(await f.call()).body;assert.equal(author.posts[0]?.label,undefined);assert.equal(author.mine[0].helped_another,0);
 // All identities below are isolated SQLite fixtures, never production members.
 for(let id=10;id<15;id++){
  const feedback='fixture-real-mark-'+id;
  f.db.prepare('INSERT INTO users(id,email) VALUES(?,?)').run(id,'fixture-'+id+'@example.test');f.db.prepare('INSERT INTO user_auth VALUES(?,1)').run(id);f.db.prepare('INSERT INTO member_status VALUES(?,?)').run(id,'member');f.db.prepare('INSERT INTO member_state(user_id,preferences) VALUES(?,?)').run(id,'{}');
  f.db.prepare('INSERT INTO timber_shed_v6test_support_trials VALUES(?,?,?,?,?,?)').run(draft.id,id,feedback,'helped',null,new Date().toISOString());f.db.prepare('INSERT INTO timber_shed_v6test_support_marks VALUES(?,?,?,?)').run(draft.id,id,feedback,new Date().toISOString());
  const visible=(await f.call(undefined,2)).body.posts[0];assert.equal(visible?.label,id===14?'From the Shed':undefined);assert.equal(visible?.helpedCount,id===14?5:undefined);
 }
 author=(await f.call()).body;assert.equal(author.mine[0].helped_another,1);
 const prepared={nextShift:{practical:{key:'eggs',shedLabel:'From the Shed',shedHelpedCount:100},reviews:[]},memberSupport:{memories:[{choice:'late'}]}};
 await attachShedEvidence(f.env.DB,{},prepared,2,f.env);assert.equal(prepared.nextShift.practical.shedHelpedCount,5);
 f.db.prepare("UPDATE timber_shed_v6test_support_trials SET outcome='not-helped' WHERE user_id=10").run();assert.equal((await f.call(undefined,2)).body.posts[0].label,undefined);
 await attachShedEvidence(f.env.DB,{},prepared,2,f.env);assert.equal(prepared.nextShift.practical.shedLabel,undefined);assert.equal(prepared.nextShift.practical.shedHelpedCount,undefined);
 assert.equal(shedThreshold({}),5);assert.equal(shedThreshold({TIMBER_SHED_HELPED_MINIMUM:'1'}),5);
 assert.equal(publicTip({status:'approved',tip_reviewed_at:'now',real_marks:10,title:'Change your dose',body:'A dose tip'},5).label,undefined);
});

test('a read-only community member can join without disclosure consent; posting still needs it',async t=>{
 const f=setup(t);const joined=await f.call({action:'join',version:SHED_POLICY.version,displayName:'ReadOnlyPeer',rulesAccepted:true,privacyAcknowledged:true,healthConsent:false});assert.equal(joined.status,201);
 const overview=(await f.call()).body;assert.equal(overview.joined,true);assert.equal(overview.healthConsent,false);
 assert.equal((await f.call({action:'preview',offerId:'own-helpful-offer',category:'meal',title:'An ordinary meal shortcut',body:'These deliberately typed words stay private.'})).status,403);
 assert.equal((await f.call({action:'peer',visible:true,topic:'after-treatment'})).status,403);
});
test('turning optional tracking off stops matching from the private record',async t=>{
 const f=setup(t);await f.join(1);assert.equal((await f.call()).body.starter.title,starterThreads.late.title);
 f.db.prepare('INSERT INTO consents(user_id,consent_type,granted) VALUES(?,?,0)').run(1,'my_shift_health_tracking');
 const overview=(await f.call()).body;assert.equal(overview.starter.title,starterThreads.general.title);assert.deepEqual(overview.helpful,[]);assert.doesNotMatch(JSON.stringify(overview),/PRIVATE OWN WORDS|PRIVATE MEDICINE/);
});
