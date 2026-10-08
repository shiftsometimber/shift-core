import core from './worker.js';

// These existing member events record usage only. Keep their health details
// and free text in the member record, never in analytics properties.
const MY_TIMBER_USAGE_PROPERTIES=new Map([
  ['continuity_today_exposed',[]],
  ['my_timber_today_viewed',['date','mealSaved','moveSaved']],
  ['my_timber_meal_saved',['date']],
  ['my_timber_move_saved',['date']],
  ['my_timber_checkin_saved',['date']],
  ['my_timber_treatment_action',['date']],
  ['after_treatment_started',[]],
  ['after_treatment_week_viewed',['week']]
]);
const ALLOWED_EVENTS=new Set([
  ...MY_TIMBER_USAGE_PROPERTIES.keys(),
  'registration_started','registration_completed','login_succeeded','onboarding_completed',
  'today_viewed','today_action_opened','grub_plan_generated','grub_feedback','fit_plan_generated','fit_feedback',
  'hydration_logged','progress_logged','progress_picture_saved','progress_picture_deleted','shift_ai_message',
  'plan_viewed','error_presented','feature_completed','treatment_checkin','member_returned',
  'daily_shift_rebuilt','daily_recovery_completed','daily_meal_accepted','daily_meal_swapped','daily_meal_rejected','daily_recommendation_feedback',
]);
// Default-deny properties for every registered event. Usage reporting must not
// become a second copy of member answers, symptoms, identifiers or free text.
const bool=value=>typeof value==='boolean';
const integer=(min,max)=>value=>Number.isInteger(value)&&value>=min&&value<=max;
const oneOf=(...values)=>value=>typeof value==='string'&&values.includes(value);
const PRIVATE_PROPERTY_KEYS=/password|token|secret|email|phone|address|symptom|diagnos|medication/i;
const GENERAL_USAGE_PROPERTIES=new Map([
 ['registration_started',{path:oneOf('fast-v2','core')}],
 ['registration_completed',{path:oneOf('fast-v2','core')}],
 ['login_succeeded',{verified:bool}],
 ['onboarding_completed',{profileContext:bool}],
 ['member_returned',{via:oneOf('login')}],
 ['today_viewed',{page:oneOf('today'),count:integer(0,100),enabled:bool}],
 ['grub_plan_generated',{retainedPlan:bool,composer:oneOf('v8'),recording:oneOf('authenticated_request'),oneShiftBrain:bool,preferencesApplied:bool,qualityReview:bool}],
 ['fit_plan_generated',{retainedPlan:bool,composer:oneOf('v8'),recording:oneOf('authenticated_request'),oneShiftBrain:bool,preferencesApplied:bool,qualityReview:bool}],
 ['shift_ai_message',{oneShiftBrain:bool,memoryUsed:bool,feedbackUsed:bool,knowledgeSources:integer(0,100)}],
 ['progress_logged',{retained:bool}],
 ['error_presented',{status:integer(400,599),reason:oneOf('semantic_quality_floor','invalid_credentials','unauthorised','unauthorized','rate_limited')}],
 ['daily_recommendation_feedback',{target:oneOf('today','grub','fit','recovery'),feedback:oneOf('love','not_again','effort','expensive','wrong_today')}]
]);
const DAILY_USAGE_EVENTS=new Set(['daily_shift_rebuilt','daily_recovery_completed','daily_meal_accepted','daily_meal_swapped','daily_meal_rejected','daily_recommendation_feedback']);
const USAGE_SURFACES=new Set(['unknown','registration','auth','onboarding','today','dashboard','grub','fit','progress','shift_ai','shift_grub','shift_fit','my_timber_today','my_timber_problem_first','grub_programme','fit_programme_uk','daily_shift_front_door','daily_shift_today']);
const USAGE_SOURCES=new Set(['server','member','member_client']);
function sanitiseGeneralUsage(name,properties){
 if(!properties||typeof properties!=='object'||Array.isArray(properties))return{};
 const out={},rules=GENERAL_USAGE_PROPERTIES.get(name)||{};
 for(const[key,accept]of Object.entries(rules))if(!PRIVATE_PROPERTY_KEYS.test(key)&&Object.hasOwn(properties,key)&&accept(properties[key]))out[key]=properties[key];
 if(DAILY_USAGE_EVENTS.has(name)&&Object.hasOwn(properties,'date')){
  const date=sanitiseMyTimberUsage('my_timber_checkin_saved',{date:properties.date}).date;
  if(date)out.date=date;
 }
 return out;
}
const ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://shiftsometimber.com','https://www.shiftsometimber.com']);

export async function analyticsRoutes(request,env,ctx){
  const path=new URL(request.url).pathname.replace(/\/+$/,'')||'/';if(path!=='/v1/events')return null;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(request)});
  if(request.method!=='POST')return json({ok:false,error:'method_not_allowed'},405,request);
  const a=await auth(request,env,ctx);if(a.response)return withCors(a.response,request);const body=await read(request);
  try{const event=await recordProductEvent(env,{userId:Number(a.user.id),eventName:body.event_name||body.eventName,surface:body.surface,properties:body.properties,sessionId:body.session_id||body.sessionId,source:'member_client'});return json({ok:true,event},201,request)}catch(e){return json({ok:false,error:'invalid_event',message:e.message},400,request)}
}

export async function recordProductEvent(env,{userId=null,eventName,surface='unknown',properties={},sessionId=null,source='server',occurredAt=null}={}){
  const name=String(eventName||'').trim();if(!ALLOWED_EVENTS.has(name))throw new Error(`unsupported event: ${name}`);
  await ensureAnalyticsSchema(env.DB);
  const cleanProperties=MY_TIMBER_USAGE_PROPERTIES.has(name)?sanitiseMyTimberUsage(name,properties):sanitiseGeneralUsage(name,properties);
  const occurred_at=normaliseOccurredAt(occurredAt);
  const cleanSurface=USAGE_SURFACES.has(surface)?surface:'unknown';
  const cleanSource=USAGE_SOURCES.has(source)?source:'server';
  // Client-provided session strings are unnecessary for account-owned usage
  // counts and can contain private text. Do not retain or echo them.

  const r=await env.DB.prepare(`INSERT INTO product_events(user_id,event_name,surface,session_id,source,properties_json,occurred_at,created_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(userId,name,cleanSurface,null,cleanSource,JSON.stringify(cleanProperties),occurred_at).run();
  return{id:Number(r?.meta?.last_row_id||0),event_name:name,surface:cleanSurface,occurred_at};
}

export async function analyticsSnapshot(DB,{hours=24,now=new Date()}={}){
  await ensureAnalyticsSchema(DB);hours=Math.max(1,Math.min(24*90,Number(hours)||24));
  // Writers store canonical UTC ISO timestamps. Use the same representation
  // for both bounds so the cutoff day does not become an extra partial day.
  const until=new Date(now).toISOString(),since=new Date(Date.parse(until)-hours*3600000).toISOString();
  const [events,active,features,errors]=await Promise.all([
    DB.prepare(`SELECT event_name,COUNT(*) count FROM product_events WHERE occurred_at>=? AND occurred_at<=? GROUP BY event_name ORDER BY count DESC`).bind(since,until).all(),
    DB.prepare(`SELECT COUNT(DISTINCT user_id) count FROM product_events WHERE user_id IS NOT NULL AND occurred_at>=? AND occurred_at<=?`).bind(since,until).first(),
    DB.prepare(`SELECT surface,COUNT(*) count FROM product_events WHERE occurred_at>=? AND occurred_at<=? GROUP BY surface ORDER BY count DESC LIMIT 20`).bind(since,until).all(),
    DB.prepare(`SELECT COUNT(*) count FROM product_events WHERE event_name='error_presented' AND occurred_at>=? AND occurred_at<=?`).bind(since,until).first()
  ]);
  return{windowHours:hours,activeMembers:Number(active?.count||0),errors:Number(errors?.count||0),events:events?.results||[],surfaces:features?.results||[]};
}

export async function ensureAnalyticsSchema(DB){await DB.exec(`CREATE TABLE IF NOT EXISTS product_events (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,event_name TEXT NOT NULL,surface TEXT NOT NULL,session_id TEXT,source TEXT NOT NULL DEFAULT 'server',properties_json TEXT NOT NULL DEFAULT '{}',occurred_at TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);CREATE INDEX IF NOT EXISTS idx_product_events_name_time ON product_events(event_name,occurred_at);CREATE INDEX IF NOT EXISTS idx_product_events_user_time ON product_events(user_id,occurred_at);CREATE INDEX IF NOT EXISTS idx_product_events_surface_time ON product_events(surface,occurred_at);`)}
function normaliseOccurredAt(value){if(value){const t=Date.parse(String(value));if(Number.isFinite(t)&&Math.abs(Date.now()-t)<=24*60*60*1000)return new Date(t).toISOString()}return new Date().toISOString()}
function sanitiseMyTimberUsage(name,properties){
  if(!properties||typeof properties!=='object'||Array.isArray(properties))return{};
  const out={};
  for(const key of MY_TIMBER_USAGE_PROPERTIES.get(name)||[]){
    if(!Object.hasOwn(properties,key))continue;
    const value=properties[key];
    if(key==='date'){
      // Exact calendar date only: no coercion, nested values or text suffixes.
      if(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)){
        const timestamp=Date.parse(`${value}T00:00:00.000Z`);
        if(Number.isFinite(timestamp)&&new Date(timestamp).toISOString().slice(0,10)===value)out.date=value;
      }
    }else if(key==='week'&&Number.isInteger(value)&&value>=1&&value<=12)out.week=value;
    else if(typeof value==='boolean')out[key]=value;
  }
  return out;
}
async function auth(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user}}
async function read(r){try{return await r.json()}catch{return{}}}
function cors(request){const origin=request.headers.get('Origin')||'',h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h}
function json(d,s=200,request){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...cors(request)}})}
function withCors(r,request){const h=new Headers(r.headers);for(const[k,v]of Object.entries(cors(request)))h.set(k,v);return new Response(r.body,{status:r.status,statusText:r.statusText,headers:h})}
