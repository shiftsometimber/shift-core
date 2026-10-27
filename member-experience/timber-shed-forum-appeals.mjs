// Private moderation appeals. Inherits forum feature, session, adult and origin gates.
// No free text, external delivery, clinical data or automated publication.
const REASONS=new Set(['missed-context','incorrect-rule','other']);
const only=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k));
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{10,80}$/.test(v);
export function validateForumAppeal(kind,input){
 if(kind==='appeal')return only(input,['postId','reason'])&&id(input.postId)&&REASONS.has(input.reason)?null:'invalid_appeal';
 if(kind==='appeal/review')return only(input,['appealId','outcome'])&&id(input.appealId)&&['upheld','reconsider'].includes(input.outcome)?null:'invalid_appeal_review';
 return 'invalid_action';
}
export async function listOpenAppeals(db){
 const result=await db.prepare("SELECT a.id,a.post_id,a.reason,a.created_at,p.room_id,p.title,p.body,p.status AS post_status FROM timber_shed_forum_appeals a JOIN timber_shed_forum_posts p ON p.id=a.post_id WHERE a.status='open' AND p.status IN ('rejected','removed') ORDER BY a.created_at ASC,a.id ASC LIMIT 100").all();
 return result.results||[];
}
export async function forumAppealAction({route,input,db,uid,timestamp,json}){
 if(route==='appeals'){
  const rows=await db.prepare("SELECT a.id,a.post_id,a.reason,a.status,a.created_at,a.resolved_at,a.decision_at FROM timber_shed_forum_appeals a JOIN timber_shed_forum_posts p ON p.id=a.post_id WHERE p.user_id=? ORDER BY a.created_at DESC,a.id DESC LIMIT 100").bind(uid).all();
  return json({appeals:rows.results||[]});
 }
 if(route==='appeal'){
  const post=await db.prepare("SELECT id,status,reviewed_by,reviewed_at FROM timber_shed_forum_posts WHERE id=? AND user_id=? AND status IN ('rejected','removed')").bind(input.postId,uid).first();
  if(!post||!post.reviewed_by||!post.reviewed_at)return json({error:'post_unavailable'},404);
  const existing=await db.prepare("SELECT id,status FROM timber_shed_forum_appeals WHERE post_id=? AND decision_at=?").bind(post.id,post.reviewed_at).first();
  if(existing)return json({ok:true,id:existing.id,status:existing.status});
  const appealId=crypto.randomUUID();
  await db.batch([
   db.prepare("INSERT INTO timber_shed_forum_appeals(id,post_id,reason,status,decision_status,decision_by,decision_at,created_at) SELECT ?,?,?,'open',status,reviewed_by,reviewed_at,? FROM timber_shed_forum_posts WHERE id=? AND user_id=? AND status=? AND reviewed_by=? AND reviewed_at=?").bind(appealId,post.id,input.reason,timestamp,post.id,uid,post.status,post.reviewed_by,post.reviewed_at),
   // A lost race is an abort, not an unaudited partial change.
   db.prepare("INSERT INTO timber_shed_forum_appeal_audit(id,appeal_id,actor_id,action,created_at) VALUES(?,?,?,CASE WHEN changes()=1 THEN 'submitted' ELSE 'conflict' END,?)").bind(crypto.randomUUID(),appealId,uid,timestamp)
  ]);
  return json({ok:true,id:appealId,status:'open',message:'Your appeal is waiting for a different moderator. The post remains hidden.'},202);
 }
 const moderator=await db.prepare("SELECT user_id FROM timber_shed_forum_moderators WHERE user_id=? AND active=1").bind(uid).first();
 if(!moderator)return json({error:'moderator_only'},403);
 const appeal=await db.prepare("SELECT a.*,p.user_id,p.status AS current_status,p.reviewed_by AS current_reviewer,p.reviewed_at AS current_decision_at FROM timber_shed_forum_appeals a JOIN timber_shed_forum_posts p ON p.id=a.post_id WHERE a.id=?").bind(input.appealId).first();
 if(!appeal)return json({error:'appeal_unavailable'},404);
 if(appeal.user_id===uid||appeal.decision_by===uid)return json({error:'independent_reviewer_required'},403);
 if(appeal.status!=='open')return json({error:'appeal_already_reviewed'},409);
 if(appeal.current_status!==appeal.decision_status||appeal.current_reviewer!==appeal.decision_by||appeal.current_decision_at!==appeal.decision_at)return json({error:'decision_changed'},409);
 const operations=[
  db.prepare("UPDATE timber_shed_forum_appeals SET status=?,resolved_by=?,resolved_at=? WHERE id=? AND status='open' AND EXISTS(SELECT 1 FROM timber_shed_forum_posts p WHERE p.id=post_id AND p.status=decision_status AND p.reviewed_by=decision_by AND p.reviewed_at=decision_at)").bind(input.outcome,uid,timestamp,appeal.id),
  db.prepare("INSERT INTO timber_shed_forum_appeal_audit(id,appeal_id,actor_id,action,created_at) VALUES(?,?,?,CASE WHEN changes()=1 THEN ? ELSE 'conflict' END,?)").bind(crypto.randomUUID(),appeal.id,uid,input.outcome,timestamp)
 ];
 if(input.outcome==='reconsider'){
  operations.push(db.prepare("UPDATE timber_shed_forum_posts SET status='pending',reviewed_by=NULL,reviewed_at=NULL WHERE id=? AND status=? AND reviewed_by=? AND reviewed_at=?").bind(appeal.post_id,appeal.decision_status,appeal.decision_by,appeal.decision_at));
  operations.push(db.prepare("INSERT INTO timber_shed_forum_appeal_audit(id,appeal_id,actor_id,action,created_at) VALUES(?,?,?,CASE WHEN changes()=1 THEN 'returned' ELSE 'conflict' END,?)").bind(crypto.randomUUID(),appeal.id,uid,timestamp));
 }
 await db.batch(operations);
 return json({ok:true,status:input.outcome,message:input.outcome==='reconsider'?'Returned for fresh moderation. Nothing has been published.':'The original decision has been upheld.'});
}
