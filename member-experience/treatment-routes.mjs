import {projectTreatment,summaryPdf} from './treatment-model.mjs';
import {authenticateMember} from '../member-state-fast-v1.js';
import {trackingConsent} from './health-routes.mjs';
const root='/v1/member/treatment';
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store, must-revalidate','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
const text=(v,n=2000)=>typeof v==='string'&&v.length<=n?v.trim():null;
export const medicines=['Mounjaro','Wegovy','Orlistat','Liraglutide','Prescribed testosterone','Blood test','Health appointment'];
export function validateTreatment(body){
 if(!object(body)||Object.keys(body).some(k=>!['medicine','prescriptionDetails','supply','nextAt'].includes(k)))throw Error('invalid_treatment');
 if(!medicines.includes(body.medicine)||!text(body.prescriptionDetails)||!Number.isInteger(body.supply)||body.supply<0||body.supply>1000)throw Error('invalid_treatment');
 if(body.nextAt!==null&&(!text(body.nextAt,40)||!Number.isFinite(Date.parse(body.nextAt))))throw Error('invalid_schedule');
 return body;
}
export function validateMedical(body){
 const fields=['conditions','allergies','otherMedicines','pastTreatment','familyHistory','gp'];
 if(!object(body)||Object.keys(body).some(k=>!fields.includes(k)))throw Error('invalid_medical_details');
 const out={};for(const key of fields){const value=text(body[key]);if(value===null)throw Error('invalid_medical_details');out[key]=value;}return out;
}
export async function readTreatment(DB,userId){
 const treatments=(await DB.prepare('SELECT * FROM member_treatment_records WHERE user_id=? ORDER BY created_at DESC').bind(userId).all()).results;
 const events=(await DB.prepare('SELECT * FROM member_treatment_events WHERE user_id=? ORDER BY occurred_at DESC').bind(userId).all()).results;
 const medical=(await DB.prepare('SELECT revision,body_json,confirmed_at FROM member_medical_disclosures WHERE user_id=? ORDER BY revision DESC').bind(userId).all()).results;
 const parsed=events.map(e=>({...e,details:JSON.parse(e.body_json)}));
 return {treatments:treatments.map(t=>projectTreatment(t,parsed)),events:events.map(e=>({...e,details:JSON.parse(e.body_json),body_json:undefined})),medical:medical.map(e=>({revision:e.revision,details:JSON.parse(e.body_json),confirmedAt:e.confirmed_at,source:'member'})),reminderDeliveryAvailable:false};
}
export async function treatmentRoutes(request,env){
 const path=new URL(request.url).pathname;if(!path.startsWith(root))return null;
 // Isolated preview feature until clinical-source, retention and reminder acceptance pass.
 if(env.MY_TREATMENT_PREVIEW_ENABLED!=='true')return reply({error:'not_enabled'},404);
 if(![root,root+'/records',root+'/events',root+'/medical',root+'/summary.pdf'].includes(path))return reply({error:'not_found'},404);
 if(!['GET','POST'].includes(request.method)||request.method==='GET'&&![root,root+'/summary.pdf'].includes(path))return reply({error:'method_not_allowed'},405);
 if(request.method==='POST'&&(request.headers.get('Origin')!==new URL(request.url).origin||!request.headers.get('Content-Type')?.startsWith('application/json')))return reply({error:'origin_not_allowed'},403);
 let auth;try{auth=await authenticateMember(request,env);}catch{return reply({error:'authentication_unavailable'},503);}if(auth.response)return reply({error:'authentication_required'},401);
 try{
 if(path===root+'/summary.pdf'){
 if(request.method!=='GET')return reply({error:'method_not_allowed'},405);
 const query=new URL(request.url).searchParams,period=query.get('period')||'28',selected=query.get('treatment')||'all';if(!['28','84','all'].includes(period))return reply({error:'invalid_period'},400);const data=await readTreatment(env.DB,auth.userId);if(selected!=='all'&&!data.treatments.some(t=>t.id===selected))return reply({error:'treatment_not_found'},404);const since=period==='all'?0:Date.now()-Number(period)*86400000;const fmt=v=>v?new Date(v).toLocaleString('en-GB',{timeZone:'Europe/London'}):'Not recorded';const lines=['My Timber - personal summary','Fictional preview records - not a clinical assessment','Generated: '+fmt(new Date().toISOString())+' (Europe/London)','Period: '+(period==='all'?'Full history':'Last '+period+' days'),''];
 for(const t of data.treatments.filter(t=>selected==='all'||t.id===selected)){lines.push(t.medicine+' - '+t.status,t.prescription_details,'Recorded supply: '+t.supply+' - Scheduled: '+fmt(t.next_at));for(const e of data.events.filter(e=>e.treatment_id===t.id&&Date.parse(e.occurred_at)>=since)){const c=e.details.checkin;lines.push(fmt(e.occurred_at)+' - '+e.kind.replaceAll('_',' ')+' - '+e.source,c?'Weight: '+(c.weight===null?'Not recorded':c.weight+' kg')+' - Appetite: '+c.appetite+' - Energy: '+c.energy+' - Reported side effects: '+(c.sideEffects||'None reported'):e.details.note||e.details.prescriptionDetails||'');}lines.push('');}
 if(query.get('medical')==='1'&&data.medical[0]){lines.push('Medical disclosures - member-reported');for(const[key,value]of Object.entries(data.medical[0].details))lines.push(key+': '+(value||'Not disclosed'));}lines.push('No information is sent automatically.');return new Response(summaryPdf(lines),{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="my-timber-summary.pdf"','Cache-Control':'no-store, must-revalidate','Vary':'Cookie','X-Content-Type-Options':'nosniff'}});
 }
 if(request.method==='GET')return reply(await readTreatment(env.DB,auth.userId));
 if(!await trackingConsent(env.DB,auth.userId))return reply({error:'health_consent_required',message:'Review optional health-data consent before saving.'},409);
 const raw=await request.text();if(new TextEncoder().encode(raw).length>16000)return reply({error:'too_large'},413);
 let body;try{body=JSON.parse(raw);}catch{return reply({error:'invalid_json'},400);}const at=new Date().toISOString();
 if(path===root+'/records'){
  try{validateTreatment(body);}catch(e){return reply({error:e.message},400);}
  const id=crypto.randomUUID();await env.DB.batch([
   env.DB.prepare('INSERT INTO member_treatment_records(id,user_id,medicine,prescription_details,status,supply,next_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,auth.userId,body.medicine,body.prescriptionDetails,'active',body.supply,body.nextAt,at,at),
   env.DB.prepare('INSERT INTO member_treatment_events(id,user_id,treatment_id,kind,body_json,occurred_at,created_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),auth.userId,id,'record_added',JSON.stringify({prescriptionDetails:body.prescriptionDetails}),at,at)
  ]);return reply({ok:true,id},201);
 }
 if(path===root+'/medical'){
  if(!object(body)||Object.keys(body).some(k=>!['revision','details'].includes(k))||!Number.isInteger(body.revision)||body.revision<0)return reply({error:'invalid_revision'},400);
  let details;try{details=validateMedical(body.details);}catch(e){return reply({error:e.message},400);}
  const result=await env.DB.prepare('INSERT INTO member_medical_disclosures(user_id,revision,body_json,confirmed_at) SELECT ?,?,?,? WHERE COALESCE((SELECT MAX(revision) FROM member_medical_disclosures WHERE user_id=?),0)=?').bind(auth.userId,body.revision+1,JSON.stringify(details),at,auth.userId,body.revision).run();
  if(result.meta.changes!==1)return reply({error:'record_changed',message:'Reload the current medical details before saving.'},409);
  return reply({ok:true,revision:body.revision+1},201);
 }
 if(!object(body)||Object.keys(body).some(k=>!['treatmentId','kind','occurredAt','note','operationId','supply','nextAt','enabled','checkin'].includes(k))||!['dose_taken','repeat_order','prescription_record','paused','finished','resumed','note','supply_updated','schedule_updated','reminder_updated','checkin'].includes(body.kind)||!text(body.note,2000)||!text(body.treatmentId,100)||!text(body.operationId,100)||!text(body.occurredAt,40)||!Number.isFinite(Date.parse(body.occurredAt))||Date.parse(body.occurredAt)>Date.now()+60000)return reply({error:'invalid_event'},400);
 if(body.kind==='supply_updated'&&(!Number.isInteger(body.supply)||body.supply<0||body.supply>1000))return reply({error:'invalid_supply'},400);
 if(body.kind==='schedule_updated'&&body.nextAt!==null&&(!text(body.nextAt,40)||!Number.isFinite(Date.parse(body.nextAt))))return reply({error:'invalid_schedule'},400);
 if(body.kind==='reminder_updated'&&typeof body.enabled!=='boolean')return reply({error:'invalid_reminder'},400);
 if(body.kind==='checkin'){
  const c=body.checkin;if(!object(c)||Object.keys(c).some(k=>!['weight','appetite','energy','sideEffects'].includes(k))||c.weight!==null&&(!Number.isFinite(c.weight)||c.weight<20||c.weight>400)||!['Low','Usual','High'].includes(c.appetite)||!['Low','Usual','High'].includes(c.energy)||text(c.sideEffects,2000)===null)return reply({error:'invalid_checkin'},400);
 }
 const record=await env.DB.prepare('SELECT id FROM member_treatment_records WHERE id=? AND user_id=?').bind(body.treatmentId,auth.userId).first();if(!record)return reply({error:'treatment_not_found'},404);
 const previous=await env.DB.prepare('SELECT * FROM member_treatment_events WHERE id=?').bind(body.operationId).first();
 const eventDetails={note:body.note};if(body.kind==='supply_updated')eventDetails.supply=body.supply;if(body.kind==='schedule_updated')eventDetails.nextAt=body.nextAt;if(body.kind==='reminder_updated')eventDetails.enabled=body.enabled;if(body.kind==='checkin')eventDetails.checkin=body.checkin;const details=JSON.stringify(eventDetails);if(previous){if(previous.user_id!==auth.userId||previous.treatment_id!==body.treatmentId||previous.kind!==body.kind||previous.body_json!==details||previous.occurred_at!==body.occurredAt)return reply({error:'operation_conflict'},409);return reply({ok:true,id:previous.id});}
 await env.DB.prepare('INSERT INTO member_treatment_events(id,user_id,treatment_id,kind,body_json,occurred_at,created_at) VALUES(?,?,?,?,?,?,?)').bind(body.operationId,auth.userId,body.treatmentId,body.kind,details,body.occurredAt,at).run();
 // Dose logs do not invent stock, schedules or a prescription change. Each is separate.
 return reply({ok:true,id:body.operationId},201);
 }catch{return reply({error:'treatment_unavailable',message:'Your record could not be confirmed. Reload before retrying.'},503);}
}
