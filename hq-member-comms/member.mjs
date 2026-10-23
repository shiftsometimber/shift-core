import {authenticateMember} from '../member-state-fast-v1.js';
import {validEndpoint,validKey} from '../mental-health-pathway/member/model.mjs';
import {fail} from './model.mjs';
import {json} from './api.mjs';
export async function forgetCommunications(DB,id){await DB.batch([DB.prepare('DELETE FROM hq_comms_push_receipts WHERE endpoint IN (SELECT endpoint FROM hq_comms_devices WHERE user_id=?)').bind(id),DB.prepare('DELETE FROM hq_comms_devices WHERE user_id=?').bind(id)]);}
export async function suppressAccountCommunications(DB,id){await forgetCommunications(DB,id);await DB.prepare("UPDATE hq_comms_recipients SET status='suppressed' WHERE user_id=? AND status='pending'").bind(id).run();}
export async function exportCommunications(DB,id){return{devices:(await DB.prepare('SELECT consented_at,expires_at FROM hq_comms_devices WHERE user_id=?').bind(id).all()).results,updates:(await DB.prepare("SELECT d.id,d.payload_json,d.scheduled_at,r.read_at,r.status FROM hq_comms_recipients r JOIN hq_comms_drafts d ON d.id=r.draft_id WHERE r.user_id=? AND d.approved_at IS NOT NULL AND r.status='available_in_app'").bind(id).all()).results.map(r=>({id:r.id,subject:JSON.parse(r.payload_json).subject,body:JSON.parse(r.payload_json).body,scheduledAt:r.scheduled_at,readAt:r.read_at}))};}
export async function memberApi(request,env,{authenticate=authenticateMember,now=new Date()}={}){
 try{
  const auth=await authenticate(request,env);if(auth.response)return json({error:'sign_in_required'},401);
  const DB=env.DB,id=auth.userId,root='/v1/my-timber-communications',path=new URL(request.url).pathname.slice(root.length),at=now.toISOString();
  if(request.method==='GET'&&path===''){
   const devices=(await DB.prepare('SELECT expires_at FROM hq_comms_devices WHERE user_id=? AND session_id=? AND expires_at>?').bind(id,auth.user.session_id,at).all()).results;
   const config=await DB.prepare('SELECT public_key FROM fit_notification_config WHERE id=1').first();
   const rows=(await DB.prepare("SELECT d.id,d.payload_json,d.scheduled_at,r.read_at FROM hq_comms_recipients r JOIN hq_comms_drafts d ON d.id=r.draft_id WHERE r.user_id=? AND r.status='available_in_app' AND d.status IN ('scheduled','processed') AND d.approved_at IS NOT NULL AND d.scheduled_at<=? ORDER BY d.scheduled_at DESC LIMIT 100").bind(id,at).all()).results;
   return json({account:String(id),enabled:devices.length>0,deviceConsentUntil:devices[0]?.expires_at||null,publicKey:config?.public_key||null,updates:rows.map(r=>{const p=JSON.parse(r.payload_json);return{id:r.id,subject:p.subject,body:p.body,at:r.scheduled_at,readAt:r.read_at,attachment:p.attachment}})});
  }
  if(!['POST','DELETE'].includes(request.method))fail('method_not_allowed',405);
  if(request.headers.get('Origin')!==new URL(request.url).origin||!request.headers.get('Content-Type')?.startsWith('application/json'))fail('origin_not_allowed',403);
  const raw=await request.text();if(raw.length>4096)fail('request_too_large',413);let body;try{body=JSON.parse(raw)}catch{fail('invalid_json')}
  if(path==='/device'&&request.method==='DELETE'){
   if(!body||Object.keys(body).some(x=>x!=='endpoint'))fail('invalid_request');
   if(body.endpoint){if(!validEndpoint(body.endpoint))fail('invalid_subscription');await DB.batch([DB.prepare('DELETE FROM hq_comms_push_receipts WHERE endpoint=? AND EXISTS(SELECT 1 FROM hq_comms_devices WHERE user_id=? AND endpoint=?)').bind(body.endpoint,id,body.endpoint),DB.prepare('DELETE FROM hq_comms_devices WHERE user_id=? AND endpoint=?').bind(id,body.endpoint)]);}else await forgetCommunications(DB,id);return json({ok:true});
  }
  if(path==='/device'&&request.method==='POST'){
   if(!body||Object.keys(body).some(x=>!['endpoint','keys','consent','backgroundConsent'].includes(x))||body.consent!==true||body.backgroundConsent!==true||!validEndpoint(body.endpoint)||!validKey(body.keys?.p256dh,65)||!validKey(body.keys?.auth,16))fail('explicit_device_consent_required');
   if(Number((await DB.prepare('SELECT email_verified FROM user_auth WHERE user_id=?').bind(id).first())?.email_verified)!==1)fail('verify_email_first',403);
   const until=new Date(now.getTime()+90*86400000).toISOString();
   await DB.batch([DB.prepare('DELETE FROM hq_comms_push_receipts WHERE endpoint=? AND EXISTS(SELECT 1 FROM hq_comms_devices WHERE endpoint=? AND user_id<>?)').bind(body.endpoint,body.endpoint,id),DB.prepare('INSERT INTO hq_comms_devices(endpoint,user_id,session_id,p256dh,auth,consented_at,expires_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id,session_id=excluded.session_id,p256dh=excluded.p256dh,auth=excluded.auth,consented_at=excluded.consented_at,expires_at=excluded.expires_at').bind(body.endpoint,id,auth.user.session_id,body.keys.p256dh,body.keys.auth,at,until)]);
   return json({ok:true,enabled:true,until});
  }
  if(path==='/read'&&request.method==='POST'&&typeof body?.id==='string'&&Object.keys(body).length===1){await DB.prepare("UPDATE hq_comms_recipients SET read_at=? WHERE draft_id=? AND user_id=? AND status='available_in_app'").bind(at,body.id,id).run();return json({ok:true});}
  fail('not_found',404);
 }catch(e){return json({error:e.status?e.message:'communications_unavailable'},e.status||503);}
}
