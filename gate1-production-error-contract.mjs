import fs from 'node:fs';

const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const ORIGIN=process.env.SHIFT_TEST_ORIGIN||'https://shiftsometimber.co.uk';
const nonce=`g1-errors-${Date.now()}`;

function assert(condition,message){if(!condition)throw new Error(message)}

if(process.env.SHIFT_ERROR_CONTRACT_SOURCE_ONLY==='1'){
  const entry=fs.readFileSync('worker-entry-v6.js','utf8');
  for(const marker of ["X-Shift-Request-Id","Cache-Control","no-store","X-Content-Type-Options","nosniff"])assert(entry.includes(marker),`source contract missing ${marker}`);
  assert(/function withMemberCors\([\s\S]*?X-Shift-Request-Id[\s\S]*?return new Response/.test(entry),'intercepted member responses do not visibly receive the safe response envelope');
  console.log('G1-007 SOURCE ERROR-ENVELOPE CONTRACT PASS — production proof remains mandatory after deployment');
  process.exit(0);
}

async function raw(path,{method='GET',body,contentType='application/json'}={}){
  const headers={Origin:ORIGIN};
  if(contentType)headers['Content-Type']=contentType;
  const r=await fetch(`${BASE}${path}`,{method,headers,body,redirect:'manual'});
  const text=await r.text();
  let data=null;try{data=JSON.parse(text)}catch{}
  return{r,text,data};
}
function assertSafeFailure(name,result,statuses,{bodyRequestId=false}={}){
  assert(statuses.includes(result.r.status),`${name}: expected ${statuses.join('/')}, got ${result.r.status}`);
  assert((result.r.headers.get('content-type')||'').toLowerCase().includes('application/json'),`${name}: failure was not JSON`);
  const headerId=result.r.headers.get('x-shift-request-id');
  assert(headerId,`${name}: missing X-Shift-Request-Id`);
  assert(result.data&&typeof result.data==='object',`${name}: invalid JSON failure body`);
  assert(typeof result.data.error==='string'&&result.data.error.length>0,`${name}: missing stable error code`);
  if(bodyRequestId)assert(result.data.requestId,`${name}: missing body requestId`);
  const lower=result.text.toLowerCase();
  for(const forbidden of ['stack','traceback','sqlite','d1_error','sql syntax','internal server error','exception at ','cloudflare ray'])assert(!lower.includes(forbidden),`${name}: leaked internal diagnostic marker: ${forbidden}`);
  assert(result.text.length<2000,`${name}: error response is unexpectedly verbose`);
  console.log(`PASS ${name} ${result.r.status} ${result.data.error} request=${headerId}`);
}

const missing=await raw(`/v1/definitely-not-a-route-${nonce}`,{contentType:null});
assertSafeFailure('unknown route',missing,[404],{bodyRequestId:true});

const member=await raw('/v1/profile',{contentType:null});
assertSafeFailure('unauthenticated member surface',member,[401,403]);

const hq=await raw('/v1/hq/me',{contentType:null});
assertSafeFailure('unauthenticated HQ surface',hq,[401,403]);

const malformed=await raw('/v1/auth/register',{method:'POST',body:'{"email":',contentType:'application/json'});
assertSafeFailure('malformed registration JSON',malformed,[400]);

const invalidRegistration=await raw('/v1/auth/register',{method:'POST',body:JSON.stringify({email:'not-an-email',password:'short'})});
assertSafeFailure('invalid registration validation',invalidRegistration,[400]);
assert(typeof invalidRegistration.data.message==='string'&&invalidRegistration.data.message.length>0,'invalid registration: missing member-facing guidance');

const badLogin=await raw('/v1/auth/login',{method:'POST',body:JSON.stringify({email:`nobody-${nonce}@example.invalid`,password:'DefinitelyNotThePassword123!'})});
assertSafeFailure('invalid login',badLogin,[401]);
assert(badLogin.data.error==='invalid_credentials','invalid login: account-enumerating or unstable error contract');

const reset=await raw('/v1/auth/request-password-reset',{method:'POST',body:JSON.stringify({email:`nobody-${nonce}@example.invalid`})});
assert(reset.r.status===200,`password reset non-enumeration: expected 200, got ${reset.r.status}`);
assert(reset.r.headers.get('x-shift-request-id'),'password reset non-enumeration: missing X-Shift-Request-Id');
assert(reset.data?.ok===true,'password reset non-enumeration: expected generic success');
assert(typeof reset.data?.message==='string'&&/if that account exists/i.test(reset.data.message),'password reset non-enumeration: response reveals account state or lacks expected generic guidance');
console.log('PASS password-reset non-enumeration');

const wrongMethod=await raw('/v1/profile',{method:'POST',body:'{}'});
assertSafeFailure('unsupported method',wrongMethod,[404],{bodyRequestId:true});

console.log('G1-007 PRODUCTION ERROR CONTRACT PASS');
