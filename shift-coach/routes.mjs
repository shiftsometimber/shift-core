import {constraintOptions,blockerOptions,saveConstraints,chooseBlocker,journeyView} from './progression.mjs';
import {supportView,requestSupport,reopenSupport} from './support.mjs';
import {authenticateMember} from '../member-state-fast-v1.js';
import {load,mutate,activeConsent,usable,statePath} from './store.mjs';
import {setup,saveFact,memoryView} from './memory.mjs';
import {prepareToday,readToday} from './today.mjs';
import {accept,reject,outcome,wanted} from './follow-up.mjs';
import {setSettings} from './permissions.mjs';
import {chooseComponents,weeklyReview,reviewView} from './life-back.mjs';
import {mode as changeMode,circumstances} from './continue.mjs';
import {deleteItem} from './privacy.mjs';
import {prepareNight} from './night-job.mjs';
import {helpPanel,boundary} from './safety.mjs';
import {pendingFollowup,acknowledgeFollowup} from './followup-view.mjs';
import {acceptPlan} from './planning.mjs';
import {stages,library,focusLabels,focusChoices,treatmentSupport,challengeLabels} from './voice.mjs';
const headers={'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
const json=(data,status=200)=>Response.json(data,{status,headers});
const starter=Object.freeze({id:null,title:'Choose one thing to make your week easier',reason:'General starter. Tell Shift AI what matters to you and what your week looks like.',general:true,tone:'Start with one thing you can actually use.',status:'starter'});
async function boundedBody(request){
 const limit=4096;
 if(Number(request.headers.get('Content-Length'))>limit)throw Object.assign(Error('request_too_large'),{status:413});
 if(!request.body)return '';
 const reader=request.body.getReader(),chunks=[];let bytes=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>limit){await reader.cancel();throw Object.assign(Error('request_too_large'),{status:413});}chunks.push(value);}}
 finally{reader.releaseLock();}
 const body=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}
 return new TextDecoder('utf-8',{fatal:true}).decode(body);
}
function staleBody(input){return ['userId','user_id','member','member_id','state','permissions','readings','doses','calendar','audit','actions','cost'].some(k=>Object.hasOwn(input,k));}
export async function coachingRoutes(request,env){
 const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'');
 if(!path.startsWith('/v1/shift-coach'))return null;
 if(path!=='/v1/shift-coach')return json({error:'not_found'},404);
 if(!['GET','POST','DELETE'].includes(request.method))return json({error:'method_not_allowed'},405);
 if(url.search)return json({error:'unsupported_query'},400);
 if(request.method!=='GET'&&(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site'))return json({error:'origin_not_allowed'},403);
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 const birth=Date.parse(auth.user.date_of_birth||'');
 if(Number.isFinite(birth)&&Date.now()-birth<18*365.2425*86400000)return json({error:'adult_service',message:'My Timber coaching is for adults.',help:helpPanel},403);
 try{
  const {revision,state}=await load(env.DB,auth.userId),consent=await activeConsent(env.DB,auth.userId);
  const allowed=usable(state,consent);
  if(request.method==='GET')return json({revision,enabled:allowed,consent:Number(consent?.granted)===1,action:allowed?readToday(state):starter,memory:allowed?memoryView(state):null,choices:allowed?focusChoices(state):[],treatment:allowed?treatmentSupport(state.mode):null,challenges:challengeLabels,journey:allowed?journeyView(state):null,blockers:allowed?blockerOptions:{},support:allowed?await supportView(env.DB,auth.userId):{available:false,tickets:[]},supportRequired:allowed&&state.facts.some(f=>f.confirmed&&['goal','week'].includes(f.key)&&!boundary(f.value).coaching),review:allowed?reviewView(state):null,audit:allowed?state.audit:[],followup:allowed?pendingFollowup(state,Date.now(),env.SHIFT_COACH_OFF==='true'):null,help:helpPanel,background:env.SHIFT_COACH_OFF!=='true',modelCalls:0});
  if(request.method==='DELETE'){
   await env.DB.prepare("UPDATE member_state SET preferences=json_set(json_remove(preferences,?),'$.lifeBack.progress.revision',COALESCE(json_extract(preferences,'$.lifeBack.progress.revision'),0)+1),updated_at=? WHERE user_id=?").bind(statePath,new Date().toISOString(),auth.userId).run();
   return json({ok:true,deleted:true});
  }
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'json_required'},415);
  const raw=await boundedBody(request);
  let input;try{input=JSON.parse(raw);}catch{return json({error:'invalid_json'},400);}
  if(!input||typeof input!=='object'||Array.isArray(input)||staleBody(input))return json({error:'invalid_request'},400);
  if(!/^[a-zA-Z0-9-]{16,80}$/.test(input.operationId||'')||!Number.isInteger(input.revision))return json({error:'refresh_before_saving'},400);
  if(['support-request','support-reopen'].includes(input.kind)){
   if(!allowed||revision!==input.revision)return json({error:'state_changed_retry'},409);
   const result=input.kind==='support-request'?await requestSupport(env.DB,auth.userId,input,state.consentId):await reopenSupport(env.DB,auth.userId,input.reference);
   return json({ok:true,...result},201);
  }
  if(allowed&&state.operations?.includes(input.operationId))return json({ok:true,duplicate:true,revision});
  const at=Date.now();
  const operation=s=>{
   let result;
   switch(input.kind){
    case 'setup':result=setup(s,input,at);if(input.constraints)saveConstraints(s,input.constraints);if(input.components)chooseComponents(s,input.components);if(input.mode)changeMode(s,input.mode);prepareToday(s,at);break;
    case 'fact':result=saveFact(s,input.key,input.value,at);prepareToday(s,at);break;
    case 'focus':{
     if(typeof input.restore!=='boolean'||!Object.hasOwn(focusLabels,input.focus))throw Object.assign(Error('invalid_focus_choice'),{status:400});
     result=saveFact(s,'focus',input.focus,at);
     if(input.restore){const types=library.filter(a=>a.focus===input.focus).map(a=>a.type);s.rejected=s.rejected.filter(type=>!types.includes(type));s.pausedTypes=s.pausedTypes.filter(type=>!types.includes(type));}
     s.pendingWant=null;s.pendingBlocker=null;prepareToday(s,at,{replace:true});break;
    }
    case 'constraints':result=saveConstraints(s,input.constraints);prepareToday(s,at);break;
    case 'blocker':result=chooseBlocker(s,input.blocker);prepareToday(s,at,{different:true,previousType:readToday(s)?.type});break;
    case 'different-step':{const a=readToday(s);if(!a||a.status!=='prepared')throw Object.assign(Error('action_unavailable'),{status:409});s.pendingBlocker=null;result=prepareToday(s,at,{different:true,previousType:a.type});break;}
    case 'delete-item':result=deleteItem(s,input.id);prepareToday(s,at);break;
    case 'accept':if(input.followup!==undefined){if(typeof input.followup!=='boolean')throw Object.assign(Error('invalid_followup_choice'),{status:400});setSettings(s,{...(input.followup?{proactive:true}:{}),followup:input.followup});}result=accept(s,input.id,at);break;
    case 'decline':result=reject(s,input.id,at);break;
    case 'outcome':result=outcome(s,input.id,input.value,at);break;
    case 'wanted':result=wanted(s,input.yes,at);break;
    case 'followup-seen':result=acknowledgeFollowup(s,input.id,at,env.SHIFT_COACH_OFF==='true');break;
    case 'settings':result=setSettings(s,input.settings||{});break;
    case 'pause-choice':{
     const entry=(s.pauseRequests||[]).find(x=>x.id===input.id&&x.status==='queued');
     if(!entry||typeof input.yes!=='boolean')throw Object.assign(Error('pause_choice_unavailable'),{status:409});
     entry.status=input.yes?'restored':'declined';
     if(input.yes){s.pausedTypes=s.pausedTypes.filter(x=>x!==entry.type);s.touches=s.touches.map(x=>x.type===entry.type?{...x,answered:true}:x);}
     result={dataUsed:[],outcome:entry.status};break;
    }
    case 'components':result=chooseComponents(s,input.components);prepareToday(s,at);break;
    case 'stage':if(!stages.includes(input.stage))throw Object.assign(Error('invalid_stage'),{status:400});s.stage=input.stage;result={dataUsed:[]};prepareToday(s,at);break;
    case 'plan-accept':result=acceptPlan(s,input.id);break;
    case 'review':result=weeklyReview(s,input.rating,at);prepareToday(s,at);break;
    case 'circumstances':result=circumstances(s,input,at);break;
    case 'mode':result=changeMode(s,input.mode);prepareToday(s,at);break;
    case 'restore':if(typeof input.type!=='string'||!s.rejected.includes(input.type))throw Object.assign(Error('rejection_missing'),{status:404});s.rejected=s.rejected.filter(x=>x!==input.type);result={dataUsed:[]};prepareToday(s,at);break;
    case 'refresh':result=prepareNight(s,at);break;
    default:throw Object.assign(Error('unknown_action'),{status:400});
   }
   s.operations=[...(s.operations||[]),input.operationId].slice(-100);return result;
  };
  const saved=await mutate(env.DB,auth.userId,input.kind,operation,at,{initialise:input.kind==='setup',expectedRevision:input.revision});
  return json({ok:true,revision:saved.revision,action:readToday(saved.state)},201);
 }catch(error){return json({error:error.status?error.message:'coaching_unavailable',help:error.status===422?helpPanel:undefined},error.status||503);}
}