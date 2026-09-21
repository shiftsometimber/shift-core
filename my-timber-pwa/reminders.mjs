import {authenticateMember} from '../member-state-fast-v1.js';
import {getMemberPushIdentity,ensureMemberPushIdentitySchema} from '../fit-reminders-v1.js';
import webpush from 'web-push';

const root='/v1/my-timber-pwa';
const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export const deviceDDL=`CREATE TABLE IF NOT EXISTS my_timber_push_devices (
 endpoint TEXT PRIMARY KEY,user_id INTEGER NOT NULL,session_id TEXT NOT NULL,
 p256dh TEXT NOT NULL,auth TEXT NOT NULL,hour INTEGER NOT NULL DEFAULT 19,
 enabled INTEGER NOT NULL DEFAULT 0,consented_at TEXT NOT NULL,updated_at TEXT NOT NULL,
 last_test_at TEXT,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE)`;
export const deliveryDDL=`CREATE TABLE IF NOT EXISTS my_timber_push_deliveries (
 endpoint TEXT NOT NULL,local_date TEXT NOT NULL,status TEXT NOT NULL,at TEXT NOT NULL,
 PRIMARY KEY(endpoint,local_date),FOREIGN KEY(endpoint) REFERENCES my_timber_push_devices(endpoint) ON DELETE CASCADE)`;
export async function ensurePwaSchema(DB){await DB.batch([DB.prepare(deviceDDL),DB.prepare(deliveryDDL),DB.prepare('CREATE INDEX IF NOT EXISTS my_timber_push_due ON my_timber_push_devices(enabled,hour)')])}
export function validEndpoint(value){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&!u.port&&u.href.length<2048&&(u.hostname==='fcm.googleapis.com'||u.hostname==='updates.push.services.mozilla.com'||u.hostname==='web.push.apple.com'||u.hostname.endsWith('.push.apple.com')||u.hostname.endsWith('.notify.windows.com'))}catch{return false}
}
function validKey(value,length){try{return typeof value==='string'&&/^[A-Za-z0-9_-]+$/.test(value)&&atob(value.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(value.length/4)*4,'=')).length===length}catch{return false}}
function ukClock(now){const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now).map(x=>[x.type,x.value]));return{date:`${p.year}-${p.month}-${p.day}`,hour:Number(p.hour)}}
export async function pwaReminderRoutes(request,env){
 const path=new URL(request.url).pathname;if(!path.startsWith(root+'/'))return null;
 if(!['/status','/subscription','/test'].some(p=>path===root+p))return json({error:'not_found'},404);
 const allowed=path===root+'/subscription'?['PUT','DELETE']:['POST'];if(!allowed.includes(request.method))return json({error:'method_not_allowed'},405);
 // Browser writes must be same-origin JSON; no query-string subscription secrets.
 if(request.headers.get('Origin')!==new URL(request.url).origin||!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'origin_not_allowed'},403);
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 const raw=await request.text();if(raw.length>4096)return json({error:'request_too_large'},413);
 let body;try{body=JSON.parse(raw)}catch{return json({error:'invalid_json'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'invalid_request'},400);
 const verified=await env.DB.prepare('SELECT email_verified FROM user_auth WHERE user_id=?').bind(auth.userId).first();
 if(Number(verified?.email_verified)!==1)return json({error:'verification_required',message:'Verify your account email before enabling reminders.'},403);
 await ensurePwaSchema(env.DB);
 const endpoint=String(body.endpoint||body.subscription?.endpoint||'');
 if(endpoint&&!validEndpoint(endpoint))return json({error:'invalid_subscription'},400);
 if(path===root+'/status'){
  await ensureMemberPushIdentitySchema(env.DB);const identity=await getMemberPushIdentity(env);
  if(!identity)return json({error:'push_unavailable',message:'Notifications are not configured yet. Please retry later.'},503);
  const row=endpoint?await env.DB.prepare('SELECT enabled,hour,session_id FROM my_timber_push_devices WHERE endpoint=? AND user_id=?').bind(endpoint,auth.userId).first():null;
  return json({enabled:!!row?.enabled&&String(row.session_id)===String(auth.user.session_id),hour:row?.hour||19,publicKey:identity.publicKey});
 }
 if(!endpoint)return json({error:'subscription_required'},400);
 if(request.method==='DELETE'){
  // The user asked to switch off this check-in device, not other Fit subscriptions.
  await env.DB.batch([env.DB.prepare('DELETE FROM my_timber_push_deliveries WHERE endpoint=? AND EXISTS(SELECT 1 FROM my_timber_push_devices WHERE endpoint=? AND user_id=?)').bind(endpoint,endpoint,auth.userId),env.DB.prepare('DELETE FROM my_timber_push_devices WHERE endpoint=? AND user_id=?').bind(endpoint,auth.userId)]);
  return json({ok:true,enabled:false});
 }
 if(request.method==='PUT'){
  const sub=body.subscription,hour=body.hour;
  if(!validKey(sub?.keys?.p256dh,65)||!validKey(sub?.keys?.auth,16)||!Number.isInteger(hour)||hour<7||hour>21)return json({error:'invalid_subscription',message:'Check the reminder time and retry notification setup.'},400);
  const at=new Date().toISOString();
  await env.DB.prepare(`INSERT INTO my_timber_push_devices(endpoint,user_id,session_id,p256dh,auth,hour,enabled,consented_at,updated_at) VALUES(?,?,?,?,?,?,1,?,?) ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id,session_id=excluded.session_id,p256dh=excluded.p256dh,auth=excluded.auth,hour=excluded.hour,enabled=1,consented_at=excluded.consented_at,updated_at=excluded.updated_at`).bind(endpoint,auth.userId,String(auth.user.session_id),sub.keys.p256dh,sub.keys.auth,hour,at,at).run();
  await ensureMemberPushIdentitySchema(env.DB);const identity=await getMemberPushIdentity(env);
  return json({ok:true,enabled:true,hour,publicKey:identity?.publicKey});
 }
 const row=await env.DB.prepare('SELECT * FROM my_timber_push_devices WHERE endpoint=? AND user_id=? AND session_id=? AND enabled=1').bind(endpoint,auth.userId,String(auth.user.session_id)).first();
 if(!row)return json({error:'device_not_enabled'},409);
 const now=new Date(),cutoff=new Date(now.getTime()-60000).toISOString();
 const claim=await env.DB.prepare('UPDATE my_timber_push_devices SET last_test_at=? WHERE endpoint=? AND user_id=? AND (last_test_at IS NULL OR last_test_at<?)').bind(now.toISOString(),endpoint,auth.userId,cutoff).run();
 if(!claim.meta.changes)return json({error:'test_rate_limited',message:'Wait a minute before sending another test.'},429);
 try{const result=await sendPwaPush(env,row);if(result==='accepted')return json({ok:true,status:'accepted_not_receipt'});if(result==='expired')await revoke(env.DB,endpoint);return json({error:'push_not_accepted',message:'The test was not accepted. Retry setup if this device subscription has expired.'},503)}catch(error){const code=error.pwaStage==='transport'?'push_connection_failed':'push_preparation_failed';return json({error:code,message:'The test could not be sent. Reference: '+code+'. Please report this reference.'},503)}
}
export async function sendPwaPush(env,row,transport=fetch){
 if(!validEndpoint(row.endpoint))return 'expired';
 await ensureMemberPushIdentitySchema(env.DB);const identity=await getMemberPushIdentity(env);if(!identity)throw Error('push identity unavailable');
 const subscription={endpoint:row.endpoint,expirationTime:null,keys:{p256dh:row.p256dh,auth:row.auth}};
 // Pin the current RFC 8291/8292 format. The existing Fit-only library emits
 // legacy aesgcm/WebPush headers; keep its behavior unchanged in this patch.
 const payload=webpush.generateRequestDetails(subscription,JSON.stringify({kind:'my-timber-checkin',title:'Time for your check-in',body:'A minute for you. Open My Timber when you’re ready.',url:'/member/dashboard#today'}),{TTL:1800,urgency:'normal',contentEncoding:'aes128gcm',vapidDetails:identity});
 // Workers rejects redirect:'error' before making any network request.
 // Manual mode never forwards the subscription or VAPID headers elsewhere;
 // all 3xx responses fall through to rejected below.
 let response;try{response=await transport(row.endpoint,{method:payload.method,headers:payload.headers,body:payload.body,redirect:'manual',signal:AbortSignal.timeout(10000)})}catch{throw Object.assign(Error('Push transport failed'),{pwaStage:'transport'})}
 return response.ok?'accepted':[404,410].includes(response.status)?'expired':'rejected';
}
async function revoke(DB,endpoint){await DB.batch([DB.prepare('DELETE FROM my_timber_push_deliveries WHERE endpoint=?').bind(endpoint),DB.prepare('DELETE FROM my_timber_push_devices WHERE endpoint=?').bind(endpoint)])}
async function hasCheckedIn(DB,userId,date){
 const tables=(await DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('check_ins','shift_today_checkins')").all()).results.map(r=>r.name);
 if(tables.includes('check_ins')){const row=await DB.prepare('SELECT submitted_at FROM check_ins WHERE user_id=? AND case_id IS NULL ORDER BY submitted_at DESC LIMIT 1').bind(userId).first();if(row?.submitted_at&&ukClock(new Date(row.submitted_at)).date===date)return true}
 if(tables.includes('shift_today_checkins'))return !!await DB.prepare('SELECT 1 found FROM shift_today_checkins WHERE user_id=? AND local_date=?').bind(userId,date).first();
 return false;
}
export async function runPwaReminders(env,now=new Date(),send=sendPwaPush){
 await ensurePwaSchema(env.DB);const clock=ukClock(now),out={accepted:0,suppressed:0,failed:0,expired:0};
 // Session binding makes logout, password reset and account-deletion session
 // revocation suppress this device without depending on a browser cleanup event.
 const rows=(await env.DB.prepare(`SELECT d.* FROM my_timber_push_devices d JOIN users u ON u.id=d.user_id JOIN user_auth a ON a.user_id=u.id JOIN user_sessions s ON s.id=d.session_id AND s.user_id=d.user_id WHERE d.enabled=1 AND d.hour=? AND a.email_verified=1 AND s.revoked_at IS NULL AND julianday(s.expires_at)>julianday(?) AND NOT EXISTS(SELECT 1 FROM my_timber_push_deliveries r WHERE r.endpoint=d.endpoint AND r.local_date=?) ORDER BY d.endpoint LIMIT 500`).bind(clock.hour,now.toISOString(),clock.date).all()).results;
 for(const row of rows){let claimed=false,accepted=false;try{
  const claim=await env.DB.prepare("INSERT OR IGNORE INTO my_timber_push_deliveries(endpoint,local_date,status,at) VALUES(?,?,'sending',?)").bind(row.endpoint,clock.date,now.toISOString()).run();if(!claim.meta.changes)continue;claimed=true;
  if(await hasCheckedIn(env.DB,row.user_id,clock.date)){await env.DB.prepare("UPDATE my_timber_push_deliveries SET status='suppressed' WHERE endpoint=? AND local_date=?").bind(row.endpoint,clock.date).run();claimed=false;out.suppressed++;continue}
  // Recheck withdrawal/revocation immediately before transport, after the claim.
  const current=await env.DB.prepare('SELECT d.endpoint FROM my_timber_push_devices d JOIN user_sessions s ON s.id=d.session_id AND s.user_id=d.user_id WHERE d.endpoint=? AND d.user_id=? AND d.enabled=1 AND s.revoked_at IS NULL AND julianday(s.expires_at)>julianday(?)').bind(row.endpoint,row.user_id,now.toISOString()).first();if(!current)continue;
  const result=await send(env,row);
  if(result==='expired'){await revoke(env.DB,row.endpoint);out.expired++;continue}
  if(result!=='accepted'){out.failed++;continue}
  accepted=true;out.accepted++;
  await env.DB.prepare("UPDATE my_timber_push_deliveries SET status='accepted' WHERE endpoint=? AND local_date=?").bind(row.endpoint,clock.date).run();
 }catch{out.failed++}finally{if(claimed&&!accepted)await env.DB.prepare("DELETE FROM my_timber_push_deliveries WHERE endpoint=? AND local_date=? AND status='sending'").bind(row.endpoint,clock.date).run().catch(()=>{out.failed++})}}
 // Keep operational dedup records for 30 days, not a permanent engagement history.
 await env.DB.prepare('DELETE FROM my_timber_push_deliveries WHERE local_date<?').bind(ukClock(new Date(now.getTime()-30*86400000)).date).run();
 return out;
}
export async function appendPwaExport(request,env,response){
 if(new URL(request.url).pathname!=='/v1/privacy/export'||request.method!=='POST'||!response.ok)return response;
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 const payload=await response.json();
 const exists=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='my_timber_push_devices'").first();
 // Export preferences/history, not push encryption material or bearer endpoints.
 payload.myTimberNotifications={devices:[],deliveries:[]};
 if(exists){
  payload.myTimberNotifications.devices=(await env.DB.prepare('SELECT hour,enabled,consented_at,updated_at,last_test_at FROM my_timber_push_devices WHERE user_id=?').bind(auth.userId).all()).results;
  payload.myTimberNotifications.deliveries=(await env.DB.prepare('SELECT r.local_date,r.status,r.at FROM my_timber_push_deliveries r JOIN my_timber_push_devices d ON d.endpoint=r.endpoint WHERE d.user_id=? ORDER BY r.local_date DESC').bind(auth.userId).all()).results;
 }
 return json(payload);
}
