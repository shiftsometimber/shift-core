import core from './worker.js';

const ALLOWED_EVENTS=new Set([
  'registration_started','registration_completed','login_succeeded','onboarding_completed',
  'today_viewed','today_action_opened','grub_plan_generated','grub_feedback','fit_plan_generated','fit_feedback',
  'hydration_logged','progress_logged','progress_picture_saved','progress_picture_deleted','shift_ai_message',
  'plan_viewed','error_presented','feature_completed','treatment_checkin','member_returned',
  'daily_shift_rebuilt','daily_recovery_completed'
]);
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
  const cleanProperties=sanitise(properties);
  const occurred_at=normaliseOccurredAt(occurredAt);
  const r=await env.DB.prepare(`INSERT INTO product_events(user_id,event_name,surface,session_id,source,properties_json,occurred_at,created_at) VALUES(?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(userId,name,String(surface||'unknown').slice(0,80),sessionId?String(sessionId).slice(0,120):null,String(source||'server').slice(0,40),JSON.stringify(cleanProperties),occurred_at).run();
  return{id:Number(r?.meta?.last_row_id||0),event_name:name,surface,occurred_at};
}

export async function analyticsSnapshot(DB,{hours=24}={}){
  await ensureAnalyticsSchema(DB);hours=Math.max(1,Math.min(24*90,Number(hours)||24));
  const since=`-${hours} hours`;
  const [events,active,features,errors]=await Promise.all([
    DB.prepare(`SELECT event_name,COUNT(*) count FROM product_events WHERE occurred_at>=datetime('now',?) GROUP BY event_name ORDER BY count DESC`).bind(since).all(),
    DB.prepare(`SELECT COUNT(DISTINCT user_id) count FROM product_events WHERE user_id IS NOT NULL AND occurred_at>=datetime('now',?)`).bind(since).first(),
    DB.prepare(`SELECT surface,COUNT(*) count FROM product_events WHERE occurred_at>=datetime('now',?) GROUP BY surface ORDER BY count DESC LIMIT 20`).bind(since).all(),
    DB.prepare(`SELECT COUNT(*) count FROM product_events WHERE event_name='error_presented' AND occurred_at>=datetime('now',?)`).bind(since).first()
  ]);
  return{windowHours:hours,activeMembers:Number(active?.count||0),errors:Number(errors?.count||0),events:events?.results||[],surfaces:features?.results||[]};
}

export async function ensureAnalyticsSchema(DB){await DB.exec(`CREATE TABLE IF NOT EXISTS product_events (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,event_name TEXT NOT NULL,surface TEXT NOT NULL,session_id TEXT,source TEXT NOT NULL DEFAULT 'server',properties_json TEXT NOT NULL DEFAULT '{}',occurred_at TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);CREATE INDEX IF NOT EXISTS idx_product_events_name_time ON product_events(event_name,occurred_at);CREATE INDEX IF NOT EXISTS idx_product_events_user_time ON product_events(user_id,occurred_at);CREATE INDEX IF NOT EXISTS idx_product_events_surface_time ON product_events(surface,occurred_at);`)}
function normaliseOccurredAt(value){if(value){const t=Date.parse(String(value));if(Number.isFinite(t)&&Math.abs(Date.now()-t)<=24*60*60*1000)return new Date(t).toISOString()}return new Date().toISOString()}
function sanitise(v){if(!v||typeof v!=='object'||Array.isArray(v))return{};const out={};for(const[k,val]of Object.entries(v).slice(0,40)){if(/password|token|secret|email|phone|address|symptom|diagnos|medication/i.test(k))continue;if(typeof val==='string')out[k]=val.slice(0,300);else if(typeof val==='number'||typeof val==='boolean'||val===null)out[k]=val;else if(Array.isArray(val))out[k]=val.slice(0,20).map(x=>typeof x==='string'?x.slice(0,100):x);}return out}
async function auth(request,env,ctx){const r=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);if(!r.ok)return{response:r};return{user:(await r.json()).user}}
async function read(r){try{return await r.json()}catch{return{}}}
function cors(request){const origin=request.headers.get('Origin')||'',h={'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};if(ORIGINS.has(origin))h['Access-Control-Allow-Origin']=origin;return h}
function json(d,s=200,request){return new Response(JSON.stringify(d),{status:s,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...cors(request)}})}
function withCors(r,request){const h=new Headers(r.headers);for(const[k,v]of Object.entries(cors(request)))h.set(k,v);return new Response(r.body,{status:r.status,statusText:r.statusText,headers:h})}
