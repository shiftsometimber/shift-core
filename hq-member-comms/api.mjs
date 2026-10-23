import {FROM,REPLY,PUSH,fail,validate,hash,attachment} from './model.mjs';
export const headers={'Cache-Control':'private, no-store, must-revalidate','Vary':'Cookie, Origin','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow','Referrer-Policy':'no-referrer'};
export const json=(data,status=200)=>Response.json(data,{status,headers});
export const audit=(DB,id,actor,action,at)=>DB.prepare('INSERT INTO hq_comms_audit(draft_id,actor_id,action,at) VALUES(?,?,?,?)').bind(id,actor,action,at);
export async function authenticateHQ(request,env){
 // Reuse the serving HQ verifier; no bootstrap/admin-key bypass.
 const h=new Headers();if(request.headers.has('Cookie'))h.set('Cookie',request.headers.get('Cookie'));
 const response=await env.CORE.fetch(new Request('https://api.shiftsometimber.co.uk/v1/hq/me',{headers:h}));
 if(!response.ok)fail('hq_sign_in_required',401);const actor=(await response.json()).user;
 if(!actor?.id||!['owner','admin'].includes(actor.role))fail('hq_owner_or_admin_required',403);return actor;
}
export async function hqApi(request,env,{authenticate=authenticateHQ,now=new Date()}={}){
 try{
  const actor=await authenticate(request,env),DB=env.DB,url=new URL(request.url),root='/v1/hq/member-comms',parts=url.pathname.slice(root.length).split('/').filter(Boolean);
  if(request.method==='GET'){
   if(!parts.length){const rows=(await DB.prepare('SELECT * FROM hq_comms_drafts ORDER BY created_at DESC LIMIT 100').all()).results;return json({actor:{role:actor.role,name:actor.name},items:rows.map(r=>({...r,payload:JSON.parse(r.payload_json),payload_json:undefined})),emailConfigured:!!env.EMAIL,from:FROM,replyTo:REPLY,push:PUSH});}
   if(parts.length===1){const d=await DB.prepare('SELECT * FROM hq_comms_drafts WHERE id=?').bind(parts[0]).first();if(!d)fail('not_found',404);const recipients=(await DB.prepare('SELECT email,user_id,status,provider_id,error_code,at,read_at FROM hq_comms_recipients WHERE draft_id=? ORDER BY email').bind(d.id).all()).results;const pushReceipts=(await DB.prepare('SELECT status,COUNT(*) count FROM hq_comms_push_receipts WHERE draft_id=? GROUP BY status').bind(d.id).all()).results;return json({...d,payload:JSON.parse(d.payload_json),payload_json:undefined,recipients,pushReceipts});}
   fail('not_found',404);
  }
  if(request.method!=='POST')fail('method_not_allowed',405);
  if(!['https://hq.shiftsometimber.co.uk'].includes(request.headers.get('Origin'))||!request.headers.get('Content-Type')?.startsWith('application/json'))fail('origin_not_allowed',403);
  const raw=await request.text();if(raw.length>20000)fail('request_too_large',413);let body;try{body=JSON.parse(raw)}catch{fail('invalid_json')}
  const at=now.toISOString();
  if(!parts.length){
   const values=validate(body,now),id=crypto.randomUUID(),resolved=[];
   for(const email of values.recipients){const row=await DB.prepare('SELECT u.id,u.email,u.first_name,u.last_name,a.email_verified FROM users u LEFT JOIN user_auth a ON a.user_id=u.id WHERE lower(u.email)=?').bind(email).first();if(values.channel==='notification'&&(!row||Number(row.email_verified)!==1))fail('notifications_require_verified_member');resolved.push({email,userId:row?.id||null,name:row?[row.first_name,row.last_name].filter(Boolean).join(' '):'',accountVerified:Number(row?.email_verified)===1});}
   const payload={channel:values.channel,from:FROM,replyTo:REPLY,cc:[],bcc:[],recipients:resolved,subject:values.subject,body:values.body,scheduledAt:values.scheduledAt,attachment:attachment(values.calendarAt,id,now),push:values.channel==='notification'?PUSH:null,serviceOnly:true};
   const digest=await hash(payload);
   await DB.batch([DB.prepare("INSERT INTO hq_comms_drafts(id,hash,payload_json,status,scheduled_at,created_by,created_at) VALUES(?,?,?,'draft',?,?,?)").bind(id,digest,JSON.stringify(payload),values.scheduledAt,actor.id,at),...resolved.map(r=>DB.prepare('INSERT INTO hq_comms_recipients(draft_id,email,user_id) VALUES(?,?,?)').bind(id,r.email,r.userId)),audit(DB,id,actor.id,'draft_created',at)]);
   return json({id,hash:digest,payload,status:'draft'},201);
  }
  if(parts.length!==2||!['approve','cancel'].includes(parts[1]))fail('not_found',404);
  if(actor.role!=='owner')fail('owner_approval_required',403);
  const d=await DB.prepare('SELECT * FROM hq_comms_drafts WHERE id=?').bind(parts[0]).first();if(!d)fail('not_found',404);
  if(!body||Object.keys(body).some(k=>!['hash','confirmation'].includes(k))||body.hash!==d.hash||await hash(JSON.parse(d.payload_json))!==d.hash)fail('preview_changed',409);
  if(parts[1]==='cancel'){
   if(body.confirmation!=='cancel')fail('confirmation_required');
   const r=await DB.batch([DB.prepare("UPDATE hq_comms_drafts SET status='cancelled',cancelled_at=? WHERE id=? AND status IN ('draft','scheduled')").bind(at,d.id),audit(DB,d.id,actor.id,'cancel_requested',at)]);if(!r[0].meta.changes)fail('already_processing',409);return json({ok:true,status:'cancelled'});
  }
  if(body.confirmation!=='approve_exact_message_and_recipients')fail('exact_approval_required');
  const payload=JSON.parse(d.payload_json);if(payload.channel==='email'&&!env.EMAIL)fail('email_not_configured',503);
  // Require a fresh review if the intended schedule passed while a draft waited.
  if(Date.parse(d.scheduled_at)<now.getTime()-15*60000)fail('draft_time_passed_create_new_preview',409);
  const r=await DB.batch([DB.prepare("UPDATE hq_comms_drafts SET status='scheduled',approved_by=?,approved_at=? WHERE id=? AND status='draft'").bind(actor.id,at,d.id),audit(DB,d.id,actor.id,'approval_requested',at)]);
  if(!r[0].meta.changes)fail('already_approved_or_cancelled',409);
  return json({ok:true,status:'scheduled',message:'Approved. Delivery will be attempted at the selected time.'});
 }catch(e){return json({error:e.status?e.message:'communications_unavailable'},e.status||503);}
}
