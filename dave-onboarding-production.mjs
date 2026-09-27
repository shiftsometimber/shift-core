const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const ORIGIN='https://shiftsometimber.co.uk',nonce=`dave-onboard-${Date.now()}`,password='Shift-Commissioning-2026!';
const email=`shiftsometimber+structured-${nonce}@gmail.com`;
const assert=(c,m)=>{if(!c)throw new Error(m)};
async function call(path,{method='GET',body,cookie}={}){const h={Origin:ORIGIN,Accept:'application/json'};if(body!==undefined)h['Content-Type']='application/json';if(cookie)h.Cookie=cookie;const r=await fetch(BASE+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});let data=null;try{data=await r.json()}catch{}return{r,data,cookie:(r.headers.get('set-cookie')||'').split(';')[0]}}

const registration=await call('/v1/auth/register',{method:'POST',body:{email,firstName:'Dave',password,source:'commissioning-dave-onboarding'}});
assert(registration.r.status===201,`fresh Dave registration failed ${registration.r.status} ${JSON.stringify(registration.data)}`);
assert(registration.cookie,'fresh Dave registration did not establish a retained commissioning session');
let cookie=registration.cookie;

const baselineProfile=await call('/v1/profile',{cookie});
const baselineState=await call('/v1/member-state',{cookie});
assert(baselineProfile.r.ok&&baselineState.r.ok,'fresh Dave baseline profile/state could not be read');

const profileInput={firstName:'Dave',lastName:'Commissioning',phone:'07123456789',dateOfBirth:'1982-04-16',postcode:'SK10 1AA'};
const stateInput={
  myWhy:{why:'Feel fitter, have more energy and keep up with the family.',promise:'Do the next sensible thing rather than chase perfect.'},
  preferences:{foodDislikes:['mushrooms'],exerciseDislikes:['running'],goal:'steady_weight_loss',commissioningOnboardingNonce:nonce}
};
const savedProfile=await call('/v1/profile',{method:'PATCH',cookie,body:profileInput});
assert(savedProfile.r.ok,`Dave profile onboarding save failed ${savedProfile.r.status}`);
const savedState=await call('/v1/member-state',{method:'PATCH',cookie,body:stateInput});
assert(savedState.r.ok,`Dave personal-context onboarding save failed ${savedState.r.status}`);

const [profile,state,today]=await Promise.all([call('/v1/profile',{cookie}),call('/v1/member-state',{cookie}),call('/v1/shift/today',{cookie})]);
assert(profile.r.ok&&state.r.ok&&today.r.ok,'Dave could not enter authenticated member experience after onboarding');
for(const [apiKey,inputKey] of [['first_name','firstName'],['last_name','lastName'],['phone','phone'],['date_of_birth','dateOfBirth'],['postcode','postcode']])assert(String(profile.data?.profile?.[apiKey]||'')===profileInput[inputKey],`Dave onboarding profile did not retain ${inputKey}`);
assert(state.data?.state?.preferences?.commissioningOnboardingNonce===nonce,'Dave onboarding preferences were not retained');
assert(String(state.data?.state?.myWhy?.why||'').includes('more energy'),'Dave onboarding Why was not retained');
assert(JSON.stringify(today.data).includes('one_shift_brain'),'Dave post-onboarding Today is not using One Shift Brain');

const logout=await call('/v1/auth/logout',{method:'POST',cookie,body:{}});assert(logout.r.ok,'Dave onboarding logout failed');
const relogin=await call('/v1/auth/login',{method:'POST',body:{email,password}});assert(relogin.r.ok&&relogin.cookie,`Dave onboarding relogin failed ${relogin.r.status}`);cookie=relogin.cookie;
const [profile2,state2,today2]=await Promise.all([call('/v1/profile',{cookie}),call('/v1/member-state',{cookie}),call('/v1/shift/today',{cookie})]);
assert(profile2.r.ok&&state2.r.ok&&today2.r.ok,'Dave onboarding state was not usable after leave/return');
assert(profile2.data?.profile?.postcode===profileInput.postcode,'Dave onboarding profile was lost after leave/return');
assert(state2.data?.state?.preferences?.commissioningOnboardingNonce===nonce,'Dave onboarding personal context was lost after leave/return');
assert(JSON.stringify(today2.data).includes('one_shift_brain'),'Dave returned Today is not using One Shift Brain');

console.log(JSON.stringify({proof:'DAVE_ONBOARDING_PRODUCTION_V1',registration:registration.r.status,baselineReadable:true,profileSaved:true,personalContextSaved:true,todayAfterOnboarding:true,leaveReturnRetained:true,postReturnToday:true},null,2));
console.log('PASS Dave onboarding production journey — fresh member completed profile + personal context, entered Today, left, returned, and retained the onboarding state.');
