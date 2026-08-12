const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const ORIGIN=process.env.SHIFT_TEST_ORIGIN||'https://shiftsometimber.co.uk';
const nonce=`g1-errors-${Date.now()}`;

function assert(condition,message){if(!condition)throw new Error(message)}
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
  for(const forbidden of ['stack','traceback','sqlite','d1_error','sql syntax','internal server error','exception at ','cloudflare ray']){
    assert(!lower.includes(forbidden),`${name}: leaked internal diagnostic marker: ${forbidden}`);
  }
  assert(result.text.length<2000,`${name}: error response is unexpectedly verbose`);
  console.log(`PASS ${name} ${result.r.status} ${result.data.error} request=${headerId}`);
}

// Unknown same-origin API route: stable 404 contract plus body request ID for support correlation.
const missing=await raw(`/v1/definitely-not-a-route-${nonce}`,{contentType:null});
assertSafeFailure('unknown route',missing,[404],{bodyRequestId:true});

// Protected member surface without a session must fail closed and never emit HTML/stack detail.
const member=await raw('/v1/profile',{contentType:null});
assertSafeFailure('unauthenticated member surface',member,[401,403]);

// Protected HQ surface without operator auth must fail closed under the same safe contract.
const hq=await raw('/v1/hq/me',{contentType:null});
assertSafeFailure('unauthenticated HQ surface',hq,[401,403]);

// Malformed JSON must degrade to a controlled validation response, not an unhandled 500.
const malformed=await raw('/v1/auth/register',{method:'POST',body:'{"email":',contentType:'application/json'});
assertSafeFailure('malformed registration JSON',malformed,[400]);

// Invalid registration data should produce a usable validation message rather than a generic crash.
const invalidRegistration=await raw('/v1/auth/register',{method:'POST',body:JSON.stringify({email:'not-an-email',password:'short'})});
assertSafeFailure('invalid registration validation',invalidRegistration,[400]);
assert(typeof invalidRegistration.data.message==='string'&&invalidRegistration.data.message.length>0,'invalid registration: missing member-facing guidance');

// Login must not enumerate accounts or expose internals for an unknown synthetic address.
const badLogin=await raw('/v1/auth/login',{method:'POST',body:JSON.stringify({email:`nobody-${nonce}@example.invalid`,password:'DefinitelyNotThePassword123!'})});
assertSafeFailure('invalid login',badLogin,[401]);
assert(badLogin.data.error==='invalid_credentials','invalid login: account-enumerating or unstable error contract');

// Password reset intentionally returns the same success message for unknown addresses.
const reset=await raw('/v1/auth/request-password-reset',{method:'POST',body:JSON.stringify({email:`nobody-${nonce}@example.invalid`})});
assert(reset.r.status===200,`password reset non-enumeration: expected 200, got ${reset.r.status}`);
assert(reset.r.headers.get('x-shift-request-id'),'password reset non-enumeration: missing X-Shift-Request-Id');
assert(reset.data?.ok===true,'password reset non-enumeration: expected generic success');
assert(typeof reset.data?.message==='string'&&/if that account exists/i.test(reset.data.message),'password reset non-enumeration: response reveals account state or lacks expected generic guidance');
console.log('PASS password-reset non-enumeration');

// Wrong method on a known route must remain a controlled not_found response rather than a framework failure.
const wrongMethod=await raw('/v1/profile',{method:'POST',body:'{}'});
assertSafeFailure('unsupported method',wrongMethod,[404],{bodyRequestId:true});

console.log('G1-007 PRODUCTION ERROR CONTRACT PASS');
