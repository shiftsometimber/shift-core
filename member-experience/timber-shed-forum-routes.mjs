import {authenticateMember} from '../member-state-fast-v1.js';
import {timberShedForumRooms} from './timber-shed-forums.mjs';

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
  const route=path.slice('/v1/timber-shed/forum/'.length);
  if(!new Set(['rooms','threads','mine','moderation','profile','profile/save','submit','report','moderate']).has(route))return json({error:'not_found'},404);
  const method=route==='rooms'||route==='threads'||route==='mine'||route==='moderation'||route==='profile'?'GET':'POST';
  if(request.method!==method)return json({error:'method_not_allowed'},405);
  if(method==='POST'&&request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'same_origin_required'},403);
  const auth=await authenticate(request,env);if(auth.response)return auth.response;
  if(!Number.isSafeInteger(auth.userId)||auth.userId<=0)return json({error:'authentication_required'},401);
  const db=env.DB,uid=auth.userId;
  try{
   // Eligibility is checked server-side; DOB and email verification never enter responses.
   const eligibility=await db.prepare('SELECT a.email_verified,u.date_of_birth FROM users u JOIN user_auth a ON a.user_id=u.id WHERE u.id=?').bind(uid).first();
   if(!eligibility||Number(eligibility.email_verified)!==1||!adult(eligibility.date_of_birth,now()))return json({error:'adult_verified_members_only'},403);
   if(route==='rooms')return json({rooms:timberShedForumRooms.map(({id,name,kicker,description})=>({id,name,kicker,description}))});
   if(route==='threads'){
    const room=new URL(request.url).searchParams.get('room');
    if(!ROOMS.has(room))return json({error:'invalid_room'},400);
    const posts=await db.prepare("SELECT p.id,p.room_id,p.parent_id,p.title,p.body,p.created_at,pr.display_name FROM timber_shed_forum_posts p JOIN timber_shed_forum_profiles pr ON pr.user_id=p.user_id WHERE p.room_id=? AND p.status='approved' AND (p.parent_id IS NULL OR EXISTS(SELECT 1 FROM timber_shed_forum_posts parent WHERE parent.id=p.parent_id AND parent.status='approved')) ORDER BY p.created_at DESC LIMIT 100").bind(room).all();
    return json({room,posts:posts.results||[]});
   }
   if(route==='mine'){
    const rows=await db.prepare("SELECT id,room_id,parent_id,title,body,status,created_at FROM timber_shed_forum_posts WHERE user_id=? ORDER BY created_at DESC LIMIT 100").bind(uid).all();
    return json({posts:rows.results||[]});
   }
   if(route==='profile'){
    const profile=await db.prepare('SELECT display_name FROM timber_shed_forum_profiles WHERE user_id=?').bind(uid).first();
    return json({profile:profile?{displayName:profile.display_name}:null});
   }
   if(route==='moderation'){
    if(!await isModerator(db,uid))return json({error:'moderator_only'},403);
    const queue=await db.prepare("SELECT p.id,p.room_id,p.parent_id,p.title,p.body,p.status,p.created_at,pr.display_name FROM timber_shed_forum_posts p JOIN timber_shed_forum_profiles pr ON pr.user_id=p.user_id WHERE p.status='pending' ORDER BY p.created_at ASC LIMIT 100").all();
    const reports=await db.prepare("SELECT r.id,r.post_id,r.reason,r.created_at,p.room_id,p.title,p.body FROM timber_shed_forum_reports r JOIN timber_shed_forum_posts p ON p.id=r.post_id WHERE r.status='open' ORDER BY r.created_at ASC LIMIT 100").all();
    return json({pending:queue.results||[],reports:reports.results||[]});
   }
   if(!['profile/save','submit','report','moderate'].includes(route))return json({error:'not_found'},404);
   const parsed=await parse(request);if(parsed.error)return json({error:parsed.error},parsed.status);
   const input=parsed.value,kind=route==='profile/save'?'profile':route;
   const problem=validateForumInput(kind,input);if(problem)return json({error:problem},400);
   const timestamp=now().toISOString();
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
     const parent=await db.prepare("SELECT room_id FROM timber_shed_forum_posts WHERE id=? AND status='approved' AND parent_id IS NULL").bind(input.parentId).first();
     if(!parent||parent.room_id!==input.roomId)return json({error:'parent_unavailable'},404);
    }
    const quota=await db.prepare("SELECT COUNT(*) AS n FROM timber_shed_forum_posts WHERE user_id=? AND created_at>=?").bind(uid,new Date(now().getTime()-86400000).toISOString()).first();
    if(Number(quota?.n||0)>=5)return json({error:'daily_submission_limit'},429);
    const id=crypto.randomUUID();
    await db.prepare("INSERT INTO timber_shed_forum_posts(id,user_id,room_id,parent_id,title,body,status,created_at) VALUES(?,?,?,?,?,?,'pending',?)").bind(id,uid,input.roomId,input.parentId||null,input.title||null,input.body,timestamp).run();
    return json({ok:true,id,status:'pending',message:'Submitted privately for moderation. Not visible to other members.'},202);
   }
   if(route==='report'){
    const post=await db.prepare("SELECT id FROM timber_shed_forum_posts WHERE id=? AND status='approved'").bind(input.postId).first();
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
   const post=await db.prepare('SELECT user_id,status FROM timber_shed_forum_posts WHERE id=?').bind(input.postId).first();
   if(!post)return json({error:'post_unavailable'},404);
   if(post.user_id===uid)return json({error:'cannot_moderate_own_post'},403);
   if(input.action==='approve'&&post.status!=='pending')return json({error:'not_pending'},409);
   if(input.action==='reject'&&post.status!=='pending')return json({error:'not_pending'},409);
   if(input.action==='remove'&&post.status!=='approved')return json({error:'not_approved'},409);
   const next=input.action==='approve'?'approved':input.action==='reject'?'rejected':'removed';
   // D1 batch executes atomically. A failed audit must never leave an approved post.
   const operations=[
    db.prepare('UPDATE timber_shed_forum_posts SET status=?,reviewed_by=?,reviewed_at=? WHERE id=? AND status=?').bind(next,uid,timestamp,input.postId,post.status),
    db.prepare('INSERT INTO timber_shed_forum_audit(id,post_id,moderator_id,action,created_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM timber_shed_forum_posts WHERE id=? AND status=? AND reviewed_by=? AND reviewed_at=?)').bind(crypto.randomUUID(),input.postId,uid,input.action,timestamp,input.postId,next,uid,timestamp)
   ];
   if(input.action==='remove')operations.push(db.prepare("UPDATE timber_shed_forum_reports SET status='closed' WHERE post_id=? AND status='open'").bind(input.postId));
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
