import {publishV7Effort,v7CrewSnapshot} from './v7-crew.mjs';
import{authenticateMember}from'../member-state-fast-v1.js';
import{applyV7Operation}from'./v7-model.mjs';
import{v7Context}from'./v7-context.mjs';
const parse=s=>{try{return JSON.parse(s||'{}')}catch{return {}}};
const json=(b,status=200)=>Response.json(b,{status,headers:{'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
export async function v7Write(request,env,prepareOffers,decorate=p=>p){
 if(request.method!=='POST')return null;
 const raw=await request.clone().text();if(raw.length>8000)return null;
 let input;try{input=JSON.parse(raw)}catch{return null;}
 if(!String(input?.action||'').startsWith('v7-'))return null;
 if(![new URL(request.url).origin,'https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk'].includes(request.headers.get('Origin')))return json({error:'Use this page to save your action.'},403);
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 if(input.expectedAccount===undefined||String(input.expectedAccount)!==String(auth.userId))return json({error:'Your account changed. Reload before saving.'},409);
 const displayOnly=['v7-preferences','v7-fit-health-delete'].includes(input.action),tracking=async()=>Number((await env.DB.prepare("SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1").bind(auth.userId).first())?.granted)===1;
 try{
  if(!displayOnly&&!await tracking())return json({error:'Optional health tracking is off.',code:'health_consent_required'},409);
  if(!/^[-a-zA-Z0-9]{16,80}$/.test(input.operationId||''))return json({error:'Refresh before saving.'},400);
  for(let attempt=0;attempt<4;attempt++){
   const prefs=parse((await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(auth.userId).first())?.preferences),old=prefs.lifeBack?.progress||{version:3,revision:0,goalId:'personal-start',goal:'Your personal goal',entries:[],operations:[]};
   if(!displayOnly&&prefs.myJourney?.setup?.paused===true)return json({error:'Your Journey tracking is paused.'},409);
   const at=new Date().toISOString(),context=await v7Context(env.DB,auth.userId,prefs,at),next=structuredClone(old);
   const response=async(p,status,awarded=false)=>json({ok:true,awarded,league:await v7CrewSnapshot(env.DB,auth.userId,at),accountId:auth.userId,progress:decorate(p),v7:await v7Context(env.DB,auth.userId,{...prefs,lifeBack:{...prefs.lifeBack,progress:p}},at)},status);
   if((old.operations||[]).includes(input.operationId))return response(old,200);
   if(input.action==='v7-refresh')context.preparedOffers=await prepareOffers(env.DB,prefs,at,auth.userId);
   if(!applyV7Operation(next,input,at,context))return response(old,200);
   next.revision=(old.revision||0)+1;next.operations=[...(old.operations||[]),input.operationId].slice(-100);
   await env.DB.prepare('INSERT OR IGNORE INTO member_state(user_id) VALUES(?)').bind(auth.userId).run();
   const guard=displayOnly?'':" AND (SELECT granted FROM consents WHERE user_id=? AND consent_type='my_shift_health_tracking' ORDER BY id DESC LIMIT 1)=1 AND COALESCE(json_extract(preferences,'$.myJourney.setup.paused'),0)<>1";
   const r=await env.DB.prepare("UPDATE member_state SET preferences=json_set(CASE WHEN json_type(preferences,'$.lifeBack')='object' THEN preferences ELSE json_set(preferences,'$.lifeBack',json('{}')) END,'$.lifeBack.progress',json(?)),updated_at=? WHERE user_id=? AND COALESCE(json_extract(preferences,'$.lifeBack.progress.revision'),0)=?"+guard).bind(JSON.stringify(next),at,auth.userId,old.revision||0,...(displayOnly?[]:[auth.userId])).run();
   if(r.meta.changes===1){await publishV7Effort(env.DB,auth.userId,next,at);return response(next,201,!old.v7?.days?.[context.today]?.log&&!!next.v7?.days?.[context.today]?.log);}
  }
  return json({error:'Your record changed. Reload and try again.'},409);
 }catch(e){return json({error:e.status?e.message:'Your save could not be confirmed. Reload before retrying.'},e.status||503);}
}
