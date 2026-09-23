// Security-sensitive account identity changes. Disabled unless explicitly enabled.
// Password re-entry plus BOTH mailbox confirmations. GET links never consume tokens.
import {authenticateMember} from '../member-state-fast-v1.js';
import {emailChangePage,emailConfirmationRuntime} from './member-email-client.mjs';
const H={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','Vary':'Cookie'};
const json=(b,s=200)=>Response.json(b,{status:s,headers:H});
const err=(error,message,status=400)=>json({ok:false,error,message},status);
const object=b=>b&&typeof b==='object'&&!Array.isArray(b);
const hex=bytes=>[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
const hash=async value=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));
const token=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
const validEmail=e=>typeof e==='string'&&e.length<=254&&/^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(e);
const at=()=>new Date().toISOString();
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function verifyEmailChangePassword(password,stored){
 try{
  const parts=String(stored).split('$');if(parts.length!==4||parts[0]!=='pbkdf2')return false;
  const count=Number(parts[1]);if(!Number.isInteger(count)||count<100000||count>1000000)return false;
  const decode=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
  const salt=decode(parts[2]),expected=decode(parts[3]);if(salt.length<16||salt.length>64||expected.length!==32)return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const actual=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:count,salt},key,256));
  let diff=0;for(let i=0;i<actual.length;i++)diff|=actual[i]^expected[i];return diff===0;
 }catch{return false;}
}
async function bodyOf(request){
 const reader=request.body?.getReader();if(!reader)throw Error('invalid_json');let length=0,chunks=[];
 try{for(;;){const r=await reader.read();if(r.done)break;length+=r.value.length;if(length>4096){await reader.cancel();throw Error('too_large');}chunks.push(r.value);}}
 finally{reader.releaseLock();}
 const data=new Uint8Array(length);let offset=0;for(const c of chunks){data.set(c,offset);offset+=c.length;}
 const body=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));if(!object(body))throw Error('invalid_json');return body;
}
function sourceOrigin(request,env){
 const origin=new URL(request.url).origin;
 if(origin==='https://shiftsometimber.co.uk'||origin==='https://www.shiftsometimber.co.uk')return origin;
 if(origin==='https://shift-stabilisation-preview.matobrien.workers.dev'&&env.SHIFT_ENVIRONMENT==='stabilisation-preview-20260917')return origin;
 return null;
}
async function send(env,to,subject,text){
 return env.EMAIL.send({from:{email:String(env.AUTH_EMAIL_FROM||'hello@shiftsometimber.co.uk'),name:'Shift Some Timber'},to,subject,text,html:'<div style="font-family:Arial,sans-serif;max-width:620px;white-space:pre-wrap">'+escape(text)+'</div>'});
}
async function rowFor(env,id){return env.DB.prepare('SELECT * FROM member_email_changes WHERE user_id=?').bind(id).first();}
function statusView(row){
 const active=row&&['sending','pending'].includes(row.status)&&Date.parse(row.expires_at)>Date.now();
 return {ok:true,enabled:true,pending:Boolean(active),...(active?{requestId:row.request_id,newEmail:row.new_email,expiresAt:row.expires_at,currentMailboxConfirmed:Boolean(row.old_confirmed),newMailboxConfirmed:Boolean(row.new_confirmed),preparing:row.status==='sending'}:{}),message:active?'Confirm the links in BOTH mailboxes. Your sign-in email stays unchanged until then.':'No email change is pending.'};
}
async function cancelRow(env,id,requestId){return env.DB.prepare("UPDATE member_email_changes SET status='cancelled',old_email='',new_email='',password_fingerprint='',old_token_hash=NULL,new_token_hash=NULL,cancel_token_hash=NULL,updated_at=? WHERE user_id=? AND request_id=? AND status IN ('sending','pending')").bind(at(),id,requestId).run();}
async function requestChange(request,env,auth,body){
 if(Object.keys(body).some(k=>!['currentPassword','newEmail','confirmEmail','operationId'].includes(k))||typeof body.currentPassword!=='string'||body.currentPassword.length<1||body.currentPassword.length>1024||!validEmail(body.newEmail?.trim())||body.newEmail.trim().toLowerCase()!==body.confirmEmail?.trim().toLowerCase()||typeof body.operationId!=='string'||!/^[a-f0-9-]{36}$/.test(body.operationId))return err('invalid_request','Enter your current password and the same valid new email twice.');
 const newEmail=body.newEmail.trim().toLowerCase(),oldEmail=String(auth.user.email).toLowerCase(),id=auth.userId;
 if(newEmail===oldEmail)return err('email_unchanged','That is already your sign-in email.');
 const previous=await rowFor(env,id);
 if(previous?.request_id===body.operationId){
  if(previous.new_email===newEmail&&['sending','pending'].includes(previous.status)&&Date.parse(previous.expires_at)>Date.now())return json(statusView(previous),202);
  return err('request_used','That request has expired or was cancelled. Start a new request.',409);
 }
 // Bounded own-account attempts, including wrong passwords. No IP/identity enumeration.
 const now=at();
 const limit=await env.DB.prepare("INSERT INTO member_email_change_limits(user_id,window_started_at,attempts) VALUES(?,?,1) ON CONFLICT(user_id) DO UPDATE SET attempts=CASE WHEN julianday(member_email_change_limits.window_started_at)<=julianday('now','-15 minutes') THEN 1 ELSE member_email_change_limits.attempts+1 END,window_started_at=CASE WHEN julianday(member_email_change_limits.window_started_at)<=julianday('now','-15 minutes') THEN excluded.window_started_at ELSE member_email_change_limits.window_started_at END RETURNING attempts").bind(id,now).first();
 if(limit.attempts>5)return err('rate_limited','Too many email-change attempts. Wait 15 minutes before trying again.',429);
 const credentials=await env.DB.prepare('SELECT password_hash,locked_until FROM user_auth WHERE user_id=?').bind(id).first();
 if(!credentials||Date.parse(credentials.locked_until||'')>Date.now()||!(await verifyEmailChangePassword(body.currentPassword,credentials.password_hash)))return err('reauthentication_required','Your current password could not be verified.',401);
 if(await env.DB.prepare('SELECT id FROM users WHERE lower(email)=? AND id<>?').bind(newEmail,id).first())return err('email_unavailable','That email cannot be used. Try a different address or contact support.',409);
 const origin=sourceOrigin(request,env);if(!origin)return err('invalid_origin','Use the My Timber website to change your email.',403);
 const oldToken=token(),newToken=token(),cancelToken=token(),nonce=crypto.randomUUID(),expires=new Date(Date.now()+1800000).toISOString(),fingerprint=await hash(credentials.password_hash);
 const created=await env.DB.prepare(`INSERT INTO member_email_changes(user_id,request_id,old_email,new_email,password_fingerprint,old_token_hash,new_token_hash,cancel_token_hash,status,expires_at,write_nonce,created_at,updated_at)
 SELECT ?,?,?,?,?,?,?,?,'sending',?,?,?,? WHERE EXISTS(SELECT 1 FROM users u JOIN user_auth a ON a.user_id=u.id WHERE u.id=? AND lower(u.email)=? AND a.password_hash=?)
 ON CONFLICT(user_id) DO UPDATE SET request_id=excluded.request_id,old_email=excluded.old_email,new_email=excluded.new_email,password_fingerprint=excluded.password_fingerprint,old_token_hash=excluded.old_token_hash,new_token_hash=excluded.new_token_hash,cancel_token_hash=excluded.cancel_token_hash,old_confirmed=0,new_confirmed=0,status='sending',expires_at=excluded.expires_at,write_nonce=excluded.write_nonce,created_at=excluded.created_at,updated_at=excluded.updated_at`).bind(id,body.operationId,oldEmail,newEmail,fingerprint,await hash(oldToken),await hash(newToken),await hash(cancelToken),expires,nonce,now,now,id,oldEmail,credentials.password_hash).run();
 if(Number(created.meta?.changes)!==1)return err('account_changed','Your account changed during this request. Sign in again and retry.',409);
 const url=(t,action='confirm')=>origin+'/member/email-change#token='+t+'&action='+action;
 try{
  await send(env,auth.user.email,'Confirm your My Timber email change',`A request was made to change your sign-in email to ${newEmail}. Your existing sign-in stays unchanged unless BOTH mailboxes approve.\n\nApprove from your current mailbox: ${url(oldToken)}\n\nNot you? Cancel this request: ${url(cancelToken,'cancel')}\n\nLinks expire in 30 minutes. Do not forward them. If this was not you, cancel and change your password.`);
  await send(env,newEmail,'Verify your new My Timber email',`Confirm that you control this new email address: ${url(newToken)}\n\nYour existing My Timber email is unchanged until the confirmation from your current mailbox is also completed. Links expire in 30 minutes. Do not forward them. If you did not request this, ignore this message.`);
 }catch{await cancelRow(env,id,body.operationId);return err('delivery_failed','The confirmation emails could not both be sent. Your sign-in email is unchanged. Start a new request later.',503);}
 const ready=await env.DB.prepare("UPDATE member_email_changes SET status='pending',updated_at=? WHERE user_id=? AND request_id=? AND write_nonce=? AND status='sending' AND julianday(expires_at)>julianday('now')").bind(at(),id,body.operationId,nonce).run();
 if(Number(ready.meta?.changes)!==1)return err('request_replaced','This request was replaced or expired. Use only the newest confirmation emails.',409);
 return json(statusView(await rowFor(env,id)),202);
}
async function confirmChange(env,body){
 if(Object.keys(body).some(k=>!['token','action'].includes(k))||typeof body.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token)||!['confirm','cancel'].includes(body.action))return err('invalid_link','This link is invalid or expired. Start a new request in Member Details.');
 const digest=await hash(body.token),r=await env.DB.prepare('SELECT * FROM member_email_changes WHERE old_token_hash=? OR new_token_hash=? OR cancel_token_hash=?').bind(digest,digest,digest).first();
 if(!r||!['sending','pending'].includes(r.status)||Date.parse(r.expires_at)<=Date.now())return err('invalid_link','This link has expired, was replaced or was already used.');
 if(body.action==='cancel'){
  if(r.cancel_token_hash!==digest)return err('invalid_link','Use the cancellation link from your current mailbox.');
  const result=await cancelRow(env,r.user_id,r.request_id);if(Number(result.meta?.changes)!==1)return err('invalid_link','This request has already finished.');
  return json({ok:true,cancelled:true,message:'Email change cancelled. Your existing sign-in email is unchanged.'});
 }
 if(r.status!=='pending')return err('request_preparing','The emails are still being prepared. Wait a moment, then press Confirm again.',409);
 const field=r.old_token_hash===digest?'old_confirmed':r.new_token_hash===digest?'new_confirmed':null;
 if(!field||r[field])return err('invalid_link','This confirmation was already used. Use the link from the other mailbox.');
 const credentials=await env.DB.prepare('SELECT password_hash FROM user_auth WHERE user_id=?').bind(r.user_id).first();
 if(!credentials||await hash(credentials.password_hash)!==r.password_fingerprint){await cancelRow(env,r.user_id,r.request_id);return err('account_changed','Your password or security details changed. Start a new email-change request.',409);}
 const nonce=crypto.randomUUID(),stamp=at(),complete="EXISTS(SELECT 1 FROM member_email_changes WHERE user_id=? AND write_nonce=? AND status='completed')";
 const confirmed="EXISTS(SELECT 1 FROM member_email_changes WHERE user_id=? AND write_nonce=? AND status='pending' AND old_confirmed=1 AND new_confirmed=1)";
 let result;
 try{result=await env.DB.batch([
  env.DB.prepare(`UPDATE member_email_changes SET ${field}=1,write_nonce=?,updated_at=? WHERE user_id=? AND request_id=? AND status='pending' AND ${field}=0 AND julianday(expires_at)>julianday('now') AND EXISTS(SELECT 1 FROM users u JOIN user_auth a ON a.user_id=u.id WHERE u.id=? AND lower(u.email)=? AND a.password_hash=?) AND NOT EXISTS(SELECT 1 FROM users WHERE lower(email)=? AND id<>?)`).bind(nonce,stamp,r.user_id,r.request_id,r.user_id,r.old_email,credentials.password_hash,r.new_email,r.user_id),
  env.DB.prepare(`UPDATE users SET email=?,updated_at=? WHERE id=? AND lower(email)=? AND ${confirmed}`).bind(r.new_email,stamp,r.user_id,r.old_email,r.user_id,nonce),
  env.DB.prepare("UPDATE member_email_changes SET status='completed',updated_at=? WHERE user_id=? AND write_nonce=? AND status='pending' AND old_confirmed=1 AND new_confirmed=1 AND EXISTS(SELECT 1 FROM users WHERE id=? AND email=?)").bind(stamp,r.user_id,nonce,r.user_id,r.new_email),
  env.DB.prepare(`UPDATE user_auth SET email_verified=1,email_verified_at=?,updated_at=? WHERE user_id=? AND ${complete}`).bind(stamp,stamp,r.user_id,r.user_id,nonce),
  env.DB.prepare(`UPDATE auth_tokens SET used_at=? WHERE user_id=? AND used_at IS NULL AND ${complete}`).bind(stamp,r.user_id,r.user_id,nonce),
  env.DB.prepare(`UPDATE user_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL AND ${complete}`).bind(stamp,r.user_id,r.user_id,nonce),
  env.DB.prepare(`INSERT INTO audit_log(user_id,action,entity_type,entity_id,metadata,created_at) SELECT ?,'member.email.changed','user',?,'{}',? WHERE ${complete}`).bind(r.user_id,String(r.user_id),stamp,r.user_id,nonce),
  env.DB.prepare("UPDATE member_email_changes SET old_email='',new_email='',password_fingerprint='',old_token_hash=NULL,new_token_hash=NULL,cancel_token_hash=NULL WHERE user_id=? AND write_nonce=? AND status='completed'").bind(r.user_id,nonce)
 ]);}catch{return err('confirmation_failed','The change could not be completed. Your previous sign-in remains in place. Retry the same confirmation.',503);}
 if(Number(result[0]?.meta?.changes)!==1)return err('account_changed','This request no longer matches your account, or that email cannot be used. Start a new request.',409);
 if(Number(result[1]?.meta?.changes)===1){
  let noticesSent=true;
  for(const email of [r.old_email,r.new_email])try{await send(env,email,'Your My Timber sign-in email has changed','Both email confirmations were completed. Sign in again using your new email and existing password. Your account, saved information and historical orders have not been replaced. If this was not you, contact support@shiftsometimber.co.uk immediately.');}catch{noticesSent=false;}
  return json({ok:true,completed:true,noticesSent,message:'Your email has changed. Sign in again with your new email and existing password.'});
 }
 return json({ok:true,completed:false,message:'This mailbox is confirmed. Complete the confirmation from your other mailbox to finish. Your sign-in email has not changed yet.'});
}
export async function memberEmailChangeRoute(request,env){
 const path=new URL(request.url).pathname.replace(/\/+$/,'');
 if(!['/v1/member/details/email-change','/v1/member/details/email-change/confirm','/member/email-change','/assets/member-experience/email-confirmation.mjs'].includes(path))return null;
 const enabled=env.MEMBER_EMAIL_CHANGE_ENABLED==='true'&&typeof env.EMAIL?.send==='function';
 if(path==='/member/email-change')return new Response(request.method==='HEAD'?null:emailChangePage(enabled),{status:['GET','HEAD'].includes(request.method)?200:405,headers:{...H,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'"}});
 if(path==='/assets/member-experience/email-confirmation.mjs')return new Response(request.method==='HEAD'?null:emailConfirmationRuntime,{status:['GET','HEAD'].includes(request.method)?200:405,headers:{...H,'Content-Type':'text/javascript; charset=utf-8'}});
 if(!['GET','POST'].includes(request.method)||path.endsWith('/confirm')&&request.method!=='POST')return err('method_not_allowed','Use the confirmation button to make this change.',405);
 if(request.method==='POST'){
  if(!sourceOrigin(request,env)||request.headers.get('Origin')!==new URL(request.url).origin)return err('origin_not_allowed','Use this My Timber page to confirm the change.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return err('json_required','Send JSON account details.',415);
 }
 if(!enabled)return json({ok:false,enabled:false,error:'email_change_unavailable',message:'Secure email change is not enabled here. Contact support@shiftsometimber.co.uk.'},503);
 let body;if(request.method==='POST')try{body=await bodyOf(request);}catch(e){return err('invalid_request','Your request could not be read.',e.message==='too_large'?413:400);}
 try{
  if(path.endsWith('/confirm'))return await confirmChange(env,body);
  const auth=await authenticateMember(request,env);if(auth.response)return new Response(auth.response.body,{status:auth.response.status,headers:{...H,'Content-Type':'application/json'}});
  if(request.method==='GET')return json(statusView(await rowFor(env,auth.userId)));
  return await requestChange(request,env,auth,body);
 }catch{return err('email_change_unavailable','Email change is temporarily unavailable. Your existing sign-in is unchanged; retry later.',503);}
}
