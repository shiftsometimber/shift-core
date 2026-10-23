import {validateCareHandover} from './care-handover.mjs';
import {contextSharing,saveContextSharing,clinicalContext} from './clinical-context.mjs';
// Workflow decisions are not prescriptions. No signing, release or email sending here.
const kinds=new Set(['photo_id','front_photo','scale_photo','prescription']);
const fail=(status,code)=>{throw Object.assign(Error(code),{status});};
const rows=async q=>(await q.all()).results;
const now=()=>new Date().toISOString();
const clean=(v,max=4000)=>{if(typeof v!=='string'||!v.trim()||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))fail(422,'message_required');return v.trim();};
export async function clinicalStaff(env,actor,role){const staff=await env.DB.prepare('SELECT * FROM clinical_hq_staff WHERE user_id=? AND active=1 AND expires_at>?').bind(actor.id,now()).first();if(!staff||staff.role!==role||!staff.verified_by||(role==='clinician'&&(!staff.registration_number||!staff.registration_body)))fail(403,'clinical_role_required');return staff;}
export async function caseView(env,record,reviewer=false){
 const state=await env.DB.prepare('SELECT * FROM clinical_case_state WHERE record_id=?').bind(record.id).first();
 const events=await rows(env.DB.prepare('SELECT * FROM clinical_case_events WHERE record_id=? ORDER BY version').bind(record.id));
 const latest=await env.DB.prepare('SELECT version,submitted FROM clinical_member_versions WHERE record_id=? ORDER BY version DESC LIMIT 1').bind(record.id).first();
 const answered=new Set(events.filter(e=>e.kind==='member_reply').map(e=>JSON.parse(e.public_json).requestId));const pending=events.some(e=>e.kind==='information_requested'&&!answered.has(e.id));
 const stale=!!state&&state.assessment_version!==latest?.version;
 return {version:state?.version||0,status:!record.review_sharing?'draft':pending?'needs_information':stale?'awaiting_review':state?.status||record.status,assessmentVersion:latest?.version||0,decisionOutdated:stale,events:events.filter(e=>reviewer||e.kind!=='internal_note').map(e=>({id:e.id,version:e.version,assessmentVersion:e.assessment_version,kind:e.kind,createdAt:e.created_at,...JSON.parse(e.public_json),...reviewer?{clinical:JSON.parse(e.private_json),actorUserId:e.actor_user_id,actorKind:e.actor_kind}:{}})),prescriptionIssued:false,pharmacyReleased:false};
}
export async function caseQueue(env,actor,operations=false){
 await clinicalStaff(env,actor,operations?'operations':'clinician');
 const records=operations?await rows(env.DB.prepare('SELECT id,user_id,order_number,status,revision,review_sharing,updated_at FROM clinical_member_records ORDER BY updated_at DESC LIMIT 200')):await rows(env.DB.prepare('SELECT r.* FROM clinical_member_records r JOIN clinical_case_assignments a ON a.record_id=r.id WHERE a.hq_user_id=? AND a.active=1 AND a.expires_at>? ORDER BY r.updated_at LIMIT 200').bind(actor.id,now()));
 const out=[];for(const r of records){const view=await caseView(env,{...r,review_sharing:r.review_sharing});out.push({id:r.id,memberId:r.user_id,orderNumber:r.order_number,status:!r.review_sharing&&view.events.some(e=>e.kind==='information_requested')?'needs_information':view.status,availableForReview:!!r.review_sharing,updatedAt:r.updated_at,caseVersion:view.version,assessmentVersion:view.assessmentVersion,decisionOutdated:view.decisionOutdated,prescriptionIssued:false});}return {records:out,limit:200,operations};
}
export async function caseAction(env,record,actor,reviewer,b){
 if(!b||!Number.isInteger(b.version)||!Number.isInteger(b.assessmentVersion))fail(422,'version_required');
 if(reviewer){const staff=await clinicalStaff(env,actor,'clinician');if(actor.role!=='clinical')fail(403,'clinical_role_required');}
 const assessment=await env.DB.prepare('SELECT * FROM clinical_member_versions WHERE record_id=? ORDER BY version DESC LIMIT 1').bind(record.id).first();
 if(!assessment||!assessment.submitted||!record.review_sharing||b.assessmentVersion!==assessment.version)fail(409,'submitted_assessment_required');
 await env.DB.prepare('INSERT OR IGNORE INTO clinical_case_state VALUES(?,0,?,?,?)').bind(record.id,'awaiting_review',assessment.version,now()).run();
 const state=await env.DB.prepare('SELECT * FROM clinical_case_state WHERE record_id=?').bind(record.id).first();if(state.version!==b.version)fail(409,'case_changed');
 const effective=state.assessment_version===assessment.version?state.status:'awaiting_review';
 const history=await rows(env.DB.prepare('SELECT * FROM clinical_case_events WHERE record_id=? ORDER BY version').bind(record.id));
 const answered=new Set(history.filter(e=>e.kind==='member_reply').map(e=>JSON.parse(e.public_json).requestId));
 const outstanding=history.filter(e=>e.kind==='information_requested'&&!answered.has(e.id));
 let kind,status=effective,publicData={},privateData={},recipient;
 if(!reviewer){
  if(b.action!=='reply')fail(403,'member_action_not_allowed');
  const requested=outstanding.find(e=>e.id===b.requestId);if(!requested)fail(409,'request_not_open');
  if(assessment.version<=requested.assessment_version)fail(409,'resubmit_updated_assessment');
  const req=JSON.parse(requested.public_json),files=JSON.parse(assessment.evidence_json),old=await env.DB.prepare('SELECT evidence_json FROM clinical_member_versions WHERE record_id=? AND version=?').bind(record.id,requested.assessment_version).first(),oldIds=new Set(JSON.parse(old.evidence_json).map(e=>e.id));
  for(const k of req.evidenceKinds)if(!files.some(e=>e.kind===k&&!oldIds.has(e.id)))fail(422,'replacement_evidence_required');
  kind='member_reply';publicData={requestId:requested.id,message:clean(b.message)};status=outstanding.length>1?'needs_information':'awaiting_review';recipient=requested.actor_user_id;
 }else if(b.action==='review_evidence'){
  if(!['awaiting_review','in_review','needs_information'].includes(effective))fail(409,'case_closed');
  const files=JSON.parse(assessment.evidence_json),file=files.find(e=>e.id===b.evidenceId);
  if(!file||file.kind==='photo_id')fail(422,'medical_evidence_required');
  if(!['approve','reject','query'].includes(b.outcome))fail(422,'invalid_evidence_decision');
  if(outstanding.some(e=>JSON.parse(e.public_json).evidenceId===file.id))fail(409,'request_already_open');
  publicData={evidenceId:file.id,evidenceKind:file.kind,evidenceDigest:file.digest,outcome:b.outcome,message:b.outcome==='approve'?'Document accepted.':clean(b.message)};
  if(b.outcome==='approve'){kind='evidence_reviewed';}
  else {kind='information_requested';publicData.evidenceKinds=b.outcome==='reject'?[file.kind]:[];status='needs_information';recipient=record.user_id;}
 }else if(b.action==='request_information'){
  if(!['awaiting_review','in_review','needs_information'].includes(effective))fail(409,'case_closed');
  if(!Array.isArray(b.evidenceKinds)||b.evidenceKinds.length>4||new Set(b.evidenceKinds).size!==b.evidenceKinds.length||b.evidenceKinds.some(k=>!kinds.has(k)))fail(422,'invalid_evidence_kind');
  if(outstanding.length)fail(409,'request_already_open');
  kind='information_requested';status='needs_information';publicData={message:clean(b.message),evidenceKinds:b.evidenceKinds};recipient=record.user_id;
 }else if(b.action==='start_review'){
  if(effective!=='awaiting_review'||outstanding.length)fail(409,'case_not_ready');kind='review_started';status='in_review';
 }else if(b.action==='review_updates'){
  const context=await clinicalContext(env,record);if(!context.enabled||!context.updates.length)fail(409,'no_shared_updates');if(b.digest!==context.digest)fail(409,'updates_changed');
  kind='app_updates_reviewed';publicData={message:'Your shared My Timber updates were reviewed.',count:context.updates.length};privateData={digest:context.digest,sharingRevision:context.sharing.revision,updates:context.updates,sources:context.sources};
 }else if(b.action==='note'){
  kind='internal_note';privateData={note:clean(b.note)};
 }else if(b.action==='decision'){
  if(effective!=='in_review'||outstanding.length)fail(409,'case_not_ready');
  if(!['proceed','decline','consultation'].includes(b.outcome))fail(422,'invalid_decision');
  if(b.outcome==='proceed'){
   const latestFiles=new Map();for(const e of JSON.parse(assessment.evidence_json))latestFiles.set(e.kind,e);
   for(const file of latestFiles.values()){if(file.kind==='photo_id')continue;const review=history.filter(e=>{const d=JSON.parse(e.public_json);return d.evidenceId===file.id&&d.evidenceDigest===file.digest;}).at(-1);if(!review||JSON.parse(review.public_json).outcome!=='approve')fail(422,'medical_evidence_approval_required');}
   if(b.identityVerified!==true||b.independentMeasurementsVerified!==true)fail(422,'verification_required');privateData.verification=clean(b.verification);privateData.handover=validateCareHandover(b.handover);}
  kind='clinical_decision';status={proceed:'ready_for_prescription',decline:'declined',consultation:'consultation_required'}[b.outcome];publicData={outcome:b.outcome,message:clean(b.message)};privateData.rationale=clean(b.rationale);recipient=record.user_id;
 }else fail(422,'unknown_case_action');
 const sharingGuard=kind==='app_updates_reviewed'?' AND COALESCE((SELECT MAX(revision) FROM clinical_context_sharing WHERE record_id=?),0)=?':'';
 const sharingArgs=kind==='app_updates_reviewed'?[record.id,privateData.sharingRevision]:[];
 const id=crypto.randomUUID(),date=now(),version=state.version+1;
 const staffGuard=reviewer?" AND EXISTS(SELECT 1 FROM clinical_case_assignments WHERE record_id=? AND hq_user_id=? AND active=1 AND expires_at>?) AND EXISTS(SELECT 1 FROM clinical_hq_staff WHERE user_id=? AND active=1 AND role='clinician' AND verified_by IS NOT NULL AND verified_by<>'' AND registration_number IS NOT NULL AND registration_number<>'' AND registration_body IS NOT NULL AND registration_body<>'' AND expires_at>?)":'';
 const staffArgs=reviewer?[record.id,actor.id,date,actor.id,date]:[];
 // D1 batch is transactional. The conditional INSERT and UPDATE prevent stale or concurrent decisions.
 const statements=[env.DB.prepare('INSERT INTO clinical_case_events(id,record_id,version,assessment_version,actor_user_id,actor_kind,kind,public_json,private_json,created_at) SELECT ?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM clinical_case_state WHERE record_id=? AND version=?) AND EXISTS(SELECT 1 FROM clinical_member_records WHERE id=? AND revision=? AND review_sharing=1)'+sharingGuard+staffGuard).bind(id,record.id,version,assessment.version,actor.id,reviewer?'hq':'member',kind,JSON.stringify(publicData),JSON.stringify(privateData),date,record.id,state.version,record.id,record.revision,...sharingArgs,...staffArgs)];
 statements.push(env.DB.prepare('UPDATE clinical_case_state SET version=?,status=?,assessment_version=?,updated_at=? WHERE record_id=? AND version=? AND EXISTS(SELECT 1 FROM clinical_case_events WHERE id=?)').bind(version,status,assessment.version,date,record.id,state.version,id));
 if(recipient!==undefined)statements.push(env.DB.prepare('INSERT INTO clinical_case_outbox SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM clinical_case_events WHERE id=?)').bind(crypto.randomUUID(),id,recipient,reviewer?'member':'hq',reviewer?(kind==='information_requested'?'member_action_needed':'member_case_update'):'reviewer_case_update',(reviewer?'/member/treatment-records?record=':'/?view=clinical&record=')+record.id,'pending',date,id));
 const result=await env.DB.batch(statements);if(Number(result[0].meta?.changes)!==1)fail(409,'case_changed');
 return caseView(env,record,reviewer);
}
export async function caseworkRoute(request,env,actor,record,reviewer,parts,readBody){
 if(env.CLINICAL_CASEWORK_ENABLED!=='true')return null;
 if(parts[1]!=='workflow')return null;
 if(parts[2]==='sharing'&&parts.length===3&&!reviewer){if(request.method==='GET')return contextSharing(env,record);if(request.method==='POST')return saveContextSharing(env,record,actor,await readBody(request));}
 if(parts[2]==='context'&&parts.length===3&&!reviewer&&request.method==='GET')return clinicalContext(env,record);
 if(request.method==='GET'&&!parts[2])return caseView(env,record,reviewer);
 if(request.method==='POST'&&parts[2]==='action'&&parts.length===3)return caseAction(env,record,actor,reviewer,await readBody(request));
 fail(404,'not_found');
}
