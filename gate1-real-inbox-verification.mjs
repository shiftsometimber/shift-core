import fs from 'node:fs';

const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const ORIGIN='https://shiftsometimber.co.uk';
const run=String(process.env.GITHUB_RUN_ID||Date.now());
const stamp=Date.now();
const email=`shiftsometimber+gate1-${run}-${stamp}@gmail.com`;
const password='Shift-Commissioning-2026!';
const evidence={proof:'GATE1_REAL_INBOX_VERIFICATION',email,startedAt:new Date().toISOString(),steps:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const assert=(c,m)=>{if(!c)throw new Error(m)};

async function call(path,{method='GET',body,cookie}={}){
  const headers={Origin:ORIGIN};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(cookie)headers.Cookie=cookie;
  const response=await fetch(BASE+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:'manual'});
  let data=null;try{data=await response.clone().json()}catch{}
  return {response,data,cookie:(response.headers.get('set-cookie')||'').split(';')[0]};
}

const registration=await call('/v1/auth/register',{method:'POST',body:{email,password,firstName:'Gate1',lastName:'Commissioning',source:'real-inbox-commissioning',consents:[]}});
evidence.steps.push({step:'register',status:registration.response.status,emailVerified:registration.data?.emailVerified,verificationRequired:registration.data?.verificationRequired,verificationDelivery:registration.data?.verificationDelivery});
assert(registration.response.status===201,`registration failed ${registration.response.status} ${JSON.stringify(registration.data)}`);
assert(registration.data?.emailVerified===false,'registration unexpectedly bypassed verification');
assert(registration.data?.verificationRequired===true,'registration did not require email verification');
assert(registration.data?.verificationDelivery==='sent',`verification email not sent: ${registration.data?.verificationDelivery}`);

const blocked=await call('/v1/auth/login',{method:'POST',body:{email,password}});
evidence.steps.push({step:'pre_verify_login',status:blocked.response.status,error:blocked.data?.error});
assert(blocked.response.status===403&&blocked.data?.error==='email_verification_required','unverified login was not blocked');

let authenticated=null;
for(let attempt=1;attempt<=72;attempt++){
  const login=await call('/v1/auth/login',{method:'POST',body:{email,password}});
  if(login.response.ok&&login.cookie){authenticated=login;evidence.steps.push({step:'post_verify_login',status:login.response.status,emailVerified:login.data?.emailVerified,attempt});break;}
  if(login.response.status!==403||login.data?.error!=='email_verification_required')throw new Error(`verification poll unexpected response ${login.response.status} ${JSON.stringify(login.data)}`);
  if(attempt%6===0)console.log(`Waiting for real inbox verification click: ${attempt*10}s`);
  await sleep(10000);
}
assert(authenticated,'real inbox verification was not completed inside the commissioning window');
assert(authenticated.data?.emailVerified===true,'verified login did not return emailVerified=true');

const me=await call('/v1/me',{cookie:authenticated.cookie});
evidence.steps.push({step:'authenticated_me',status:me.response.status,email:me.data?.user?.email});
assert(me.response.ok,'verified session could not access /v1/me');
assert(String(me.data?.user?.email||'').toLowerCase()===email.toLowerCase(),'verified session resolved to wrong member');

const reset=await call('/v1/auth/request-password-reset',{method:'POST',body:{email}});
evidence.steps.push({step:'request_password_reset',status:reset.response.status,ok:reset.data?.ok});
assert(reset.response.ok&&reset.data?.ok===true,'real password-reset request failed');

const logout=await call('/v1/auth/logout',{method:'POST',cookie:authenticated.cookie,body:{}});
evidence.steps.push({step:'logout',status:logout.response.status,ok:logout.data?.ok});
assert(logout.response.ok,'logout failed');

evidence.completedAt=new Date().toISOString();
fs.mkdirSync('commissioning-evidence',{recursive:true});
fs.writeFileSync('commissioning-evidence/gate1-real-inbox-verification.json',JSON.stringify(evidence,null,2));
console.log(`PASS real inbox verification lifecycle for ${email}: register -> unverified login denied -> real email verification -> verified login -> authenticated member -> reset email requested -> logout.`);
