import {authenticateMember} from '../member-state-fast-v1.js';

export const TRACKING_CONSENT='my_shift_health_tracking';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const parse=value=>{try{return JSON.parse(value||'{}')}catch{return {}}};
const moods=['Tough day','Struggling','OK','Good','Brilliant'];
export async function appendHealthExport(request,env,response){
 if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true'||new URL(request.url).pathname!=='/v1/privacy/export'||request.method!=='POST'||!response.ok)return response;
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 const payload=await response.json();
 for(const [key,table]of [['journeyWeeklyCheckIns','my_journey_weekly_checkins'],['savedPlans','shift_plans']]){
  const exists=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(table).first();
  payload[key]=exists?(await env.DB.prepare(`SELECT * FROM ${table} WHERE user_id=? ORDER BY id`).bind(auth.userId).all()).results:[];
 }
 return json(payload);
}
export async function trackingConsent(DB,userId){
 const row=await DB.prepare('SELECT granted FROM consents WHERE user_id=? AND consent_type=? ORDER BY id DESC LIMIT 1').bind(userId,TRACKING_CONSENT).first();
 return Number(row?.granted)===1;
}
// Persist the exact replacement returned by the existing approved exercise
// engine. A stale tab cannot replace a different exercise or a newer plan.
export async function persistFitReplacement(request,env,response,input){
 if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true'||!input?.persist||!response?.ok)return response;
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 const saved=await env.DB.prepare("SELECT id,plan_json FROM shift_plans WHERE user_id=? AND plan_type='fit' AND status='active' ORDER BY id DESC LIMIT 1").bind(auth.userId).first();
 const plan=parse(saved?.plan_json),session=plan.sessions?.[input.session_index];
 const index=input.exercise_index;
 if(!saved||!Number.isInteger(input.session_index)||!Number.isInteger(index)||session?.exercises?.[index]?.id!==input.current_id)return json({error:'fit_plan_changed',message:'Your saved plan has changed. Reload it before swapping.'},409);
 const payload=await response.clone().json();
 if(!payload.exercise?.id)return json({error:'fit_replacement_unavailable'},503);
 session.exercises[index]=payload.exercise;
 const result=await env.DB.prepare("UPDATE shift_plans SET plan_json=? WHERE id=? AND user_id=? AND status='active' AND plan_json=?").bind(JSON.stringify(plan),saved.id,auth.userId,saved.plan_json).run();
 if(result.meta.changes!==1)return json({error:'fit_plan_changed',message:'Your saved plan has changed. Reload it before swapping.'},409);
 return json({...payload,saved:true});
}
export async function memberHealthRoutes(request,env){
 if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true')return null;
 const path=new URL(request.url).pathname.replace(/\/+$/,''),method=request.method;
 const owned=['/v1/check-ins','/v1/fit/activity'].includes(path);
 const protectedWrite=(method==='POST'&&['/v1/progress','/v1/health-mot','/v1/journey/weekly-check-in'].includes(path))||(method==='PATCH'&&['/v1/journey','/v1/my-journey'].includes(path));
 if(!owned&&!protectedWrite)return null;
 if(!['GET','POST','PATCH'].includes(method))return owned?json({error:'method_not_allowed'},405):null;
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 let body;
 if(method!=='GET'){
  const raw=await request.clone().text();if(raw.length>200000)return json({error:'request_too_large'},413);
  try{body=JSON.parse(raw)}catch{return json({error:'invalid_json'},400)}
  if(!body||typeof body!=='object'||Array.isArray(body))return json({error:'invalid_request'},400);
  // Clearing is an erasure operation, not a new health-data save.
  if(protectedWrite&&method==='PATCH'&&body.clear===true)return null;
  if(!await trackingConsent(env.DB,auth.userId))return json({error:'health_consent_required',message:'Optional health tracking is off. Review your choice before saving.'},409);
 }
 if(!owned)return null;
 if(path==='/v1/check-ins'){
  if(method==='GET'){
   const {results=[]}=await env.DB.prepare('SELECT id,wellbeing_score,notes,submitted_at FROM check_ins WHERE user_id=? AND case_id IS NULL ORDER BY id DESC LIMIT 100').bind(auth.userId).all();
   return json({checkIns:results.map(r=>({...r,mood:moods[Number(r.wellbeing_score)-1]||'',note:r.notes||'',checkedAt:r.submitted_at,createdAt:r.submitted_at}))});
  }
  if(method!=='POST')return json({error:'method_not_allowed'},405);
  const index=moods.findIndex(m=>m.toLowerCase()===String(body.mood||'').trim().toLowerCase());
  if(index<0)return json({error:'mood_required',message:'Choose how today feels before saving.'},400);
  const note=String(body.note??body.notes??'').trim();if(note.length>2000)return json({error:'note_too_long',message:'Keep the note under 2,000 characters.'},400);
  const at=new Date().toISOString();
  const result=await env.DB.prepare('INSERT INTO check_ins(user_id,wellbeing_score,notes,submitted_at) VALUES(?,?,?,?)').bind(auth.userId,index+1,note,at).run();
  return json({ok:true,checkIn:{id:result.meta.last_row_id,mood:moods[index],note,checkedAt:at}},201);
 }
 const row=await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(auth.userId).first();
 const current=parse(row?.preferences).fitJourney||{entries:{},sessionReviews:{}};
 if(method==='GET'){
  const saved=await env.DB.prepare("SELECT plan_json FROM shift_plans WHERE user_id=? AND plan_type='fit' AND status='active' ORDER BY id DESC LIMIT 1").bind(auth.userId).first();
  return json({fitJourney:current,plan:saved?parse(saved.plan_json):null});
 }
 if(method!=='POST')return json({error:'method_not_allowed'},405);
 const activity=body.fitJourney;
 if(!activity||typeof activity!=='object'||!activity.entries||typeof activity.entries!=='object'||Array.isArray(activity.entries)||Object.keys(activity.entries).length>500)return json({error:'invalid_fit_activity'},400);
 const entries={...current.entries};
 for(const [key,item]of Object.entries(activity.entries)){
  if(key.length>220||!item||!['done','skipped'].includes(item.status)||!/^\d{4}-\d{2}-\d{2}$/.test(item.recordedOn||'')||typeof item.exerciseId!=='string')return json({error:'invalid_fit_activity'},400);
  entries[key]={status:item.status,reason:String(item.reason||'').slice(0,100),exerciseId:item.exerciseId.slice(0,150),group:String(item.group||'').slice(0,80),sessionDay:Math.max(1,Math.min(7,Number(item.sessionDay)||1)),recordedOn:item.recordedOn,updatedAt:String(item.updatedAt||new Date().toISOString()).slice(0,40)};
 }
 const reviews={...current.sessionReviews};
 for(const [key,item]of Object.entries(activity.sessionReviews||{})){
  if(key.length>220||!item||typeof item!=='object')return json({error:'invalid_fit_review'},400);
  reviews[key]=Object.fromEntries(['effort','body','again','mood','barrier','note','recordedOn','updatedAt','verdict'].map(k=>[k,String(item[k]||'').slice(0,k==='note'||k==='verdict'?1000:80)]));
 }
 const trim=(o,n)=>Object.fromEntries(Object.entries(o).sort((a,b)=>String(b[1].updatedAt).localeCompare(String(a[1].updatedAt))).slice(0,n));
 const next={entries:trim(entries,500),sessionReviews:trim(reviews,100)};
 // Write only this owned branch of preferences; Grub and Journey cannot be overwritten.
 await env.DB.prepare("INSERT INTO member_state(user_id,preferences,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET preferences=json_set(member_state.preferences,'$.fitJourney',json(?)),updated_at=excluded.updated_at").bind(auth.userId,JSON.stringify({fitJourney:next}),new Date().toISOString(),JSON.stringify(next)).run();
 return json({ok:true,fitJourney:next});
}
