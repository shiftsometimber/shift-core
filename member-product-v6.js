import core from './worker.js';
import {memberProductV5Routes} from './member-product-v5.js';
import {buildShiftBrainContext} from './shift-brain-v1.js';

const OWNED=new Set(['/v1/grub/plan','/v1/grub/replace','/v1/fit/plan','/v1/fit/replace']);

export async function memberProductV6Routes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';
  if(!OWNED.has(path)||request.method!=='POST')return memberProductV5Routes(request,env,ctx);
  const a=await auth(request,env,ctx);if(a.response)return a.response;
  const body=await read(request.clone()),brain=await buildShiftBrainContext(env,Number(a.user.id),'',{knowledgeLimit:0});
  const product=path.startsWith('/v1/grub/')?'grub':'fit',nays=brain.behaviour.feedback.nay.filter(x=>x.product===product).map(x=>x.entity_id),prefs=brain.member.state.preferences||{};
  const merged={...body,exclude:[...new Set([...(Array.isArray(body.exclude)?body.exclude:[]),...nays])],brain_contract:brain.contract};
  if(product==='grub'){
    if(body.preferences===undefined&&Object.keys(prefs).length)merged.preferences=JSON.stringify(prefs);
    if(body.dislikes===undefined&&prefs.dislikes)merged.dislikes=Array.isArray(prefs.dislikes)?prefs.dislikes.join(', '):String(prefs.dislikes);
    if(body.dietaryRequirements===undefined&&prefs.dietaryRequirements)merged.dietaryRequirements=Array.isArray(prefs.dietaryRequirements)?prefs.dietaryRequirements.join(', '):String(prefs.dietaryRequirements);
  }else{
    if(body.preferences===undefined&&Object.keys(prefs).length)merged.preferences=JSON.stringify(prefs);
    if(body.limitations===undefined&&prefs.limitations)merged.limitations=Array.isArray(prefs.limitations)?prefs.limitations.join(', '):String(prefs.limitations);
    if(body.equipment===undefined&&prefs.equipment)merged.equipment=prefs.equipment;
    if(body.location===undefined&&prefs.exercise_location)merged.location=prefs.exercise_location;
  }
  const forwarded=new Request(request.url,{method:'POST',headers:request.headers,body:JSON.stringify(merged)}),response=await memberProductV5Routes(forwarded,env,ctx);
  if(!response?.ok)return response;
  const payload=await response.clone().json().catch(()=>null);if(!payload)return response;
  payload.oneShiftBrain={contract:brain.contract,preferencesApplied:Object.keys(prefs).length>0,historicalNaysApplied:nays.length};
  return new Response(JSON.stringify(payload),{status:response.status,headers:response.headers});
}

async function auth(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user}}
async function read(r){try{return await r.json()}catch{return{}}}
