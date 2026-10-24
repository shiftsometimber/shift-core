// Durable internal acceptance workspace. No patient inputs, credentials, real Rx or sender adapters.
import {fail,fulfilmentAction,CHECKS} from './domain.mjs';
export const COMMISSIONING_BASE='/v1/hq/clinical/commissioning';
const ORIGIN='https://hq.shiftsometimber.co.uk';
const sql=(env,s,...a)=>env.DB.prepare(s).bind(...a);
const rows=async q=>(await q.all()).results||[];
const stamp=()=>new Date().toISOString();
const response=(b,status=200)=>Response.json(b,{status,headers:{'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Credentials':'true','Vary':'Origin'}});
async function json(request){
 const reader=request.body?.getReader();if(!reader)fail(400,'invalid_json');let n=0,parts=[];
 while(true){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>2048){await reader.cancel();fail(413,'request_too_large');}parts.push(value);}
 const buf=new Uint8Array(n);let offset=0;for(const part of parts){buf.set(part,offset);offset+=part.length;}
 try{const b=JSON.parse(new TextDecoder().decode(buf));if(!b||typeof b!=='object'||Array.isArray(b))fail(400,'invalid_json');return b;}catch(e){if(e.status)throw e;fail(400,'invalid_json');}
}
const guard=a=>({text:"EXISTS(SELECT 1 FROM hq_users u JOIN hq_sessions s ON s.hq_user_id=u.id WHERE u.id=? AND u.role=? AND u.status='active' AND u.mfa_enabled=1 AND s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>?)",args:[a.id,a.role,a.hash,stamp()]});
async function actor(request,env,authenticate){
 const access=await authenticate(request,env);if(access.response)return access;
 const u=access.user;if(!u)fail(401,'hq_sign_in_required');
 if(!['owner','admin'].includes(u.role))fail(403,'internal_owner_access_required');
 if(u.mfaEnabled!==true)fail(403,'hq_mfa_required');
 const raw=(request.headers.get('cookie')||'').match(/(?:^|;\s*)sst_hq_session=([^;]+)/)?.[1];if(!raw)fail(401,'hq_session_required');
 let token;try{token=decodeURIComponent(raw);}catch{fail(401,'invalid_session');}
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
 const a={id:String(u.id),role:u.role,hash},g=guard(a);
 if(!await sql(env,'SELECT 1 ok WHERE '+g.text,...g.args).first())fail(403,'access_revoked');return a;
}
export function newCommissioningOrder(orderNumber,date){
 if(!/^TEST-[A-F0-9]{12}$/.test(orderNumber))fail(422,'synthetic_order_number_required');
 return{synthetic:true,orderNumber,version:0,member:{id:'SYNTHETIC-ALEX',name:'Alex Example',dateOfBirth:'1985-01-01'},
  status:'pending',stage:'assessment',documents:['identity','full_length','weight','previous_treatment'].map(kind=>({kind,status:kind==='identity'?'test_placeholder':'pending',revision:1})),
  app:{source:'Synthetic My Timber fixture',weightKg:93.2,wellbeing:'Test check-in only'},
  stockAvailable:false,prescription:null,fulfilment:null,createdAt:date,updatedAt:date,actionNeeded:false};
}
const NOTES={query_photo:'Please replace your full-length photo using the secure order page.',query_info:'Please confirm your current treatment and the date of your last dose in your secure order page.',reject:'The synthetic assessment was not approved. See the explanation in your order.',pharmacy_query:'The dispensing team needs more information. Please check your secure order page.',pharmacy_reject:'The dispensing team could not fulfil this test order. Please check your secure order page.'};
export function commissioningAction(original,b,date,id){
 if(original.synthetic!==true||!/^TEST-[A-F0-9]{12}$/.test(original.orderNumber))fail(403,'synthetic_records_only');
 if(!Number.isInteger(b.version)||b.version!==original.version)fail(409,'order_changed');
 if(Object.keys(b).some(k=>!['version','action','document'].includes(k)))fail(422,'synthetic_fields_only');
 const s=structuredClone(original),a=b.action;let notify=null;
 const at=states=>{if(!states.includes(s.status))fail(409,'invalid_order_transition');};
 if(a==='review'){at(['pending','to_action']);s.status='to_action';s.stage='clinical_review';}
 else if(a==='approve_picture'||a==='reject_picture'){
  at(['to_action']);const d=s.documents.find(d=>d.kind===b.document&&d.kind!=='identity');if(!d)fail(422,'medical_document_required');
  d.status=a==='approve_picture'?'approved':'rejected';
 }else if(a==='query_photo'||a==='query_info'){
  at(['to_action']);s.status='referred_back';s.actionNeeded=true;s.request=a;s.memberMessage=NOTES[a];
  if(a==='query_photo')s.documents.find(d=>d.kind==='full_length').status='replacement_requested';notify='information_requested';
 }else if(a==='member_respond'){
  if(s.fulfilment?.status==='query'&&s.actionNeeded){s.actionNeeded=false;s.memberMessage='Your test response was received by the dispensing team.';notify='response_received';}
  else{at(['referred_back']);if(s.request==='query_photo'){const d=s.documents.find(d=>d.kind==='full_length');d.revision++;d.status='pending';}
   s.status='to_action';s.actionNeeded=false;s.memberMessage='Your response was received and is back with the clinical team.';s.request=null;notify='response_received';}
 }else if(a==='reject'){
  at(['to_action']);s.status='rejected';s.actionNeeded=false;s.memberMessage=NOTES.reject;notify='assessment_rejected';
 }else if(a==='sign_off'){
  at(['to_action']);if(s.documents.some(d=>d.kind!=='identity'&&d.status!=='approved'))fail(422,'medical_documents_need_approval');
  s.status='signed_off';s.stage='prescription_handover';s.prescription={id:'TEST-RX-'+id,synthetic:true,legallyIssued:false,medicine:'TEST MEDICINE — NOT FOR SUPPLY',approvedAt:date};
  s.fulfilment={orderNumber:s.orderNumber,partnerId:'SYNTHETIC-PHARMACY',memberId:'SYNTHETIC-ALEX',prescriptionId:s.prescription.id,area:'weight_management',medicine:'TEST MEDICINE — NOT FOR SUPPLY',status:'received',version:0};
  s.memberMessage='Your test assessment is signed off and has moved to the dispensing queue. No real prescription has been issued.';notify='assessment_approved';
 }else if(a==='stock_on'||a==='stock_off'){
  if(!s.fulfilment||['dispatched','rejected'].includes(s.fulfilment.status))fail(409,'active_test_fulfilment_required');s.stockAvailable=a==='stock_on';
 }else if(['accept','prepare','dispatch','pharmacy_query','pharmacy_reject'].includes(a)){
  if(!s.fulfilment)fail(409,'signed_off_test_order_required');
  // Exercise the exact production dispensing reducer; its fixtures cannot enter production tables.
  const expiry='2099-01-01T00:00:00.000Z',staff={status:'active',orgId:'SYNTHETIC-PHARMACY',hqUserId:'SYNTHETIC-DISPENSER',credentialVersion:0,
   checks:CHECKS.map(kind=>({kind,outcome:'verified',credentialVersion:0,expiresAt:expiry})),
   grants:[{credentialVersion:0,area:'weight_management',actions:['supply_decision','prepare','dispatch','query'],medicines:[],startsAt:'2020-01-01T00:00:00.000Z',expiresAt:expiry}]};
  const action=a==='pharmacy_query'?'query':a==='pharmacy_reject'?'reject':a;
  const result=fulfilmentAction(s.fulfilment,{version:s.fulfilment.version,action,message:NOTES[a],carrier:'royal_mail',trackingNumber:'TEST000000GB'},staff,{id:staff.hqUserId,mfa:true},date,id,{prescriptionCurrent:s.prescription?.synthetic===true,stockAvailable:s.stockAvailable});
  s.fulfilment=result.state;
  // A synthetic parcel must never offer a real courier link or imply an actual dispatch.
  if(s.fulfilment.tracking){delete s.fulfilment.tracking.url;s.fulfilment.tracking.synthetic=true;}
  s.stage='dispensing';if(a==='dispatch'){s.status='dispatched';s.stage='tracking';s.actionNeeded=false;s.memberMessage='Test dispatch recorded. No parcel was sent.';notify='order_dispatched';}
  else if(a==='pharmacy_query'||a==='pharmacy_reject'){s.memberMessage=NOTES[a];s.actionNeeded=a==='pharmacy_query';if(a==='pharmacy_reject')s.status='rejected';notify=a==='pharmacy_query'?'dispensing_query':'dispensing_rejected';}
  else if(a==='accept'){s.actionNeeded=false;s.memberMessage='The dispensing team accepted this synthetic handover.';notify='dispensing_accepted';}
  else if(a==='prepare'){s.memberMessage='Test preparation has started. No medicine is being supplied.';notify='dispensing_started';}
 }else fail(422,'unknown_commissioning_action');
 s.version++;s.updatedAt=date;return{state:s,event:{id,action:a,at:date,details:{status:s.status,stage:s.stage,document:b.document||null,fulfilment:s.fulfilment?.status||null}},notify};
}
export function commissioningViews(s,events=[]){
 const timeline=events.map(e=>({action:e.action,at:e.created_at}));
 return{member:{name:s.member.name,orderNumber:s.orderNumber,status:s.status,stage:s.stage,actionNeeded:s.actionNeeded,message:s.memberMessage||'Your assessment is awaiting review.',documents:s.documents,prescription:s.prescription,tracking:s.fulfilment?.tracking||null,recentActivity:timeline},
  clinician:{orderNumber:s.orderNumber,status:s.status,member:s.member,documents:s.documents,myTimber:s.app,prescriptionHistory:s.prescription?[s.prescription]:[],recentActivity:timeline},
  dispensing:{orderNumber:s.orderNumber,prescription:s.prescription,fulfilment:s.fulfilment,stockAvailable:s.stockAvailable,recentActivity:timeline}};
}
async function auditRead(env,a,orderNumber,action){
 const g=guard(a),id=crypto.randomUUID(),date=stamp();
 const r=await sql(env,'INSERT INTO partner_commissioning_events SELECT ?,?,-1-COALESCE((SELECT -MIN(version) FROM partner_commissioning_events WHERE order_number=? AND version<0),0),?,?,?,? WHERE '+g.text,id,orderNumber,orderNumber,a.id,action,'{}',date,...g.args).run();
 if(r.meta?.changes!==1)fail(403,'access_revoked');
}
async function view(env,a,orderNumber){
 const row=await sql(env,'SELECT state_json FROM partner_commissioning_orders WHERE order_number=?',orderNumber).first();if(!row)fail(404,'test_order_not_found');
 await auditRead(env,a,orderNumber,'order_viewed');
 const s=JSON.parse(row.state_json),events=await rows(sql(env,'SELECT id,actor_id,action,details_json,created_at FROM partner_commissioning_events WHERE order_number=? AND version>=0 ORDER BY version DESC',orderNumber));
 const notifications=await rows(sql(env,'SELECT channel,template,body,status,created_at FROM partner_commissioning_notifications WHERE order_number=? ORDER BY created_at DESC,id',orderNumber));
 return{order:s,views:commissioningViews(s,events),events,notifications};
}
export async function commissioningRoute(request,env,authenticate){
 const path=new URL(request.url).pathname;if(path!==COMMISSIONING_BASE&&!path.startsWith(COMMISSIONING_BASE+'/'))return null;
 try{
  const origin=request.headers.get('Origin');if(origin&&origin!==ORIGIN)fail(403,'origin_forbidden');
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store','Vary':'Origin'}});
  if(!['GET','POST'].includes(request.method))fail(405,'method_not_allowed');if(request.method==='POST'&&origin!==ORIGIN)fail(403,'origin_required');
  const a=await actor(request,env,authenticate);if(a.response)return a.response;
  const p=path.slice(COMMISSIONING_BASE.length).split('/').filter(Boolean);
  if(!p.length&&request.method==='GET'){
   const g=guard(a),orders=await rows(sql(env,'SELECT order_number,version,state_json,updated_at FROM partner_commissioning_orders WHERE '+g.text+' ORDER BY updated_at DESC LIMIT 100',...g.args));
   for(const o of orders)await auditRead(env,a,o.order_number,'queue_viewed');
   return response({internalOnly:true,syntheticOnly:true,messagesWithheld:true,orders:orders.map(o=>({orderNumber:o.order_number,version:o.version,status:JSON.parse(o.state_json).status,updatedAt:o.updated_at}))});
  }
  if(!p.length&&request.method==='POST'){
   const b=await json(request);if(Object.keys(b).length)fail(422,'synthetic_fields_only');const date=stamp(),number='TEST-'+crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase(),s=newCommissioningOrder(number,date),g=guard(a),event=crypto.randomUUID();
   const r=await env.DB.batch([
    sql(env,'INSERT INTO partner_commissioning_orders SELECT ?,0,?,?,? WHERE '+g.text,number,JSON.stringify(s),a.id,date,...g.args),
    sql(env,'INSERT INTO partner_commissioning_events SELECT ?,?,0,?,?,?,? WHERE changes()=1',event,number,a.id,'order_created','{"synthetic":true}',date)
   ]);if(r[0].meta?.changes!==1)fail(403,'access_revoked');return response(await view(env,a,number),201);
  }
  if(!/^TEST-[A-F0-9]{12}$/.test(p[0]||''))fail(404,'test_order_not_found');
  if(p.length===1&&request.method==='GET')return response(await view(env,a,p[0]));
  if(p.length===2&&p[1]==='action'&&request.method==='POST'){
   const b=await json(request),row=await sql(env,'SELECT state_json FROM partner_commissioning_orders WHERE order_number=?',p[0]).first();if(!row)fail(404,'test_order_not_found');
   const result=commissioningAction(JSON.parse(row.state_json),b,stamp(),crypto.randomUUID()),s=result.state,e=result.event,g=guard(a);
   const statements=[sql(env,'UPDATE partner_commissioning_orders SET state_json=?,version=?,updated_at=? WHERE order_number=? AND version=? AND '+g.text,JSON.stringify(s),s.version,s.updatedAt,p[0],b.version,...g.args),
    sql(env,'INSERT INTO partner_commissioning_events SELECT ?,?,?,?,?,?,? WHERE changes()=1',e.id,s.orderNumber,s.version,a.id,e.action,JSON.stringify(e.details),e.at)];
   if(result.notify)for(const channel of ['email','whatsapp'])statements.push(sql(env,"INSERT INTO partner_commissioning_notifications SELECT ?,?,?,?,?,?,'withheld',? WHERE EXISTS(SELECT 1 FROM partner_commissioning_events WHERE id=?)",crypto.randomUUID(),e.id,s.orderNumber,channel,result.notify,'TEST ONLY · '+s.orderNumber+' · '+s.memberMessage,e.at,e.id));
   const out=await env.DB.batch(statements);if(out[0].meta?.changes!==1)fail(409,'order_changed_or_access_revoked');return response(await view(env,a,s.orderNumber));
  }
  fail(404,'not_found');
 }catch(e){return response({error:e.status?e.message:'internal_commissioning_unavailable'},e.status||503);}
}
