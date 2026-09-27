// Operator-only functions. Not imported by public routes and no HTTP admin API.
// The caller must be an authenticated, authorised service operator.
import {ProgrammeStore} from './store.mjs';
import {emptyState,ProgrammeError} from './service.mjs';
const requireValue=(condition,message,status=400)=>{if(!condition)throw new ProgrammeError(message,status)};
function grant(input,now){
 requireValue(typeof input.active==='boolean','Choose active or paused service access.');
 const result={active:input.active};
 if(input.active){
  requireValue(typeof input.expiresAt==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(input.expiresAt)&&Number.isFinite(Date.parse(input.expiresAt))&&Date.parse(input.expiresAt)>Date.parse(now),'Active access requires a valid future expiry.');
  result.expiresAt=new Date(input.expiresAt).toISOString();
 }
 return result;
}
function operatorEvent(actor,reason,now){
 requireValue(typeof actor==='string'&&actor.trim()&&actor.length<=120,'An accountable operator is required.');
 requireValue(typeof reason==='string'&&reason.trim()&&reason.length<=300,'Record why access is changing.');
 return {actor:actor.trim(),reason:reason.trim(),at:now};
}
export async function provisionAccount(env,input,{now=new Date().toISOString()}={}){
 requireValue(Number.isSafeInteger(input.userId)&&input.userId>0,'A verified member ID is required.');
 requireValue(env.DB&&env.PROGRAMME_DB,'Use the separately bound Programme database.');
 const event=operatorEvent(input.actor,input.reason,now),entitlement=grant(input,now);
 const member=await env.DB.prepare('SELECT id,first_name FROM users WHERE id=?').bind(input.userId).first();requireValue(member,'Existing member not found.',404);
 const clock=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
 const state=emptyState(clock);state.name=String(member.first_name||'').slice(0,80);state.entitlement=entitlement;state.serviceEvents=[{...event,type:'provision',entitlement}];
 const created=await new ProgrammeStore(env.PROGRAMME_DB).create(input.userId,state);
 requireValue(created,'Programme account already exists; use a versioned access change.',409);
 return {created:true,revision:0};
}
export async function changeAccess(env,input,{now=new Date().toISOString()}={}){
 requireValue(Number.isSafeInteger(input.userId)&&input.userId>0,'A verified member ID is required.');
 const event=operatorEvent(input.actor,input.reason,now),entitlement=grant(input,now),store=new ProgrammeStore(env.PROGRAMME_DB),state=await store.get(input.userId);
 requireValue(state,'Programme account not found.',404);requireValue(Number.isSafeInteger(input.revision)&&input.revision===state.revision,'Account changed; read the current revision before retrying.',409);
 const next={...state,entitlement,review:null,serviceEvents:[...(state.serviceEvents||[]),{...event,type:'access',entitlement}]};
 requireValue(await store.save(input.userId,state.revision,next),'Account changed; no access update was committed.',409);
 return {updated:true,revision:state.revision+1};
}
