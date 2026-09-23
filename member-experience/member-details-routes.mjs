import {addressLookupEnabled,addressLookupProvider} from './photon-address.mjs';
import {memberEmailChangeRoute} from './member-email-change.mjs';
import {memberDeliveryRoute} from './member-delivery-routes.mjs';
import {authenticateMember} from '../member-state-fast-v1.js';

const HEADERS={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','Vary':'Cookie'};
const json=(body,status=200)=>Response.json(body,{status,headers:HEADERS});
const pathOf=request=>new URL(request.url).pathname.replace(/\/+$/,'');
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const CORE=['first_name','last_name','phone','date_of_birth','postcode'];
const INPUT_CORE=['firstName','lastName','phone','dateOfBirth','postcode'];
const CONTACT=['address1','address2','town','county','gpPractice','gpPostcode','gpCode'];
const MAX={firstName:100,lastName:100,phone:50,dateOfBirth:10,postcode:12,address1:120,address2:120,town:100,county:100,gpPractice:160,gpPostcode:12,gpCode:12};
const error=(code,message,status=400)=>json({ok:false,error:code,message},status);
async function hash(value){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(value)));return [...new Uint8Array(bytes)].map(n=>n.toString(16).padStart(2,'0')).join('');}
export function normalisePostcode(value){const s=value.replace(/\s+/g,'').toUpperCase();return s?s.slice(0,-3)+' '+s.slice(-3):'';}
const postcodeOK=v=>!v||/^(?:GIR 0AA|[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2})$/.test(v);
export function validateMemberDetails(input,today=new Date().toISOString().slice(0,10)){
 if(!object(input)||Object.keys(input).some(k=>!Object.keys(MAX).includes(k)))throw Error('Please use the member details fields shown on this page.');
 const out={};
 for(const[k,max]of Object.entries(MAX)){
  if(!own(input,k)||typeof input[k]!=='string'||input[k].trim().length>max||/[\u0000-\u001f\u007f]/.test(input[k]))throw Error('Please check '+k+' and try again.');
  out[k]=input[k].trim();
 }
 if(!out.firstName)throw Error('Enter your first name.');
 for(const key of ['postcode','gpPostcode']){out[key]=normalisePostcode(out[key]);if(!postcodeOK(out[key]))throw Error('Enter a valid UK postcode, or leave it blank.');}
 if(out.dateOfBirth&&(!/^\d{4}-\d{2}-\d{2}$/.test(out.dateOfBirth)||out.dateOfBirth<'1900-01-01'||out.dateOfBirth>today||!Number.isFinite(Date.parse(out.dateOfBirth))||new Date(out.dateOfBirth).toISOString().slice(0,10)!==out.dateOfBirth))throw Error('Enter a real date of birth that is not in the future.');
 if(out.phone&&!/^\+?[\d ()\-.]{6,50}$/.test(out.phone))throw Error('Check your phone number.');
 if((out.address1||out.address2||out.town||out.county)&&(!out.address1||!out.town||!out.postcode))throw Error('For a home address, include address line 1, town or city, and postcode.');
 out.gpCode=out.gpCode.toUpperCase();
 if(out.gpCode&&!/^[A-Z0-9]{3,12}$/.test(out.gpCode))throw Error('Choose a GP suggestion again or clear the practice and enter it manually.');
 if(!out.gpPractice&&(out.gpCode||out.gpPostcode))throw Error('Enter your GP practice name or clear the GP details.');
 return out;
}
async function record(env,userId){
 const u=await env.DB.prepare('SELECT id,email,first_name,last_name,phone,date_of_birth,postcode FROM users WHERE id=?').bind(userId).first();
 if(!u)throw Error('account_unavailable');
 const row=await env.DB.prepare('SELECT revision,body_json,last_operation,updated_at FROM member_account_details WHERE user_id=?').bind(userId).first();
 let contact={};if(row){contact=JSON.parse(row.body_json);if(!object(contact))throw Error('invalid_account_record');}
 const details=Object.fromEntries(INPUT_CORE.map((k,i)=>[k,u[CORE[i]]||'']));for(const k of CONTACT)details[k]=typeof contact[k]==='string'?contact[k]:'';
 const revision=await hash({core:CORE.map(k=>u[k]??null),version:row?.revision??0,body:row?.body_json??'{}'});
 return {u,row,details,revision};
}
const view=(s,env)=> ({ok:true,details:{...s.details,email:s.u.email},revision:s.revision,updatedAt:s.row?.updated_at||null,addressLookupConfigured:addressLookupEnabled(env),addressLookupProvider:addressLookupProvider(env),gpLookupConfigured:env?.MEMBER_GP_LOOKUP_ENABLED==='true'});
// The user ID is always derived from the existing authenticated session. No client
// account selector, order write, preference replacement, AI request or analytics call.
export async function memberDetailsRoute(request,env){
 const email=await memberEmailChangeRoute(request,env);if(email)return email;
 const delivery=await memberDeliveryRoute(request,env);if(delivery)return delivery;
 const path=pathOf(request);if(path!=='/v1/member/details')return null;
 if(!['GET','PATCH'].includes(request.method))return error('method_not_allowed','Use GET or PATCH for member details.',405);
 if(request.method==='PATCH'){
  if(request.headers.get('Origin')!==new URL(request.url).origin)return error('origin_not_allowed','Please use this site to update your details.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return error('json_required','Send JSON member details.',415);
 }
 let auth;try{auth=await authenticateMember(request,env);}catch{return error('account_unavailable','Account details are temporarily unavailable. Your details have not been changed.',503);}
 if(auth.response)return new Response(auth.response.body,{status:auth.response.status,headers:{...HEADERS,'Content-Type':'application/json'}});
 let current;try{current=await record(env,auth.userId);}catch{return error('details_unavailable','Your saved details could not load. Please retry; nothing has been changed.',503);}
 if(request.method==='GET')return json(view(current,env));
 let body;try{const text=await request.text();if(new TextEncoder().encode(text).length>8192)return error('too_large','Your form is too large. Please check the fields.',413);body=JSON.parse(text);}catch{return error('invalid_json','Your changes could not be read. Please try again.');}
 if(!object(body)||Object.keys(body).some(k=>!['details','revision','operationId'].includes(k))||typeof body.revision!=='string'||!/^[a-f0-9]{64}$/.test(body.revision)||typeof body.operationId!=='string'||!/^[a-f0-9-]{36}$/.test(body.operationId))return error('invalid_request','Reload your saved details before making this change.');
 let values;try{values=validateMemberDetails(body.details);}catch(e){return error('invalid_details',e.message);}
 if(current.row?.last_operation===body.operationId){
  if(JSON.stringify(values)!==JSON.stringify(current.details))return error('operation_conflict','This save reference has already been used. Reload your saved details.',409);
  return json(view(current,env));
 }
 if(body.revision!==current.revision)return error('details_changed','Your details changed in another window. Your edits are still here. Reload saved details before saving again.',409);
 const savedContact=JSON.parse(current.row?.body_json||'{}');
 const contact=JSON.stringify({...Object.fromEntries(CONTACT.map(k=>[k,values[k]])),...(savedContact.delivery?{delivery:savedContact.delivery}:{})}),at=new Date().toISOString(),version=current.row?.revision??0,nonce=crypto.randomUUID();
 // Match the core values again inside the transaction, not just at the earlier read.
 // The operation claim guards every subsequent write. A stale batch changes zero rows.
 const coreMatch=CORE.map(k=>k+' IS ?').join(' AND '),condition='EXISTS(SELECT 1 FROM member_account_details WHERE user_id=? AND write_nonce=?)';
 let results;
 try{
  results=await env.DB.batch([
   env.DB.prepare(`INSERT INTO member_account_details(user_id,revision,body_json,last_operation,write_nonce,updated_at) SELECT ?,1,?,?,?,? WHERE EXISTS(SELECT 1 FROM users WHERE id=? AND ${coreMatch}) ON CONFLICT(user_id) DO UPDATE SET revision=member_account_details.revision+1,body_json=excluded.body_json,last_operation=excluded.last_operation,write_nonce=excluded.write_nonce,updated_at=excluded.updated_at WHERE member_account_details.revision=?`).bind(auth.userId,contact,body.operationId,nonce,at,auth.userId,...CORE.map(k=>current.u[k]??null),version),
   env.DB.prepare(`UPDATE users SET first_name=?,last_name=?,phone=?,date_of_birth=?,postcode=?,updated_at=? WHERE id=? AND ${condition}`).bind(...INPUT_CORE.map(k=>values[k]||null),at,auth.userId,auth.userId,nonce),
   env.DB.prepare(`UPDATE member_status SET last_activity_at=?,updated_at=? WHERE user_id=? AND ${condition}`).bind(at,at,auth.userId,auth.userId,nonce),
   env.DB.prepare(`INSERT INTO audit_log(user_id,action,entity_type,entity_id,metadata,created_at) SELECT ?,'member.details.update','user',?,'{}',? WHERE ${condition}`).bind(auth.userId,String(auth.userId),at,auth.userId,nonce)
  ]);
 }catch{return error('save_failed','Your details were not saved. Your edits are still here. Please try again.',503);}
 if(Number(results[0]?.meta?.changes||0)!==1)return error('details_changed','Your details changed while you were saving. Your edits are still here. Reload saved details before saving again.',409);
 try{return json(view(await record(env,auth.userId),env));}catch{return error('save_confirmation_unavailable','We could not confirm the saved details. Retry this same save before changing anything else.',503);}
}
export async function appendMemberDetailsExport(request,env,response){
 if(pathOf(request)!=='/v1/privacy/export'||request.method!=='POST'||!response.ok)return response;
 try{
  const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
  const data=await response.clone().json(),row=await env.DB.prepare('SELECT body_json,updated_at FROM member_account_details WHERE user_id=?').bind(auth.userId).first();
  data.memberAccountDetails=row?{...JSON.parse(row.body_json),updatedAt:row.updated_at}:null;
  const headers=new Headers(response.headers);for(const[k,v]of Object.entries(HEADERS))headers.set(k,v);headers.delete('Content-Length');
  return new Response(JSON.stringify(data),{status:response.status,headers});
 }catch{return error('export_unavailable','Your account export could not include all details. Please retry; nothing has been erased.',503);}
}
