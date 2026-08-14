const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const ORIGIN='https://shiftsometimber.co.uk',nonce=`finish-${Date.now()}`,password='Shift-Commissioning-2026!';
// Production commissioning deliberately accepts only the narrow structured alias family.
// Keep this synthetic isolation proof inside that allowlist rather than widening production auth.
const A={email:`shiftsometimber+structured-${nonce}-a@gmail.com`,firstName:'DaveA'},B={email:`shiftsometimber+structured-${nonce}-b@gmail.com`,firstName:'DaveB'};
const assert=(c,m)=>{if(!c)throw new Error(m)};
async function call(path,{method='GET',body,cookie}={}){const h={Origin:ORIGIN};if(body!==undefined)h['Content-Type']='application/json';if(cookie)h.Cookie=cookie;const r=await fetch(BASE+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});let data=null;try{data=await r.json()}catch{}return{r,data,cookie:(r.headers.get('set-cookie')||'').split(';')[0]}}
async function register(person){const x=await call('/v1/auth/register',{method:'POST',body:{...person,password,source:'commissioning'}});assert(x.r.status===201,`register ${person.firstName}: ${x.r.status} ${JSON.stringify(x.data)}`);assert(x.cookie,'registration session missing');return x.cookie}
const a=await register(A),b=await register(B);
const aState={preferences:{foodDislikes:['mushrooms'],exerciseDislikes:['running'],commissioningOwner:'A'}};
const bState={preferences:{foodDislikes:['olives'],exerciseDislikes:['gym'],commissioningOwner:'B'}};
for(const [cookie,state] of [[a,aState],[b,bState]]){const x=await call('/v1/member-state',{method:'PATCH',cookie,body:state});assert(x.r.ok,'state save failed')}
await call('/v1/progress',{method:'POST',cookie:a,body:{recordedOn:'2026-08-12',weightKg:111.1,notes:`A-${nonce}`}});
await call('/v1/progress',{method:'POST',cookie:b,body:{recordedOn:'2026-08-12',weightKg:88.8,notes:`B-${nonce}`}});
const [ab,bb]=await Promise.all([call('/v1/shift/brain/context?q=food',{cookie:a}),call('/v1/shift/brain/context?q=food',{cookie:b})]);
assert(ab.r.ok&&bb.r.ok,'Brain read failed');
const aj=JSON.stringify(ab.data),bj=JSON.stringify(bb.data);
assert(aj.includes('mushrooms')&&!aj.includes('olives')&&!aj.includes('88.8'),'member A context contaminated by B');
assert(bj.includes('olives')&&!bj.includes('mushrooms')&&!bj.includes('111.1'),'member B context contaminated by A');
const at=await call('/v1/shift/today',{cookie:a}),bt=await call('/v1/shift/today',{cookie:b});assert(at.r.ok&&bt.r.ok,'Today failed for authenticated members');
assert(JSON.stringify(at.data).includes('one_shift_brain'),'Today A not using Brain');assert(JSON.stringify(bt.data).includes('one_shift_brain'),'Today B not using Brain');
for(const cookie of [a,b])assert((await call('/v1/auth/logout',{method:'POST',cookie,body:{}})).r.ok,'logout failed');
async function login(email){const x=await call('/v1/auth/login',{method:'POST',body:{email,password}});assert(x.r.ok&&x.cookie,`relogin failed ${email}`);return x.cookie}
const a2=await login(A.email),b2=await login(B.email);const [as,bs]=await Promise.all([call('/v1/member-state',{cookie:a2}),call('/v1/member-state',{cookie:b2})]);
assert(as.data?.state?.preferences?.commissioningOwner==='A','A state lost across session');assert(bs.data?.state?.preferences?.commissioningOwner==='B','B state lost across session');
const [ap,bp]=await Promise.all([call('/v1/progress',{cookie:a2}),call('/v1/progress',{cookie:b2})]);assert(JSON.stringify(ap.data).includes('111.1')&&!JSON.stringify(ap.data).includes('88.8'),'A progress isolation failed');assert(JSON.stringify(bp.data).includes('88.8')&&!JSON.stringify(bp.data).includes('111.1'),'B progress isolation failed');
console.log('FINISH AUTHENTICATED PRODUCTION PASS — two real sessions isolated across state, Brain, Today and Progress; logout/login retained own state.');

// Dave's remaining automatable journey leg is onboarding. Keep the existing
// authenticated isolation proof unchanged, then execute a fresh member's real
// profile + personal-context onboarding, Today entry and leave/return retention.
await import('./dave-onboarding-production.mjs');

// Shift Me is now a production-critical member identity surface. Keep this
// inside the already-authorised production commissioning workflow so the proof
// exercises the real authenticated service rather than a parallel test path.
await import('./shift-me-production-proof.mjs');
