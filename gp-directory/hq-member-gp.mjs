import {directoryVersion,normalisePostcode} from './search.mjs';
const HQ='https://hq.shiftsometimber.co.uk';
const GP=['gpPractice','gpPostcode','gpCode','gpAddress','gpSelectionMode'];
const CORE=['first_name','last_name','phone','date_of_birth','postcode'];
const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','Vary':'Cookie, Origin'};
const json=(b,status=200)=>Response.json(b,{status,headers:HEADERS});
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const permit=(p,k)=>p.includes('*')||p.includes(k);
const same=(a,b)=>GP.every(k=>a[k]===b[k]);
async function digest(v){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(v)));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function record(DB,id){
 const user=await DB.prepare('SELECT id,first_name,last_name,phone,date_of_birth,postcode FROM users WHERE id=?').bind(id).first();if(!user)return null;
 const row=await DB.prepare('SELECT revision,body_json,last_operation,updated_at FROM member_account_details WHERE user_id=?').bind(id).first();
 const contact=JSON.parse(row?.body_json||'{}');if(!object(contact))throw Error('invalid_record');
 const gp=Object.fromEntries(GP.map(k=>[k,typeof contact[k]==='string'?contact[k]:'']));
 return {user,row,contact,gp,revision:await digest({memberId:id,core:CORE.map(k=>user[k]??null),version:row?.revision??0,body:row?.body_json??'{}'})};
}
export function validateHqGp(input){
 if(!object(input)||Object.keys(input).length!==GP.length||Object.keys(input).some(k=>!GP.includes(k)))throw Error('invalid_gp');
 const max={gpPractice:160,gpPostcode:12,gpCode:12,gpAddress:500,gpSelectionMode:12},out={};
 for(const k of GP){if(typeof input[k]!=='string'||input[k].trim().length>max[k]||/[\u0000-\u001f\u007f]/.test(input[k]))throw Error('invalid_gp');out[k]=input[k].trim();}
 out.gpPostcode=normalisePostcode(out.gpPostcode);out.gpCode=out.gpCode.toUpperCase();
 if(out.gpCode&&!/^[A-Z0-9]{3,12}$/.test(out.gpCode))throw Error('invalid_gp_code');
 if(out.gpPostcode&&!/^(?:GIR 0AA|[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2})$/.test(out.gpPostcode))throw Error('invalid_postcode');
 if(!['manual','directory','no_gp'].includes(out.gpSelectionMode))throw Error('invalid_gp_mode');
 if(out.gpSelectionMode==='no_gp'&&GP.filter(k=>k!=='gpSelectionMode').some(k=>out[k]))throw Error('no_gp_conflict');
 if(out.gpSelectionMode==='manual'&&out.gpCode)throw Error('manual_code_conflict');
 if(out.gpSelectionMode==='directory'&&(!out.gpPractice||!out.gpCode))throw Error('directory_selection_required');
 if(!out.gpPractice&&(out.gpCode||out.gpPostcode||out.gpAddress))throw Error('practice_required');
 return out;
}
const expose=(id,s)=>({ok:true,memberId:id,gp:s.gp,revision:s.revision,updatedAt:s.row?.updated_at||null,registrationVerified:false,notificationSent:false});
// Existing HQ session only. No member impersonation, role grant or clinical action.
export async function hqMemberGpRoute(request,env,ctx,authenticate){
 const u=new URL(request.url),m=u.pathname.match(/^\/v1\/hq\/management\/people\/([1-9]\d*)\/gp-details$/);if(!m)return null;
 if(request.method==='OPTIONS')return null;
 if(!['GET','PATCH'].includes(request.method))return json({error:'method_not_allowed'},405);
 const id=Number(m[1]);if(!Number.isSafeInteger(id))return json({error:'invalid_member'},400);
 const origin=request.headers.get('Origin');
 if(request.headers.get('Sec-Fetch-Site')==='cross-site'||origin&&![HQ,u.origin].includes(origin)||request.method==='PATCH'&&origin!==HQ)return json({error:'origin_not_allowed'},403);
 if(request.method==='PATCH'&&!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))return json({error:'json_required'},415);
 let a;try{const r=await authenticate(new Request(new URL('/v1/hq/me',u),{headers:request.headers}),env,ctx);if(!r.ok){const h=new Headers(r.headers);for(const[k,v]of Object.entries(HEADERS))h.set(k,v);return new Response(r.body,{status:r.status,headers:h});}a=await r.json();}catch{return json({error:'hq_authentication_unavailable'},503);}
 if(!object(a))return json({error:'hq_authentication_unavailable'},503);
 const permissions=Array.isArray(a.permissions)?a.permissions:[];
 if((!Number.isSafeInteger(a.user?.id)||a.user.id<1)||!permit(permissions,'health_read')||!permit(permissions,request.method==='PATCH'?'crm_write':'crm_read'))return json({error:'hq_forbidden'},403);
 if(env.MEMBER_GP_DIRECTORY_V2_ENABLED!=='true')return json({error:'gp_directory_not_enabled'},503);
 let current;try{current=await record(env.DB,id);}catch{return json({error:'gp_details_unavailable'},503);}if(!current)return json({error:'member_not_found'},404);
 if(request.method==='GET')return json(expose(id,current));
 let b;try{const t=await request.text();if(new TextEncoder().encode(t).length>4096)return json({error:'too_large'},413);b=JSON.parse(t);}catch{return json({error:'invalid_json'},400);}
 if(!object(b)||Object.keys(b).some(k=>!['memberId','revision','operationId','gp','selection'].includes(k))||b.memberId!==id||!/^[a-f0-9]{64}$/.test(b.revision||'')||!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(b.operationId||''))return json({error:'invalid_request'},400);
 let gp;try{gp=validateHqGp(b.gp);}catch(e){return json({error:e.message},400);}
 const operationBase='hq-gp:'+id+':'+a.user.id+':'+b.operationId+':',operation=operationBase+await digest({gp,selection:b.selection??null});
 if(current.row?.last_operation?.startsWith(operationBase))return current.row.last_operation===operation&&same(gp,current.gp)?json(expose(id,current)):json({error:'operation_conflict'},409);
 if(b.revision!==current.revision)return json({error:'details_changed',message:'Saved details changed. Your edits are still here; reload before saving.'},409);
 let selectedVersion=null,selectedRow=null;
 if(gp.gpSelectionMode==='directory'&&(!same(gp,current.gp)||b.selection)){
  if(!object(b.selection)||Object.keys(b.selection).some(k=>!['directoryVersion','siteCode'].includes(k))||typeof b.selection.siteCode!=='string'||!/^[A-Z0-9-]{3,30}$/.test(b.selection.siteCode)||typeof b.selection.directoryVersion!=='string')return json({error:'directory_selection_required'},400);
  try{const v=await directoryVersion(env.DB);if(v.version!==b.selection.directoryVersion)return json({error:'directory_changed',message:'The directory changed. Search and choose the practice again.'},409);
   const p=await env.DB.prepare("SELECT code,parent_code,name,address_json,postcode FROM gp_directory_practices WHERE version=? AND code=? AND status='ACTIVE'").bind(v.version,b.selection.siteCode).first();
   if(!p)return json({error:'directory_selection_unavailable'},409);
   const canonical={gpPractice:p.name,gpPostcode:p.postcode,gpCode:p.parent_code||p.code,gpAddress:JSON.parse(p.address_json).join(', '),gpSelectionMode:'directory'};
   if(!same(gp,canonical))return json({error:'directory_selection_mismatch'},400);selectedVersion=v.version;selectedRow=p;
  }catch{return json({error:'directory_unavailable'},503);}
 }else if(b.selection)return json({error:'unexpected_directory_selection'},400);
 const contact=JSON.stringify({...current.contact,...gp}),at=new Date().toISOString(),nonce=crypto.randomUUID(),version=current.row?.revision??0;
 const directoryGuard=selectedRow?` AND EXISTS(SELECT 1 FROM gp_directory_active a JOIN gp_directory_versions v ON v.version=a.version WHERE a.singleton=1 AND a.version=? AND v.complete=1) AND EXISTS(SELECT 1 FROM gp_directory_practices WHERE version=? AND code=? AND parent_code IS ? AND name IS ? AND address_json IS ? AND postcode IS ? AND status='ACTIVE')`:'';
 const directoryBind=selectedRow?[selectedVersion,selectedVersion,selectedRow.code,selectedRow.parent_code,selectedRow.name,selectedRow.address_json,selectedRow.postcode]:[];
 const coreMatch=CORE.map(k=>k+' IS ?').join(' AND '),claimed='EXISTS(SELECT 1 FROM member_account_details WHERE user_id=? AND write_nonce=?)';
 const metadata=JSON.stringify({memberId:id,mode:gp.gpSelectionMode,directoryVersion:selectedVersion,notificationSent:false});
 let results;try{results=await env.DB.batch([
  env.DB.prepare(`INSERT INTO member_account_details(user_id,revision,body_json,last_operation,write_nonce,updated_at) SELECT ?,1,?,?,?,? WHERE EXISTS(SELECT 1 FROM users WHERE id=? AND ${coreMatch})${directoryGuard} ON CONFLICT(user_id) DO UPDATE SET revision=member_account_details.revision+1,body_json=excluded.body_json,last_operation=excluded.last_operation,write_nonce=excluded.write_nonce,updated_at=excluded.updated_at WHERE member_account_details.revision=? AND member_account_details.body_json=?`).bind(id,contact,operation,nonce,at,id,...CORE.map(k=>current.user[k]??null),...directoryBind,version,current.row?.body_json??'{}'),
  env.DB.prepare(`INSERT INTO hq_audit(hq_user_id,action,entity_type,entity_id,metadata,created_at) SELECT ?,'hq.member_gp.update','user',?,?,? WHERE ${claimed}`).bind(a.user.id,String(id),metadata,at,id,nonce),
  env.DB.prepare(`INSERT INTO audit_log(user_id,action,entity_type,entity_id,metadata,created_at) SELECT ?,'hq.member_gp.update','user',?,?,? WHERE ${claimed}`).bind(id,String(id),JSON.stringify({hqActorId:a.user.id,notificationSent:false}),at,id,nonce)
 ]);}catch{return json({error:'save_failed',message:'GP details were not saved. Your edits are still here.'},503);}
 if(Number(results[0]?.meta?.changes||0)!==1)return json({error:'details_or_directory_changed',message:'Saved details or the directory changed while saving. Reload and choose the practice again.'},409);
 try{return json(expose(id,await record(env.DB,id)));}catch{return json({error:'save_confirmation_unavailable',message:'Retry this same save to confirm its result.'},503);}
}
