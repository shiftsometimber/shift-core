// In-app-only Timber Shed notifications. No external communications, delivery
// provider, email address, device token, push or member health information.
export const NOTIFICATION_KINDS=Object.freeze(['approved','rejected','removed','reply']);
export function notificationWrites(db,{postId,action,moderatorId,timestamp}){
 if(!['approve','reject','remove'].includes(action))return [];
 const kind={approve:'approved',reject:'rejected',remove:'removed'}[action];
 const status=kind;
 const writes=[
  db.prepare(`INSERT OR IGNORE INTO timber_shed_forum_notifications
    (id,recipient_id,post_id,thread_id,room_id,kind,created_at)
    SELECT ?,p.user_id,p.id,COALESCE(p.parent_id,p.id),p.room_id,?,?
    FROM timber_shed_forum_posts p
    WHERE p.id=? AND p.status=? AND p.reviewed_by IS ? AND p.reviewed_at=?`)
   .bind(crypto.randomUUID(),kind,timestamp,postId,status,moderatorId,timestamp)
 ];
 if(action==='approve'){
  // Only an approved reply generates a notification for the parent author.
  // The parent must still be visible; replying to yourself is not a notification.
  writes.push(db.prepare(`INSERT OR IGNORE INTO timber_shed_forum_notifications
    (id,recipient_id,post_id,thread_id,room_id,kind,created_at)
    SELECT ?,parent.user_id,reply.id,parent.id,reply.room_id,'reply',?
    FROM timber_shed_forum_posts reply
    JOIN timber_shed_forum_posts parent ON parent.id=reply.parent_id
    WHERE reply.id=? AND reply.status='approved' AND parent.status='approved'
      AND reply.reviewed_by IS ? AND reply.reviewed_at=? AND parent.user_id<>reply.user_id`)
   .bind(crypto.randomUUID(),timestamp,postId,moderatorId,timestamp));
 }
 return writes;
}
