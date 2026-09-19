import {appendAcquisitionExport} from '../acquisition-activation/server.mjs';
import {authenticateMember} from '../member-state-fast-v1.js';
import {readPassport,saveRecord,updateRecord,removeRecord,exportPassport} from './store.mjs';
import {object,fail} from './model.mjs';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, must-revalidate','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Vary':'Cookie','Referrer-Policy':'no-referrer'};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
const PUBLIC_ORIGINS=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk','https://api.shiftsometimber.co.uk']);
function checkOrigin(request){const origin=request.headers.get('Origin');if(request.headers.get('Sec-Fetch-Site')==='cross-site'||(origin&&!PUBLIC_ORIGINS.has(origin)&&origin!==new URL(request.url).origin))throw fail('origin_not_allowed','This request did not come from the account page.',403);}
export async function passportRoutes(request,env){
 if(env.HEALTH_PASSPORT_V1_ENABLED!=='true'||env.MEMBER_EXPERIENCE_V1_ENABLED!=='true')return null;
 const path=new URL(request.url).pathname.replace(/\/+$/,''),base='/v1/health-passport';
 if(path!==base&&!/^\/v1\/health-passport\/records(?:\/[a-zA-Z0-9-]+)?$/.test(path))return null;
 const auth=await authenticateMember(request,env);if(auth.response){const response=new Response(auth.response.body,auth.response);for(const [k,v]of Object.entries(headers))response.headers.set(k,v);return response;}
 try{
  if(path===base){if(request.method!=='GET')return json({error:'method_not_allowed'},405);return json({ok:true,member:{id:auth.userId,firstName:auth.user.first_name||'',email:auth.user.email||''},passport:await readPassport(env.DB,auth.userId)});}
  if(!['POST','PATCH','DELETE'].includes(request.method))return json({error:'method_not_allowed'},405);
  checkOrigin(request);
  if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))throw fail('json_required','Use the account form to save this record.',415);
  const raw=await request.text();if(new TextEncoder().encode(raw).byteLength>8192)throw fail('request_too_large','This record is too large.',413);
  let body;try{body=JSON.parse(raw)}catch{throw fail('invalid_json','The record could not be read.');}
  if(!object(body))throw fail('invalid_record','Use a valid personal record.');
  if(body.expectedAccountId!==auth.userId)throw fail('account_changed','The signed-in account changed. Reload and review where this record will be saved.',409);
  if(path===base+'/records'&&request.method==='POST')return json({ok:true,...await saveRecord(env.DB,auth.userId,body.type,body.payload,body.requestKey)},201);
  const id=path.slice((base+'/records/').length);
  if(path===base+'/records')return json({error:'method_not_allowed'},405);
  if(request.method==='PATCH')return json({ok:true,record:await updateRecord(env.DB,auth.userId,id,body.payload,body.revision)});
  if(request.method==='DELETE')return json({ok:true,...await removeRecord(env.DB,auth.userId,id,body.revision)});
  return json({error:'method_not_allowed'},405);
 }catch(error){return json({ok:false,error:error.code||'passport_unavailable',message:error.status?error.message:'Your Health Passport could not be loaded or verified. Your existing records have not been replaced.'},error.status||503);}
}
// Existing privacy export remains the parent. This only adds this account's records.
export async function appendPassportExport(request,env,response){
 response=await appendAcquisitionExport(request,env,response);
 if(new URL(request.url).pathname!=='/v1/privacy/export'||request.method!=='POST'||!response.ok)return response;
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 try{const passport=await exportPassport(env.DB,auth.userId);if(passport===null)return response;const payload=await response.json();return json({...payload,healthPassport:passport});}
 catch{return json({ok:false,error:'passport_export_failed',message:'The complete export could not be prepared. Please retry.'},503);}
}
