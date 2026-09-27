// Invoked only behind the existing isolated-preview nonce/host/expiry guard.
import {fastMemberLogin} from '../../member-login-fastpath-v1.js';
import {handleAuthRecovery} from '../../auth-recovery-v1.js';
import {authenticateMember} from '../../member-state-fast-v1.js';
const assert=(condition,message)=>{if(!condition)throw Error(message)};
const hex=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(n=>n.toString(16).padStart(2,'0')).join('');
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function passwordHash(password){const salt=crypto.getRandomValues(new Uint8Array(16)),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']),bits=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:100000},key,256));return `pbkdf2$100000$${b64(salt)}$${b64(bits)}`}
export async function proveResetLoginRace(env){
 const DB=env.DB,id=Date.now()*1000+Math.floor(Math.random()*1000),email='auth-race-'+crypto.randomUUID()+'@example.invalid',oldPassword='Preview-old-'+crypto.randomUUID(),newPassword='Preview-new-'+crypto.randomUUID(),token=crypto.randomUUID();
 const req=(path,body)=>new Request('https://preview.example.invalid'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 await DB.batch([
  DB.prepare("INSERT INTO users(id,email,first_name) VALUES(?,?,'Fictional auth race')").bind(id,email),
  DB.prepare('INSERT INTO user_auth(user_id,password_hash,email_verified) VALUES(?,?,1)').bind(id,await passwordHash(oldPassword)),
  DB.prepare('INSERT INTO member_status(user_id) VALUES(?)').bind(id),
  DB.prepare("INSERT INTO auth_tokens(user_id,token_hash,token_type,expires_at) VALUES(?,?,'password_reset',?)").bind(id,await hex(token),new Date(Date.now()+600000).toISOString())
 ]);
 const wrap=(sql,args=[])=>({sql,args,bind(...next){return wrap(sql,next)},run(){return DB.prepare(sql).bind(...args).run()},first(){return DB.prepare(sql).bind(...args).first()},all(){return DB.prepare(sql).bind(...args).all()}});
 let resetStatus=null,interleaved=false;
 const intercepted={prepare:sql=>wrap(sql),batch:async statements=>{
  if(!interleaved&&statements.some(s=>s.sql.startsWith('INSERT INTO user_sessions'))){
   interleaved=true;const reset=await handleAuthRecovery(req('/v1/auth/reset-password',{token,password:newPassword}),env,{},()=>{throw Error('Unexpected auth fallback')});resetStatus=reset.status;assert(resetStatus===200,'Real D1 reset must commit before held login resumes');
  }
  return DB.batch(statements.map(s=>DB.prepare(s.sql).bind(...s.args)));
 }};
 const late=await fastMemberLogin(req('/v1/auth/login',{email,password:oldPassword}),{...env,DB:intercepted});
 assert(interleaved&&late.status===401&&!late.headers.has('Set-Cookie'),'Obsolete password must not mint a session or cookie');
 const activeBeforeFresh=Number((await DB.prepare('SELECT COUNT(*) count FROM user_sessions WHERE user_id=? AND revoked_at IS NULL').bind(id).first()).count);assert(activeBeforeFresh===0,'No obsolete-credential session remains');
 const auditBeforeFresh=Number((await DB.prepare("SELECT COUNT(*) count FROM audit_log WHERE user_id=? AND action='auth.login'").bind(id).first()).count);assert(auditBeforeFresh===0,'Rejected old login cannot claim audit success');
 const fresh=await fastMemberLogin(req('/v1/auth/login',{email,password:newPassword}),env);assert(fresh.status===200,'Current password login works');
 const cookie=fresh.headers.getSetCookie().find(s=>!s.includes('Max-Age=0')).split(';')[0];
 const auth=await authenticateMember(new Request('https://preview.example.invalid/v1/member-state',{headers:{Cookie:cookie}}),env);assert(auth.userId===id,'New session is independently valid');
 return {realIsolatedD1:true,resetStatus,lateOldLoginStatus:late.status,activeBeforeFresh,auditBeforeFresh,freshLoginStatus:fresh.status,freshSessionVerified:true,externalCalls:0,productionWrites:0};
}
