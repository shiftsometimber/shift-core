import {emptyLifeBack} from './life-back-routes.mjs';
import {authenticateMember} from '../member-state-fast-v1.js';
export const medicines={wegovy:{label:'Wegovy tablets',source:'https://www.medicines.org.uk/emc/product/102344/pil',instructions:'Take the prescribed tablet whole after at least 8 hours without food, with up to 120 mL of water. Wait at least 30 minutes before food, drink or other oral medicines. Follow your own patient leaflet and prescriber’s instructions.'},foundayo:{label:'Foundayo tablets',source:'https://www.gov.uk/government/news/uk-first-in-europe-to-authorise-orforglipron-for-weight-management-and-type-2-diabetes',instructions:'Taken once daily without food or water timing restrictions. Follow your own patient leaflet and prescriber’s instructions.'}};
export const difficulties={none:'The routine is manageable',timing:'My shifts or mornings make timing difficult',forgetting:'I forget or lose track',food:'Food is difficult to organise',sideeffects:'Side effects or symptoms',hunger:'Hunger or food noise is returning'};
const consentSQL="COALESCE((SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1),0)=1";
const json=(b,status=200)=>Response.json(b,{status,headers:{'Cache-Control':'no-store, private','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow'}});
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status})};
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function routineStep(difficulty,alternative=false){
 const steps={
 none:['Keep one useful anchor','Choose one part of your existing day that already works, and keep your routine alongside it.'],
 timing:alternative?['Ask your pharmacist to review the timing','Take your shift pattern and other medicine timings to your pharmacist or prescriber. Do not improvise a different medication schedule.']:['Map tomorrow’s waking routine','Write down when you wake and when food, drinks and other tablets usually happen. Compare this with your patient leaflet; ask your pharmacist if they conflict.'],
 forgetting:alternative?['Use a simple tick-off','Choose a paper checklist for the next three days. Tick only after taking the medicine; if unsure whether you took it, check your patient leaflet or ask your pharmacist.']:['Choose one quiet reminder','Set one generic reminder at the time agreed with your prescriber. A reminder is a prompt, not evidence that a dose was taken.'],
 food:alternative?['Make one familiar meal easier','Choose a familiar meal with fewer preparation steps. Keep the next shopping list short.']:['Plan one easy food option','Choose one familiar food option for your next busy day and put it on your shopping list.'],
 sideeffects:['Contact your prescriber','Contact your prescriber using the details on your prescription or treatment confirmation for symptoms or side effects. Do not wait for this check-in.'],
 hunger:['Arrange a treatment review','Tell your prescriber when hunger changed and what is difficult. My Timber cannot decide whether treatment or dose should change.']
 };
 return {id:crypto.randomUUID(),difficulty,alternative,title:steps[difficulty][0],detail:steps[difficulty][1]};
}
export function viewRoutine(raw,now=Date.now()){
 const state=raw?.enabled?raw:null;
 return {state,revision:raw?.revision||0,firstWeekDue:!!state&&!state.review&&now-Date.parse(state.startDate+'T12:00:00Z')>=6*86400000,medicines,difficulties};
}
export function applyRoutine(old,input,at=new Date().toISOString()){
 if(input.kind==='erase')return {revision:(old?.revision||0)+1,enabled:false};
 let next=structuredClone(old||{revision:0});
 if(input.kind==='setup'){
  if(!medicines[input.medicine]||input.prescribed!==true||!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate||'')||!Number.isFinite(Date.parse(input.startDate))||new Date(input.startDate).toISOString().slice(0,10)!==input.startDate||input.startDate<'2020-01-01'||input.startDate>today()||!(input.time===''||/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time||'')))fail('Check the medicine, start date and optional routine time.');
  const reset=next.medicine!==input.medicine||next.startDate!==input.startDate;
  next={...next,enabled:true,medicine:input.medicine,startDate:input.startDate,time:input.time,updatedAt:at,...(reset?{review:null,step:null,outcomes:[]}:{} )};
 }else{
  if(!next.enabled)fail('Save your tablet routine first.',409);
  if(input.kind==='review'){
   if(!['manageable','difficult','not-started'].includes(input.routine)||!Object.hasOwn(difficulties,input.difficulty)||typeof input.prescriberHelp!=='boolean')fail('Choose your routine and difficulty.');
   next.review={routine:input.routine,difficulty:input.difficulty,prescriberHelp:input.prescriberHelp,at};
   next.step=routineStep(input.prescriberHelp?'sideeffects':input.difficulty);next.updatedAt=at;
  }else if(input.kind==='feedback'){
   if(!next.step||input.stepId!==next.step.id||!['helped','didnt-help','didnt-fit','not-tried'].includes(input.outcome))fail('This step changed. Reload before answering.',409);
   next.outcomes=[...(next.outcomes||[]),{title:next.step.title,outcome:input.outcome,at}].slice(-12);
   if(['didnt-help','didnt-fit'].includes(input.outcome)){
    if(['sideeffects','hunger'].includes(next.step.difficulty))next.step=routineStep(next.step.difficulty);
    else if(next.step.alternative)next.step={id:crypto.randomUUID(),difficulty:next.step.difficulty,alternative:true,title:'Choose a different approach with support',detail:'Two approaches have not fitted. Choose another obstacle in the check-in, or ask SHIFT for practical help at /contact. Medication questions belong to your prescriber.'};
    else next.step=routineStep(next.step.difficulty,true);
   }else next.step={...next.step,answered:input.outcome};
  }else fail('Unsupported routine action.');
 }
 next.revision=(old?.revision||0)+1;return next;
}
export async function tabletRoutineRoutes(request,env){
 const url=new URL(request.url);if(url.pathname!=='/v1/tablet-routine')return null;
 if(!['GET','POST','DELETE'].includes(request.method))return json({error:'method_not_allowed'},405);
 if(url.search)return json({error:'unsupported_query'},400);
 if(request.method!=='GET'&&(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site'))return json({error:'origin_not_allowed'},403);
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 const birth=Date.parse(auth.user.date_of_birth||'');if(Number.isFinite(birth)&&Date.now()-birth<18*365.2425*86400000)return json({error:'adult_service'},403);
 const uid=auth.userId,DB=env.DB;
 const read=async()=>{const r=await DB.prepare("SELECT json_extract(preferences,'$.lifeBack.progress.tabletRoutine') data FROM member_state WHERE user_id=?").bind(uid).first();return r?.data?JSON.parse(r.data):null};
 const consentRecord=async()=>await DB.prepare("SELECT id,granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(uid).first();
 try{
  const record=await consentRecord(),consent=Number(record?.granted)===1,old=await read(),current=old?.consentId===record?.id?old:null;
  if(request.method==='GET')return json({...viewRoutine(consent?current:null),revision:old?.revision||0,consent,accountId:uid});
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))fail('JSON required.',415);
  if(Number(request.headers.get('Content-Length'))>2048)fail('Request too large.',413);
  const reader=request.body?.getReader();let bytes=0,chunks=[];if(reader){try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>2048){await reader.cancel();fail('Request too large.',413)}chunks.push(value)}}finally{reader.releaseLock()}}
  const raw=new Uint8Array(bytes);let pos=0;for(const c of chunks){raw.set(c,pos);pos+=c.length}
  let input;try{input=JSON.parse(new TextDecoder().decode(raw))}catch{fail('Invalid request.')}
  if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(k=>!['kind','revision','accountId','medicine','prescribed','startDate','time','routine','difficulty','prescriberHelp','stepId','outcome'].includes(k)))fail('Invalid routine fields.');
  if(input.accountId!==uid||!Number.isInteger(input.revision)||input.revision!==(old?.revision||0))fail('Your account or routine changed. Reload before saving.',409);
  if(request.method==='DELETE')input.kind='erase';else if(input.kind==='erase')fail('Use the delete action.');
  if(input.kind!=='erase'&&!consent)fail('Review optional health tracking in Settings before saving.',403);
  if(input.kind!=='setup'&&input.kind!=='erase'&&!current)fail('Set up a new routine after changing tracking consent.',409);
  const next=applyRoutine(input.kind==='setup'&&!current?{revision:old?.revision||0}:old,input);if(input.kind!=='erase')next.consentId=record.id;const guard=input.kind==='erase'?'': ' AND '+consentSQL+" AND (SELECT id FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=?";
  await DB.prepare('INSERT OR IGNORE INTO member_state(user_id) VALUES(?)').bind(uid).run();
  const result=await DB.prepare("UPDATE member_state SET preferences=json_set(CASE WHEN json_type(preferences,'$.lifeBack.progress')='object' THEN preferences ELSE json_set(preferences,'$.lifeBack.progress',json(?)) END,'$.lifeBack.progress.tabletRoutine',json(?),'$.lifeBack.progress.revision',COALESCE(json_extract(preferences,'$.lifeBack.progress.revision'),0)+1),updated_at=? WHERE user_id=? AND COALESCE(json_extract(preferences,'$.lifeBack.progress.tabletRoutine.revision'),0)=?"+guard).bind(JSON.stringify(emptyLifeBack()),JSON.stringify(next),new Date().toISOString(),uid,input.revision,...(input.kind==='erase'?[]:[uid,uid,record.id])).run();
  if(result.meta?.changes!==1)fail('Your routine or consent changed. Reload before saving.',409);
  return json({ok:true,...viewRoutine(next),consent,accountId:uid});
 }catch(e){return json({error:e.status?e.message:'routine_unavailable',message:e.status?e.message:'Your routine could not be saved. Please retry.'},e.status||503)}
}
