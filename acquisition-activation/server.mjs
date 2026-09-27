import {authenticateMember} from '../member-state-fast-v1.js';
import {VERSION,normaliseAcquisition} from './model.mjs';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Vary':'Cookie','Referrer-Policy':'no-referrer'};
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers});
const PATH='/v1/acquisition-attribution';
export function sourceOriginAllowed(request){
 const origin=request.headers.get('Origin');
 return request.headers.get('Sec-Fetch-Site')!=='cross-site'&&(!origin||['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://api.shiftsometimber.co.uk'].includes(origin)||origin===new URL(request.url).origin);
}
export async function readAcquisition(DB,userId,now=Date.now()){
 const row=await DB.prepare("SELECT metadata FROM audit_log WHERE user_id=? AND action='auth.register' ORDER BY created_at,id LIMIT 1").bind(userId).first();
 let raw;try{raw=JSON.parse(row?.metadata||'{}').acquisition}catch{return null}
 // Do not extend a record's life by re-normalising at read time.
 const expiry=Date.parse(raw?.expiresAt),captured=Date.parse(raw?.capturedAt);
 if(!raw||raw.version!==VERSION||!Number.isFinite(expiry)||expiry<=now||expiry-captured>120*86400000)return null;
 const checked=normaliseAcquisition(raw,Date.parse(raw.capturedAt));
 return checked?{version:VERSION,model:'first_consented_touch_30d',source:checked.source,medium:checked.medium,consentAt:checked.consentAt,capturedAt:checked.capturedAt,expiresAt:raw.expiresAt}:null;
}
export function eraseAcquisitionStatement(DB,userId){
 return DB.prepare("UPDATE audit_log SET metadata=json_remove(metadata,'$.acquisition') WHERE user_id=? AND action='auth.register' AND CASE WHEN json_valid(metadata) THEN json_type(metadata,'$.acquisition') IS NOT NULL ELSE 0 END").bind(userId);
}
export async function acquisitionRoutes(request,env){
 if(new URL(request.url).pathname.replace(/\/+$/,'')!==PATH)return null;
 if(!['GET','DELETE'].includes(request.method))return json({ok:false,error:'method_not_allowed'},405);
 if(!sourceOriginAllowed(request))return json({ok:false,error:'origin_not_allowed'},403);
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 try{
  if(request.method==='GET')return json({ok:true,attribution:await readAcquisition(env.DB,auth.userId)});
  await eraseAcquisitionStatement(env.DB,auth.userId).run();
  return json({ok:true,erased:true});
 }catch{return json({ok:false,error:'attribution_unavailable'},503)}
}
export async function appendAcquisitionExport(request,env,response){
 if(new URL(request.url).pathname!=='/v1/privacy/export'||request.method!=='POST'||!response.ok)return response;
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 try{return json({...await response.json(),acquisitionAttribution:await readAcquisition(env.DB,auth.userId)})}catch{return json({ok:false,error:'attribution_export_failed'},503)}
}
export async function acquisitionAccountDelete(request,env,ctx,next){
 if(new URL(request.url).pathname!=='/v1/privacy/account'||request.method!=='DELETE')return null;
 if(!sourceOriginAllowed(request))return json({ok:false,error:'origin_not_allowed'},403);
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 // Source erasure is safe before the separate full-account deletion request.
 // The existing request/revocation/clinical-retention rules remain authoritative.
 try{await eraseAcquisitionStatement(env.DB,auth.userId).run()}catch{return json({ok:false,error:'attribution_erasure_failed'},503)}
 return next(request,env,ctx);
}
export const PURGE_EXPIRED_SQL="UPDATE audit_log SET metadata=json_remove(metadata,'$.acquisition') WHERE action='auth.register' AND CASE WHEN json_valid(metadata) THEN json_type(metadata,'$.acquisition') IS NOT NULL AND (julianday(json_extract(metadata,'$.acquisition.expiresAt'))<=julianday('now') OR julianday(json_extract(metadata,'$.acquisition.expiresAt')) IS NULL) ELSE 0 END";
