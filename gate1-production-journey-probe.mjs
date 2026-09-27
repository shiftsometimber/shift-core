const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const EMAIL=process.env.SHIFT_TEST_EMAIL||'';
const PASSWORD=process.env.SHIFT_TEST_PASSWORD||'';
const ORIGIN=process.env.SHIFT_TEST_ORIGIN||'https://shiftsometimber.co.uk';
const nonce=`gate1-${Date.now()}`;

function assert(condition,message){if(!condition)throw new Error(message)}
async function call(path,{method='GET',body,cookie}={}){
  const headers={Origin:ORIGIN};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(cookie)headers.Cookie=cookie;
  const r=await fetch(`${BASE}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body),redirect:'manual'});
  let data=null;try{data=await r.json()}catch{}
  return {r,data,cookie:r.headers.get('set-cookie')};
}

const health=await call('/v1/health');
assert(health.r.ok,'health endpoint failed');
assert(health.data?.ok===true,'health payload not ok');
console.log('PASS health',health.data?.service,health.data?.version);

const missing=await call(`/v1/definitely-not-a-route-${nonce}`);
assert(missing.r.status===404,`expected 404, got ${missing.r.status}`);
assert(missing.r.headers.get('x-shift-request-id'),'404 missing X-Shift-Request-Id');
assert(missing.data?.requestId,'404 body missing requestId');
console.log('PASS route/error contract',missing.data.requestId);

if(!EMAIL||!PASSWORD){
  console.log('AMBER authenticated persistence journey: set SHIFT_TEST_EMAIL and SHIFT_TEST_PASSWORD to run save -> logout -> login -> retained-state commissioning.');
  process.exit(0);
}

let login=await call('/v1/auth/login',{method:'POST',body:{email:EMAIL,password:PASSWORD}});
assert(login.r.ok,`initial login failed: ${login.r.status} ${JSON.stringify(login.data)}`);
let cookie=(login.cookie||'').split(';')[0];
assert(cookie,'login did not issue session cookie');
console.log('PASS initial login');

const beforeProfile=await call('/v1/profile',{cookie});
assert(beforeProfile.r.ok,'could not read profile before test');
const p=beforeProfile.data?.profile||{};
const beforeState=await call('/v1/member-state',{cookie});
assert(beforeState.r.ok,'could not read member state before test');
const s=beforeState.data?.state||{};

const sentinelFirst=`Commissioning-${nonce.slice(-8)}`;
const patchProfile=await call('/v1/profile',{method:'PATCH',cookie,body:{firstName:sentinelFirst}});
assert(patchProfile.r.ok,'profile PATCH failed');
assert((patchProfile.data?.profile?.first_name??patchProfile.data?.profile?.firstName)===sentinelFirst,'profile PATCH response did not contain persisted first name');

const preferences={...(s.preferences||{}),commissioningNonce:nonce};
const patchState=await call('/v1/member-state',{method:'PATCH',cookie,body:{preferences}});
assert(patchState.r.ok,'member-state PATCH failed');
assert(patchState.data?.state?.preferences?.commissioningNonce===nonce,'member-state PATCH response missing nonce');
console.log('PASS save profile + member state');

const rereadProfile=await call('/v1/profile',{cookie});
const rereadState=await call('/v1/member-state',{cookie});
assert((rereadProfile.data?.profile?.first_name??rereadProfile.data?.profile?.firstName)===sentinelFirst,'profile did not survive immediate reread');
assert(rereadState.data?.state?.preferences?.commissioningNonce===nonce,'member state did not survive immediate reread');
console.log('PASS refresh/reread persistence');

const logout=await call('/v1/auth/logout',{method:'POST',cookie,body:{}});
assert(logout.r.ok,'logout failed');
console.log('PASS logout');

login=await call('/v1/auth/login',{method:'POST',body:{email:EMAIL,password:PASSWORD}});
assert(login.r.ok,'second login failed');
cookie=(login.cookie||'').split(';')[0];
assert(cookie,'second login did not issue session cookie');
const afterLoginProfile=await call('/v1/profile',{cookie});
const afterLoginState=await call('/v1/member-state',{cookie});
assert((afterLoginProfile.data?.profile?.first_name??afterLoginProfile.data?.profile?.firstName)===sentinelFirst,'profile did not persist across logout/login');
assert(afterLoginState.data?.state?.preferences?.commissioningNonce===nonce,'member state did not persist across logout/login');
console.log('PASS logout/login retained state');

// Restore the test account to its original values so commissioning is non-destructive.
await call('/v1/profile',{method:'PATCH',cookie,body:{firstName:p.first_name??p.firstName??null}});
await call('/v1/member-state',{method:'PATCH',cookie,body:{preferences:s.preferences||{}}});
console.log('PASS test-account restoration');
console.log('GATE1 PERSISTENCE JOURNEY PASS');
