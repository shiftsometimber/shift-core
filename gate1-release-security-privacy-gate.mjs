import fs from 'node:fs';

let failed=false;
const fail=m=>{console.error(`FAIL ${m}`);failed=true};
const ok=m=>console.log(`PASS ${m}`);
const read=p=>fs.readFileSync(p,'utf8');

const worker=read('worker.js');
const login=read('member-login-fastpath-v1.js');
const entry=read('worker-entry-v6.js');
const entryCompact=entry.replace(/"/g,"'").replace(/\s+/g,'');
const security=read('security-privacy-v1.js');
const analytics=read('product-analytics-v1.js');
const identity=read('commissioning-identity-v1.js');
const recovery=read('auth-recovery-v1.js');
const deletion=read('privacy-account-request-v1.js');

const requireText=(src,text,label)=>src.includes(text)?ok(label):fail(`${label}: missing ${text}`);
const forbid=(src,re,label)=>re.test(src)?fail(label):ok(label);

for(const marker of ["headers.set('X-Shift-Request-Id'","headers.set('Cache-Control', 'no-store')","headers.set('X-Content-Type-Options', 'nosniff')"]) requireText(worker,marker,`core response envelope ${marker}`);
for(const marker of ["headers.set('X-Shift-Request-Id'","headers.set('Cache-Control','no-store')","headers.set('X-Content-Type-Options','nosniff')"]) requireText(entryCompact,marker.replace(/\s+/g,''),`member response envelope ${marker}`);

for(const marker of ["if (method === 'POST' && path === '/v1/privacy/export')","if (method === 'DELETE' && path === '/v1/privacy/account')","const auth = await requireUser(request, env)","await receiveAccountDeletion(env.DB,auth.user.id)"]) requireText(worker,marker,`privacy boundary ${marker}`);

requireText(worker,"import {receiveAccountDeletion} from './privacy-account-request-v1.js'",'deletion handler import');
for(const marker of ['await DB.batch([','INSERT INTO data_requests','INSERT INTO hq_tasks','UPDATE user_sessions SET revoked_at=? WHERE user_id=? AND revoked_at IS NULL'])requireText(deletion,marker,'atomic deletion receipt '+marker);

for(const marker of ["httpOnly:true","secure:true","sameSite:'Lax'","exportRequired:true","deleteRequired:true","hqWritesRequired:true","clientExposureForbidden:true","assertMemberBoundary","rejectMaliciousText"]) requireText(security,marker,`security policy ${marker}`);

for(const key of ['password','token','secret','email','phone','address','symptom','diagnosis','medication','name','postcode','dob']) requireText(security,`'${key}'`,`analytics deny-key ${key}`);
for(const key of ['password','token','secret','email','phone','address','symptom','diagnos','medication']) requireText(analytics,key,`runtime analytics sanitiser ${key}`);
requireText(analytics,"if(!ALLOWED_EVENTS.has(name))throw new Error",'analytics event allowlist enforced');
requireText(analytics,"const a=await auth(request,env,ctx)",'analytics endpoint authenticated');

for(const marker of ["AUDIENCE='shift-production-commissioning'","REPOSITORY='shiftsometimber/shift-core'","ACTOR_ID='315011648'","SYNTHETIC=/^shiftsometimber\\+","ALLOWED_WORKFLOWS","header.alg!=='RS256'","claims.iss!==ISSUER","claims.repository!==REPOSITORY","String(claims.actor_id)!==ACTOR_ID"]) requireText(identity,marker,`commissioning identity restriction ${marker}`);
forbid(identity,/AUTO_VERIFY_EMAIL|verificationRequired\s*:\s*false[\s\S]*email\.test/i,'commissioning identity must not become generic verification bypass');

for(const marker of ['RESET_TTL_MS=30*60*1000','password.length<12','constantTimeBytesEqual','token_type=\'password_reset\'']) requireText(recovery,marker,`recovery security ${marker}`);

for(const marker of ['PBKDF2','iterations = 100000','HttpOnly','Secure','SameSite=Lax']) requireText(worker,marker,`auth defence ${marker}`);

for(const marker of ['failed_login_attempts','const LOCK_AFTER=8','attempts>=LOCK_AFTER','const LOCK_MS=15*60*1000','Date.now()+LOCK_MS','WHERE user_id=? AND password_hash=? AND email_verified=1','Number(committed[0]?.meta?.changes)!==1']) requireText(login,marker,`canonical login defence ${marker}`);
requireText(worker,'return fastMemberLogin(new Request(url,request),env)','legacy login shares guarded canonical authentication');

if(failed)process.exit(1);
console.log('G1-010 / M05 RELEASE SECURITY-PRIVACY SOURCE GATE PASS');
