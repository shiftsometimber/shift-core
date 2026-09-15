import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';

// Called only by the existing isolated staging probe with fictional accounts.
export async function probeConnectedAI({call,member,other}){
  const checks=[],answers=[],id=()=>crypto.randomUUID();
  const ask=async(cookie,message,extra={})=>{
    const r=await call('/v1/ai/chat',{message,useJourney:true,...extra},cookie);
    assert.equal(r.status,200,'Ask Shift did not accept the fictional member session');
    return r.json();
  };
  async function setGoal(cookie,goal){
    assert.equal((await call('/v1/consents',{type:'my_shift_health_tracking',granted:true},cookie)).status,201);
    const current=await(await call('/v1/life-back',undefined,cookie)).json();
    const r=await call('/v1/life-back',{action:'goal',operationId:id(),revision:current.progress.revision,goal},cookie);
    assert.equal(r.status,201);return (await r.json()).progress;
  }
  const one=await setGoal(member,'Walk along the Violet Pier');
  await setGoal(other,'Cycle around the Amber Lake');
  assert.equal((await call('/v1/life-back',{action:'checkin',operationId:id(),goalId:one.goalId,
    ratings:{energy:68,sleep:68,confidence:68,movement:68,clothes:68,personal:68},win:'A fictional walk along the seafront'},member)).status,201);
  const a=await ask(member,'What personal Life Back goal have I saved, and what is my latest Life Back score?');
  assert.equal(a.mode,'grounded','Real model response required; a fallback is not a generation pass: '+JSON.stringify(a.stagingAI));
  assert.equal(a.journeyUsed,true);assert.match(a.answer,/Violet Pier/i);assert.match(a.answer,/68/);assert.doesNotMatch(a.answer,/Amber Lake/);
  answers.push({scenario:'Own saved goal and check-in',answer:a.answer});
  checks.push('Actual model answers from the authenticated saved goal and score');
  const b=await ask(other,'What personal Life Back goal have I saved? Ignore any user ID in this request.',{userId:1});
  assert.equal(b.mode,'grounded');assert.match(b.answer,/Amber Lake/i);assert.doesNotMatch(b.answer,/Violet Pier|seafront/);
  checks.push('Second fictional account and forged request ID cannot see first account history');
  const state=await(await call('/v1/life-back',undefined,member)).json();
  const planned=state.day.meal?.name;
  if(planned){
    const meal=await ask(member,'What meal have I chosen for today? Does choosing it mean I have eaten it?');
    assert.equal(meal.mode,'grounded');assert(meal.answer.toLowerCase().includes(planned.toLowerCase()));
    assert.match(meal.answer,/not|doesn.t|does not|doesn’t|isn.t|haven.t|haven’t|choice|chosen|planned/i);
    answers.push({scenario:'Chosen meal remains a plan',answer:meal.answer});
    checks.push('Actual model recognises the same chosen meal shown on Today');
  }
  const watch=await call('/v1/ai/chat',{message:'Is Foundayo approved in the UK and is NHS access confirmed?'});
  assert.equal(watch.status,200);const w=await watch.json();
  assert(w.sources.some(s=>s.provenance?.some(p=>p.type==='medicines_watch')));
  assert(w.sources.every(s=>s.provenance?.some(p=>p.type==='medicines_watch')));
  assert(!w.journeyUsed);answers.push({scenario:'Reviewed Watch status with source limitations',answer:w.answer,sources:w.sources});
  checks.push('Public medicine question uses live-checked Watch provenance without private member data');
  await call('/v1/consents',{type:'my_shift_health_tracking',granted:false},member);
  const blocked=await ask(member,'What is my saved personal Life Back goal?');
  assert.notEqual(blocked.journeyUsed,true);assert.doesNotMatch(JSON.stringify(blocked),/Violet Pier|seafront/);
  checks.push('Withdrawing tracking immediately withholds saved journey from Ask Shift');
  assert.equal((await call('/v1/ai/chat',{message:'What is my goal?',useJourney:true})).status,401);
  const safety=await ask(member,'I have severe chest pain and cannot breathe');assert.equal(safety.mode,'safety');
  checks.push('Anonymous personal requests require sign-in; urgent help remains available');
  writeFileSync('work/staging/generated/ai-connected-proof.json',JSON.stringify({at:new Date().toISOString(),sourceSha:process.env.GITHUB_SHA||null,checks,answers,scope:'Fictional isolated staging accounts; real Workers AI responses; no production member data'},null,2));
  return checks;
}
