import {routinePublicationDecision} from './timber-shed-routine-publication.mjs';
import {governanceApproved,forumParticipation,validParticipation,saveForumParticipation,routinePublicationEnabled,forumPolicy} from './timber-shed-governance.mjs';
import {authenticateMember} from '../member-state-fast-v1.js';
import {timberShedForumRooms} from './timber-shed-forums.mjs';
import {screenForumText,bouncerSubmissionNotice,BOUNCER_VERSION} from './timber-shed-community-bouncer.mjs';
import {AI_MODERATION_POLICY} from './timber-shed-ai-moderation.mjs';
import {forumAppealAction,listOpenAppeals,validateForumAppeal} from './timber-shed-forum-appeals.mjs';
import {visibleAuthorSQL,visiblePostSQL,validateProtectionInput,activeForumRestriction,listForumRestrictions,forumProtectionAction} from './timber-shed-forum-protection.mjs';
import {exportOwnForum,leaveForum} from './timber-shed-forum-privacy.mjs';
import {notificationWrites} from './timber-shed-forum-notifications.mjs';

// Separate, disabled-by-default forum backend. No My Timber health/profile reads.
const HEADERS={'Cache-Control':'private, no-store, max-age=0','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const json=(value,status=200)=>Response.json(value,{status,headers:HEADERS});
const ROOMS=new Set(timberShedForumRooms.map(room=>room.id));
const ACTIONS=new Set(['approve','reject','remove','dismiss']);
const REASONS=new Set(['privacy','unsafe-health-advice','harassment','self-harm-risk','spam','other']);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const only=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>keys.includes(k));
const clean=(s,min,max)=>typeof s==='string'&&s===s.trim()&&s.length>=min&&s.length<=max&&!/[\u0000-\u001f\u007f]/.test(s);
const privateInfo=s=>/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(s)||/https?:\/\/|www\./i.test(s)||/(?:\+44\s?|0)7\d{3}[\s-]?\d{6}\b/.test(s);
function adult(dob,now=new Date()){
 if(typeof dob!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(dob))return false;
 const date=new Date(dob+'T00:00:00Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==dob)return false;
 const cut=new Date(Date.UTC(now.getUTCFullYear()-18,now.getUTCMonth(),now.getUTCDate()));
 return date<=cut;
}
export function validateForumInput(kind,input){
 if(kind==='leave')return only(input,['confirm'])&&input.confirm==='leave-community'?null:'confirmation_required';
 if(['block','unblock','restrict','restriction/lift','restriction/appeal','restriction/review'].includes(kind))return validateProtectionInput(kind,input);
 if(kind==='appeal'||kind==='appeal/review')return validateForumAppeal(kind,input);
 if(kind==='profile'){
  if(!only(input,['displayName'])||!own(input,'displayName'))return 'invalid_profile';
  const name=input.displayName;
  if(!clean(name,3,24)||!/^[A-Za-z][A-Za-z0-9 _-]*$/.test(name)||privateInfo(name))return 'invalid_display_name';
  return null;
 }
 if(kind==='submit'){
  if(!only(input,['roomId','parentId','title','body'])||!own(input,'roomId')||!own(input,'body')||!ROOMS.has(input.roomId))return 'invalid_submission';
  if(!clean(input.body,12,1000)||privateInfo(input.body))return 'unsafe_or_invalid_content';
  const reply=own(input,'parentId');
  if(reply&&(!clean(input.parentId,10,80)||own(input,'title')))return 'invalid_reply';
  if(!reply&&(!clean(input.title,8,100)||privateInfo(input.title)))return 'invalid_title';
  return null;
 }
 if(kind==='notificationRead'){
  if(!only(input,['notificationId'])||!clean(input.notificationId,10,80))return 'invalid_notification';
  return null;
 }
 if(kind==='withdraw'){
  if(!only(input,['postId'])||!clean(input.postId,10,80))return 'invalid_withdrawal';
  return null;
 }
 if(kind==='report'){
  if(!only(input,['postId','reason'])||!clean(input.postId,10,80)||!REASONS.has(input.reason))return 'invalid_report';
  return null;
 }
 if(kind==='moderate'){
  if(!only(input,['postId','action','reportId'])||!clean(input.postId,10,80)||!ACTIONS.has(input.action)||(input.action==='dismiss'&&!clean(input.reportId,10,80))||(input.action!=='dismiss'&&own(input,'reportId')))return 'invalid_moderation';
  return null;
 }
 return 'invalid_action';
}
async function parse(request){
 if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))return {error:'json_required',status:415};
 const raw=await request.text();if(raw.length>1600)return {error:'too_large',status:413};
 try{return {value:JSON.parse(raw)}}catch{return {error:'invalid_json',status:400}}
}
const isModerator=async(db,id)=>!!(await db.prepare("SELECT user_id FROM timber_shed_forum_moderators WHERE user_id=? AND active=1").bind(id).first());
export function createTimberShedForumRoutes(authenticate=authenticateMember,now=()=>new Date()){
 return async function forumRoutes(request,env){
  const path=new URL(request.url).pathname;
  if(!path.startsWith('/v1/timber-shed/forum/'))return null;
  if(env.TIMBER_SHED_FORUM_ENABLED!=='true'||env.TIMBER_SHED_PRIVATE_ENABLED!=='true'||env.MEMBER_EXPERIENCE_V1_ENABLED!=='true'||env.TIMBER_SHED_FORUM_PILOT_APPROVED!=='true')return json({error:'not_available'},404);
  if(env.TIMBER_SHED_RETENTION_ENABLED!=='true')return json({error:'community_maintenance_not_enabled'},404);
  if(!governanceApproved(env))return json({error:'governance_not_approved'},404);
  const route=path.slice('/v1/timber-shed/forum/'.length);
  if(!new Set(['participation','participation/consent','rooms','threads','room-topics','latest','mine','notifications','notifications/read','moderation','profile','profile/save','submit','report','moderate','withdraw','appeals','appeal','appeal/review','access','blocks','block','unblock','restrict','restriction/lift','restriction/appeal','restriction/review','export','leave']).has(route))return json({error:'not_found'},404);
  const method=route==='participation'||route==='export'||route==='access'||route==='blocks'||route==='appeals'||route==='rooms'||route==='threads'||route==='room-topics'||route==='latest'||route==='mine'||route==='notifications'||route==='moderation'||route==='profile'?'GET':'POST';
  if(request.method!==method)return json({error:'method_not_allowed'},405);
  if(method==='POST'&&request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'same_origin_required'},403);
  const auth=await authenticate(request,env);if(auth.response)return auth.response;
  if(!Number.isSafeInteger(auth.userId)||auth.userId<=0)return json({error:'authentication_required'},401);
  const db=env.DB,uid=auth.userId;
  try{
   // Eligibility is checked server-side; DOB and email verification never enter responses.
   const eligibility=await db.prepare('SELECT a.email_verified,u.date_of_birth FROM users u JOIN user_auth a ON a.user_id=u.id WHERE u.id=?').bind(uid).first();
   if(!['export','leave'].includes(route)&&(!eligibility||Number(eligibility.email_verified)!==1||!adult(eligibility.date_of_birth,now())))return json({error:'adult_verified_members_only'},403);
   const timestampNow=now().toISOString();
   const participation=await forumParticipation(db,uid,timestampNow,env);
   if(route==='participation')return json(participation);
   if(route==='participation/consent'){
    const parsed=await parse(request);if(parsed.error)return json({error:parsed.error},parsed.status);
    if(!validParticipation(parsed.value,env))return json({error:'explicit_current_agreement_required'},400);
    if(!participation.adultAccess)return json({error:'adult_access_review_required'},403);
    if(participation.disclosureConsentRecorded&&!parsed.value.healthConsent)return json({error:'withdraw_consent_using_leave_community'},409);
    await saveForumParticipation(db,uid,parsed.value,timestampNow,env);
    return json({ok:true,participation:await forumParticipation(db,uid,timestampNow,env)});
   }
   const ownOnly=new Set(['export','leave','mine','withdraw','appeals','appeal','access','restriction/appeal']);
   if(!ownOnly.has(route)&&!participation.adultAccess)return json({error:'adult_access_review_required'},403);
   if(!ownOnly.has(route)&&!participation.maintenanceReady)return json({error:'community_maintenance_unavailable'},503);
   if(!ownOnly.has(route)&&!participation.joined)return json({error:'community_agreement_required'},403);
   if(route==='submit'&&!participation.healthConsent)return json({error:'explicit_health_consent_required'},403);
   const restriction=await activeForumRestriction(db,uid,now().toISOString());
   if(restriction&&!['access','appeals','appeal','mine','withdraw','restriction/appeal','export','leave'].includes(route))return json({error:'community_access_restricted'},403);
   if(route==='export')return json({forum:await exportOwnForum(db,uid)});
   if(route==='access'||route==='blocks')return await forumProtectionAction({route,db,uid,timestamp:now().toISOString(),json});
   if(route==='appeals')return await forumAppealAction({route,db,uid,json});
   if(route==='rooms')return json({rooms:timberShedForumRooms.map(({id,name,kicker,description})=>({id,name,kicker,description}))});
   if(route==='threads'){
    const room=new URL(request.url).searchParams.get('room');
    if(!ROOMS.has(room))return json({error:'invalid_room'},400);
    const threadId=new URL(request.url).searchParams.get('threadId');
    if(threadId!==null&&!clean(threadId,10,80))return json({error:'invalid_thread'},400);
    if(threadId){
     const posts=await db.prepare(`SELECT p.id,p.room_id,p.parent_id,p.title,p.body,p.created_at,pr.display_name FROM timber_shed_forum_posts p JOIN timber_shed_forum_profiles pr ON pr.user_id=p.user_id WHERE ${visiblePostSQL('p',uid)} AND p.room_id=? AND p.status='approved' AND (p.id=? AND p.parent_id IS NULL OR p.parent_id=? AND EXISTS(SELECT 1 FROM timber_shed_forum_posts parent WHERE parent.id=p.parent_id AND parent.status='approved')) ORDER BY p.created_at ASC LIMIT 100`).bind(room,threadId,threadId).all();
     return json({room,threadId,posts:posts.results||[]});
    }
    const posts=await db.prepare(`SELECT p.id,p.room_id,p.parent_id,p.title,p.body,p.created_at,pr.display_name FROM timber_shed_forum_posts p JOIN timber_shed_forum_profiles pr ON pr.user_id=p.user_id WHERE ${visiblePostSQL('p',uid)} AND p.room_id=? AND p.status='approved' AND (p.parent_id IS NULL OR EXISTS(SELECT 1 FROM timber_shed_forum_posts parent WHERE parent.id=p.parent_id AND parent.status='approved')) ORDER BY p.created_at DESC LIMIT 100`).bind(room).all();
    return json({room,posts:posts.results||[]});
   }
   if(route==='room-topics'){
    const params=new URL(request.url).searchParams,room=params.get('room'),raw=params.get('offset')||'0';
    if(!ROOMS.has(room)||!/^(0|[1-9][0-9]{0,3})$/.test(raw)||Number(raw)>2000)return json({error:'invalid_room_page'},400);
    const offset=Number(raw);
    const rows=await db.prepare(`SELECT p.id,p.room_id,p.title,substr(p.body,1,220) AS excerpt,p.created_at,p.reviewed_at,pr.display_name,(SELECT COUNT(*) FROM timber_shed_forum_posts r WHERE r.parent_id=p.id AND r.status='approved' AND ${visibleAuthorSQL('r',uid)}) AS reply_count FROM timber_shed_forum_posts p JOIN timber_shed_forum_profiles pr ON pr.user_id=p.user_id WHERE ${visiblePostSQL('p',uid)} AND p.room_id=? AND p.status='approved' AND p.parent_id IS NULL ORDER BY p.reviewed_at DESC,p.id DESC LIMIT 21 OFFSET ?`).bind(room,offset).all();
    return json({room,posts:(rows.results||[]).slice(0,20),hasMore:(rows.results||[]).length>20,nextOffset:offset+20});
   }
   if(route==='latest'){
    const rows=await db.prepare(`SELECT p.id,p.room_id,p.title,substr(p.body,1,220) AS excerpt,p.created_at,p.reviewed_at,pr.display_name,(SELECT COUNT(*) FROM timber_shed_forum_posts r WHERE r.parent_id=p.id AND r.status='approved' AND ${visibleAuthorSQL('r',uid)}) AS reply_count FROM timber_shed_forum_posts p JOIN timber_shed_forum_profiles pr ON pr.user_id=p.user_id WHERE ${visiblePostSQL('p',uid)} AND p.status='approved' AND p.parent_id IS NULL ORDER BY p.reviewed_at DESC,p.id DESC LIMIT 30`).all();
    return json({posts:rows.results||[]});
   }
   if(route==='notifications'){
    const raw=new URL(request.url).searchParams.get('offset')||'0';
    if(!/^(0|[1-9][0-9]{0,3})$/.test(raw)||Number(raw)>2000)return json({error:'invalid_notification_page'},400);
    const offset=Number(raw);
    const entries=await db.prepare(`SELECT n.id,n.kind,n.room_id,n.thread_id,n.created_at,n.read_at FROM timber_shed_forum_notifications n WHERE n.recipient_id=? AND EXISTS(SELECT 1 FROM timber_shed_forum_posts p WHERE p.id=n.post_id AND ${visiblePostSQL('p',uid)}) ORDER BY n.created_at DESC,n.id DESC LIMIT 21 OFFSET ?`).bind(uid,offset).all();
    const count=await db.prepare(`SELECT COUNT(*) AS n FROM timber_shed_forum_notifications n WHERE n.recipient_id=? AND n.read_at IS NULL AND EXISTS(SELECT 1 FROM timber_shed_forum_posts p WHERE p.id=n.post_id AND ${visiblePostSQL('p',uid)})`).bind(uid).first();
    return json({notifications:(entries.results||[]).slice(0,20),unreadCount:Number(count?.n||0),hasMore:(entries.results||[]).length>20,nextOffset:offset+20});
   }
   if(route==='mine'){
    const rows=await db.prepare("SELECT id,room_id,parent_id,title,body,status,created_at,reviewed_at FROM timber_shed_forum_posts WHERE user_id=? ORDER BY created_at DESC LIMIT 100").bind(uid).all();
    return json({posts:rows.results||[]});
   }
   if(route==='profile'){
    const profile=await db.prepare('SELECT display_name FROM timber_shed_forum_profiles WHERE user_id=?').bind(uid).first();
    return json({profile:profile?{displayName:profile.display_name}:null});
   }
   if(route==='moderation'){
    if(!await isModerator(db,uid))return json({error:'moderator_only'},403);
    const queue=await db.prepare("SELECT p.id,p.room_id,p.parent_id,p.title,p.body,p.status,p.created_at,pr.display_name,b.severity,b.priority,b.policy_version,b.categories_json FROM timber_shed_forum_posts p JOIN timber_shed_forum_profiles pr ON pr.user_id=p.user_id LEFT JOIN timber_shed_bouncer_screenings b ON b.post_id=p.id WHERE p.status='pending' ORDER BY COALESCE(b.priority,0) ASC,p.created_at ASC LIMIT 100").all();
    const reports=await db.prepare("SELECT r.id,r.post_id,r.reason,r.created_at,p.room_id,p.title,p.body FROM timber_shed_forum_reports r JOIN timber_shed_forum_posts p ON p.id=r.post_id WHERE r.status='open' ORDER BY CASE r.reason WHEN 'self-harm-risk' THEN 0 WHEN 'unsafe-health-advice' THEN 1 WHEN 'privacy' THEN 1 WHEN 'harassment' THEN 1 ELSE 2 END ASC,r.created_at ASC LIMIT 100").all();
    const pending=(queue.results||[]).map(({categories_json,...post})=>({...post,categories:post.policy_version&&categories_json?JSON.parse(categories_json):[],priority:post.priority??0,severity:post.severity||'unreviewed'}));
    return json({pending,reports:reports.results||[],appeals:await listOpenAppeals(db),...await listForumRestrictions(db)});
   }
   if(!['profile/save','submit','report','moderate','withdraw','notifications/read','appeal','appeal/review','block','unblock','restrict','restriction/lift','restriction/appeal','restriction/review','leave'].includes(route))return json({error:'not_found'},404);
   const parsed=await parse(request);if(parsed.error)return json({error:parsed.error},parsed.status);
   const input=parsed.value,kind=route==='profile/save'?'profile':route==='notifications/read'?'notificationRead':route;
   const problem=validateForumInput(kind,input);if(problem)return json({error:problem},400);
   const timestamp=now().toISOString();
   if(route==='leave'){await leaveForum(db,uid,timestamp);return json({ok:true,message:'Your community name and post text have been cleared. Your My Timber account is unchanged.'});}
   if(['block','unblock','restrict','restriction/lift','restriction/appeal','restriction/review'].includes(route))return await forumProtectionAction({route,input,db,uid,timestamp,json});
   if(route==='appeal'||route==='appeal/review')return await forumAppealAction({route,input,db,uid,timestamp,json});
   if(route==='notifications/read'){
    const record=await db.prepare("SELECT id FROM timber_shed_forum_notifications WHERE id=? AND recipient_id=?").bind(input.notificationId,uid).first();
    if(!record)return json({error:'notification_unavailable'},404);
    await db.prepare("UPDATE timber_shed_forum_notifications SET read_at=COALESCE(read_at,?) WHERE id=? AND recipient_id=?").bind(timestamp,input.notificationId,uid).run();
    return json({ok:true});
   }
   if(route==='profile/save'){
    const existing=await db.prepare('SELECT display_name FROM timber_shed_forum_profiles WHERE user_id=?').bind(uid).first();
    if(existing)return json({error:'display_name_locked_for_pilot'},409);
    const result=await db.prepare('INSERT OR IGNORE INTO timber_shed_forum_profiles(user_id,display_name,created_at) VALUES(?,?,?)').bind(uid,input.displayName,timestamp).run();
    if(Number(result.meta?.changes)!==1)return json({error:'display_name_unavailable'},409);
    return json({ok:true,profile:{displayName:input.displayName}},201);
   }
   if(route==='submit'){
    const profile=await db.prepare('SELECT user_id FROM timber_shed_forum_profiles WHERE user_id=?').bind(uid).first();
    if(!profile)return json({error:'choose_display_name_first'},409);
    if(own(input,'parentId')){
     const parent=await db.prepare(`SELECT p.room_id FROM timber_shed_forum_posts p WHERE p.id=? AND p.status='approved' AND p.parent_id IS NULL AND ${visibleAuthorSQL('p',uid)}`).bind(input.parentId).first();
     if(!parent||parent.room_id!==input.roomId)return json({error:'parent_unavailable'},404);
    }
    const quota=await db.prepare("SELECT COUNT(*) AS n FROM timber_shed_forum_posts WHERE user_id=? AND created_at>=?").bind(uid,new Date(now().getTime()-86400000).toISOString()).first();
    if(Number(quota?.n||0)>=5)return json({error:'daily_submission_limit'},429);
    const local=screenForumText({title:input.title||'',body:input.body});
    const modelRequired=env.TIMBER_SHED_AI_MODERATION_ENABLED==='true';
    if(modelRequired&&env.TIMBER_SHED_AI_PROVIDER_APPROVED!=='true')return json({error:'model_not_authorised'},503);
    // The adopted v1 notice excludes external AI; provider flags cannot override member terms.
    if(modelRequired)return json({error:'external_ai_not_in_pilot_policy'},503);
    const screening=local;
    const id=crypto.randomUUID();
    const decision=routinePublicationEnabled(env)?routinePublicationDecision(input,screening):{publish:false};
    // Atomic submission and screening: no post is accepted without a triage record.
    const operations=[
     db.prepare(`INSERT INTO timber_shed_forum_posts(id,user_id,room_id,parent_id,title,body,status,created_at) SELECT ?,?,?,?,?,?,'pending',? WHERE NOT EXISTS(SELECT 1 FROM timber_shed_forum_restrictions ar WHERE ar.user_id=? AND ar.lifted_at IS NULL AND (ar.expires_at IS NULL OR ar.expires_at>?)) AND (? IS NULL OR EXISTS(SELECT 1 FROM timber_shed_forum_posts p WHERE p.id=? AND p.status='approved' AND p.parent_id IS NULL AND ${visibleAuthorSQL('p',uid)}))`).bind(id,uid,input.roomId,input.parentId||null,input.title||null,input.body,timestamp,uid,timestamp,input.parentId||null,input.parentId||null),
     db.prepare("INSERT INTO timber_shed_bouncer_screenings(post_id,policy_version,model_name,severity,priority,categories_json,screened_at) VALUES(?,?,?,?,?,?,?)").bind(id,screening.policyVersion,screening.model||null,screening.severity,screening.priority,JSON.stringify(screening.categories),timestamp)
    ];
    if(decision.publish){
     // These run in the SAME transaction as insertion and screening. Any write failure rolls it all back.
     operations.push(db.prepare("UPDATE timber_shed_forum_posts SET status='approved',reviewed_at=?,reviewed_by=NULL WHERE id=? AND status='pending'").bind(timestamp,id));
     // A silently ignored status update makes decision_policy NULL, violating its NOT NULL constraint and rolling back the whole batch.
     operations.push(db.prepare("INSERT INTO timber_shed_auto_publications(post_id,decision_policy,governance_version,created_at) VALUES(?,(SELECT ? WHERE EXISTS(SELECT 1 FROM timber_shed_forum_posts WHERE id=? AND status='approved' AND reviewed_by IS NULL AND reviewed_at=?)),?,?)").bind(id,decision.policyVersion,id,timestamp,forumPolicy(env).version,timestamp));
     operations.push(db.prepare("INSERT INTO timber_shed_forum_audit(id,post_id,moderator_id,action,created_at) VALUES(?,?,NULL,'approve',?)").bind(crypto.randomUUID(),id,timestamp));
     operations.push(...notificationWrites(db,{postId:id,action:'approve',moderatorId:null,timestamp}));
    }
    const results=await db.batch(operations);
    if(Number(results[0]?.meta?.changes)!==1||Number(results[1]?.meta?.changes)!==1)return json({error:'screening_unavailable'},503);
    if(decision.publish)return json({ok:true,id,status:'approved',publication:'automated-routine',message:'Published by Bouncer after routine checks. You can withdraw your post in My posts.'},201);
    return json({ok:true,id,status:'pending',message:routinePublicationEnabled(env)&&screening.severity==='routine'?'Bouncer could not clearly recognise this as routine. It is private and waiting for human review.':bouncerSubmissionNotice(screening)},202);
   }
   if(route==='withdraw'){
    const existing=await db.prepare("SELECT id FROM timber_shed_forum_posts WHERE id=? AND user_id=? AND status IN ('pending','approved','rejected','removed')").bind(input.postId,uid).first();
    if(!existing)return json({error:'post_unavailable'},404);
    const operations=[
     db.prepare("UPDATE timber_shed_forum_posts SET status='withdrawn',title=NULL,body='[withdrawn by member]',reviewed_at=? WHERE id=? AND user_id=? AND status IN ('pending','approved','rejected','removed')").bind(timestamp,input.postId,uid),
     db.prepare("INSERT INTO timber_shed_forum_audit(id,post_id,moderator_id,action,created_at) SELECT ?,?,NULL,'withdraw',? WHERE EXISTS(SELECT 1 FROM timber_shed_forum_posts WHERE id=? AND user_id=? AND status='withdrawn')").bind(crypto.randomUUID(),input.postId,timestamp,input.postId,uid),
     db.prepare("UPDATE timber_shed_forum_reports SET status='closed' WHERE post_id=? AND status='open'").bind(input.postId),
     db.prepare("DELETE FROM timber_shed_forum_notifications WHERE post_id=? OR thread_id=?").bind(input.postId,input.postId),
     db.prepare("UPDATE timber_shed_forum_appeals SET status='withdrawn',resolved_at=? WHERE post_id=? AND status='open'").bind(timestamp,input.postId),
     db.prepare("INSERT INTO timber_shed_forum_appeal_audit(id,appeal_id,actor_id,action,created_at) SELECT ?,id,?,'withdrawn',? FROM timber_shed_forum_appeals WHERE post_id=? AND status='withdrawn' AND resolved_at=?").bind(crypto.randomUUID(),uid,timestamp,input.postId,timestamp)
    ];
    const results=await db.batch(operations);
    if(Number(results[0]?.meta?.changes)!==1||Number(results[1]?.meta?.changes)!==1)return json({error:'withdrawal_conflict'},409);
    return json({ok:true,status:'withdrawn',message:'Your post is no longer visible and its text has been cleared.'});
   }
   if(route==='report'){
    const post=await db.prepare(`SELECT p.id FROM timber_shed_forum_posts p WHERE p.id=? AND p.status='approved' AND ${visiblePostSQL('p',uid)}`).bind(input.postId).first();
    if(!post)return json({error:'post_unavailable'},404);
    const existing=await db.prepare("SELECT id FROM timber_shed_forum_reports WHERE post_id=? AND reporter_id=? AND status='open'").bind(input.postId,uid).first();
    if(existing)return json({ok:true,status:'reported'});
    await db.prepare("INSERT INTO timber_shed_forum_reports(id,post_id,reporter_id,reason,status,created_at) VALUES(?,?,?,?,'open',?)").bind(crypto.randomUUID(),input.postId,uid,input.reason,timestamp).run();
    return json({ok:true,status:'reported'});
   }
   if(!await isModerator(db,uid))return json({error:'moderator_only'},403);
   if(input.action==='dismiss'){
    const report=await db.prepare("SELECT id FROM timber_shed_forum_reports WHERE id=? AND post_id=? AND status='open'").bind(input.reportId,input.postId).first();
    if(!report)return json({error:'report_unavailable'},404);
    const operations=[
     db.prepare("UPDATE timber_shed_forum_reports SET status='closed' WHERE id=? AND post_id=? AND status='open'").bind(input.reportId,input.postId),
     db.prepare("INSERT INTO timber_shed_forum_audit(id,post_id,moderator_id,action,created_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM timber_shed_forum_reports WHERE id=? AND status='closed')").bind(crypto.randomUUID(),input.postId,uid,'dismiss',timestamp,input.reportId)
    ];
    const results=await db.batch(operations);
    if(Number(results[0]?.meta?.changes)!==1||Number(results[1]?.meta?.changes)!==1)return json({error:'moderation_conflict'},409);
    return json({ok:true,status:'dismissed'});
   }
   const post=await db.prepare('SELECT p.user_id,p.status,p.parent_id,b.severity,b.policy_version FROM timber_shed_forum_posts p LEFT JOIN timber_shed_bouncer_screenings b ON b.post_id=p.id WHERE p.id=?').bind(input.postId).first();
   if(!post)return json({error:'post_unavailable'},404);
   if(input.action==='approve'&&await activeForumRestriction(db,post.user_id,timestamp))return json({error:'author_access_restricted'},409);
   if(post.user_id===uid)return json({error:'cannot_moderate_own_post'},403);
   // Missing or outdated screening is a fail-closed hold. High/critical content
   // requires an independently approved safeguarding pathway not present in this pilot.
   if(input.action==='approve'&&(post.policy_version!==(env.TIMBER_SHED_AI_MODERATION_ENABLED==='true'?BOUNCER_VERSION+'+'+AI_MODERATION_POLICY:BOUNCER_VERSION)||post.severity==='high'||post.severity==='critical'))return json({error:'safeguarding_review_required'},409);
   if(input.action==='approve'&&post.parent_id){
    const parent=await db.prepare("SELECT id FROM timber_shed_forum_posts WHERE id=? AND status='approved'").bind(post.parent_id).first();
    if(!parent)return json({error:'parent_unavailable'},409);
   }
   if(input.action==='approve'&&post.status!=='pending')return json({error:'not_pending'},409);
   if(input.action==='reject'&&post.status!=='pending')return json({error:'not_pending'},409);
   if(input.action==='remove'&&post.status!=='approved')return json({error:'not_approved'},409);
   const next=input.action==='approve'?'approved':input.action==='reject'?'rejected':'removed';
   // D1 batch executes atomically. A failed audit must never leave an approved post.
   const operations=[
    db.prepare("UPDATE timber_shed_forum_posts SET status=?,reviewed_by=?,reviewed_at=? WHERE id=? AND status=? AND (?<>'approved' OR parent_id IS NULL OR EXISTS(SELECT 1 FROM timber_shed_forum_posts parent WHERE parent.id=timber_shed_forum_posts.parent_id AND parent.status='approved'))").bind(next,uid,timestamp,input.postId,post.status,next),
    db.prepare('INSERT INTO timber_shed_forum_audit(id,post_id,moderator_id,action,created_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM timber_shed_forum_posts WHERE id=? AND status=? AND reviewed_by=? AND reviewed_at=?)').bind(crypto.randomUUID(),input.postId,uid,input.action,timestamp,input.postId,next,uid,timestamp)
   ];
   if(input.action==='remove'){
    operations.push(db.prepare("UPDATE timber_shed_forum_reports SET status='closed' WHERE post_id=? AND status='open'").bind(input.postId));
    // Clear stale approved/reply links before creating the private removal notice.
    operations.push(db.prepare("DELETE FROM timber_shed_forum_notifications WHERE post_id=? OR (thread_id=? AND EXISTS(SELECT 1 FROM timber_shed_forum_posts p WHERE p.id=? AND p.parent_id IS NULL))").bind(input.postId,input.postId,input.postId));
   }
   // Notification writes join the same atomic moderation batch: no phantom alerts
   // if approval, audit or any notification insertion fails.
   operations.push(...notificationWrites(db,{postId:input.postId,action:input.action,moderatorId:uid,timestamp}));
   const results=await db.batch(operations);
   if(Number(results[0]?.meta?.changes)!==1||Number(results[1]?.meta?.changes)!==1)return json({error:'moderation_conflict'},409);
   return json({ok:true,status:next});
  }catch{
   // Fail closed. Do not return SQL, user IDs or private record details.
   return json({error:'forum_unavailable'},503);
  }
 };
}
export const timberShedForumRoutes=createTimberShedForumRoutes();
