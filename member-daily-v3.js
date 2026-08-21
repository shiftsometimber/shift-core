import core from './worker.js';
import {memberDailyV2Routes} from './member-daily-v2.js';
import {buildShiftBrainContext} from './shift-brain-v1.js';
import {recordProductEvent} from './product-analytics-v1.js';

const ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);
const TODAY='/v1/shift/today',SETUP='/v1/shift/setup',DECISION=/^\/v1\/shift\/today\/actions\/([\w-]+)\/decision$/;
const allowed=new Set(['complete','swap','skip']);
const clean=(v,n=500)=>String(v??'').trim().slice(0,n),parse=v=>{try{return JSON.parse(v||'{}')}catch{return{}}};
const localDate=request=>clean(request.headers.get('X-Shift-Local-Date'),10)||new Date().toISOString().slice(0,10);

export async function memberDailyV3Routes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/',method=request.method.toUpperCase(),match=path.match(DECISION);
  if(path!==TODAY&&path!==SETUP&&!match)return memberDailyV2Routes(request,env,ctx);
  if(method==='OPTIONS')return new Response(null,{status:204,headers:cors(request)});
  const authResult=await authenticate(request,env,ctx);if(authResult.response)return withCors(authResult.response,request);
  const uid=Number(authResult.user.id);await ensureAdaptiveTodaySchema(env.DB);
  if(path===SETUP&&method==='GET')return reply({ok:true,setup:await getSetup(env,uid)},200,request);
  if(path===SETUP&&method==='PATCH')return saveSetup(request,env,uid);
  if(path===TODAY&&method==='GET')return getToday(request,env,ctx,uid,authResult.user);
  if(match&&method==='POST')return decide(request,env,ctx,uid,match[1]);
  return reply({ok:false,error:'method_not_allowed'},405,request);
}

export async function ensureAdaptiveTodaySchema(DB){await DB.batch([
  DB.prepare(`CREATE TABLE IF NOT EXISTS shift_member_preferences (user_id INTEGER PRIMARY KEY,activity_level TEXT,meal_pattern TEXT,movement_preference TEXT,life_priority TEXT,tone TEXT,consent_scope TEXT NOT NULL DEFAULT 'personalisation_v1',preferences_json TEXT NOT NULL DEFAULT '{}',updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
  DB.prepare(`CREATE TABLE IF NOT EXISTS shift_daily_plans (id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,local_date TEXT NOT NULL,context_json TEXT NOT NULL DEFAULT '{}',version INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,local_date))`),
  DB.prepare(`CREATE TABLE IF NOT EXISTS shift_daily_actions (id TEXT PRIMARY KEY,plan_id TEXT NOT NULL,user_id INTEGER NOT NULL,local_date TEXT NOT NULL,position INTEGER NOT NULL,domain TEXT NOT NULL,title TEXT NOT NULL,detail TEXT NOT NULL,why_json TEXT NOT NULL DEFAULT '{}',source_json TEXT NOT NULL DEFAULT '{}',status TEXT NOT NULL DEFAULT 'planned',swap_count INTEGER NOT NULL DEFAULT 0,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
  DB.prepare(`CREATE TABLE IF NOT EXISTS shift_daily_action_events (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,action_id TEXT NOT NULL,plan_id TEXT NOT NULL,local_date TEXT NOT NULL,decision TEXT NOT NULL,reason TEXT,idempotency_key TEXT NOT NULL,payload_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,idempotency_key))`),
  DB.prepare(`CREATE INDEX IF NOT EXISTS idx_shift_daily_actions_user_date ON shift_daily_actions(user_id,local_date,position)`),
  DB.prepare(`CREATE INDEX IF NOT EXISTS idx_shift_daily_events_user_date ON shift_daily_action_events(user_id,local_date,created_at)`)
]);}

async function getToday(request,env,ctx,uid,user){
  const date=localDate(request);let plan=await env.DB.prepare(`SELECT * FROM shift_daily_plans WHERE user_id=? AND local_date=?`).bind(uid,date).first();
  if(!plan){
    const baseResponse=await memberDailyV2Routes(new Request(request.url,{method:'GET',headers:request.headers}),env,ctx);
    if(!baseResponse?.ok)return baseResponse||reply({ok:false,error:'today_unavailable'},503,request);
    const base=(await baseResponse.json()).today||{};
    const [brain,setup,history]=await Promise.all([buildShiftBrainContext(env,uid,'today',{knowledgeLimit:0}),getSetup(env,uid),recentHistory(env,uid,date)]);
    plan=await createPlan(env,uid,date,base,brain,setup,history);
  }
  const actions=await listActions(env,uid,plan.id),setup=await getSetup(env,uid);
  const today={date,greeting:`${daypart()}${user?.first_name?`, ${user.first_name}`:''}.`,headline:'Here’s what matters today.',subhead:'Three useful things. Built around you, and allowed to change when real life does.',actions,setup:{complete:setup.complete,missing:setup.missing},progress:{complete:actions.filter(x=>x.status==='completed').length,total:actions.length},context_used:{one_shift_brain:true,stable_daily_plan:true,behaviour_feedback:true,setup_complete:setup.complete},rule:'Safety and clinical boundaries override personalisation. Daily actions are practical support, not medical advice.'};
  defer(ctx,recordProductEvent(env,{userId:uid,eventName:'today_viewed',surface:'shift_today',source:'server',properties:{actions:actions.length,localDate:date}}),'today_analytics');
  return reply({ok:true,today},200,request);
}

async function createPlan(env,uid,date,base,brain,setup,history){
  const id=crypto.randomUUID(),actions=buildAdaptiveActions({baseActions:base.actions||[],setup,history});
  const context={contract:brain?.contract||null,activePlans:Object.keys(brain?.plans?.active||{}),memorySignals:brain?.memory?.intelligent?.length||0,setup:setup.values,history};
  await env.DB.prepare(`INSERT OR IGNORE INTO shift_daily_plans(id,user_id,local_date,context_json) VALUES(?,?,?,?)`).bind(id,uid,date,JSON.stringify(context)).run();
  const stored=await env.DB.prepare(`SELECT * FROM shift_daily_plans WHERE user_id=? AND local_date=?`).bind(uid,date).first();
  if(stored.id===id)await env.DB.batch(actions.map((a,i)=>env.DB.prepare(`INSERT INTO shift_daily_actions(id,plan_id,user_id,local_date,position,domain,title,detail,why_json,source_json) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),id,uid,date,i,a.domain,a.title,a.detail,JSON.stringify(a.why),JSON.stringify(a.source))));
  return stored;
}

export function buildAdaptiveActions({baseActions=[],setup={},history={}}={}){
  const values=setup.values||{},map={};for(const item of baseActions){const domain=normalDomain(item.domain);if(!map[domain])map[domain]=item}
  const skipped=new Set(history.skippedDomains||[]),completed=new Set(history.completedDomains||[]),eat=map.eat||{},move=map.move||{},life=map.life||{};
  const eatTitle=eat.title||(values.meal_pattern==='chaotic'?'Decide dinner before hunger decides it':'Build one meal around protein');
  const moveTitle=move.title||(values.movement_preference==='strength'?'Do a short strength session':'Take a ten-minute walk');
  const lifeLabel={energy:'more energy',confidence:'confidence',sleep:'better sleep',family:'family time',headspace:'headspace'}[values.life_priority]||'feeling more like yourself';
  return [
    makeAction('eat',eatTitle,eat.detail||eat.text||'Keep it practical: choose the next meal, not a perfect week.',explanation('eat',eat,values,skipped,completed),{from:eat.domain?'current_plan':'adaptive_fallback'}),
    makeAction('move',moveTitle,move.detail||move.text||'Small enough to start; useful enough to count.',explanation('move',move,values,skipped,completed),{from:move.domain?'current_plan':'adaptive_fallback'}),
    makeAction('life',life.title||`Protect ten minutes for ${lifeLabel}`,life.detail||life.text||'Weight matters, but it is not the only result worth getting back.',explanation('life',life,values,skipped,completed),{from:life.domain?'current_plan':'member_priority'})
  ];
}
function normalDomain(value){const d=String(value||'').toLowerCase();if(['grub','food','protein'].includes(d))return'eat';if(['fit','movement','steps','hydration'].includes(d))return'move';return'life'}
function makeAction(domain,title,detail,why,source){return{domain,title:clean(title,180),detail:clean(detail,500),why,source}}
function explanation(domain,base,values,skipped,completed){const reason=base.domain?'It connects to your current Shift plan.':domain==='life'&&values.life_priority?'It reflects what you said you want life to feel like again.':'It is a useful starting point while Shift learns what works for you.';const learned=skipped.has(domain)?'You skipped a similar action recently, so today’s version is deliberately smaller.':completed.has(domain)?'You completed a similar action recently, so Shift is keeping the momentum familiar.':null;return{headline:'Why this today?',reason,learned,inputs:['your saved preferences','your active plans','your recent choices'],medical_advice:false}}

async function decide(request,env,ctx,uid,actionId){
  const body=await request.json().catch(()=>({})),decision=clean(body.decision,20),reason=clean(body.reason,300);
  if(!allowed.has(decision))return reply({ok:false,error:'invalid_decision'},400,request);
  const row=await env.DB.prepare(`SELECT * FROM shift_daily_actions WHERE id=? AND user_id=?`).bind(actionId,uid).first();if(!row)return reply({ok:false,error:'action_not_found'},404,request);
  const key=clean(body.idempotencyKey,100)||`${actionId}:${decision}:${row.swap_count}`;
  const existing=await env.DB.prepare(`SELECT id FROM shift_daily_action_events WHERE user_id=? AND idempotency_key=?`).bind(uid,key).first();if(existing)return reply({ok:true,replayed:true,action:publicAction(row)},200,request);
  if(decision==='swap'){const next=swapFor(row.domain,Number(row.swap_count||0)+1);await env.DB.prepare(`UPDATE shift_daily_actions SET title=?,detail=?,why_json=?,swap_count=swap_count+1,status='planned',updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?`).bind(next.title,next.detail,JSON.stringify(next.why),actionId,uid).run();}
  else await env.DB.prepare(`UPDATE shift_daily_actions SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?`).bind(decision==='complete'?'completed':'skipped',actionId,uid).run();
  await env.DB.prepare(`INSERT INTO shift_daily_action_events(user_id,action_id,plan_id,local_date,decision,reason,idempotency_key,payload_json) VALUES(?,?,?,?,?,?,?,?)`).bind(uid,actionId,row.plan_id,row.local_date,decision,reason||null,key,JSON.stringify({previousStatus:row.status})).run();
  const updated=await env.DB.prepare(`SELECT * FROM shift_daily_actions WHERE id=? AND user_id=?`).bind(actionId,uid).first();
  defer(ctx,recordProductEvent(env,{userId:uid,eventName:`today_action_${decision}`,surface:'shift_today',source:'server',properties:{domain:row.domain,localDate:row.local_date}}),'decision_analytics');
  const message=decision==='complete'?'Nice one. That counts.':decision==='skip'?'No guilt. Shift will learn from it.':'Swapped. Same direction, better fit.';
  return reply({ok:true,action:publicAction(updated),message},200,request);
}
function swapFor(domain,count){const options={eat:[['Choose your next meal now','One decision now can remove a harder decision later.'],['Add protein to what you already planned','No reinvention required—just make the existing meal work harder.']],move:[['Walk for five minutes','A smaller action is still a real action.'],['Stand up and loosen off for three minutes','Useful on the days a workout is not happening.']],life:[['Message someone you trust','A small bit of connection can shift the shape of a day.'],['Do one thing that is not about weight','Progress should give you more life, not another full-time job.']]};const list=options[domain]||options.life,[title,detail]=list[(count-1)%list.length];return{title,detail,why:{headline:'Why this instead?',reason:'You asked for another option, so Shift kept the purpose and reduced the friction.',learned:'Your swap is saved and will influence later suggestions.',inputs:['your choice just now'],medical_advice:false}}}

async function listActions(env,uid,planId){const rows=(await env.DB.prepare(`SELECT * FROM shift_daily_actions WHERE user_id=? AND plan_id=? ORDER BY position`).bind(uid,planId).all()).results||[];return rows.map(publicAction)}
function publicAction(row){return{id:row.id,domain:row.domain,eyebrow:row.domain==='eat'?'EAT':row.domain==='move'?'MOVE':'LIFE BACK',title:row.title,detail:row.detail,status:row.status,swap_count:Number(row.swap_count||0),why:parse(row.why_json),source:parse(row.source_json),controls:['complete','swap','skip']}}
async function recentHistory(env,uid,before){const rows=(await env.DB.prepare(`SELECT a.domain,e.decision,e.local_date FROM shift_daily_action_events e JOIN shift_daily_actions a ON a.id=e.action_id WHERE e.user_id=? AND e.local_date<? ORDER BY e.id DESC LIMIT 30`).bind(uid,before).all()).results||[];return{completedDomains:[...new Set(rows.filter(x=>x.decision==='complete').map(x=>x.domain))],skippedDomains:[...new Set(rows.filter(x=>x.decision==='skip').map(x=>x.domain))],recentEvents:rows.slice(0,10)}}

async function getSetup(env,uid){const row=await env.DB.prepare(`SELECT * FROM shift_member_preferences WHERE user_id=?`).bind(uid).first();const values=row?{activity_level:row.activity_level,meal_pattern:row.meal_pattern,movement_preference:row.movement_preference,life_priority:row.life_priority,tone:row.tone,...parse(row.preferences_json)}:{};const missing=['activity_level','meal_pattern','movement_preference','life_priority'].filter(key=>!values[key]);return{complete:missing.length===0,missing,values,consent_scope:row?.consent_scope||'personalisation_v1'}}
async function saveSetup(request,env,uid){const body=await request.json().catch(()=>({}));const valid={activity_level:['low','some','regular'],meal_pattern:['structured','mixed','chaotic'],movement_preference:['walking','strength','mixed','unsure'],life_priority:['energy','confidence','sleep','family','headspace'],tone:['direct','supportive','quiet']};for(const[key,values]of Object.entries(valid))if(body[key]!=null&&!values.includes(body[key]))return reply({ok:false,error:`invalid_${key}`},400,request);const current=(await getSetup(env,uid)).values,next={...current,...Object.fromEntries(Object.keys(valid).filter(key=>body[key]!=null).map(key=>[key,body[key]]))};await env.DB.prepare(`INSERT INTO shift_member_preferences(user_id,activity_level,meal_pattern,movement_preference,life_priority,tone,preferences_json,updated_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET activity_level=excluded.activity_level,meal_pattern=excluded.meal_pattern,movement_preference=excluded.movement_preference,life_priority=excluded.life_priority,tone=excluded.tone,preferences_json=excluded.preferences_json,updated_at=CURRENT_TIMESTAMP`).bind(uid,next.activity_level||null,next.meal_pattern||null,next.movement_preference||null,next.life_priority||null,next.tone||'direct',JSON.stringify({})).run();const date=localDate(request),plan=await env.DB.prepare(`SELECT p.id,(SELECT COUNT(*) FROM shift_daily_action_events e WHERE e.plan_id=p.id) event_count FROM shift_daily_plans p WHERE p.user_id=? AND p.local_date=?`).bind(uid,date).first();if(plan&&Number(plan.event_count||0)===0){await env.DB.prepare(`DELETE FROM shift_daily_actions WHERE user_id=? AND plan_id=?`).bind(uid,plan.id).run();await env.DB.prepare(`DELETE FROM shift_daily_plans WHERE user_id=? AND id=?`).bind(uid,plan.id).run()}return reply({ok:true,setup:await getSetup(env,uid)},200,request)}

async function authenticate(request,env,ctx){const result=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!result.ok)return{response:result};return{user:(await result.json()).user}}
function daypart(){const h=new Date().getUTCHours();return h<12?'Morning':h<18?'Afternoon':'Evening'}
function reply(data,status,request){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...cors(request)}})}
function cors(request){const origin=request.headers.get('Origin')||'',headers={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, PATCH, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Idempotency-Key, X-Shift-Local-Date','Vary':'Origin'};if(ORIGINS.has(origin))headers['Access-Control-Allow-Origin']=origin;return headers}
function withCors(result,request){const headers=new Headers(result.headers);for(const[key,value]of Object.entries(cors(request)))headers.set(key,value);return new Response(result.body,{status:result.status,statusText:result.statusText,headers})}
function defer(ctx,promise,label){const guarded=promise.catch(error=>console.warn(`${label}_failed`,error?.message));if(ctx?.waitUntil)ctx.waitUntil(guarded)}
