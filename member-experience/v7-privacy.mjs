import {authenticateMember} from '../member-state-fast-v1.js';
const headers={'Cache-Control':'no-store, private','Vary':'Cookie','X-Content-Type-Options':'nosniff'};
// Extend the existing erasure transaction, not a second best-effort deletion.
// The original handler still owns authentication, origin, confirmation, audit,
// clinical retention and its response. Only the new optional V7 stores are added.
export function erasureDatabase(DB,userId,present,healthOnly){
 const sql=new WeakMap(),raw=new WeakMap();
 function statement(value,text){
  const proxy=new Proxy(value,{get(target,name){
   if(name==='bind')return (...args)=>statement(target.bind(...args),text);
   const v=Reflect.get(target,name,target);return typeof v==='function'?v.bind(target):v;
  }});sql.set(proxy,text);raw.set(proxy,value);return proxy;
 }
 return new Proxy(DB,{get(target,name){
  if(name==='prepare')return text=>statement(target.prepare(text),text);
  if(name==='batch')return async statements=>{
   const sources=statements.map(x=>sql.get(x)||''),erases=healthOnly?sources.some(x=>x.includes('UPDATE member_state')&&x.includes('json_remove')&&x.includes('$.lifeBack')):sources.some(x=>x.includes('UPDATE users SET email=CASE'));
   const batch=statements.map(x=>raw.get(x)||x);
   if(erases){
    if(present.has('mt_v7_crew_invites'))batch.push(DB.prepare('DELETE FROM mt_v7_crew_invites WHERE creator_id=?').bind(userId));
    for(const table of ['mt_v7_crew_members','mt_v7_effort'])if(present.has(table))batch.push(DB.prepare('DELETE FROM '+table+' WHERE user_id=?').bind(userId));
    if(present.has('mt_v7_crews'))batch.push(DB.prepare('UPDATE mt_v7_crews SET created_by=NULL WHERE created_by=?').bind(userId));
    if(!healthOnly)batch.push(DB.prepare("UPDATE member_state SET preferences=json_remove(preferences,'$.shedArcade') WHERE user_id=?").bind(userId));
    if(healthOnly)batch.push(DB.prepare("UPDATE member_state SET preferences=json_remove(preferences,'$.v7NutritionDay') WHERE user_id=?").bind(userId));
   }
   return target.batch(batch);
  };
  const v=Reflect.get(target,name,target);return typeof v==='function'?v.bind(target):v;
 }});
}
export function withV7Privacy(original){return {...original,async fetch(request,env,ctx){
 const path=new URL(request.url).pathname,erase=request.method==='DELETE'&&['/v1/privacy/account','/v1/privacy/health-tracking'].includes(path),exporting=request.method==='POST'&&path==='/v1/privacy/export';
 if(!erase&&!exporting)return original.fetch(request,env,ctx);
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 try{
  let response;
  if(erase){const rows=(await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'mt_v7_%'").all()).results||[],present=new Set(rows.map(r=>r.name));response=await original.fetch(request,{...env,DB:erasureDatabase(env.DB,auth.userId,present,path.endsWith('/health-tracking'))},ctx);}
  else response=await original.fetch(request,env,ctx);
  if(!exporting||!response.ok)return response;
  const body=await response.json(),row=await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(auth.userId).first(),prefs=JSON.parse(row?.preferences||'{}');
  const exists=await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='mt_v7_crew_members'").first();
  const membership=exists?await env.DB.prepare('SELECT crew_id,alias,joined_at FROM mt_v7_crew_members WHERE user_id=?').bind(auth.userId).first():null;
  const effort=exists?(await env.DB.prepare('SELECT week,logs,updated_at FROM mt_v7_effort WHERE user_id=? ORDER BY week').bind(auth.userId).all()).results||[]:[];
  return Response.json({...body,myTimberV7:{arcade:prefs.shedArcade||null,progress:prefs.lifeBack?.progress?.v7||null,nutritionSummary:prefs.v7NutritionDay||null,privateCrew:{membership,effort}}},{status:response.status,headers});
 }catch{return Response.json({error:'privacy_unavailable',message:'Your complete privacy request could not be confirmed. Please retry.'},{status:503,headers});}
}};}
