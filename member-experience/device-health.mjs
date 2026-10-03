import {authenticateMember} from '../member-state-fast-v1.js';
const platforms=new Set(['apple_health','health_connect']);
const VERSION='native-health-import/2026-10-03';
const origins=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://api.shiftsometimber.co.uk']);
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','Vary':'Cookie','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'}});
const fail=(message,status=400)=>Object.assign(Error(message),{status});
const consentSQL=type=>`COALESCE((SELECT granted FROM consents WHERE user_id=? AND consent_type='${type}' ORDER BY id DESC LIMIT 1),0)=1`;
const tracking=consentSQL('my_shift_health_tracking');
const native=platform=>consentSQL('native_health_import_'+platform);
async function enabled(DB,uid,type){return Number((await DB.prepare('SELECT granted FROM consents WHERE user_id=? AND consent_type=? ORDER BY id DESC LIMIT 1').bind(uid,type).first())?.granted)===1;}
export function normaliseDeviceReadings(platform,input,now=Date.now()){
 if(!platforms.has(platform)||!Array.isArray(input)||input.length<1||input.length>150)throw fail('Choose between 1 and 150 supported readings.');
 const keys=new Set();
 return input.map(r=>{
  if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).some(k=>!['id','kind','at','heartRate','systolic','diastolic','weightKg','source'].includes(k)))throw fail('Unsupported reading fields.');
  if(typeof r.id!=='string'||!/^[A-Za-z0-9_.:-]{1,160}$/.test(r.id)||!['heart_rate','blood_pressure','weight'].includes(r.kind))throw fail('Invalid reading identity.');
  const at=Date.parse(r.at);if(typeof r.at!=='string'||!Number.isFinite(at)||at>now+300000||at<now-30*86400000)throw fail('Only readings from the last 30 days can be imported.');
  const key=platform+':'+r.kind+':'+r.id;if(keys.has(key))throw fail('Duplicate readings in this import.');keys.add(key);
  if(typeof r.source!=='string'||r.source.length<1||r.source.length>100||/[\x00-\x1f]/.test(r.source))throw fail('Invalid reading source.');
  const out={id:r.id,key,platform,kind:r.kind,at:new Date(at).toISOString(),source:r.source};
  const number=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  if(r.kind==='heart_rate'){
   if(!number(r.heartRate,10,350)||r.systolic!==undefined||r.diastolic!==undefined||r.weightKg!==undefined)throw fail('Invalid heart-rate reading.');out.heartRate=r.heartRate;out.unit='bpm';
  }else if(r.kind==='blood_pressure'){
   if(!number(r.systolic,20,400)||!number(r.diastolic,10,300)||r.systolic<r.diastolic||r.heartRate!==undefined||r.weightKg!==undefined)throw fail('Invalid blood-pressure reading.');out.systolic=r.systolic;out.diastolic=r.diastolic;out.unit='mmHg';
  }else{
   if(!number(r.weightKg,20,500)||r.heartRate!==undefined||r.systolic!==undefined||r.diastolic!==undefined)throw fail('Invalid weight reading.');out.weightKg=r.weightKg;out.unit='kg';
  }
  return out;
 });
}
export async function readDeviceHealth(DB,uid){
 const row=await DB.prepare("SELECT json_extract(preferences,'$.deviceHealth') state FROM member_state WHERE user_id=?").bind(uid).first();
 const data=row?.state?JSON.parse(row.state):{readings:[]};
 return {accountId:uid,trackingEnabled:await enabled(DB,uid,'my_shift_health_tracking'),permissions:Object.fromEntries(await Promise.all([...platforms].map(async p=>[p,await enabled(DB,uid,'native_health_import_'+p)]))),readings:data.readings||[],lastImportedAt:data.lastImportedAt||null,limit:500,clinicalMonitoring:false};
}
export async function deviceHealthRoutes(request,env){
 if(env.MEMBER_EXPERIENCE_V1_ENABLED!=='true'||new URL(request.url).pathname.replace(/\/+$/,'')!=='/v1/device-health')return null;
 if(!['GET','POST'].includes(request.method))return json({error:'method_not_allowed'},405);
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 try{
  if(request.method==='GET')return json(await readDeviceHealth(env.DB,auth.userId));
  if(request.headers.get('Sec-Fetch-Site')==='cross-site'||!origins.has(request.headers.get('Origin')))throw fail('Use your signed-in account page.',403);
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))throw fail('JSON required.',415);
  const text=await request.text();if(new TextEncoder().encode(text).length>60000)throw fail('Import is too large.',413);
  let body;try{body=JSON.parse(text)}catch{throw fail('Invalid import.');}
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!['action','platform','expectedAccountId','agreed','readings'].includes(k)))throw fail('Invalid import.');
  if(body.expectedAccountId!==auth.userId)throw fail('Your signed-in account changed. Reload and review the import.',409);
  if(!platforms.has(body.platform)||!['connect','disconnect','import','erase'].includes(body.action))throw fail('Unsupported health action.');
  const DB=env.DB,uid=auth.userId,now=new Date().toISOString(),type='native_health_import_'+body.platform;
  if(['connect','disconnect'].includes(body.action)){
   const grant=body.action==='connect';if(grant&&body.agreed!==true)throw fail('Explicit health import consent is required.');
   const sql=`INSERT INTO consents(user_id,consent_type,consent_version,granted,granted_at,withdrawn_at,created_at) SELECT ?,?,?,?,?,?,?${grant?' WHERE '+tracking:''}`;
   const result=await DB.prepare(sql).bind(uid,type,VERSION,grant?1:0,grant?now:null,grant?null:now,now,...(grant?[uid]:[])).run();
   if(result.meta?.changes!==1)throw fail('Switch on optional health tracking before connecting.',409);
   if(grant)await DB.prepare("INSERT INTO member_state(user_id,preferences,updated_at) VALUES(?,'{}',?) ON CONFLICT(user_id) DO NOTHING").bind(uid,now).run();
   return json(await readDeviceHealth(DB,uid));
  }
  const row=await DB.prepare("SELECT json_extract(preferences,'$.deviceHealth') state FROM member_state WHERE user_id=?").bind(uid).first();
  const previous=row?.state||null,current=previous?JSON.parse(previous):{readings:[]};
  let next;
  if(body.action==='erase')next={...current,readings:(current.readings||[]).filter(r=>r.platform!==body.platform)};
  else{
   const incoming=normaliseDeviceReadings(body.platform,body.readings),saved=new Map((current.readings||[]).map(r=>[r.key,r]));
   for(const r of incoming){const old=saved.get(r.key);if(old&&JSON.stringify({...old,importedAt:undefined})!==JSON.stringify(r))throw fail('An existing source reading changed. Erase its imported copy before reimporting.',409);if(!old)saved.set(r.key,{...r,importedAt:now});}
   if(saved.size>500)throw fail('Your 500-reading limit is reached. Export and erase imported copies before adding more.',409);
   next={readings:[...saved.values()].sort((a,b)=>b.at.localeCompare(a.at)),lastImportedAt:now};
  }
  const guard=body.action==='import'?` AND ${tracking} AND ${native(body.platform)}`:'';
  const statement=DB.prepare(`UPDATE member_state SET preferences=json_set(preferences,'$.deviceHealth',json(?)),updated_at=? WHERE user_id=? AND json_extract(preferences,'$.deviceHealth') IS ?${guard}`).bind(JSON.stringify(next),now,uid,previous,...(body.action==='import'?[uid,uid]:[]));
  const statements=[statement];
  if(body.action==='erase')statements.push(DB.prepare('INSERT INTO consents(user_id,consent_type,consent_version,granted,withdrawn_at,created_at) VALUES(?,?,?,0,?,?)').bind(uid,type,VERSION,now,now));
  const results=await DB.batch(statements);if(results[0].meta?.changes!==1)throw fail('Tracking was switched off or your records changed. Reload before retrying.',409);
  return json({...await readDeviceHealth(DB,uid),saved:true});
 }catch(e){return json({error:'device_health_not_saved',message:e.status?e.message:'Your device readings could not be verified. Reload before retrying.'},e.status||503);}
}
