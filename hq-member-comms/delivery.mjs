import {PUSH,emailMessage,hash} from './model.mjs';
import {sendSupportPush} from '../mental-health-pathway/member/push.mjs';
export async function runCommunications(env,now=new Date(),{sendEmail=(e,p,to)=>e.EMAIL.send(emailMessage(p,to)),sendPush=sendSupportPush}={}){
 const DB=env.DB,at=now.toISOString(),out={emailAccepted:0,inApp:0,pushAccepted:0,unknown:0,suppressed:0};
 const drafts=(await DB.prepare("SELECT * FROM hq_comms_drafts WHERE status='scheduled' AND scheduled_at<=? AND scheduled_at>=? ORDER BY scheduled_at LIMIT 10").bind(at,new Date(now.getTime()-86400000).toISOString()).all()).results;
 for(const d of drafts){
  const p=JSON.parse(d.payload_json),actor=await DB.prepare("SELECT id FROM hq_users WHERE id=? AND role='owner' AND status='active'").bind(d.approved_by).first();
  if(!actor||await hash(p)!==d.hash){await DB.prepare("UPDATE hq_comms_drafts SET status='held' WHERE id=? AND status='scheduled'").bind(d.id).run();continue;}
  const recipients=(await DB.prepare("SELECT * FROM hq_comms_recipients WHERE draft_id=? AND status='pending' ORDER BY email LIMIT 25").bind(d.id).all()).results;
  for(const r of recipients){
   // Conditional update claims this recipient exactly once, including concurrent cron runs.
   const claim=await DB.prepare("UPDATE hq_comms_recipients SET status='processing',at=? WHERE draft_id=? AND email=? AND status='pending' AND EXISTS(SELECT 1 FROM hq_comms_drafts WHERE id=? AND status='scheduled')").bind(at,d.id,r.email,d.id).run();if(!claim.meta.changes)continue;
   let status='unknown',provider=null,errorCode=null;
   try{
    // Recheck cancellation just before dispatch. A provider request already in flight cannot be recalled.
    const current=await DB.prepare("SELECT id FROM hq_comms_drafts WHERE id=? AND status='scheduled'").bind(d.id).first();
    if(!current){status='suppressed';out.suppressed++;}
    else if(p.channel==='email'){
     if(r.user_id&&!await DB.prepare('SELECT id FROM users WHERE id=? AND lower(email)=?').bind(r.user_id,r.email).first()){status='suppressed';out.suppressed++;}else{const result=await sendEmail(env,p,r.email);if(!result?.messageId||String(result.messageId).startsWith('sim-'))throw Error('missing_real_provider_receipt');provider=String(result.messageId).slice(0,240);status='provider_accepted';out.emailAccepted++;}
    }else{
     const user=await DB.prepare('SELECT u.id,u.email,a.email_verified FROM users u JOIN user_auth a ON a.user_id=u.id WHERE u.id=? AND lower(u.email)=?').bind(r.user_id,r.email).first();
     if(!user||Number(user.email_verified)!==1){status='suppressed';out.suppressed++;}
     else{status='available_in_app';out.inApp++;
      const devices=(await DB.prepare('SELECT d.* FROM hq_comms_devices d JOIN user_sessions s ON s.id=d.session_id AND s.user_id=d.user_id WHERE d.user_id=? AND d.expires_at>? AND s.revoked_at IS NULL').bind(user.id,at).all()).results;
      for(const device of devices){
       const claimed=await DB.prepare("INSERT OR IGNORE INTO hq_comms_push_receipts(draft_id,endpoint,status,at) VALUES(?,?,'processing',?)").bind(d.id,device.endpoint,at).run();if(!claimed.meta.changes)continue;
       let result='unknown';try{
        const eligible=await DB.prepare("SELECT d.endpoint FROM hq_comms_devices d JOIN user_sessions s ON s.id=d.session_id AND s.user_id=d.user_id WHERE d.endpoint=? AND d.user_id=? AND d.expires_at>? AND s.revoked_at IS NULL AND EXISTS(SELECT 1 FROM hq_comms_drafts WHERE id=? AND status='scheduled')").bind(device.endpoint,user.id,at,d.id).first();
        result=eligible?await sendPush(env,device,{...PUSH,tag:'hq-update-'+d.id}):'suppressed';if(result==='accepted')out.pushAccepted++;
        if(result==='expired')await DB.prepare('DELETE FROM hq_comms_devices WHERE endpoint=?').bind(device.endpoint).run();
       }catch{out.unknown++;}
       await DB.prepare('UPDATE hq_comms_push_receipts SET status=? WHERE draft_id=? AND endpoint=?').bind(result,d.id,device.endpoint).run();
      }
     }
    }
   }catch(e){out.unknown++;errorCode=String(e.code||'delivery_uncertain').replace(/[^A-Za-z0-9_-]/g,'').slice(0,80);}
   await DB.prepare('UPDATE hq_comms_recipients SET status=?,provider_id=?,error_code=?,at=? WHERE draft_id=? AND email=?').bind(status,provider,errorCode,at,d.id,r.email).run();
  }
  await DB.prepare("UPDATE hq_comms_drafts SET status='processed' WHERE id=? AND status='scheduled' AND NOT EXISTS(SELECT 1 FROM hq_comms_recipients WHERE draft_id=? AND status IN ('pending','processing'))").bind(d.id,d.id).run();
 }
 await DB.prepare("UPDATE hq_comms_drafts SET status='expired' WHERE status='scheduled' AND scheduled_at<?").bind(new Date(now.getTime()-86400000).toISOString()).run();
 // An interrupted/ambiguous attempt is never automatically resent.
 await DB.prepare("UPDATE hq_comms_recipients SET status='unknown' WHERE status='processing' AND at<?").bind(new Date(now.getTime()-3600000).toISOString()).run();
 await DB.prepare('DELETE FROM hq_comms_devices WHERE expires_at<?').bind(at).run();
 return out;
}
