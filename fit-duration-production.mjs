const BASE=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const ORIGIN='https://shiftsometimber.co.uk';
const nonce=`fit-duration-${Date.now()}`;
const email=`shiftsometimber+${nonce}@gmail.com`;
const password='Shift-Commissioning-2026!';
const assert=(condition,message)=>{if(!condition)throw new Error(message)};
async function call(path,{method='GET',body,cookie}={}){const headers={Origin:ORIGIN};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;const response=await fetch(BASE+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let data=null;try{data=await response.json()}catch{}return{response,data,cookie:(response.headers.get('set-cookie')||'').split(';')[0]}}

let registration=await call('/v1/auth/register',{method:'POST',body:{email,password,firstName:'DaveFitDuration',source:'commissioning'}});
assert(registration.response.status===201&&registration.cookie,`commissioning registration failed ${registration.response.status} ${JSON.stringify(registration.data)}`);
const cookie=registration.cookie;
const durations=[10,15,20,30,45,60];
const results=[];
for(const minutes of durations){
  const result=await call('/v1/fit/plan',{method:'POST',cookie,body:{days:1,minutes_per_day:minutes,location:'home',equipment:['none'],preferences:{dislikes:['running']}}});
  assert(result.response.ok,`${minutes}m plan failed ${result.response.status} ${JSON.stringify(result.data)}`);
  assert(result.data?.qualityCommissioning?.ok===true,`${minutes}m plan failed member quality gate ${JSON.stringify(result.data?.qualityCommissioning)}`);
  const session=result.data?.plan?.sessions?.[0];
  assert(session,`${minutes}m plan returned no session`);
  assert(Number(session.requested_minutes)===minutes,`${minutes}m plan lost requested duration: ${session.requested_minutes}`);
  const exercises=session.exercises||[];
  assert(exercises.length>=2,`${minutes}m plan is too thin (${exercises.length} exercises)`);
  const ids=exercises.map(x=>String(x.id||x.name||''));
  assert(new Set(ids).size===ids.length,`${minutes}m plan pads time by repeating an exercise: ${ids.join(',')}`);
  assert(exercises.every(x=>Array.isArray(x.how||x.instructions)&&(x.how||x.instructions).length>=2),`${minutes}m plan contains an exercise without usable instructions`);
  const sum=exercises.reduce((total,x)=>total+Number(x.minutes||0),0);
  assert(Number(session.estimated_minutes)===sum,`${minutes}m estimated duration does not equal composed movement duration (${session.estimated_minutes} vs ${sum})`);
  assert(sum<=minutes,`${minutes}m plan overruns requested duration (${sum}m)`);
  const utilisation=sum/minutes;
  assert(utilisation>=0.8,`${minutes}m plan materially underfills the requested session (${sum}m, ${(utilisation*100).toFixed(1)}%)`);
  const catalogue=result.data?.plan?.catalogue;
  if(catalogue){
    assert(Number(catalogue.total_items)===exercises.length,`${minutes}m catalogue telemetry denominator disagrees with served exercises`);
    assert(Number(catalogue.structured_items_served||0)+Number(catalogue.legacy_fallback_items||0)===exercises.length,`${minutes}m structured/fallback telemetry does not reconcile`);
  }
  results.push({requested_minutes:minutes,estimated_minutes:sum,utilisation_pct:+(utilisation*100).toFixed(1),exercise_count:exercises.length,unique_exercises:new Set(ids).size,quality_score:result.data.qualityCommissioning.score,structured_serving_pct:catalogue?.structured_serving_pct??null,legacy_fallback_pct:catalogue?.legacy_fallback_pct??null});
}
console.log(JSON.stringify({proof:'G2-006_FIT_DURATION_PRODUCTION_MATRIX',journey:'authenticated production member requests 10/15/20/30/45/60 minute home sessions',results},null,2));
console.log('PASS G2-006 production Fit duration matrix: all requested durations are useful, non-padding, non-overrunning, instruction-complete sessions with >=80% duration utilisation.');
