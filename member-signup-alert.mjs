import {SHIFT_MAILBOXES} from './transactional-email-v1.js';
import {recordAuthDelivery} from './auth-delivery-v1.js';

export const SIGNUP_ALERT_SCHEMA = `CREATE TABLE IF NOT EXISTS member_signup_alerts (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','sending','accepted','uncertain','suppressed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  provider_id TEXT,
  last_error TEXT
)`;
const enabled=env=>env.MEMBER_SIGNUP_ALERTS_ENABLED==='true';
const stamp=()=>new Date().toISOString();
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=value=>String(value??'').replace(/[\r\n\u0000-\u001f]/g,' ').trim().slice(0,200);

export function signupAlertMessage(user,{test=false}={}){
  const name=clean([user.first_name,user.last_name].filter(Boolean).join(' '))||'Name not supplied';
  const title=(test?'TEST — ':'')+'New My Timber member';
  const lines=[title,'',`Name: ${name}`,`Email: ${clean(user.email)}`,`Member reference: ${Number(user.id)}`,`Signed up: ${clean(user.signed_up_at)}`,'','A new account was created. Email verification may still be pending.','Open SHIFT HQ to view the account.'];
  return {from:{email:SHIFT_MAILBOXES.hq,name:'SHIFT'},to:SHIFT_MAILBOXES.hello,subject:`${title} · #${Number(user.id)}`,text:lines.join('\n'),html:`<!doctype html><html><body style="margin:0;background:#050505;color:#E7E3DA;font-family:Arial,sans-serif"><main style="max-width:600px;margin:auto;padding:32px"><p style="color:#707762;font-weight:bold">SHIFT SOME TIMBER</p><h1>${escape(title)}</h1><p><strong>${escape(name)}</strong></p><p>${escape(user.email)}</p><p>Member reference: ${Number(user.id)}<br>Signed up: ${escape(user.signed_up_at)}</p><p>A new account was created. Email verification may still be pending.</p><p>Open SHIFT HQ to view the account.</p></main></body></html>`};
}

// Called only after successful public registration, outside the commissioning
// path. No scanning/backfill of old accounts; verification resends never call it.
export async function queueSignupAlert(env,userId,ctx){
  if(!enabled(env)||!env.DB||!Number.isSafeInteger(userId)||userId<=0)return {disabled:true};
  try{
    await env.DB.prepare(SIGNUP_ALERT_SCHEMA).run();
    const at=stamp();
    await env.DB.prepare("INSERT OR IGNORE INTO member_signup_alerts(user_id,state,created_at,updated_at) SELECT ?,'pending',?,? WHERE EXISTS(SELECT 1 FROM users u JOIN user_auth a ON a.user_id=u.id WHERE u.id=?)").bind(userId,at,at,userId).run();
    const job=deliverSignupAlert(env,userId).catch(()=>console.error('signup_alert_delivery_deferred',{userId}));
    if(ctx?.waitUntil)ctx.waitUntil(job);else await job;
    return {queued:true};
  }catch{
    // Notification failure must never invalidate a successfully created account.
    console.error('signup_alert_queue_failed',{userId});
    return {queued:false};
  }
}

export async function deliverSignupAlert(env,userId){
  if(!enabled(env))return {disabled:true};
  if(!env.EMAIL?.send)return {pending:true,reason:'email_binding_unavailable'};
  const user=await env.DB.prepare("SELECT u.id,u.email,u.first_name,u.last_name,n.created_at AS signed_up_at FROM member_signup_alerts n JOIN users u ON u.id=n.user_id JOIN user_auth a ON a.user_id=u.id WHERE n.user_id=? AND n.state='pending'").bind(userId).first();
  if(!user)return {sent:false};
  // The address is read from the committed account, never from a retry payload.
  const claim=await env.DB.prepare("UPDATE member_signup_alerts SET state='sending',updated_at=?,last_error=NULL WHERE user_id=? AND state='pending'").bind(stamp(),userId).run();
  if(Number(claim.meta?.changes)!==1)return {sent:false};
  let state='uncertain',providerId=null;
  try{
    const result=await env.EMAIL.send(signupAlertMessage(user));
    providerId=String(result?.id||result?.messageId||'').slice(0,200)||null;
    state='accepted';
  }catch{
    // The provider may have accepted the email before the connection failed.
    // Never blindly resend an ambiguous send and create duplicate operator mail.
    console.error('signup_alert_delivery_uncertain',{userId});
  }
  await env.DB.prepare("UPDATE member_signup_alerts SET state=?,provider_id=?,last_error=?,updated_at=? WHERE user_id=? AND state='sending'").bind(state,providerId,state==='uncertain'?'provider_acceptance_unknown':null,stamp(),userId).run();
  await recordAuthDelivery(env.DB,{userId,email:SHIFT_MAILBOXES.hello,eventType:'member_signup_operator',status:state,providerId}).catch(()=>console.error('signup_alert_audit_failed',{userId}));
  return {state};
}

export async function retryPendingSignupAlerts(env){
  if(!enabled(env)||!env.DB)return {disabled:true};
  // No schema mutation on an unrelated preview or before the guarded migration.
  if(!await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='member_signup_alerts'").first())return {processed:0};
  const {results=[]}=await env.DB.prepare("SELECT user_id FROM member_signup_alerts WHERE state='pending' ORDER BY created_at,user_id LIMIT 25").all();
  for(const row of results)await deliverSignupAlert(env,Number(row.user_id));
  const {results:states=[]}=await env.DB.prepare('SELECT state,COUNT(*) AS count FROM member_signup_alerts GROUP BY state').all();
  return {processed:results.length,states,providerAcceptanceIsNotInboxReceipt:true};
}
