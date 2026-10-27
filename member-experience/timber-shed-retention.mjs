import {governanceApproved} from './timber-shed-governance.mjs';
const cutoff=(now,days)=>new Date(now.getTime()-days*86400000).toISOString();
// Bounded, idempotent maintenance. Never touches non-Shed account/health tables.
export async function runTimberShedRetention(env,now=new Date()){
 if(!governanceApproved(env)||env.TIMBER_SHED_RETENTION_ENABLED!=='true')return {enabled:false};
 if(!Number.isFinite(now.getTime()))throw Error('Invalid retention clock');
 const db=env.DB;
 const candidates=await db.prepare(`SELECT p.id FROM timber_shed_forum_posts p WHERE
 (p.status='pending' AND p.created_at<?)
 OR (p.status='approved' AND p.created_at<?)
 OR (p.status IN ('rejected','removed') AND COALESCE(p.reviewed_at,p.created_at)<? AND
  (NOT EXISTS(SELECT 1 FROM timber_shed_forum_appeals a WHERE a.post_id=p.id AND a.status='open') OR COALESCE(p.reviewed_at,p.created_at)<?))
 ORDER BY p.created_at,p.id LIMIT 7`).bind(cutoff(now,7),cutoff(now,365),cutoff(now,30),cutoff(now,90)).all();
 const ids=(candidates.results||[]).map(x=>x.id);
 const ops=[];
 for(const id of ids){
  ops.push(db.prepare("DELETE FROM timber_shed_forum_notifications WHERE post_id=? OR thread_id=?").bind(id,id));
  ops.push(db.prepare("DELETE FROM timber_shed_forum_reports WHERE post_id=?").bind(id));
  ops.push(db.prepare("DELETE FROM timber_shed_bouncer_screenings WHERE post_id=?").bind(id));
  ops.push(db.prepare("INSERT INTO timber_shed_forum_appeal_audit(id,appeal_id,actor_id,action,created_at) SELECT lower(hex(randomblob(16))),id,NULL,'expired',? FROM timber_shed_forum_appeals WHERE post_id=? AND status='open'").bind(now.toISOString(),id));
  ops.push(db.prepare("UPDATE timber_shed_forum_appeals SET status='withdrawn',resolved_at=?,resolved_by=NULL WHERE post_id=? AND status='open'").bind(now.toISOString(),id));
  ops.push(db.prepare("UPDATE timber_shed_forum_posts SET status='withdrawn',title=NULL,body='[expired under retention policy]' WHERE id=? AND status<>'withdrawn'").bind(id));
 }
 // The first batch clears expired text/derived health flags before any metadata removal.
 if(ops.length)await db.batch(ops);
 const results=await db.batch([
  db.prepare("DELETE FROM timber_shed_forum_notifications WHERE id IN(SELECT id FROM timber_shed_forum_notifications WHERE created_at<? LIMIT 500)").bind(cutoff(now,30)),
  db.prepare("DELETE FROM timber_shed_forum_audit WHERE id IN(SELECT id FROM timber_shed_forum_audit WHERE created_at<? LIMIT 500)").bind(cutoff(now,365)),
  db.prepare("DELETE FROM timber_shed_forum_reports WHERE id IN(SELECT id FROM timber_shed_forum_reports WHERE status='closed' AND created_at<? LIMIT 100)").bind(cutoff(now,365)),
  db.prepare("DELETE FROM timber_shed_forum_appeals WHERE id IN(SELECT id FROM timber_shed_forum_appeals WHERE status<>'open' AND COALESCE(resolved_at,created_at)<? LIMIT 100)").bind(cutoff(now,365)),
  db.prepare("DELETE FROM timber_shed_forum_restrictions WHERE id IN(SELECT id FROM timber_shed_forum_restrictions r WHERE COALESCE(r.lifted_at,r.expires_at)<? AND NOT EXISTS(SELECT 1 FROM timber_shed_restriction_appeals a WHERE a.restriction_id=r.id AND (a.status='open' OR COALESCE(a.resolved_at,a.created_at)>=?)) LIMIT 100)").bind(cutoff(now,365),cutoff(now,365)),
  // Do not cascade away another author's open appeal; keep the cleared tombstone until resolved.
  db.prepare("DELETE FROM timber_shed_forum_posts WHERE id IN(SELECT p.id FROM timber_shed_forum_posts p WHERE p.status='withdrawn' AND COALESCE(p.reviewed_at,p.created_at)<? AND NOT EXISTS(SELECT 1 FROM timber_shed_forum_appeals a JOIN timber_shed_forum_posts child ON child.id=a.post_id WHERE (child.id=p.id OR child.parent_id=p.id) AND (a.status='open' OR COALESCE(a.resolved_at,a.created_at)>=?)) LIMIT 100)").bind(cutoff(now,365),cutoff(now,365)),
  db.prepare('INSERT INTO timber_shed_maintenance(id,completed_at) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET completed_at=excluded.completed_at').bind(now.toISOString())
 ]);
 return {enabled:true,expiredPosts:ids.length,metadataChanges:results.reduce((n,r)=>n+Number(r.meta?.changes||0),0),batchLimit:7};
}
