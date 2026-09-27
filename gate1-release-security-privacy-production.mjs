const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const GOOD_ORIGIN='https://shiftsometimber.co.uk';
const EVIL_ORIGIN='https://attacker.invalid';
const nonce=`finish-security-${Date.now()}`;
const password='Shift-Security-Commissioning-2026!';
const A={email:`shiftsometimber+${nonce}-a@gmail.com`,firstName:'SecurityA'};
const B={email:`shiftsometimber+${nonce}-b@gmail.com`,firstName:'SecurityB'};
const assert=(c,m)=>{if(!c)throw new Error(m)};

async function call(path,{method='GET',body,cookie,origin=GOOD_ORIGIN,headers={}}={}){
  const h={Origin:origin,...headers};
  if(body!==undefined)h['Content-Type']='application/json';
  if(cookie)h.Cookie=cookie;
  const r=await fetch(BASE+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});
  let data=null;try{data=await r.json()}catch{}
  return{r,data,cookie:(r.headers.get('set-cookie')||'').split(';')[0]};
}
function secureEnvelope(x,label){
  assert(x.r.headers.get('cache-control')?.toLowerCase().includes('no-store'),`${label}: Cache-Control no-store missing`);
  assert(x.r.headers.get('x-content-type-options')?.toLowerCase()==='nosniff',`${label}: nosniff missing`);
  assert(x.r.headers.get('x-shift-request-id'),`${label}: request correlation missing`);
}
async function register(person){
  const x=await call('/v1/auth/register',{method:'POST',body:{...person,password,source:'commissioning-security'}});
  assert(x.r.status===201,`register ${person.firstName}: ${x.r.status} ${JSON.stringify(x.data)}`);
  assert(x.data?.commissioningIdentity==='github_actions_oidc',`register ${person.firstName}: restricted commissioning identity not evidenced`);
  assert(x.data?.emailVerified===true,`register ${person.firstName}: synthetic account not verified`);
  assert(x.cookie,`register ${person.firstName}: session missing`);
  secureEnvelope(x,`register ${person.firstName}`);
  return x.cookie;
}

// Public attacker cannot convert the restricted OIDC path into a real-member verification bypass.
const ordinary=await call('/v1/auth/register',{method:'POST',body:{email:`ordinary-security-${Date.now()}@example.com`,firstName:'Ordinary',password,source:'commissioning-security'}});
assert(ordinary.r.status===403&&ordinary.data?.error==='commissioning_identity_email_rejected',`restricted OIDC accepted a non-synthetic member identity: ${ordinary.r.status} ${JSON.stringify(ordinary.data)}`);
secureEnvelope(ordinary,'commissioning identity rejection');

// Anonymous privacy/HQ/member surfaces remain closed.
for(const [label,path,method] of [
  ['privacy export','/v1/privacy/export','POST'],
  ['privacy delete','/v1/privacy/account','DELETE'],
  ['member profile','/v1/profile','GET'],
  ['HQ identity','/v1/hq/me','GET']
]){
  const x=await call(path,{method,body:method==='GET'?undefined:{}});
  assert([401,403].includes(x.r.status),`${label}: anonymous access was not blocked (${x.r.status})`);
  secureEnvelope(x,label);
}

// Cross-origin callers never receive a credentialed allow-origin grant.
const evil=await call('/v1/me',{origin:EVIL_ORIGIN});
assert([401,403].includes(evil.r.status),`evil-origin member probe unexpected status ${evil.r.status}`);
assert(!evil.r.headers.get('access-control-allow-origin'),`evil origin received Access-Control-Allow-Origin: ${evil.r.headers.get('access-control-allow-origin')}`);
secureEnvelope(evil,'evil-origin member probe');

const a=await register(A),b=await register(B);
await call('/v1/member-state',{method:'PATCH',cookie:a,body:{preferences:{commissioningPrivacyOwner:'A',foodDislikes:['mushrooms']}}});
await call('/v1/member-state',{method:'PATCH',cookie:b,body:{preferences:{commissioningPrivacyOwner:'B',foodDislikes:['olives']}}});
await call('/v1/progress',{method:'POST',cookie:a,body:{recordedOn:'2026-08-12',weightKg:107.31,notes:`private-a-${nonce}`}});
await call('/v1/progress',{method:'POST',cookie:b,body:{recordedOn:'2026-08-12',weightKg:83.27,notes:`private-b-${nonce}`}});

// Subject-access export is authenticated, contains the member's own state and excludes the other member.
const ax=await call('/v1/privacy/export',{method:'POST',cookie:a,body:{}});
const bx=await call('/v1/privacy/export',{method:'POST',cookie:b,body:{}});
assert(ax.r.ok&&bx.r.ok,`privacy export failed A=${ax.r.status} B=${bx.r.status}`);
secureEnvelope(ax,'privacy export A');secureEnvelope(bx,'privacy export B');
const aj=JSON.stringify(ax.data),bj=JSON.stringify(bx.data);
assert(aj.includes(A.email)&&aj.includes('private-a-')&&!aj.includes(B.email)&&!aj.includes('private-b-')&&!aj.includes('83.27'),'privacy export A crossed member boundary');
assert(bj.includes(B.email)&&bj.includes('private-b-')&&!bj.includes(A.email)&&!bj.includes('private-a-')&&!bj.includes('107.31'),'privacy export B crossed member boundary');

// Deletion request is member-scoped and revokes the active session immediately.
const del=await call('/v1/privacy/account',{method:'DELETE',cookie:b,body:{}});
assert(del.r.status===202&&del.data?.status==='received',`privacy deletion request failed ${del.r.status} ${JSON.stringify(del.data)}`);
secureEnvelope(del,'privacy deletion request');
const afterDelete=await call('/v1/me',{cookie:b});
assert([401,403].includes(afterDelete.r.status),`deleted-account request did not revoke active session (${afterDelete.r.status})`);
secureEnvelope(afterDelete,'post deletion session');

// A remains independently authenticated after B's privacy request.
const aStill=await call('/v1/me',{cookie:a});
assert(aStill.r.ok&&aStill.data?.user?.email===A.email,'B privacy deletion contaminated A session');
secureEnvelope(aStill,'unrelated member survives deletion request');
await call('/v1/auth/logout',{method:'POST',cookie:a,body:{}});

console.log('G1-010 / M05 PRODUCTION SECURITY-PRIVACY PASS — restricted commissioning identity, anonymous/HQ/privacy boundaries, hostile-origin CORS, member-scoped export isolation and deletion-session revocation all proved on deployed production.');
