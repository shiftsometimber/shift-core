// Owner-scoped community export and departure. Never reads My Timber health records.
export async function exportOwnForum(db,uid){
 const all=async(sql)=>((await db.prepare(sql).bind(uid).all()).results||[]);
 const profile=await db.prepare("SELECT display_name,created_at FROM timber_shed_forum_profiles WHERE user_id=?").bind(uid).first();
 return {
  profile:profile||null,
  participation:await all('SELECT rules_version,privacy_version,disclosure_consent_at,accepted_at FROM timber_shed_participation WHERE user_id=?'),
  adultAccess:await all('SELECT evidence_method,verified_at,expires_at,revoked_at FROM timber_shed_adult_access WHERE user_id=?'),
  posts:await all("SELECT id,room_id,parent_id,title,body,status,created_at,reviewed_at FROM timber_shed_forum_posts WHERE user_id=? ORDER BY created_at,id"),
  publications:await all('SELECT a.post_id,a.decision_policy,a.governance_version,a.created_at FROM timber_shed_auto_publications a JOIN timber_shed_forum_posts p ON p.id=a.post_id WHERE p.user_id=?'),
  reports:await all("SELECT id,post_id,reason,status,created_at FROM timber_shed_forum_reports WHERE reporter_id=? ORDER BY created_at,id"),
  appeals:await all("SELECT a.id,a.post_id,a.reason,a.status,a.created_at,a.resolved_at FROM timber_shed_forum_appeals a JOIN timber_shed_forum_posts p ON p.id=a.post_id WHERE p.user_id=? ORDER BY a.created_at,a.id"),
  restrictions:await all("SELECT id,kind,reason,created_at,expires_at,lifted_at FROM timber_shed_forum_restrictions WHERE user_id=? ORDER BY created_at,id"),
  restrictionAppeals:await all("SELECT a.id,a.restriction_id,a.reason,a.status,a.created_at,a.resolved_at FROM timber_shed_restriction_appeals a JOIN timber_shed_forum_restrictions r ON r.id=a.restriction_id WHERE r.user_id=? ORDER BY a.created_at,a.id"),
  notifications:await all("SELECT id,post_id,thread_id,room_id,kind,created_at,read_at FROM timber_shed_forum_notifications WHERE recipient_id=? ORDER BY created_at,id"),
  blocks:await all("SELECT b.id,pr.display_name,b.created_at FROM timber_shed_forum_blocks b JOIN timber_shed_forum_profiles pr ON pr.user_id=b.blocked_id WHERE b.blocker_id=? ORDER BY b.created_at,b.id")
 };
}
export async function leaveForum(db,uid,timestamp){
 // Keep restriction records and minimal moderation evidence to prevent evasion.
 // Erasure of backups or legally required records is a separate privacy request.
 await db.batch([
  db.prepare('DELETE FROM timber_shed_participation WHERE user_id=?').bind(uid),
  db.prepare('DELETE FROM timber_shed_bouncer_screenings WHERE post_id IN(SELECT id FROM timber_shed_forum_posts WHERE user_id=?)').bind(uid),
  db.prepare("INSERT INTO timber_shed_forum_audit(id,post_id,moderator_id,action,created_at) SELECT lower(hex(randomblob(16))),id,NULL,'withdraw',? FROM timber_shed_forum_posts WHERE user_id=? AND status<>'withdrawn'").bind(timestamp,uid),
  db.prepare("DELETE FROM timber_shed_forum_notifications WHERE recipient_id=? OR post_id IN(SELECT id FROM timber_shed_forum_posts WHERE user_id=?) OR thread_id IN(SELECT id FROM timber_shed_forum_posts WHERE user_id=?)").bind(uid,uid,uid),
  db.prepare("DELETE FROM timber_shed_forum_reports WHERE post_id IN(SELECT id FROM timber_shed_forum_posts WHERE user_id=?)").bind(uid),
  db.prepare("DELETE FROM timber_shed_forum_appeals WHERE post_id IN(SELECT id FROM timber_shed_forum_posts WHERE user_id=?)").bind(uid),
  db.prepare("UPDATE timber_shed_forum_posts SET status='withdrawn',title=NULL,body='[withdrawn by member]',reviewed_at=? WHERE user_id=?").bind(timestamp,uid),
  db.prepare("DELETE FROM timber_shed_forum_reports WHERE reporter_id=?").bind(uid),
  db.prepare("DELETE FROM timber_shed_forum_blocks WHERE blocker_id=?").bind(uid),
  db.prepare("DELETE FROM timber_shed_forum_profiles WHERE user_id=?").bind(uid)
 ]);
}
