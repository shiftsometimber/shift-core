import {authenticateMember} from '../member-state-fast-v1.js';
import {trackingConsent} from './health-routes.mjs';
import {score,areas} from './life-back/model.mjs';
import {connectedDay} from './journey-context.mjs';
const headers={'Cache-Control':'no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
const json=(body,status=200)=>Response.json(body,{status,headers});
const parse=v=>{try{return JSON.parse(v||'{}')}catch{return {}}};
export const emptyLifeBack=()=>({version:3,revision:0,goalId:'personal-start',goal:'Your personal goal',entries:[],operations:[]});
export function applyLifeBackOperation(current,input,at=new Date().toISOString()){
 const next=structuredClone(current||emptyLifeBack());
 const fail=(message,status=400)=>{throw Object.assign(Error(message),{status})};
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(input.operationId||''))fail('Refresh this page before saving.');
 if(next.operations.includes(input.operationId)||next.entries.some(e=>e.id===input.operationId))return next;
 if(input.action==='goal'){
  if(input.revision!==next.revision)fail('Your goal changed in another tab. Reload before changing it.',409);
  const goal=String(input.goal||'').trim();if(!goal||goal.length>70)fail('Write a personal goal in 70 characters or fewer.');
  if(goal!==next.goal){next.goal=goal;next.goalId=input.operationId}
 }else if(input.action==='checkin'){
  if(input.goalId!==next.goalId)fail('Your personal goal changed. Reload before recording this check-in.',409);
  if(!input.ratings||score(input.ratings)===null||Object.values(input.ratings).some(v=>!Number.isInteger(v)))fail('Rate all six areas with a whole number from 0 to 100.');
  const win=String(input.win||'').trim();if(win.length>180)fail('Keep your win under 180 characters.');
  // Never discard old entries to make room. Export/retention needs an explicit product decision.
  if(next.entries.length>=10000)fail('Your history is full. Please contact support before adding another entry.',409);
  next.entries.push({id:input.operationId,at,goalId:next.goalId,goal:next.goal,ratings:Object.fromEntries(areas.map(a=>[a.id,input.ratings[a.id]])),win});
 }else fail('Unknown Life Back action.');
 next.revision++;next.operations=[...next.operations,input.operationId].slice(-100);return next;
}
export async function lifeBackRoutes(request,env){
 if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true'||new URL(request.url).pathname!=='/v1/life-back')return null;
 if(!['GET','POST'].includes(request.method))return json({error:'Method not allowed'},405);
 if(request.method==='POST'&&request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'Use this page to save your check-in.'},403);
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 try{
  const read=async()=>parse((await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(auth.userId).first())?.preferences);
  let prefs=await read();
  if(request.method==='GET')return json({progress:prefs.lifeBack?.progress||emptyLifeBack(),legacyEntries:prefs.lifeBack?.entries||[],journey:prefs.myJourney||{},day:await connectedDay(env.DB,auth.userId,prefs)});
  const raw=await request.text();if(raw.length>8000)return json({error:'Check-in is too large.'},413);
  let input;try{input=JSON.parse(raw)}catch{return json({error:'Invalid check-in.'},400)}
  if(!input||typeof input!=='object'||Array.isArray(input))return json({error:'Invalid check-in.'},400);
  if(!await trackingConsent(env.DB,auth.userId))return json({error:'Optional health tracking is off. Review your choice before saving.',code:'health_consent_required'},409);
  await env.DB.prepare('INSERT OR IGNORE INTO member_state(user_id) VALUES(?)').bind(auth.userId).run();
  for(let attempt=0;attempt<4;attempt++){
   const old=prefs.lifeBack?.progress||emptyLifeBack(),next=applyLifeBackOperation(old,input);
   if(next.revision===old.revision)return json({ok:true,progress:old});
   const result=await env.DB.prepare("UPDATE member_state SET preferences=json_set(CASE WHEN json_type(preferences,'$.lifeBack')='object' THEN preferences ELSE json_set(preferences,'$.lifeBack',json('{}')) END,'$.lifeBack.progress',json(?)),updated_at=? WHERE user_id=? AND COALESCE(json_extract(preferences,'$.lifeBack.progress.revision'),0)=? AND (SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=1").bind(JSON.stringify(next),new Date().toISOString(),auth.userId,old.revision,auth.userId).run();
   if(result.meta.changes===1)return json({ok:true,progress:next},201);
   if(!await trackingConsent(env.DB,auth.userId))return json({error:'Health tracking was switched off before this save.',code:'health_consent_required'},409);
   prefs=await read();
  }
  return json({error:'Your history changed in another tab. Reload and try again.'},409);
 }catch(e){return json({error:e.status?e.message:'Life Back could not load or save. Your existing history has not been replaced.'},e.status||503)}
}
