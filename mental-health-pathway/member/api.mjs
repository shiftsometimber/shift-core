import {authenticateMember} from '../../member-state-fast-v1.js';
import {CONSENT,validate,fail,decode,publicState,nextState,validEndpoint,validKey,calendar} from './model.mjs';
const HEADERS={'Cache-Control':'private, no-store, must-revalidate','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'};
export const json=(data,status=200)=>Response.json(data,{status,headers:HEADERS});
export const readStep=(DB,id)=>DB.prepare('SELECT * FROM my_timber_support_steps WHERE user_id=?').bind(id).first();
export const hasConsent=async(DB,id)=>Number((await DB.prepare('SELECT granted FROM consents WHERE user_id=? AND consent_type=? ORDER BY id DESC LIMIT 1').bind(id,CONSENT).first())?.granted)===1;
const fingerprint=async data=>{const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(data)));return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('')};
export async function forgetSupport(DB,id,now=new Date().toISOString()){
 await DB.batch([DB.prepare('DELETE FROM my_timber_support_deliveries WHERE endpoint IN (SELECT endpoint FROM my_timber_support_devices WHERE user_id=?)').bind(id),DB.prepare('DELETE FROM my_timber_support_devices WHERE user_id=?').bind(id),DB.prepare('UPDATE my_timber_support_steps SET state_json=NULL,revision=revision+1,operation_id=NULL,operation_hash=NULL,updated_at=? WHERE user_id=?').bind(now,id),DB.prepare('INSERT INTO consents(user_id,consent_type,consent_version,granted,withdrawn_at,created_at) VALUES(?,?,?,0,?,?)').bind(id,CONSENT,'2026-10-23-v1',now,now)]);
}
export async function supportApi(request,env,{authenticate=authenticateMember,now=new Date()}={}){
 const url=new URL(request.url),path=url.pathname,root='/v1/my-timber-support';if(![root,root+'/device',root+'/calendar.ics'].includes(path))return json({error:'not_found'},404);
 const methods=path===root?['GET','PUT','DELETE']:path.endsWith('.ics')?['GET']:['POST','DELETE'];if(!methods.includes(request.method))return json({error:'method_not_allowed'},405);
 if(request.method!=='GET'&&(request.headers.get('Origin')!==url.origin||!request.headers.get('Content-Type')?.startsWith('application/json')))return json({error:'origin_not_allowed'},403);
 let auth;try{auth=await authenticate(request,env);}catch{return json({error:'authentication_unavailable'},503)}if(auth.response)return json({error:'authentication_required'},401);
 try{
  const DB=env.DB,id=auth.userId,row=await readStep(DB,id),allowed=await hasConsent(DB,id);
  if(request.method==='GET'){
   if(path.endsWith('.ics')){if(!allowed)return json({error:'support_consent_required'},409);return new Response(calendar(decode(row)),{headers:{...HEADERS,'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'attachment; filename="My-Timber-reminder.ics"'}});}
   const device=await DB.prepare('SELECT COUNT(*) AS count FROM my_timber_support_devices WHERE user_id=? AND session_id=?').bind(id,auth.user.session_id).first();
   const config=await DB.prepare('SELECT public_key FROM fit_notification_config WHERE id=1').first().catch(()=>null);
   return json({...publicState(allowed?row:row?{...row,state_json:null}:null),deviceEnabled:Number(device?.count||0)>0,publicKey:config?.public_key||null,account:String(id),sessionExpiresAt:auth.user.expires_at});
  }
  const raw=await request.text();if(raw.length>4096)return json({error:'request_too_large'},413);let body;try{body=JSON.parse(raw)}catch{return json({error:'invalid_json'},400)}
  if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'invalid_request'},400);
  if(path===root&&request.method==='DELETE'){if(!Number.isSafeInteger(body.revision)||body.revision!==(row?.revision||0))return json({error:'changed_in_another_tab'},409);await forgetSupport(DB,id,now.toISOString());return json({ok:true,...publicState(await readStep(DB,id))});}
  if(path===root+'/device'){
   if(request.method==='DELETE'){if(Object.keys(body).some(k=>k!=='endpoint'))fail('invalid_request');if(body.endpoint){if(!validEndpoint(body.endpoint))fail('invalid_subscription');await DB.batch([DB.prepare('DELETE FROM my_timber_support_deliveries WHERE endpoint IN (SELECT endpoint FROM my_timber_support_devices WHERE endpoint=? AND user_id=?)').bind(body.endpoint,id),DB.prepare('DELETE FROM my_timber_support_devices WHERE endpoint=? AND user_id=?').bind(body.endpoint,id)]);}else await DB.batch([DB.prepare('DELETE FROM my_timber_support_deliveries WHERE endpoint IN (SELECT endpoint FROM my_timber_support_devices WHERE user_id=?)').bind(id),DB.prepare('DELETE FROM my_timber_support_devices WHERE user_id=?').bind(id)]);return json({ok:true});}
   if(!allowed||!decode(row)?.reminder)fail('save_reminder_first',409);
   if(Object.keys(body).some(k=>!['endpoint','keys','consent'].includes(k))||body.consent!==true||!validEndpoint(body.endpoint)||!validKey(body.keys?.p256dh,65)||!validKey(body.keys?.auth,16))fail('invalid_subscription');
   const verified=await DB.prepare('SELECT email_verified FROM user_auth WHERE user_id=?').bind(id).first();if(Number(verified?.email_verified)!==1)fail('verify_email_first',403);
   // Session ownership prevents a former account receiving a new account's reminders.
   await DB.batch([DB.prepare('DELETE FROM my_timber_support_deliveries WHERE endpoint IN (SELECT endpoint FROM my_timber_support_devices WHERE endpoint=? AND user_id<>?)').bind(body.endpoint,id),DB.prepare('INSERT INTO my_timber_support_devices(endpoint,user_id,session_id,p256dh,auth,consented_at) VALUES(?,?,?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id,session_id=excluded.session_id,p256dh=excluded.p256dh,auth=excluded.auth,consented_at=excluded.consented_at').bind(body.endpoint,id,auth.user.session_id,body.keys.p256dh,body.keys.auth,now.toISOString())]);return json({ok:true});
  }
  const normalized=validate(body,now),hash=await fingerprint(normalized);
  if(row?.operation_id===body.operationId){if(row.operation_hash!==hash)fail('operation_already_used',409);return json({ok:true,...publicState(row)});}
  if(body.revision!==(row?.revision||0))fail('changed_in_another_tab',409);
  const state=nextState(allowed?decode(row):null,normalized,normalized.reminderAt,now),encoded=JSON.stringify(state),at=now.toISOString();
  const statement=row?DB.prepare('UPDATE my_timber_support_steps SET state_json=?,revision=revision+1,operation_id=?,operation_hash=?,updated_at=? WHERE user_id=? AND revision=?').bind(encoded,body.operationId,hash,at,id,body.revision):DB.prepare('INSERT OR IGNORE INTO my_timber_support_steps(user_id,revision,state_json,operation_id,operation_hash,updated_at) VALUES(?,1,?,?,?,?)').bind(id,encoded,body.operationId,hash,at);
  // Data and explicit consent are one transaction; stale writers cannot silently replace a saved step.
  const results=await DB.batch([statement,DB.prepare('INSERT INTO consents(user_id,consent_type,consent_version,granted,granted_at,created_at) SELECT ?,?,?,1,?,? WHERE EXISTS(SELECT 1 FROM my_timber_support_steps WHERE user_id=? AND operation_id=?)').bind(id,CONSENT,'2026-10-23-v1',at,at,id,body.operationId)]);
  if(!results[0].meta.changes)fail('changed_in_another_tab',409);
  return json({ok:true,...publicState(await readStep(DB,id))},201);
 }catch(e){return json({error:e.status?e.message:'support_unavailable'},e.status||503);}
}
export async function exportSupport(DB,id){const row=await readStep(DB,id);return{...publicState(row),deviceReminders:(await DB.prepare('SELECT consented_at FROM my_timber_support_devices WHERE user_id=?').bind(id).all()).results,deliveries:(await DB.prepare('SELECT r.reminder_id,r.status,r.at FROM my_timber_support_deliveries r JOIN my_timber_support_devices d ON d.endpoint=r.endpoint WHERE d.user_id=? ORDER BY r.at DESC').bind(id).all()).results};}
