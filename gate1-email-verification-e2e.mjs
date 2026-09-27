import fs from 'node:fs';
import {handleEmailVerification} from './auth-email-verification-v1.js';

const fail=message=>{throw new Error(message)};
const assert=(condition,message)=>{if(!condition)fail(message)};

const wrangler=fs.readFileSync('wrangler.jsonc','utf8');
const entry=fs.readFileSync('worker-entry-v6.js','utf8');
const moduleSource=fs.readFileSync('auth-email-verification-v1.js','utf8');
assert(wrangler.includes('"AUTO_VERIFY_EMAIL": "false"'),'Production registration must not auto-verify email');
assert(entry.includes("handleEmailVerification"),'Worker entry must wire explicit email verification');
for(const marker of ["token_type='email_verification'",'email_verification_required','UPDATE user_sessions SET revoked_at=?','email_verified=1','VERIFY_TTL_MS=24*60*60*1000'])assert(moduleSource.includes(marker),`Verification contract missing ${marker}`);

class Statement{
  constructor(db,sql){this.db=db;this.sql=sql;this.args=[]}
  bind(...args){this.args=args;return this}
  run(){return this.db.run(this.sql,this.args)}
  first(){return this.db.first(this.sql,this.args)}
}
class FakeDB{
  constructor(){
    this.users=[{id:1,email:'verify-test@shiftsometimber.co.uk',first_name:'Dave'}];
    this.auth=new Map([[1,{email_verified:0,email_verified_at:null}]]);
    this.sessions=[];this.tokens=[];this.delivery=[];this.audit=[];this.nextTokenId=1;
  }
  prepare(sql){return new Statement(this,sql)}
  async exec(){return{success:true}}
  async batch(statements){for(const s of statements)await s.run();return statements.map(()=>({success:true}))}
  normal(sql){return String(sql).replace(/\s+/g,' ').trim().toLowerCase()}
  async run(sql,args){
    const q=this.normal(sql);
    if(q.startsWith('update user_sessions set revoked_at=? where user_id=? and revoked_at is null')){for(const s of this.sessions)if(s.user_id===Number(args[1])&&!s.revoked_at)s.revoked_at=args[0];return{success:true}}
    if(q.startsWith("update auth_tokens set used_at=? where user_id=? and token_type='email_verification' and used_at is null and id<>?")){for(const t of this.tokens)if(t.user_id===Number(args[1])&&t.token_type==='email_verification'&&!t.used_at&&t.id!==Number(args[2]))t.used_at=args[0];return{success:true}}
    if(q.startsWith("update auth_tokens set used_at=? where user_id=? and token_type='email_verification' and used_at is null")){for(const t of this.tokens)if(t.user_id===Number(args[1])&&t.token_type==='email_verification'&&!t.used_at)t.used_at=args[0];return{success:true}}
    if(q.startsWith('insert into auth_tokens')){this.tokens.push({id:this.nextTokenId++,user_id:Number(args[0]),token_hash:args[1],token_type:args[2],expires_at:args[3],used_at:null});return{success:true}}
    if(q.startsWith('insert into auth_delivery_events')){this.delivery.push({user_id:args[0],email_hash:args[1],event_type:args[2],status:args[3],provider_id:args[4],error_code:args[5]});return{success:true}}
    if(q.startsWith('insert into audit_log')){this.audit.push({user_id:Number(args[0]),action:args[1],entity_type:args[2],entity_id:args[3],metadata:args[4]});return{success:true}}
    if(q.startsWith('update user_auth set email_verified=1')){const a=this.auth.get(Number(args[2]));a.email_verified=1;a.email_verified_at=args[0];return{success:true}}
    if(q.startsWith('update auth_tokens set used_at=? where id=?')){const t=this.tokens.find(x=>x.id===Number(args[1]));if(t)t.used_at=args[0];return{success:true}}
    throw new Error(`Unsupported fake run SQL: ${q}`);
  }
  async first(sql,args){
    const q=this.normal(sql);
    if(q.includes("from auth_tokens t join users u on u.id=t.user_id join user_auth a on a.user_id=t.user_id where t.token_hash=? and t.token_type='email_verification'")){
      const t=[...this.tokens].reverse().find(x=>x.token_hash===args[0]&&x.token_type==='email_verification');if(!t)return null;const u=this.users.find(x=>x.id===t.user_id),a=this.auth.get(t.user_id);return{id:t.id,user_id:t.user_id,expires_at:t.expires_at,used_at:t.used_at,email:u.email,first_name:u.first_name,email_verified:a.email_verified};
    }
    if(q.startsWith('select u.id,u.email,u.first_name,a.email_verified from users u join user_auth a on a.user_id=u.id where lower(u.email)=?')){const u=this.users.find(x=>x.email.toLowerCase()===String(args[0]).toLowerCase());if(!u)return null;return{...u,email_verified:this.auth.get(u.id).email_verified}}
    throw new Error(`Unsupported fake first SQL: ${q}`);
  }
}

const DB=new FakeDB(),messages=[];
const env={DB,PUBLIC_SITE_URL:'https://shiftsometimber.co.uk',AUTH_EMAIL_FROM:'welcome@shiftsometimber.co.uk',EMAIL:{async send(message){messages.push(message);return{id:`mail-${messages.length}`}}}};
const headers={'Content-Type':'application/json'};
const next=async request=>{
  const path=new URL(request.url).pathname;
  if(path==='/v1/auth/register'){
    DB.sessions.push({user_id:1,revoked_at:null});
    return new Response(JSON.stringify({ok:true,user:{id:1,email:DB.users[0].email,firstName:'Dave'},emailVerified:false}),{status:201,headers:{'Content-Type':'application/json','Set-Cookie':'sst_session=fake; Path=/; HttpOnly; Secure; SameSite=Lax'}});
  }
  if(path==='/v1/auth/login'){
    DB.sessions.push({user_id:1,revoked_at:null});
    const verified=!!DB.auth.get(1).email_verified;
    return new Response(JSON.stringify({ok:true,user:{id:1,email:DB.users[0].email},emailVerified:verified}),{status:200,headers:{'Content-Type':'application/json','Set-Cookie':'sst_session=fake-login; Path=/; HttpOnly; Secure; SameSite=Lax'}});
  }
  return new Response('not found',{status:404});
};

const registerReq=new Request('https://api.shiftsometimber.co.uk/v1/auth/register',{method:'POST',headers,body:JSON.stringify({email:DB.users[0].email,password:'a-long-password',firstName:'Dave'})});
const registered=await handleEmailVerification(registerReq,env,{},next);
assert(registered.status===201,'Registration should succeed into verification-required state');
const registeredBody=await registered.json();
assert(registeredBody.verificationRequired===true&&registeredBody.emailVerified===false,'Registration must explicitly require verification');
assert((registered.headers.get('set-cookie')||'').includes('Max-Age=0'),'Registration session must be cleared before verification');
assert(DB.sessions[0].revoked_at,'Registration-created session must be revoked');
assert(messages.length===1&&messages[0].subject==='Verify your My Shift email','Registration must send verification email, not silently auto-verify');
assert(DB.tokens.filter(x=>!x.used_at).length===1,'Exactly one live verification token expected after registration');
const firstLink=messages[0].text.match(/https:\/\/[^\s]+/i)?.[0];assert(firstLink,'Verification email must contain an actionable link');

const resendReq=new Request('https://api.shiftsometimber.co.uk/v1/auth/resend-verification',{method:'POST',headers,body:JSON.stringify({email:DB.users[0].email})});
const resent=await handleEmailVerification(resendReq,env,{},next);assert(resent.status===200,'Resend should return generic success');
assert(messages.length===2,'Unverified member should receive a fresh verification email');
assert(DB.tokens.length===2&&DB.tokens[0].used_at&&!DB.tokens[1].used_at,'Resend must invalidate the previous live token');
const secondLink=messages[1].text.match(/https:\/\/[^\s]+/i)?.[0];assert(secondLink&&secondLink!==firstLink,'Resend must issue a fresh verification link');

const loginBefore=new Request('https://api.shiftsometimber.co.uk/v1/auth/login',{method:'POST',headers,body:JSON.stringify({email:DB.users[0].email,password:'a-long-password'})});
const blockedLogin=await handleEmailVerification(loginBefore,env,{},next);assert(blockedLogin.status===403,'Unverified login must be blocked');
const blockedBody=await blockedLogin.json();assert(blockedBody.error==='email_verification_required','Unverified login must explain exact boundary');
assert(DB.sessions.at(-1).revoked_at,'Login-created session must be revoked when email is unverified');

const oldTokenAttempt=await handleEmailVerification(new Request(firstLink),env,{},next);assert(oldTokenAttempt.status===302&&String(oldTokenAttempt.headers.get('location')).includes('verification_expired'),'Superseded token must not verify account');
const verified=await handleEmailVerification(new Request(secondLink),env,{},next);assert(verified.status===302&&verified.headers.get('location')==='https://shiftsometimber.co.uk/member-login.html?verified=1','Valid verification link must return member to sign-in');
assert(DB.auth.get(1).email_verified===1,'Verified state must persist in auth record');
assert(DB.tokens[1].used_at,'Verification token must be single-use');
assert(messages.length===3&&messages[2].subject==='Welcome to My Shift','Welcome must follow successful verification');
assert(DB.delivery.filter(x=>x.event_type==='email_verification'&&x.status==='sent').length===2,'Verification delivery must be observable');
assert(DB.delivery.some(x=>x.event_type==='welcome'&&x.status==='sent'),'Post-verification welcome delivery must be observable');

const replay=await handleEmailVerification(new Request(secondLink),env,{},next);assert(replay.status===302&&String(replay.headers.get('location')).includes('verification_expired'),'Verification link replay must fail closed');
const loginAfter=new Request('https://api.shiftsometimber.co.uk/v1/auth/login',{method:'POST',headers,body:JSON.stringify({email:DB.users[0].email,password:'a-long-password'})});
const allowedLogin=await handleEmailVerification(loginAfter,env,{},next);assert(allowedLogin.status===200,'Verified member must be allowed to sign in');
const unknown=await handleEmailVerification(new Request('https://api.shiftsometimber.co.uk/v1/auth/resend-verification',{method:'POST',headers,body:JSON.stringify({email:'nobody@example.com'})}),env,{},next);assert(unknown.status===200,'Unknown-email resend must remain enumeration-safe');
assert(messages.length===3,'Unknown-email resend must not send mail');

console.log('Gate 1 / M09 email verification e2e passed: register -> no session -> resend invalidates old token -> unverified login blocked -> verify -> welcome -> replay blocked -> verified login allowed.');
