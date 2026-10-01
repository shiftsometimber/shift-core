import {load,mutate,seed,initialState} from './store.mjs';import {setup,saveFact,memoryView} from './memory.mjs';import {prepareToday,readToday} from './today.mjs';import {accept,reject,outcome,wanted} from './follow-up.mjs';import {setPermission,setSettings} from './permissions.mjs';import {deleteItem,finishDeletion} from './privacy.mjs';import {audit} from './audit.mjs';import {boundary,helpPanel} from './safety.mjs';import {unsentBrief} from './escalation.mjs';import {reading,confirmReading,dose,dataView} from './notice.mjs';import {chooseComponents,weeklyReview,reviewView} from './life-back.mjs';import {mode} from './continue.mjs';import {calendarPreview,calendarAccept,undoCalendar} from './calendar.mjs';import {acceptPlan} from './planning.mjs';import {costLedger,reserveSynthetic} from './costs.mjs';import {setGlobalEnabled,dispatchSimulated} from './push.mjs';import {nightJob} from './night-job.mjs';
export const prefix='/v1/coaching-test';
const enc=new TextEncoder();
async function key(env){if(!env.COACHING_TEST_SESSION_SECRET)throw Object.assign(Error('test_secret_not_configured'),{status:503});return crypto.subtle.importKey('raw',enc.encode(env.COACHING_TEST_SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
const hex=bytes=>Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
export async function mintSession(env,member,role='member',now=Date.now()){
 const text=`${member}:${role}:${now+3600000}:${crypto.randomUUID()}`;
 return`${text}:${hex(await crypto.subtle.sign('HMAC',await key(env),enc.encode(text)))}`;
}
export async function identity(request,env){
 const token=request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith('coaching_test_session='))?.slice(22);
 if(!token)throw Object.assign(Error('sign_into_test_account'),{status:401});
 const parts=token.split(':');if(parts.length!==5||!/^synthetic-[a-z0-9-]+$/.test(parts[0])||!['member','admin'].includes(parts[1])||Number(parts[2])<=Date.now()||!/^\w{64}$/.test(parts[4]))throw Object.assign(Error('invalid_test_session'),{status:401});
 const sig=Uint8Array.from(parts[4].match(/../g),v=>parseInt(v,16));
 if(!await crypto.subtle.verify('HMAC',await key(env),sig,enc.encode(parts.slice(0,4).join(':'))))throw Object.assign(Error('invalid_test_session'),{status:401});
 return{member:parts[0],role:parts[1]};
}
export const json=(value,status=200,extra={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
async function body(request){
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw Object.assign(Error('json_required'),{status:415});
 const reader=request.body?.getReader();if(!reader)return{};let n=0;const chunks=[];
 while(true){const {value,done}=await reader.read();if(done)break;n+=value.length;if(n>8192){await reader.cancel();throw Object.assign(Error('body_too_large'),{status:413});}chunks.push(value);}
 const bytes=new Uint8Array(n);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length;}
 let value;try{value=JSON.parse(new TextDecoder().decode(bytes));}catch{throw Object.assign(Error('invalid_json'),{status:400});}
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>['memberId','member_id','userId','user_id'].includes(k)))throw Object.assign(Error('server_owns_identity'),{status:400});return value;
}
export async function routes(request,env){
 const url=new URL(request.url);if(!url.pathname.startsWith(prefix+'/'))return null;
 try{
  if(env.COACHING_TEST_MODE!=='synthetic'||!env.COACHING_TEST_DB)throw Object.assign(Error('test_environment_required'),{status:503});
  if(request.method!=='GET'&&request.headers.get('origin')&&request.headers.get('origin')!==url.origin)throw Object.assign(Error('same_origin_required'),{status:403});
  const path=url.pathname.slice(prefix.length),DB=env.COACHING_TEST_DB;
  if(path==='/test/session'&&request.method==='POST'){
   if(env.COACHING_TEST_LOCAL!=='true'||!['localhost','127.0.0.1'].includes(url.hostname))throw Object.assign(Error('local_fixture_login_only'),{status:403});
   const b=await body(request);if(!['one','two'].includes(b.account))throw Object.assign(Error('synthetic_account_required'),{status:400});
   const member='synthetic-'+b.account;await seed(DB,member);
   const {state}=await load(DB,member);if(!readToday(state))await mutate(DB,member,'starter_prepared',s=>({dataUsed:prepareToday(s).dataUsed}));
   const token=await mintSession(env,member,b.admin===true?'admin':'member');
   return json({ok:true,member},200,{'Set-Cookie':`coaching_test_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600${url.protocol==='https:'?'; Secure':''}`});
  }
  const {member,role}=await identity(request,env);const {state}=await load(DB,member);
  if(request.method==='GET'){
   if(url.search)throw Object.assign(Error('query_parameters_not_supported'),{status:400});
   const data={'/today':()=>({action:readToday(state),help:helpPanel,member,weeklyPlan:state.weeklyPlans.at(-1)||null,calendar:state.calendar.filter(c=>!c.undone),pauseRequests:(state.pauseRequests||[]).filter(r=>r.status==='sent'&&!r.shown)}),'/memory':()=>memoryView(state),'/permissions':()=>({permissions:state.permissions,settings:state.settings,mode:state.mode}),'/readings':()=>dataView(state),'/weekly-review':()=>reviewView(state),'/audit':()=>audit(DB,member),'/cost-ledger':()=>costLedger(DB,member)};
   if(!data[path])throw Object.assign(Error('route_not_found'),{status:404});return json({ok:true,data:await data[path]()});
  }
  if(!['POST','PUT','DELETE'].includes(request.method))throw Object.assign(Error('method_not_allowed'),{status:405});
  const b=await body(request),now=Date.now();
  if(path.startsWith('/test/')){
   if(role!=='admin')throw Object.assign(Error('test_admin_required'),{status:403});
   if(path==='/test/night-job')return json({ok:true,data:await nightJob(DB,now)});
   if(path==='/test/push')return json({ok:true,data:await dispatchSimulated(DB,member,now)});
   if(path==='/test/global-off'){await setGlobalEnabled(DB,b.enabled);return json({ok:true});}
   if(path==='/test/cost')return json({ok:true,data:await reserveSynthetic(DB,member,b.microUsd,now)});
   if(path==='/test/reading')return json({ok:true,data:(await mutate(DB,member,'synthetic_reading',s=>{const r=reading(s,b,now);if(b.source==='calendar'){for(const a of s.actions)if(a.status!=='cancelled')a.status='superseded';s.queue=[];prepareToday(s,now);}return r;})).result});
   throw Object.assign(Error('route_not_found'),{status:404});
  }
  if(path==='/message'){const check=boundary(b.message);return json({ok:true,data:check.coaching?{...check,action:readToday(state)}:check});}
  if(path==='/handoffs')return json({ok:true,data:unsentBrief(state,b.message)});
  if(path==='/calendar/preview')return json({ok:true,data:calendarPreview(state,b.actionId,b.start)});
  const actions={
   '/setup':s=>{const r=setup(s,b,now);prepareToday(s,now);return r;},
   '/memory':s=>{if(request.method==='DELETE'){const r=deleteItem(s,b.id);prepareToday(s,now);return r;}const r=saveFact(s,b.key,b.value,now,b.confirmed!==false);prepareToday(s,now);return r;},
   '/permissions':s=>{const r=setPermission(s,b.source,b.enabled);prepareToday(s,now);return r;},
   '/settings':s=>setSettings(s,b),
   '/pause-request-seen':s=>{const r=s.pauseRequests?.find(r=>r.id===b.id);if(!r||r.status!=='sent')throw Object.assign(Error('request_missing'),{status:404});r.shown=true;return{dataUsed:[]};},
   '/pause-request-answer':s=>{const r=s.pauseRequests?.find(r=>r.id===b.id);if(!r||typeof b.yes!=='boolean')throw Object.assign(Error('request_missing'),{status:400});r.shown=true;r.status=b.yes?'restored':'declined';if(b.yes){s.pausedTypes=s.pausedTypes.filter(x=>x!==r.type);for(const touch of s.touches)if(touch.type===r.type)touch.answered=true;}return{dataUsed:[]};},
   '/accept':s=>accept(s,b.actionId,now),'/decline':s=>reject(s,b.actionId,now),'/outcomes':s=>outcome(s,b.actionId,b.value,now),'/wanted':s=>wanted(s,b.yes,now),
   '/restore':s=>{s.rejected=s.rejected.filter(x=>x!==b.type);s.pausedTypes=s.pausedTypes.filter(x=>x!==b.type);for(const t of s.touches)if(t.type===b.type)t.answered=true;return{dataUsed:prepareToday(s,now).dataUsed};},
   '/doses':s=>dose(s,now),'/readings/confirm':s=>confirmReading(s,b.id),
   '/components':s=>{const r=chooseComponents(s,b.components);prepareToday(s,now);return r;},
   '/weekly-review':s=>{const r=weeklyReview(s,b.rating,now);prepareToday(s,now);return r;},
   '/mode':s=>mode(s,b.mode,now),'/plans/accept':s=>acceptPlan(s,b.id),
   '/calendar/accept':s=>calendarAccept(s,b.actionId,b.start,b.explicitTap),'/calendar/undo':s=>undoCalendar(s,b.id)
  };
  if(!actions[path])throw Object.assign(Error('route_not_found'),{status:404});
  const result=await mutate(DB,member,path.slice(1),actions[path],now);
  if(path==='/memory'&&request.method==='DELETE')await finishDeletion(DB,member,b.id);
  return json({ok:true,data:result.result,action:readToday(result.state)});
 }catch(e){const status=e.status||500;return json({ok:false,error:status===500?'test_request_failed':e.message},status);}
}
