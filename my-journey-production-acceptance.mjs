const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const ORIGIN='https://shiftsometimber.co.uk';
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const nonce=`journey-weekly-${Date.now()}`;
const email=`shiftsometimber+structured-${nonce}@gmail.com`;
const password=`Sst!Journey-${nonce}`;
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
function sessionCookie(headers){
  const values=typeof headers.getSetCookie==='function'?headers.getSetCookie():[headers.get('set-cookie')||''];
  for(const value of values)for(const match of value.matchAll(/(?:^|,\s*)sst_session=([^;,\s]+)/g))if(match[1])return `sst_session=${match[1]}`;
  return'';
}

async function call(path,{method='GET',body,cookie}={}){
  const headers={Origin:ORIGIN,'X-Shift-Local-Date':'2026-08-30',...(OIDC?{'X-Shift-Commissioning-OIDC':OIDC}:{})};
  if(body!==undefined)headers['Content-Type']='application/json';
  if(cookie)headers.Cookie=cookie;
  const response=await fetch(BASE+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  let data=null;try{data=await response.json()}catch{}
  return{response,data,cookie:sessionCookie(response.headers)};
}

assert(OIDC,'SHIFT_COMMISSIONING_OIDC required for verified synthetic production acceptance');
const registration=await call('/v1/auth/register',{method:'POST',body:{email,firstName:'DaveJourney',password,source:'commissioning'}});
assert(registration.response.status===201,`register ${registration.response.status} ${JSON.stringify(registration.data)}`);
assert(registration.cookie,'registration session cookie missing');
const cookie=registration.cookie;

const setup={setup:{startDate:'2026-08-01',heightCm:175,route:'lifestyle',units:'stone_lb',targetMode:'loss',reviewDay:0,focus:'clothes',reviewCadence:'weekly',why:'Synthetic Journey acceptance only',paused:false},weight:{startKg:105,currentKg:103,targetKg:90},waist:{startCm:112,currentCm:109},clothes:{startTop:'XXL',currentTop:'XL',startTrouserWaist:'42',currentTrouserWaist:'40',beltNotchChange:1,milestone:'Old shirt fits'},wellbeing:{baseline:40,latest:60,note:'Synthetic acceptance'},lifeBack:{priority:'confidence'}};
let result=await call('/v1/journey',{method:'PATCH',cookie,body:{journey:setup}});
assert(result.response.ok&&result.data?.journey?.setup?.complete===true,`Journey setup did not complete: HTTP ${result.response.status} ${JSON.stringify(result.data)}`);

const weekOne={weekEnding:'2026-08-23',route:'lifestyle',weightKg:102.5,waistCm:108,overallFeeling:'alright',mood:'steady',energy:'mixed',confidence:'steady',sleep:'mixed',appetite:'steady',physicalComfort:'steady',gutSymptoms:'',clothesFit:'a_bit_looser',clothesDetail:{top:'XL'},lifeBack:{status:'win',note:'Walked further'},disruptions:['work_pressure'],note:'Synthetic week one'};
const weekTwo={weekEnding:'2026-08-30',route:'lifestyle',weightKg:101.8,waistCm:107,overallFeeling:'good',mood:'good',energy:'good',confidence:'good',sleep:'steady',appetite:'steady',physicalComfort:'good',gutSymptoms:'',clothesFit:'dropped_size',clothesDetail:{trouserWaist:'38'},lifeBack:{status:'win',note:'Old jeans fit'},disruptions:[],note:'Synthetic week two'};
for(const week of [weekOne,weekTwo]){result=await call('/v1/journey/weekly-check-in',{method:'POST',cookie,body:week});assert(result.response.status===201&&result.data?.saved===true,`weekly save failed ${JSON.stringify(result.data)}`)}

result=await call('/v1/journey/trends?weeks=12',{cookie});
assert(result.response.ok&&Number(result.data?.confirmed_weeks)>=2,'two confirmed Journey weeks were not retained');
assert(result.data?.observation,'Journey observation was not produced');

result=await call('/v1/journey/weekly-check-in?date=2026-08-30',{cookie});
assert(result.response.ok&&result.data?.saved?.clothesFit==='dropped_size','latest weekly state did not round-trip');

const edited={...weekTwo,overallFeeling:'great',note:'Synthetic corrected week two'};
result=await call('/v1/journey/weekly-check-in',{method:'POST',cookie,body:edited});
assert(result.response.status===201,'weekly correction failed');
result=await call('/v1/journey/weekly-check-in?date=2026-08-30',{cookie});
assert(result.data?.saved?.overallFeeling==='great'&&result.data?.saved?.note==='Synthetic corrected week two','weekly correction did not persist');

result=await call('/v1/journey/export',{cookie});
assert(result.response.ok&&result.data?.private===true&&result.data?.analyticsIdentifiers===false,'private Journey export contract failed');
assert(Array.isArray(result.data?.weekly)&&result.data.weekly.length===2,'Journey export did not contain both weeks');

result=await call('/v1/journey',{method:'DELETE',cookie});
assert(result.response.ok&&result.data?.deleted===true,'Journey cleanup failed');
result=await call('/v1/journey/weekly-check-in?date=2026-08-30',{cookie});
assert(result.response.ok&&result.data?.saved===null,'weekly records remained after Journey cleanup');

const healthErase=await call('/v1/privacy/health-tracking',{method:'DELETE',cookie});
assert(healthErase.response.ok,'optional health-data cleanup failed');
const accountErase=await call('/v1/privacy/account',{method:'DELETE',cookie});
assert(accountErase.response.ok||accountErase.response.status===202,'synthetic account erasure request failed');

console.log(JSON.stringify({ok:true,evidence:{freshSyntheticAccount:true,setupComplete:true,twoWeeklyCycles:true,trendsProduced:true,weeklyEditRoundTrip:true,privateExport:true,journeyDataDeleted:true,healthDataErased:true,accountErasureRequested:true}},null,2));
console.log('PASS fresh synthetic My Journey production cycle: setup, two confirmed weeks, trends, correction, private export and cleanup.');
