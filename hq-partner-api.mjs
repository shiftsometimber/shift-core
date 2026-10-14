const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const services=['pharmacy','trt','diagnostics','devices','nutrition','apparel','other'];
const roles=['owner','admin','operations','support'];
const clean=(value,max=300)=>{if(typeof value!=='string'||value.length>max)throw Error('invalid_field');return value.trim()};
const date=value=>{if(!value)return null;if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||new Date(value+'T00:00:00Z').toISOString().slice(0,10)!==value)throw Error('invalid_date');return value};
const publicPartner=(row,actor)=>{const result={...row};if(!['owner','admin'].includes(actor.role))delete result.commercial_notes;return result};
export async function partnerRoute(request,env,ctx,authFetch){
 const path=new URL(request.url).pathname,match=path.match(/^\/v1\/hq\/management\/(partners|partner-handovers)(?:\/([a-f0-9-]{36}))?$/);if(!match)return null;
 if(request.method==='OPTIONS')return null;
 const auth=await authFetch(new Request(new URL('/v1/hq/me',request.url),{headers:request.headers}),env,ctx);if(!auth.ok)return auth;
 const actor=(await auth.json()).user;if(!roles.includes(actor?.role))return json({ok:false,error:'partner_operations_forbidden'},403);
 if(env.HQ_PARTNERS_ENABLED!=='true')return json({ok:false,error:'partner_operations_not_enabled'},503);
 const kind=match[1],id=match[2],table=kind==='partners'?'hq_partners':'hq_partner_handovers',isPartner=kind==='partners';
 try{
 if(request.method==='GET'){
  const rows=(await env.DB.prepare('SELECT * FROM '+table+(id?' WHERE id=?':'')+' ORDER BY updated_at DESC LIMIT 500').bind(...(id?[id]:[])).all()).results;
  if(id&&!rows.length)return json({ok:false,error:'not_found'},404);
  return json({ok:true,items:rows.map(r=>isPartner?publicPartner(r,actor):r),partnerAccessEnabled:false,sharingEnabled:false});
 }
 if(!['POST','PATCH'].includes(request.method))return json({ok:false,error:'method_not_allowed'},405);
 if(isPartner&&!['owner','admin'].includes(actor.role))return json({ok:false,error:'partner_admin_required'},403);
 if(request.method==='POST'&&id||request.method==='PATCH'&&!id)return json({ok:false,error:'invalid_path'},400);
 if(request.headers.get('Origin')!=='https://hq.shiftsometimber.co.uk')return json({ok:false,error:'origin_forbidden'},403);
 const body=await request.json(),allowed=isPartner?['name','service','model','status','contact_name','contact_email','owner_name','next_action','due_date','shift_responsibility','partner_responsibility','integration_status','commercial_notes','version']:['partner_id','reference','service','status','owner_name','next_action','due_date','partner_task','version'];
 if(Object.keys(body).some(k=>!allowed.includes(k)))return json({ok:false,error:'unsupported_field'},400);
 const before=id?await env.DB.prepare('SELECT * FROM '+table+' WHERE id=?').bind(id).first():null;if(id&&!before)return json({ok:false,error:'not_found'},404);
 if(id&&body.version!==before.version)return json({ok:false,error:'version_conflict'},409);
 if(id&&!isPartner&&body.partner_id&&body.partner_id!==before.partner_id)return json({ok:false,error:'partner_ownership_immutable'},400);
 const record={...(before||{}),...body},now=new Date().toISOString(),recordId=id||crypto.randomUUID();
 const fields=isPartner?['name','service','model','status','contact_name','contact_email','owner_name','next_action','due_date','shift_responsibility','partner_responsibility','integration_status','commercial_notes']:['partner_id','reference','service','status','owner_name','next_action','due_date','partner_task'];
 const defaults=isPartner?{model:'undecided',status:'discussion',integration_status:'not_started'}:{status:'draft'};
 for(const field of fields){record[field]=field==='due_date'?date(record[field]):clean(record[field]??defaults[field]??'',field==='commercial_notes'?2000:field==='partner_task'?1000:300);}
 if(!services.includes(record.service)||!(isPartner?record.name:record.reference))throw Error('required_fields');
 if(isPartner){if(!['not_started','mapping','testing','ready','active'].includes(record.integration_status))throw Error('invalid_choice');if(!['referral','shift_sale','undecided'].includes(record.model)||!['exploring','discussion','agreed','active','paused','archived'].includes(record.status))throw Error('invalid_choice');if(record.contact_email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.contact_email))throw Error('invalid_email');}
 else{if(!['draft','review','blocked','closed'].includes(record.status))throw Error('sharing_not_enabled');const partner=await env.DB.prepare('SELECT status,service FROM hq_partners WHERE id=?').bind(record.partner_id).first();if(!partner||['archived','paused'].includes(partner.status))throw Error('partner_unavailable');if(partner.service!==record.service)throw Error('service_mismatch');}
 let mutation;
 if(id)mutation=env.DB.prepare('UPDATE '+table+' SET '+fields.map(f=>f+'=?').join(',')+',version=version+1,updated_at=? WHERE id=? AND version=?').bind(...fields.map(f=>record[f]),now,id,before.version);
 else mutation=env.DB.prepare('INSERT INTO '+table+' (id,'+fields.join(',')+',created_at,updated_at) VALUES ('+Array(fields.length+3).fill('?').join(',')+')').bind(recordId,...fields.map(f=>record[f]),now,now);
 const metadata=JSON.stringify({changedFields:fields.filter(f=>before?.[f]!==record[f]),before:before?{status:before.status,version:before.version}:null,after:{status:record.status,version:(before?.version||0)+1},sharingEnabled:false});
 const audit=env.DB.prepare("INSERT INTO hq_audit(hq_user_id,action,entity_type,entity_id,metadata,created_at) SELECT ?,?,?,?,?,? WHERE changes()>0").bind(actor.id,isPartner?'hq.partner_saved':'hq.partner_handover_saved',isPartner?'partner':'partner_handover',recordId,metadata,now);
 let result;try{result=await env.DB.batch([mutation,audit])}catch{return json({ok:false,error:'save_or_audit_failed'},503)}
 if(!result[0].meta.changes)return json({ok:false,error:'version_conflict'},409);
 const saved=await env.DB.prepare('SELECT * FROM '+table+' WHERE id=?').bind(recordId).first();
 return json({ok:true,item:isPartner?publicPartner(saved,actor):saved,auditRecorded:true},id?200:201);
 }catch(error){return json({ok:false,error:['invalid_field','invalid_date','required_fields','invalid_choice','invalid_email','sharing_not_enabled','partner_unavailable','service_mismatch'].includes(error.message)?error.message:'invalid_request'},400)}
}
