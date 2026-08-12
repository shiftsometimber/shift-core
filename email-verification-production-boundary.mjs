const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const ORIGIN='https://shiftsometimber.co.uk';
const nonce=`verify-${Date.now()}`;
const email=`shiftsometimber+${nonce}@gmail.com`;
const password='Shift-Verification-Proof-2026!';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
async function call(path,{method='GET',body,cookie}={}){const headers={Origin:ORIGIN};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;const response=await fetch(BASE+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let data=null;try{data=await response.json()}catch{}return{response,data,cookie:(response.headers.get('set-cookie')||'').split(';')[0]}}

const registration=await call('/v1/auth/register',{method:'POST',body:{email,password,firstName:'DaveVerify',source:'commissioning'}});
assert(registration.response.status===201,`registration expected 201, got ${registration.response.status}: ${JSON.stringify(registration.data)}`);
assert(registration.data?.emailVerified===false,'production registration must retain emailVerified:false before verification');
assert(registration.data?.verificationRequired===true,'production registration must explicitly require email verification');
assert(!registration.cookie||registration.cookie==='sst_session=','unverified registration must not retain an authenticated session');

const loginBefore=await call('/v1/auth/login',{method:'POST',body:{email,password}});
assert(loginBefore.response.status===403,`unverified login expected 403, got ${loginBefore.response.status}: ${JSON.stringify(loginBefore.data)}`);
assert(loginBefore.data?.error==='email_verification_required','unverified login must fail with email_verification_required');
assert(!loginBefore.cookie||loginBefore.cookie==='sst_session=','unverified login must not retain an authenticated session');

const resend=await call('/v1/auth/resend-verification',{method:'POST',body:{email}});
assert(resend.response.ok&&resend.data?.ok===true,'verification resend must return enumeration-safe success');

console.log(JSON.stringify({proof:'M09_PRODUCTION_BOUNDARY_PASS',email,registration:{status:registration.response.status,emailVerified:registration.data?.emailVerified,verificationRequired:registration.data?.verificationRequired,sessionRetained:false},unverifiedLogin:{status:loginBefore.response.status,error:loginBefore.data?.error,sessionRetained:false},resend:{status:resend.response.status},next:'Use the newest verification email for this address; never log or commit its token.'}));
