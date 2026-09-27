import {authenticateMember} from '../member-state-fast-v1.js';
const HEADERS={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','Vary':'Cookie'};
const json=(body,status=200)=>Response.json(body,{status,headers:HEADERS});
const fail=(error,message,status=400)=>json({ok:false,error,message},status);
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const fields={recipient:160,address1:120,address2:120,town:100,county:100,postcode:12};
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const blank=()=>({useHome:true,recipient:'',address1:'',address2:'',town:'',county:'',postcode:''});
async function hash(v){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v))))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function validateDelivery(input){
 if(!object(input)||typeof input.useHome!=='boolean'||Object.keys(input).some(k=>!['useHome',...Object.keys(fields)].includes(k)))throw Error('Choose whether to use your home address, then check the delivery fields.');
 const out={useHome:input.useHome};
 for(const[k,max]of Object.entries(fields)){
  if(!own(input,k)||typeof input[k]!=='string'||input[k].trim().length>max||/[\u0000-\u001f\u007f]/.test(input[k]))throw Error('Please check the delivery '+k+' field.');
  out[k]=input[k].trim();
 }
 const p=out.postcode.replace(/\s/g,'').toUpperCase();out.postcode=p?p.slice(0,-3)+' '+p.slice(-3):'';
 if(out.postcode&&!/^(?:GIR 0AA|[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2})$/.test(out.postcode))throw Error('Enter a valid UK delivery postcode.');
 if(!out.useHome&&(!out.recipient||!out.address1||!out.town||!out.postcode))throw Error('For a separate delivery address, enter the recipient, address line 1, town or city, and postcode.');
 return out;
}
async function state(env,userId){
 const user=await env.DB.prepare('SELECT id,first_name,last_name,postcode FROM users WHERE id=?').bind(userId).first();if(!user)throw Error('account_unavailable');
 const row=await env.DB.prepare('SELECT revision,body_json,last_operation,updated_at FROM member_account_details WHERE user_id=?').bind(userId).first();
 const contact=row?JSON.parse(row.body_json):{};if(!object(contact))throw Error('record_unavailable');
 const delivery=contact.delivery?validateDelivery(Object.fromEntries(['useHome',...Object.keys(fields)].map(k=>[k,contact.delivery[k]]))):blank();
 const home={recipient:[user.first_name,user.last_name].filter(Boolean).join(' '),address1:contact.address1||'',address2:contact.address2||'',town:contact.town||'',county:contact.county||'',postcode:user.postcode||''};
 return {user,row,contact,delivery,home,revision:await hash({version:row?.revision||0,body:row?.body_json||'{}',home})};
}
function view(s,env){return {ok:true,delivery:s.delivery,home:s.home,effectiveAddress:s.delivery.useHome?s.home:Object.fromEntries(Object.keys(fields).map(k=>[k,s.delivery[k]])),configured:Boolean(s.contact.delivery),revision:s.revision,addressLookupConfigured:false,orderAddressChanged:false};}
export async function memberDeliveryRoute(request,env){
 if(new URL(request.url).pathname.replace(/\/+$/,'')!=='/v1/member/details/delivery')return null;
 if(!['GET','PUT'].includes(request.method))return fail('method_not_allowed','Use GET or PUT.',405);
 if(request.method==='PUT'){
  if(request.headers.get('Origin')!==new URL(request.url).origin)return fail('origin_not_allowed','Use this site to change your delivery details.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return fail('json_required','Send JSON delivery details.',415);
 }
 let auth;try{auth=await authenticateMember(request,env);}catch{return fail('account_unavailable','Your account is temporarily unavailable. Please retry.',503);}if(auth.response)return auth.response;
 let current;try{current=await state(env,auth.userId);}catch{return fail('delivery_unavailable','Your saved delivery details could not be read. Nothing has been changed.',503);}
 if(request.method==='GET')return json(view(current,env));
 let body;try{const raw=await request.text();if(new TextEncoder().encode(raw).length>4096)return fail('too_large','The delivery form is too large.',413);body=JSON.parse(raw);}catch{return fail('invalid_json','Your delivery details could not be read.');}
 if(!object(body)||Object.keys(body).some(k=>!['delivery','revision','operationId'].includes(k))||typeof body.revision!=='string'||!/^[a-f0-9]{64}$/.test(body.revision)||typeof body.operationId!=='string'||!/^[a-f0-9-]{36}$/.test(body.operationId))return fail('invalid_request','Reload the saved delivery details before changing them.');
 let delivery;try{delivery=validateDelivery(body.delivery);}catch(e){return fail('invalid_delivery',e.message);}
 if(current.contact.delivery?.lastOperation===body.operationId){
  if(JSON.stringify(delivery)!==JSON.stringify(current.delivery))return fail('operation_conflict','This save reference was already used. Reload the saved delivery details.',409);
  return json(view(current,env));
 }
 if(body.revision!==current.revision)return fail('delivery_changed','Account details changed in another window. Your edits are still here. Reload saved delivery details before saving.',409);
 if(delivery.useHome&&(!current.home.address1||!current.home.town||!current.home.postcode))return fail('home_address_incomplete','Save a complete home address above first, or choose a separate delivery address.');
 const nonce=crypto.randomUUID(),stamp=new Date().toISOString(),contact=JSON.stringify({...current.contact,delivery:{...delivery,lastOperation:body.operationId,updatedAt:stamp}}),version=current.row?.revision||0;
 let result;
 try{
  result=await env.DB.batch([
   env.DB.prepare('INSERT INTO member_account_details(user_id,revision,body_json,last_operation,write_nonce,updated_at) SELECT ?,1,?,?,?,? WHERE EXISTS(SELECT 1 FROM users WHERE id=? AND first_name IS ? AND last_name IS ? AND postcode IS ?) ON CONFLICT(user_id) DO UPDATE SET revision=member_account_details.revision+1,body_json=excluded.body_json,last_operation=excluded.last_operation,write_nonce=excluded.write_nonce,updated_at=excluded.updated_at WHERE member_account_details.revision=?').bind(auth.userId,contact,body.operationId,nonce,stamp,auth.userId,current.user.first_name??null,current.user.last_name??null,current.user.postcode??null,version),
   env.DB.prepare("INSERT INTO audit_log(user_id,action,entity_type,entity_id,metadata,created_at) SELECT ?,'member.delivery.update','user',?,'{}',? WHERE EXISTS(SELECT 1 FROM member_account_details WHERE user_id=? AND write_nonce=?)").bind(auth.userId,String(auth.userId),stamp,auth.userId,nonce)
  ]);
 }catch{return fail('save_failed','The delivery address was not saved. Your edits are still here; please retry.',503);}
 if(Number(result[0]?.meta?.changes)!==1)return fail('delivery_changed','Account details changed while saving. Reload saved details before trying again.',409);
 try{return json(view(await state(env,auth.userId),env));}catch{return fail('save_confirmation_unavailable','We could not confirm this save. Retry the same save before making further changes.',503);}
}
