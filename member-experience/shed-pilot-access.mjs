// Preserve the inherited ten-account pilot boundary without disabling everyone
// when an eleventh eligible account asks to join. Revoked/expired grants are not renewed.
export async function grantShedPilotAccess(DB,uid,at,expires){
 await DB.prepare('INSERT OR IGNORE INTO timber_shed_adult_access(user_id,evidence_method,evidence_reference,verified_by,verified_at,expires_at,revoked_at) SELECT ?,?,?,?,?,?,NULL WHERE (SELECT COUNT(*) FROM timber_shed_adult_access WHERE revoked_at IS NULL AND verified_at<=? AND expires_at>?)<10').bind(uid,'verified-adult-account','member-explicit-join',uid,at,expires,at,at).run();
 return !!await DB.prepare('SELECT user_id FROM timber_shed_adult_access WHERE user_id=? AND revoked_at IS NULL AND verified_at<=? AND expires_at>?').bind(uid,at,at).first();
}
