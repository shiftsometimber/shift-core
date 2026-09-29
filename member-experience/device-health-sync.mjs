import {authenticateMember} from '../member-state-fast-v1.js';
import {trackingConsent} from './health-routes.mjs';

const H={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','Vary':'Cookie'};
const json=(body,status=200)=>Response.json(body,{status,headers:H});
const TYPES={
 weight_kg:[25,400,'kg'],body_fat_pct:[2,75,'%'],
 systolic_mmhg:[50,300,'mmHg'],diastolic_mmhg:[30,200,'mmHg'],
 heart_rate_bpm:[25,250,'bpm'],resting_heart_rate_bpm:[25,220,'bpm'],
 oxygen_saturation_pct:[50,100,'%'],respiratory_rate_bpm:[4,80,'breaths/min'],
 body_temperature_c:[30,45,'C'],steps:[0,200000,'count'],
 active_energy_kcal:[0,20000,'kcal'],distance_m:[0,300000,'m'],
 sleep_minutes:[0,1440,'min'],exercise_minutes:[0,1440,'min']
};
const PLATFORMS=new Set(['apple_health','health_connect']);
const pathOf=r=>new URL(r.url).pathname.replace(/\/+$/,'');
async function digest(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function validReading(r,now=Date.now()){
 if(!r||typeof r!=='object'||Array.isArray(r)||!TYPES[r.type])return null;
 const [lo,hi,unit]=TYPES[r.type],value=Number(r.value),time=Date.parse(r.observedAt),id=String(r.sourceRecordId||'');
 if(!Number.isFinite(value)||value<lo||value>hi||!Number.isFinite(time)||time>now+300000||time<now-31*86400000||id.length<1||id.length>240)return null;
 return{type:r.type,value,unit,observedAt:new Date(time).toISOString(),sourceRecordId:id};
}
async function tables(env){
 for(const name of ['device_health_connections','device_health_readings']){
  const row=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(name).first();if(!row)return false;
 }
 return true;
}
async function auth(request,env){
 const a=await authenticateMember(request,env);if(a.response)return{response:new Response(a.response.body,{status:a.response.status,headers:{...H,'Content-Type':'application/json'}})};return a;
}
export async function deviceHealthSyncRoute(request,env){
 const path=pathOf(request);
 if(!['/v1/device-health/status','/v1/device-health/readings','/v1/device-health/connection'].includes(path))return null;
 if(!await tables(env))return json({ok:false,error:'health_sync_not_ready',message:'Connected health is not available yet.'},503);
 const a=await auth(request,env);if(a.response)return a.response;
 const tracking=await trackingConsent(env.DB,a.userId);
 if(path==='/v1/device-health/status'&&request.method==='GET'){
  const {results=[]}=await env.DB.prepare('SELECT platform,enabled,last_sync_at,updated_at FROM device_health_connections WHERE user_id=? ORDER BY platform').bind(a.userId).all();
  return json({ok:true,trackingEnabled:tracking,connections:results.map(x=>({platform:x.platform,enabled:Number(x.enabled)===1,lastSyncAt:x.last_sync_at||null,updatedAt:x.updated_at}))});
 }
 if(path==='/v1/device-health/readings'&&request.method==='GET'){
  if(!tracking)return json({ok:true,trackingEnabled:false,latest:{}});
  const {results=[]}=await env.DB.prepare('SELECT type,value,unit,observed_at,platform FROM device_health_readings WHERE user_id=? ORDER BY observed_at DESC LIMIT 250').bind(a.userId).all();
  const latest={};for(const r of results)if(!latest[r.type])latest[r.type]={value:r.value,unit:r.unit,observedAt:r.observed_at,platform:r.platform};
  return json({ok:true,trackingEnabled:true,latest});
 }
 if(path==='/v1/device-health/connection'&&request.method==='DELETE'){
  if(request.headers.get('Origin')!==new URL(request.url).origin)return json({ok:false,error:'origin_not_allowed'},403);
  let b;try{b=await request.json()}catch{return json({ok:false,error:'invalid_json'},400)}
  if(!PLATFORMS.has(b?.platform))return json({ok:false,error:'invalid_platform'},400);
  const at=new Date().toISOString();await env.DB.prepare('UPDATE device_health_connections SET enabled=0,updated_at=? WHERE user_id=? AND platform=?').bind(at,a.userId,b.platform).run();
  return json({ok:true,platform:b.platform,enabled:false});
 }
 if(path==='/v1/device-health/readings'&&request.method==='POST'){
  const origin=request.headers.get('Origin');if(origin&&origin!==new URL(request.url).origin)return json({ok:false,error:'origin_not_allowed'},403);
  if(!tracking)return json({ok:false,error:'health_consent_required',message:'Optional health tracking is off. Turn it on before connecting health data.'},409);
  let raw;try{raw=await request.text()}catch{return json({ok:false,error:'invalid_request'},400)}
  if(new TextEncoder().encode(raw).length>131072)return json({ok:false,error:'request_too_large'},413);
  let b;try{b=JSON.parse(raw)}catch{return json({ok:false,error:'invalid_json'},400)}
  if(!PLATFORMS.has(b?.platform)||!Array.isArray(b?.readings)||b.readings.length<1||b.readings.length>150)return json({ok:false,error:'invalid_request'},400);
  const readings=b.readings.map(r=>validReading(r));if(readings.some(r=>!r))return json({ok:false,error:'invalid_reading',message:'One health reading was outside the supported format or range.'},400);
  const at=new Date().toISOString(),stmts=[];
  for(const r of readings){
   const key=await digest(b.platform+'|'+r.type+'|'+r.sourceRecordId);
   stmts.push(env.DB.prepare('INSERT INTO device_health_readings(user_id,platform,type,value,unit,observed_at,source_record_hash,created_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(user_id,platform,type,source_record_hash) DO UPDATE SET value=excluded.value,unit=excluded.unit,observed_at=excluded.observed_at,created_at=excluded.created_at').bind(a.userId,b.platform,r.type,r.value,r.unit,r.observedAt,key,at));
  }
  stmts.push(env.DB.prepare('INSERT INTO device_health_connections(user_id,platform,enabled,last_sync_at,updated_at) VALUES(?,?,1,?,?) ON CONFLICT(user_id,platform) DO UPDATE SET enabled=1,last_sync_at=excluded.last_sync_at,updated_at=excluded.updated_at').bind(a.userId,b.platform,at,at));
  try{const result=await env.DB.batch(stmts);const inserted=result.slice(0,-1).reduce((n,x)=>n+Number(x?.meta?.changes||0),0);return json({ok:true,platform:b.platform,received:readings.length,inserted,lastSyncAt:at},201)}
  catch{return json({ok:false,error:'health_sync_failed',message:'Your health data could not be confirmed as saved. Please retry the same sync.'},503)}
 }
 return json({ok:false,error:'method_not_allowed'},405);
}
export async function appendDeviceHealthExport(request,env,response){
 if(pathOf(request)!=='/v1/privacy/export'||request.method!=='POST'||!response.ok||!await tables(env))return response;
 try{const a=await authenticateMember(request,env);if(a.response)return a.response;const payload=await response.clone().json();
 const [connections,readings]=await Promise.all([env.DB.prepare('SELECT platform,enabled,last_sync_at,updated_at FROM device_health_connections WHERE user_id=? ORDER BY platform').bind(a.userId).all(),env.DB.prepare('SELECT platform,type,value,unit,observed_at,created_at FROM device_health_readings WHERE user_id=? ORDER BY observed_at DESC').bind(a.userId).all()]);
 payload.connectedHealth={connections:connections.results||[],readings:readings.results||[]};return json(payload,response.status)}catch{return json({error:'export_unavailable',message:'Your export could not include connected health data. Please retry.'},503)}
}
