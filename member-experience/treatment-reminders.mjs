import {authenticateMember} from '../member-state-fast-v1.js';
import {trackingConsent} from './health-routes.mjs';
import {readTreatment} from './treatment-routes.mjs';
import {validEndpoint} from '../my-timber-pwa/reminders.mjs';
import {getMemberPushIdentity} from '../fit-reminders-v1.js';
import webpush from 'web-push';
const root='/v1/member/treatment-notifications';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie'}});
const key=(v,n)=>{try{return typeof v==='string'&&/^[\w-]+$/.test(v)&&Buffer.from(v,'base64url').length===n;}catch{return false;}};
export async function treatmentNotificationRoutes(request,env){
 const u=new URL(request.url);if(u.pathname!==root)return null;
 if(env.MY_TREATMENT_PREVIEW_ENABLED!=='true'&&env.MY_TREATMENT_ENABLED!=='true')return json({error:'not_enabled'},404);
 if(!['GET','PUT','DELETE'].includes(request.method))return json({error:'method_not_allowed'},405);
 const auth=await authenticateMember(request,env);if(auth.response)return json({error:'authentication_required'},401);
 if(request.method==='GET'){const identity=await getMemberPushIdentity(env);if(!identity)return json({error:'notifications_unavailable'},503);return json({publicKey:identity.publicKey});}
 if(request.headers.get('Origin')!==u.origin||!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'origin_not_allowed'},403);
 const raw=await request.text();if(raw.length>4096)return json({error:'too_large'},413);let b;try{b=JSON.parse(raw);}catch{return json({error:'invalid_json'},400);}
 if(!validEndpoint(b?.endpoint))return json({error:'invalid_subscription'},400);
 if(request.method==='DELETE'){await env.DB.prepare('DELETE FROM member_treatment_push_devices WHERE endpoint=? AND user_id=?').bind(b.endpoint,auth.userId).run();return json({ok:true});}
 if(!await trackingConsent(env.DB,auth.userId))return json({error:'health_consent_required'},409);
 if(!key(b.keys?.p256dh,65)||!key(b.keys?.auth,16))return json({error:'invalid_subscription'},400);
 await env.DB.prepare('INSERT INTO member_treatment_push_devices(endpoint,user_id,session_id,p256dh,auth,enabled_at) VALUES(?,?,?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id,session_id=excluded.session_id,p256dh=excluded.p256dh,auth=excluded.auth,enabled_at=excluded.enabled_at').bind(b.endpoint,auth.userId,auth.user.session_id,b.keys.p256dh,b.keys.auth,new Date().toISOString()).run();return json({ok:true});
}
export async function sendTreatmentPush(env,row,transport=fetch){
 const identity=await getMemberPushIdentity(env);if(!identity||!validEndpoint(row.endpoint))return 'rejected';
 const payload=webpush.generateRequestDetails({endpoint:row.endpoint,keys:{p256dh:row.p256dh,auth:row.auth}},JSON.stringify({kind:'my-timber-treatment',title:'My Timber reminder',body:'You have a scheduled reminder. Open My Timber to review it.',url:'/member/treatment'}),{TTL:1800,urgency:'normal',contentEncoding:'aes128gcm',vapidDetails:identity});
 const response=await transport(row.endpoint,{method:payload.method,headers:payload.headers,body:payload.body,redirect:'manual',signal:AbortSignal.timeout(10000)});return response.ok?'accepted':[404,410].includes(response.status)?'expired':'rejected';
}
export async function runTreatmentReminders(env,now=new Date(),send=sendTreatmentPush){
 if(env.MY_TREATMENT_PREVIEW_ENABLED!=='true'&&env.MY_TREATMENT_ENABLED!=='true')return {accepted:0};
 const out={accepted:0,suppressed:0,failed:0};
 const rows=(await env.DB.prepare('SELECT d.* FROM member_treatment_push_devices d JOIN user_sessions s ON s.id=d.session_id AND s.user_id=d.user_id WHERE s.revoked_at IS NULL AND julianday(s.expires_at)>julianday(?) LIMIT 100').bind(now.toISOString()).all()).results;
 for(const row of rows){if(!await trackingConsent(env.DB,row.user_id)){out.suppressed++;continue;}const data=await readTreatment(env.DB,row.user_id);
 for(const t of data.treatments){const due=Date.parse(t.next_at);if(t.status!=='active'||!t.reminder_enabled||!Number.isFinite(due)||due>now.getTime()||due<now.getTime()-86400000||data.events.some(e=>e.treatment_id===t.id&&e.kind==='dose_taken'&&Date.parse(e.occurred_at)>=due))continue;
 const claim=await env.DB.prepare("INSERT OR IGNORE INTO member_treatment_push_deliveries(endpoint,treatment_id,scheduled_at,status,at) VALUES(?,?,?,'sending',?)").bind(row.endpoint,t.id,t.next_at,now.toISOString()).run();if(!claim.meta.changes)continue;
 let accepted=false;try{
 const current=await env.DB.prepare('SELECT d.endpoint FROM member_treatment_push_devices d JOIN user_sessions s ON s.id=d.session_id AND s.user_id=d.user_id WHERE d.endpoint=? AND d.user_id=? AND s.revoked_at IS NULL AND julianday(s.expires_at)>julianday(?)').bind(row.endpoint,row.user_id,now.toISOString()).first();
 const latest=(await readTreatment(env.DB,row.user_id));const updated=latest.treatments.find(x=>x.id===t.id);if(!current||!await trackingConsent(env.DB,row.user_id)||updated?.status!=='active'||!updated.reminder_enabled||updated.next_at!==t.next_at||latest.events.some(e=>e.treatment_id===t.id&&e.kind==='dose_taken'&&Date.parse(e.occurred_at)>=due)){out.suppressed++;continue;}
 const result=await send(env,row);if(result==='accepted'){accepted=true;out.accepted++;await env.DB.prepare("UPDATE member_treatment_push_deliveries SET status='accepted' WHERE endpoint=? AND treatment_id=? AND scheduled_at=?").bind(row.endpoint,t.id,t.next_at).run();}else if(result==='expired'){await env.DB.prepare('DELETE FROM member_treatment_push_devices WHERE endpoint=?').bind(row.endpoint).run();}else out.failed++;
 }catch{out.failed++;}finally{if(!accepted)await env.DB.prepare("DELETE FROM member_treatment_push_deliveries WHERE endpoint=? AND treatment_id=? AND scheduled_at=? AND status='sending'").bind(row.endpoint,t.id,t.next_at).run();}
 }}return out;
}
export {treatmentServiceWorker} from './treatment-service-worker.mjs';
