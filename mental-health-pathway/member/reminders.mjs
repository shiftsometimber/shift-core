import {supportHistoryDDL,claimSupportHistory,updateSupportHistory} from './delivery-history.mjs';
import {decode,validEndpoint} from './model.mjs';
import {hasConsent,readStep} from './api.mjs';
export const reminderPayload=reminderId=>({kind:'my-timber-support',title:'My Timber reminder',body:'A reminder you chose is ready. Open My Timber when you’re ready.',url:'/member/dashboard#supportFollowThrough',tag:'my-timber-support-'+reminderId});
export async function runSupportReminders(env,now,send){
 const DB=env.DB,at=now.toISOString(),out={accepted:0,suppressed:0,failed:0};
 await DB.prepare(supportHistoryDDL).run();
 const rows=(await DB.prepare(`SELECT d.*,t.state_json FROM my_timber_support_devices d JOIN my_timber_support_steps t ON t.user_id=d.user_id JOIN user_sessions s ON s.id=d.session_id AND s.user_id=d.user_id JOIN user_auth a ON a.user_id=d.user_id WHERE s.revoked_at IS NULL AND (julianday(s.expires_at)>julianday(?) OR julianday(d.background_until)>julianday(?)) AND a.email_verified=1 AND json_extract(t.state_json,'$.reminder.at')<=? AND json_extract(t.state_json,'$.reminder.at')>=? AND NOT EXISTS(SELECT 1 FROM my_timber_support_deliveries r WHERE r.endpoint=d.endpoint AND r.reminder_id=json_extract(t.state_json,'$.reminder.id')) ORDER BY d.endpoint LIMIT 100`).bind(at,at,at,new Date(now.getTime()-86400000).toISOString()).all()).results;
 for(const row of rows){
  const state=decode(row),id=state?.reminder?.id;if(!id||!validEndpoint(row.endpoint)||!await hasConsent(DB,row.user_id)){out.suppressed++;continue;}
  const history=await claimSupportHistory(DB,row,id,at);if(!history.claimed)continue;
  const claim=await DB.prepare("INSERT OR IGNORE INTO my_timber_support_deliveries(endpoint,reminder_id,status,at) VALUES(?,?,'claimed',?)").bind(row.endpoint,id,at).run();if(!claim.meta.changes){await updateSupportHistory(DB,row.user_id,id,history.hash,'unknown');continue;}
  try{
   const current=decode(await readStep(DB,row.user_id));
   const session=await DB.prepare('SELECT d.endpoint FROM my_timber_support_devices d JOIN user_sessions s ON s.id=d.session_id AND s.user_id=d.user_id WHERE d.endpoint=? AND d.user_id=? AND s.revoked_at IS NULL AND (julianday(s.expires_at)>julianday(?) OR julianday(d.background_until)>julianday(?))').bind(row.endpoint,row.user_id,at,at).first();
   if(!session||current?.reminder?.id!==id||current.status==='complete'||!await hasConsent(DB,row.user_id)){
    await DB.prepare("UPDATE my_timber_support_deliveries SET status='suppressed' WHERE endpoint=? AND reminder_id=?").bind(row.endpoint,id).run();await updateSupportHistory(DB,row.user_id,id,history.hash,'suppressed');out.suppressed++;continue;
   }
   const result=await send(env,row,reminderPayload(id));
   await DB.prepare('UPDATE my_timber_support_deliveries SET status=? WHERE endpoint=? AND reminder_id=?').bind(result,row.endpoint,id).run();await updateSupportHistory(DB,row.user_id,id,history.hash,result);
   if(result==='accepted')out.accepted++;else out.failed++;
   if(result==='expired')await DB.batch([DB.prepare('DELETE FROM my_timber_support_deliveries WHERE endpoint=?').bind(row.endpoint),DB.prepare('DELETE FROM my_timber_support_devices WHERE endpoint=?').bind(row.endpoint)]);
  }catch{out.failed++;await updateSupportHistory(DB,row.user_id,id,history.hash,'unknown').catch(()=>{});await DB.prepare("UPDATE my_timber_support_deliveries SET status='unknown' WHERE endpoint=? AND reminder_id=? AND status='claimed'").bind(row.endpoint,id).run().catch(()=>{});}
 }
 // Keep only the current reminder's operational receipt for each device.
 await DB.prepare("DELETE FROM my_timber_support_deliveries WHERE reminder_id NOT IN (SELECT json_extract(state_json,'$.reminder.id') FROM my_timber_support_steps WHERE json_extract(state_json,'$.reminder.id') IS NOT NULL)").run();
 return out;
}
