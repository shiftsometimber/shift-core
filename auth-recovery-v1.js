export async function handleAuthRecovery(request,env,ctx,next){
  const u=new URL(request.url), p=u.pathname.replace(/\/+$/,'')||'/';
  if(request.method==='POST'&&p==='/v1/auth/reset-password') return resetPassword(request,env);
  if(request.method==='POST'&&p==='/v1/auth/change-password') return changePassword(request,env,next,ctx);
  return null;
}

async function resetPassword(request,env){
  const b=await readJson(request), token=String(b.token||'').trim(), password=String(b.password||'');
  if(!token||password.length<12) return json({ok:false,error:'invalid_reset',message:'Use the reset link and choose a password of at least 12 characters.'},400);
  const tokenHash=await sha256Hex(token);
  const row=await env.DB.prepare(`SELECT id,user_id,expires_at,used_at FROM auth_tokens WHERE token_hash=? AND token_type='password_reset' ORDER BY id DESC LIMIT 1`).bind(tokenHash).first();
  if(!row||row.used_at||new Date(row.expires_at).getTime()<=Date.now()) return json({ok:false,error:'reset_expired',message:'That reset link has expired or has already been used.'},400);
  const hash=await hashPassword(password), now=new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('UPDATE user_auth SET password_hash=?,failed_login_attempts=0,locked_until=NULL,updated_at=? WHERE user_id=?').bind(hash,now,row.user_id),
    env.DB.prepare('UPDATE auth_tokens SET used_at=? WHERE id=?').bind(now,row.id),
    env.DB.prepare('UPDATE user_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL').bind(now,row.user_id)
  ]);
  return json({ok:true,message:'Password changed. You can sign in now.'});
}

async function changePassword(request,env,next,ctx){
  const probe=await next(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);
  if(!probe.ok) return probe;
  const me=(await probe.json()).user, b=await readJson(request), current=String(b.currentPassword||''), password=String(b.password||'');
  if(password.length<12) return json({ok:false,error:'weak_password',message:'Please use at least 12 characters.'},400);
  const auth=await env.DB.prepare('SELECT password_hash FROM user_auth WHERE user_id=?').bind(me.id).first();
  if(!auth||!(await verifyPassword(current,auth.password_hash))) return json({ok:false,error:'invalid_current_password',message:'Your current password is not correct.'},401);
  const hash=await hashPassword(password), now=new Date().toISOString();
  await env.DB.prepare('UPDATE user_auth SET password_hash=?,failed_login_attempts=0,locked_until=NULL,updated_at=? WHERE user_id=?').bind(hash,now,me.id).run();
  return json({ok:true,message:'Password changed.'});
}

async function readJson(r){try{return await r.json()}catch{return{}}}
function json(d,s=200){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}})}
async function hashPassword(password){const iterations=100000,salt=crypto.getRandomValues(new Uint8Array(16)),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']),bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations},key,256);return `pbkdf2$${iterations}$${base64url(salt)}$${base64url(new Uint8Array(bits))}`}
async function verifyPassword(password,stored){try{const[scheme,iter,saltB64,hashB64]=String(stored).split('$');if(scheme!=='pbkdf2')return false;const salt=fromBase64url(saltB64),expected=fromBase64url(hashB64),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']),bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:Number(iter)},key,256);return constantTimeBytesEqual(new Uint8Array(bits),expected)}catch{return false}}
async function sha256Hex(value){const data=new TextEncoder().encode(String(value)),digest=new Uint8Array(await crypto.subtle.digest('SHA-256',data));return[...digest].map(b=>b.toString(16).padStart(2,'0')).join('')}
function base64url(bytes){let binary='';for(const b of bytes)binary+=String.fromCharCode(b);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function fromBase64url(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0))}
function constantTimeBytesEqual(a,b){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a[i]^b[i];return d===0}
