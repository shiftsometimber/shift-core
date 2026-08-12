import {recordAuthDelivery} from './auth-delivery-v1.js';
const RESET_TTL_MS=30*60*1000;
const VERIFY_TTL_MS=24*60*60*1000;
const DEFAULT_FROM='hello@shiftsometimber.co.uk';
const DEFAULT_SITE='https://shiftsometimber.co.uk';

export async function handleAuthRecovery(request,env,ctx,next){
  const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/';
  if(request.method==='POST'&&p==='/v1/auth/request-password-reset') return requestPasswordReset(request,env);
  if(request.method==='POST'&&p==='/v1/auth/reset-password') return resetPassword(request,env);
  if(request.method==='POST'&&p==='/v1/auth/change-password') return changePassword(request,env,next,ctx);
  if(request.method==='POST'&&p==='/v1/auth/request-email-verification') return requestEmailVerification(request,env,next,ctx);
  if(request.method==='POST'&&p==='/v1/auth/verify-email') return verifyEmail(request,env);
  if(request.method==='POST'&&p==='/v1/auth/register'){
    const clone=request.clone();let supplied={};try{supplied=await clone.json()}catch{}
    const response=await next(request,env,ctx);
    if(response.ok){
      try{
        const data=await response.clone().json(),user=data.user||{email:supplied.email,firstName:supplied.firstName};
        if(data.emailVerified===false){
          await issueVerification(env,{id:user?.id,email:user?.email||supplied.email,first_name:user?.firstName||user?.first_name||supplied.firstName});
        }else{
          await deliverWelcome(env,user);
        }
      }catch(e){console.warn('registration_email_observability_warning',cleanError(e))}
    }
    return response;
  }
  return null;
}

async function requestEmailVerification(request,env,next,ctx){
  const probe=await next(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);
  if(!probe.ok)return probe;
  const me=(await probe.json()).user;
  const row=await env.DB.prepare(`SELECT u.id,u.email,u.first_name,a.email_verified FROM users u JOIN user_auth a ON a.user_id=u.id WHERE u.id=?`).bind(me.id).first();
  if(!row)return cors(json({ok:false,error:'account_not_found'},404),request,env);
  if(Number(row.email_verified)===1)return cors(json({ok:true,alreadyVerified:true,message:'Your email is already verified.'}),request,env);
  await issueVerification(env,row);
  return cors(json({ok:true,verificationRequired:true,message:'We sent a fresh verification link to your email address.'}),request,env);
}

async function issueVerification(env,user){
  if(!user?.id||!user?.email)throw new Error('verification_user_missing');
  const token=randomToken(32),tokenHash=await sha256Hex(token),stamp=new Date().toISOString(),expiresAt=new Date(Date.now()+VERIFY_TTL_MS).toISOString();
  await env.DB.prepare("UPDATE auth_tokens SET used_at=? WHERE user_id=? AND token_type='email_verification' AND used_at IS NULL").bind(stamp,user.id).run();
  await env.DB.prepare('INSERT INTO auth_tokens(user_id,token_hash,token_type,expires_at) VALUES(?,?,?,?)').bind(user.id,tokenHash,'email_verification',expiresAt).run();
  if(!env.EMAIL){
    await recordAuthDelivery(env.DB,{userId:user.id,email:user.email,eventType:'email_verification',status:'binding_missing'});
    console.error('verification_email_binding_missing');
    return;
  }
  const verifyUrl=`${String(env.PUBLIC_SITE_URL||DEFAULT_SITE).replace(/\/$/,'')}/verify-email.html?token=${encodeURIComponent(token)}`;
  try{
    const result=await env.EMAIL.send({
      from:{email:String(env.AUTH_EMAIL_FROM||DEFAULT_FROM),name:'Shift Some Timber'},
      to:user.email,
      subject:'Verify your My Shift email',
      html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h1 style="color:#173c29">Verify your My Shift email</h1><p>Hi ${escapeHtml(user.first_name||user.firstName||'there')},</p><p>One quick job before your account is fully verified.</p><p><a href="${escapeHtml(verifyUrl)}" style="display:inline-block;background:#173c29;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;font-weight:bold">Verify my email</a></p><p>This link expires in 24 hours. If you did not create this account, ignore this email.</p><p>Shift Some Timber</p></div>`,
      text:`Verify your My Shift email: ${verifyUrl}\n\nThis link expires in 24 hours. If you did not create this account, ignore this email.`
    });
    await recordAuthDelivery(env.DB,{userId:user.id,email:user.email,eventType:'email_verification',status:'sent',providerId:result?.id||result?.messageId||null});
  }catch(e){
    await recordAuthDelivery(env.DB,{userId:user.id,email:user.email,eventType:'email_verification',status:'failed',errorCode:cleanError(e)});
    console.error('verification_email_failed',cleanError(e));
  }
}

async function verifyEmail(request,env){
  const b=await readJson(request),token=String(b.token||'').trim();
  if(!token)return cors(json({ok:false,error:'verification_token_required',message:'Use the verification link from your email.'},400),request,env);
  const tokenHash=await sha256Hex(token);
  const row=await env.DB.prepare(`SELECT t.id,t.user_id,t.expires_at,t.used_at,u.email,u.first_name FROM auth_tokens t JOIN users u ON u.id=t.user_id WHERE t.token_hash=? AND t.token_type='email_verification' ORDER BY t.id DESC LIMIT 1`).bind(tokenHash).first();
  if(!row||row.used_at||new Date(row.expires_at).getTime()<=Date.now())return cors(json({ok:false,error:'verification_expired',message:'That verification link has expired or has already been used.'},400),request,env);
  const stamp=new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('UPDATE user_auth SET email_verified=1,email_verified_at=?,updated_at=? WHERE user_id=?').bind(stamp,stamp,row.user_id),
    env.DB.prepare("UPDATE auth_tokens SET used_at=? WHERE user_id=? AND token_type='email_verification' AND used_at IS NULL").bind(stamp,row.user_id)
  ]);
  try{await deliverWelcome(env,{id:row.user_id,email:row.email,first_name:row.first_name})}catch(e){console.warn('post_verification_welcome_warning',cleanError(e))}
  return cors(json({ok:true,emailVerified:true,message:'Email verified. Your My Shift account is ready.'}),request,env);
}

async function requestPasswordReset(request,env){
  const b=await readJson(request),email=String(b.email||'').trim().toLowerCase();
  const generic={ok:true,message:'If that account exists, reset instructions will be sent shortly.'};
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return cors(json(generic),request,env);
  const user=await env.DB.prepare('SELECT id,email,first_name FROM users WHERE lower(email)=?').bind(email).first();
  if(user){
    const token=randomToken(32),tokenHash=await sha256Hex(token),expiresAt=new Date(Date.now()+RESET_TTL_MS).toISOString(),stamp=new Date().toISOString();
    await env.DB.prepare("UPDATE auth_tokens SET used_at=? WHERE user_id=? AND token_type='password_reset' AND used_at IS NULL").bind(stamp,user.id).run();
    await env.DB.prepare('INSERT INTO auth_tokens(user_id,token_hash,token_type,expires_at) VALUES(?,?,?,?)').bind(user.id,tokenHash,'password_reset',expiresAt).run();
    if(env.EMAIL){
      const resetUrl=`${String(env.PUBLIC_SITE_URL||DEFAULT_SITE).replace(/\/$/,'')}/reset-password.html?token=${encodeURIComponent(token)}`;
      try{const result=await env.EMAIL.send({from:{email:String(env.AUTH_EMAIL_FROM||DEFAULT_FROM),name:'Shift Some Timber'},to:user.email,subject:'Reset your My Shift password',html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h1 style="color:#173c29">Reset your My Shift password</h1><p>Hi ${escapeHtml(user.first_name||'there')},</p><p>We received a request to reset your My Shift password.</p><p><a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#173c29;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;font-weight:bold">Choose a new password</a></p><p>This link expires in 30 minutes. If you did not request this, ignore this email.</p><p>Shift Some Timber</p></div>`,text:`Reset your My Shift password: ${resetUrl}\n\nThis link expires in 30 minutes. If you did not request this, ignore this email.`});await recordAuthDelivery(env.DB,{userId:user.id,email:user.email,eventType:'password_reset',status:'sent',providerId:result?.id||result?.messageId||null})}catch(e){await recordAuthDelivery(env.DB,{userId:user.id,email:user.email,eventType:'password_reset',status:'failed',errorCode:cleanError(e)});console.error('auth_reset_email_failed',cleanError(e))}
    }else{await recordAuthDelivery(env.DB,{userId:user.id,email:user.email,eventType:'password_reset',status:'binding_missing'});console.error('auth_reset_email_binding_missing')}
  }
  return cors(json(generic),request,env);
}

async function resetPassword(request,env){
  const b=await readJson(request),token=String(b.token||'').trim(),password=String(b.password||'');
  if(!token||password.length<12)return cors(json({ok:false,error:'invalid_reset',message:'Use the reset link and choose a password of at least 12 characters.'},400),request,env);
  const tokenHash=await sha256Hex(token);
  const row=await env.DB.prepare(`SELECT id,user_id,expires_at,used_at FROM auth_tokens WHERE token_hash=? AND token_type='password_reset' ORDER BY id DESC LIMIT 1`).bind(tokenHash).first();
  if(!row||row.used_at||new Date(row.expires_at).getTime()<=Date.now())return cors(json({ok:false,error:'reset_expired',message:'That reset link has expired or has already been used.'},400),request,env);
  const hash=await hashPassword(password),stamp=new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('UPDATE user_auth SET password_hash=?,failed_login_attempts=0,locked_until=NULL,updated_at=? WHERE user_id=?').bind(hash,stamp,row.user_id),
    env.DB.prepare('UPDATE auth_tokens SET used_at=? WHERE id=?').bind(stamp,row.id),
    env.DB.prepare('UPDATE user_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL').bind(stamp,row.user_id)
  ]);
  return cors(json({ok:true,message:'Password changed. You can sign in now.'}),request,env);
}

async function changePassword(request,env,next,ctx){
  const probe=await next(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!probe.ok)return probe;
  const me=(await probe.json()).user,b=await readJson(request),current=String(b.currentPassword||''),password=String(b.password||'');
  if(password.length<12)return cors(json({ok:false,error:'weak_password',message:'Please use at least 12 characters.'},400),request,env);
  const auth=await env.DB.prepare('SELECT password_hash FROM user_auth WHERE user_id=?').bind(me.id).first();
  if(!auth||!(await verifyPassword(current,auth.password_hash)))return cors(json({ok:false,error:'invalid_current_password',message:'Your current password is not correct.'},401),request,env);
  const hash=await hashPassword(password),stamp=new Date().toISOString();await env.DB.prepare('UPDATE user_auth SET password_hash=?,failed_login_attempts=0,locked_until=NULL,updated_at=? WHERE user_id=?').bind(hash,stamp,me.id).run();
  return cors(json({ok:true,message:'Password changed.'}),request,env);
}

async function deliverWelcome(env,user){
  if(!user?.email)return;
  if(!env.EMAIL){await recordAuthDelivery(env.DB,{userId:user?.id,email:user?.email,eventType:'welcome',status:'binding_missing'});console.error('welcome_email_binding_missing');return}
  try{const result=await sendWelcomeEmail(env,user);await recordAuthDelivery(env.DB,{userId:user?.id,email:user?.email,eventType:'welcome',status:'sent',providerId:result?.id||result?.messageId||null})}catch(e){await recordAuthDelivery(env.DB,{userId:user?.id,email:user?.email,eventType:'welcome',status:'failed',errorCode:cleanError(e)});console.error('welcome_email_failed',cleanError(e))}
}
async function sendWelcomeEmail(env,user){if(!user?.email)return;return env.EMAIL.send({from:{email:String(env.AUTH_EMAIL_FROM||DEFAULT_FROM),name:'Shift Some Timber'},to:user.email,subject:'Welcome to My Shift',html:`<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h1 style="color:#173c29">Welcome to My Shift</h1><p>Hi ${escapeHtml(user.firstName||user.first_name||'there')},</p><p>Your Shift account is ready.</p><p><a href="${String(env.PUBLIC_SITE_URL||DEFAULT_SITE).replace(/\/$/,'')}/member-login.html" style="display:inline-block;background:#173c29;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;font-weight:bold">Open My Shift</a></p><p>Helping ordinary blokes feel like themselves again.</p></div>`,text:`Welcome to My Shift. Your account is ready: ${String(env.PUBLIC_SITE_URL||DEFAULT_SITE).replace(/\/$/,'')}/member-login.html`})}
async function readJson(r){try{return await r.json()}catch{return{}}}
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}
function cors(r,request,env){const h=new Headers(r.headers),o=request.headers.get('Origin'),allowed=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com',...String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean)]);if(o&&allowed.has(o))h.set('Access-Control-Allow-Origin',o);h.set('Access-Control-Allow-Credentials','true');h.set('Access-Control-Allow-Methods','POST,OPTIONS');h.set('Access-Control-Allow-Headers','Content-Type');h.set('Vary','Origin');return new Response(r.body,{status:r.status,headers:h})}
async function hashPassword(password){const iterations=100000,salt=crypto.getRandomValues(new Uint8Array(16)),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']),bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256);return `pbkdf2$${iterations}$${base64url(salt)}$${base64url(new Uint8Array(bits))}`}
async function verifyPassword(password,stored){try{const[scheme,iter,saltB64,hashB64]=String(stored).split('$');if(scheme!=='pbkdf2')return false;const salt=fromBase64url(saltB64),expected=fromBase64url(hashB64),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']),bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:Number(iter)},key,256);return constantTimeBytesEqual(new Uint8Array(bits),expected)}catch{return false}}
async function sha256Hex(value){const data=new TextEncoder().encode(String(value)),digest=new Uint8Array(await crypto.subtle.digest('SHA-256',data));return[...digest].map(b=>b.toString(16).padStart(2,'0')).join('')}
function randomToken(bytes=32){return base64url(crypto.getRandomValues(new Uint8Array(bytes)))}
function base64url(bytes){let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function fromBase64url(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0))}
function constantTimeBytesEqual(a,b){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a[i]^b[i];return d===0}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function cleanError(e){return String(e?.code||e?.name||e?.message||'delivery_error').replace(/[^a-zA-Z0-9_.:-]/g,'_').slice(0,120)}