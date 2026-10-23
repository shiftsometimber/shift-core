// Private, default-off forum controls. No external messages or automatic bans.
const only=(v,keys)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>keys.includes(k));
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{10,80}$/.test(v);
const REASONS=new Set(['medication-trading','harassment','privacy','unsafe-content','spam','other']);
const isModerator=async(db,uid)=>!!await db.prepare("SELECT user_id FROM timber_shed_forum_moderators WHERE user_id=? AND active=1").bind(uid).first();
export function visibleAuthorSQL(alias,uid){
 if(!['p','r','parent','reply'].includes(alias)||!Number.isSafeInteger(uid)||uid<=0)throw Error('invalid_visibility_scope');
 return "NOT EXISTS(SELECT 1 FROM timber_shed_forum_blocks bl WHERE (bl.blocker_id="+uid+" AND bl.blocked_id="+alias+".user_id) OR (bl.blocked_id="+uid+" AND bl.blocker_id="+alias+".user_id))";
}
export function visiblePostSQL(alias,uid){
 return visibleAuthorSQL(alias,uid)+" AND ("+alias+".parent_id IS NULL OR EXISTS(SELECT 1 FROM timber_shed_forum_posts parent WHERE parent.id="+alias+".parent_id AND parent.status='approved' AND "+visibleAuthorSQL('parent',uid)+"))";
}
export function validateProtectionInput(route,v){
 if(route==='block')return only(v,['postId'])&&id(v.postId)?null:'invalid_block';
 if(route==='unblock')return only(v,['blockId'])&&id(v.blockId)?null:'invalid_block';
 if(route==='restrict'){
  return only(v,['postId','kind','reason','days'])&&id(v.postId)&&REASONS.has(v.reason)&&
   ((v.kind==='banned'&&!Object.hasOwn(v,'days'))||(v.kind==='suspended'&&[1,7,30].includes(v.days)))?null:'invalid_restriction';
 }
 if(route==='restriction/lift')return only(v,['restrictionId'])&&id(v.restrictionId)?null:'invalid_restriction';
 if(route==='restriction/appeal')return only(v,['restrictionId','reason'])&&id(v.restrictionId)&&['missed-context','incorrect-rule','other'].includes(v.reason)?null:'invalid_restriction_appeal';
 if(route==='restriction/review')return only(v,['appealId','outcome'])&&id(v.appealId)&&['upheld','reinstated'].includes(v.outcome)?null:'invalid_restriction_review';
 return 'invalid_action';
}
export async function activeForumRestriction(db,uid,timestamp){
 return await db.prepare("SELECT id,kind,reason,expires_at FROM timber_shed_forum_restrictions WHERE user_id=? AND lifted_at IS NULL AND (expires_at IS NULL OR expires_at>?)").bind(uid,timestamp).first();
}
export async function listForumRestrictions(db){
 const restrictions=await db.prepare("SELECT r.id,r.kind,r.reason,r.created_at,r.expires_at,pr.display_name FROM timber_shed_forum_restrictions r LEFT JOIN timber_shed_forum_profiles pr ON pr.user_id=r.user_id WHERE r.lifted_at IS NULL ORDER BY r.created_at DESC LIMIT 100").all();
 const appeals=await db.prepare("SELECT a.id,a.reason,a.created_at,r.id AS restriction_id,r.kind,r.reason AS restriction_reason,pr.display_name FROM timber_shed_restriction_appeals a JOIN timber_shed_forum_restrictions r ON r.id=a.restriction_id LEFT JOIN timber_shed_forum_profiles pr ON pr.user_id=r.user_id WHERE a.status='open' AND r.lifted_at IS NULL ORDER BY a.created_at ASC LIMIT 100").all();
 return{restrictions:restrictions.results||[],restrictionAppeals:appeals.results||[]};
}
const audit=(db,rid,uid,action,ts)=>db.prepare("INSERT INTO timber_shed_access_audit(id,restriction_id,actor_id,action,created_at) VALUES(?,?,?,CASE WHEN changes()=1 THEN ? ELSE 'conflict' END,?)").bind(crypto.randomUUID(),rid,uid,action,ts);
export async function forumProtectionAction({route,input,db,uid,timestamp,json}){
 if(route==='access'){
  const restriction=await activeForumRestriction(db,uid,timestamp);
  const rows=await db.prepare("SELECT a.id,a.restriction_id,a.reason,a.status,a.created_at,a.resolved_at FROM timber_shed_restriction_appeals a JOIN timber_shed_forum_restrictions r ON r.id=a.restriction_id WHERE r.user_id=? ORDER BY a.created_at DESC LIMIT 100").bind(uid).all();
  return json({restriction,appeals:rows.results||[]});
 }
 if(route==='blocks'){
  const rows=await db.prepare("SELECT b.id,pr.display_name,b.created_at FROM timber_shed_forum_blocks b JOIN timber_shed_forum_profiles pr ON pr.user_id=b.blocked_id WHERE b.blocker_id=? ORDER BY b.created_at DESC LIMIT 100").bind(uid).all();
  return json({blocks:rows.results||[]});
 }
 if(route==='block'){
  const post=await db.prepare("SELECT p.user_id FROM timber_shed_forum_posts p WHERE p.id=? AND p.status='approved' AND (p.parent_id IS NULL OR EXISTS(SELECT 1 FROM timber_shed_forum_posts parent WHERE parent.id=p.parent_id AND parent.status='approved'))").bind(input.postId).first();
  if(!post||post.user_id===uid)return json({error:'post_unavailable'},404);
  await db.prepare("INSERT OR IGNORE INTO timber_shed_forum_blocks(id,blocker_id,blocked_id,created_at) VALUES(?,?,?,?)").bind(crypto.randomUUID(),uid,post.user_id,timestamp).run();
  return json({ok:true,message:'Your posts are now hidden from each other. Moderators can still review reports.'});
 }
 if(route==='unblock'){
  await db.prepare("DELETE FROM timber_shed_forum_blocks WHERE id=? AND blocker_id=?").bind(input.blockId,uid).run();
  return json({ok:true});
 }
 if(route==='restriction/appeal'){
  const restriction=await db.prepare("SELECT id FROM timber_shed_forum_restrictions WHERE id=? AND user_id=? AND lifted_at IS NULL AND (expires_at IS NULL OR expires_at>?)").bind(input.restrictionId,uid,timestamp).first();
  if(!restriction)return json({error:'restriction_unavailable'},404);
  const existing=await db.prepare("SELECT id,status FROM timber_shed_restriction_appeals WHERE restriction_id=?").bind(restriction.id).first();
  if(existing)return json({ok:true,...existing});
  const appealId=crypto.randomUUID();
  await db.batch([
   db.prepare("INSERT INTO timber_shed_restriction_appeals(id,restriction_id,reason,status,created_at) SELECT ?,id,?,'open',? FROM timber_shed_forum_restrictions WHERE id=? AND user_id=? AND lifted_at IS NULL").bind(appealId,input.reason,timestamp,restriction.id,uid),
   audit(db,restriction.id,uid,'appealed',timestamp)
  ]);
  return json({ok:true,id:appealId,status:'open'},202);
 }
 if(!await isModerator(db,uid))return json({error:'moderator_only'},403);
 if(route==='restrict'){
  const post=await db.prepare("SELECT user_id FROM timber_shed_forum_posts WHERE id=? AND status<>'withdrawn'").bind(input.postId).first();
  if(!post)return json({error:'post_unavailable'},404);
  if(post.user_id===uid||await isModerator(db,post.user_id))return json({error:'independent_admin_required'},403);
  if(await activeForumRestriction(db,post.user_id,timestamp))return json({error:'already_restricted'},409);
  const rid=crypto.randomUUID(),expires=input.kind==='suspended'?new Date(new Date(timestamp).getTime()+input.days*86400000).toISOString():null;
  await db.batch([
   db.prepare("UPDATE timber_shed_forum_restrictions SET lifted_at=? WHERE user_id=? AND lifted_at IS NULL AND expires_at IS NOT NULL AND expires_at<=?").bind(timestamp,post.user_id,timestamp),
   // Record any expired restriction closed by this request before a new restriction.
   db.prepare("INSERT INTO timber_shed_access_audit(id,restriction_id,actor_id,action,created_at) SELECT ?,id,?,'expired',? FROM timber_shed_forum_restrictions WHERE user_id=? AND lifted_at=? AND expires_at<=? AND NOT EXISTS(SELECT 1 FROM timber_shed_access_audit a WHERE a.restriction_id=timber_shed_forum_restrictions.id AND a.action='expired')").bind(crypto.randomUUID(),uid,timestamp,post.user_id,timestamp,timestamp),
   db.prepare("INSERT INTO timber_shed_forum_restrictions(id,user_id,source_post_id,kind,reason,created_by,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?)").bind(rid,post.user_id,input.postId,input.kind,input.reason,uid,timestamp,expires),
   audit(db,rid,uid,input.kind,timestamp)
  ]);
  return json({ok:true,id:rid,kind:input.kind,expiresAt:expires},201);
 }
 if(route==='restriction/lift'){
  const restriction=await db.prepare("SELECT id,user_id FROM timber_shed_forum_restrictions WHERE id=? AND lifted_at IS NULL").bind(input.restrictionId).first();
  if(!restriction)return json({error:'restriction_unavailable'},404);
  if(restriction.user_id===uid)return json({error:'independent_admin_required'},403);
  await db.batch([
   db.prepare("UPDATE timber_shed_forum_restrictions SET lifted_by=?,lifted_at=? WHERE id=? AND lifted_at IS NULL").bind(uid,timestamp,restriction.id),
   audit(db,restriction.id,uid,'lifted',timestamp),
   db.prepare("UPDATE timber_shed_restriction_appeals SET status='reinstated',resolved_by=?,resolved_at=? WHERE restriction_id=? AND status='open'").bind(uid,timestamp,restriction.id)
  ]);
  return json({ok:true});
 }
 const appeal=await db.prepare("SELECT a.id,a.status,r.id AS restriction_id,r.user_id,r.created_by,r.lifted_at FROM timber_shed_restriction_appeals a JOIN timber_shed_forum_restrictions r ON r.id=a.restriction_id WHERE a.id=?").bind(input.appealId).first();
 if(!appeal)return json({error:'appeal_unavailable'},404);
 if(appeal.user_id===uid||appeal.created_by===uid)return json({error:'independent_reviewer_required'},403);
 if(appeal.status!=='open'||appeal.lifted_at)return json({error:'appeal_already_reviewed'},409);
 const ops=[
  db.prepare("UPDATE timber_shed_restriction_appeals SET status=?,resolved_by=?,resolved_at=? WHERE id=? AND status='open' AND EXISTS(SELECT 1 FROM timber_shed_forum_restrictions r WHERE r.id=restriction_id AND r.lifted_at IS NULL)").bind(input.outcome,uid,timestamp,appeal.id),
  audit(db,appeal.restriction_id,uid,input.outcome,timestamp)
 ];
 if(input.outcome==='reinstated'){
  ops.push(db.prepare("UPDATE timber_shed_forum_restrictions SET lifted_by=?,lifted_at=? WHERE id=? AND lifted_at IS NULL").bind(uid,timestamp,appeal.restriction_id));
  ops.push(audit(db,appeal.restriction_id,uid,'lifted',timestamp));
 }
 await db.batch(ops);
 return json({ok:true,status:input.outcome});
}
