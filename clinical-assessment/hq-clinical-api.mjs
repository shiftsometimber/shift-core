import {clinicalContext,contextSharing} from './clinical-context.mjs';
import {clinicianAnswers,caseLabels,questionLabel,questionnaireContext} from './clinician-presentation.mjs';
import {caseQueue,caseView,caseAction,clinicalStaff} from './casework.mjs';
const base='/v1/hq/clinical',origin='https://hq.shiftsometimber.co.uk';
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Vary':'Origin','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true'}});
const fail=(status,code)=>{throw Object.assign(Error(code),{status});};
export async function hqClinicalRoute(request,env,authenticate){
 let auditActor=null,auditRecord=null;const path=new URL(request.url).pathname;if(path!==base&&!path.startsWith(base+'/'))return null;
 try{
  if(request.headers.has('Origin')&&request.headers.get('Origin')!==origin)fail(403,'origin_forbidden');
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'}});
  if(!['GET','POST'].includes(request.method))fail(405,'method_not_allowed');
  if(request.method==='POST'&&request.headers.get('Origin')!==origin)fail(403,'origin_required');
  const access=await authenticate(request,env);if(access.response)return access.response;const actor=access.user;
  if(!actor)fail(401,'hq_sign_in_required');auditActor=actor;
  if(env.CLINICAL_CASEWORK_ENABLED!=='true'||env.CLINICAL_REVIEW_READY!=='true')fail(503,'clinical_casework_not_open');
  const parts=path.slice(base.length).split('/').filter(Boolean);
  const operations=['owner','admin','operations'].includes(actor.role);
  if(!operations&&actor.role!=='clinical')fail(403,'clinical_role_required');
  if(!parts.length&&request.method==='GET'){
   const queue=await caseQueue(env,actor,operations);
   if(queue.records.length)await env.DB.batch(queue.records.map(r=>env.DB.prepare('INSERT INTO clinical_member_audit VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),r.id,actor.id,'hq_case_list_viewed',JSON.stringify({actorKind:'hq',scope:operations?'operations':'assigned_clinician'}),new Date().toISOString())));
   return json({...queue,records:queue.records.map(r=>({...r,displayStatus:caseLabels[r.status]||'Pending'}))});
  }
  if(operations&&parts[0]==='staff'&&parts.length===1&&request.method==='GET'){
   await clinicalStaff(env,actor,'operations');
   return json({staff:(await env.DB.prepare("SELECT user_id,registration_body,registration_number,expires_at FROM clinical_hq_staff WHERE active=1 AND role='clinician' AND expires_at>?").bind(new Date().toISOString()).all()).results});
  }
  if(operations&&parts[1]==='assignment'&&parts.length===2&&request.method==='POST'){
   await clinicalStaff(env,actor,'operations');if(!/^[a-f0-9-]{36}$/.test(parts[0]))fail(404,'case_not_found');
   if(Number(request.headers.get('content-length'))>2000)fail(413,'request_too_large');
   const raw=await request.text();if(raw.length>2000)fail(413,'request_too_large');let b;try{b=JSON.parse(raw);}catch{fail(400,'invalid_json');}
   if(!Number.isInteger(b.staffUserId)||typeof b.active!=='boolean')fail(422,'invalid_assignment');
   const candidate=await clinicalStaff(env,{id:b.staffUserId},'clinician');
   const record=await env.DB.prepare('SELECT id,user_id,review_sharing FROM clinical_member_records WHERE id=?').bind(parts[0]).first();if(!record)fail(404,'case_not_found');
   const date=new Date().toISOString(),expiry=new Date(Math.min(Date.parse(candidate.expires_at),Date.now()+7*86400000)).toISOString();
   const statements=[env.DB.prepare('INSERT INTO clinical_case_assignments(record_id,hq_user_id,active,expires_at) VALUES(?,?,?,?) ON CONFLICT(record_id,hq_user_id) DO UPDATE SET active=excluded.active,expires_at=excluded.expires_at').bind(record.id,b.staffUserId,b.active?1:0,expiry),env.DB.prepare('INSERT INTO clinical_member_audit VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),record.id,actor.id,'hq_assignment_changed',JSON.stringify({actorKind:'hq',reviewerHqUserId:b.staffUserId,active:b.active,expiresAt:expiry}),date)];
   if(b.active&&record.review_sharing)statements.push(env.DB.prepare('INSERT INTO clinical_case_outbox VALUES(?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),'assignment:'+crypto.randomUUID(),b.staffUserId,'hq','reviewer_case_update','/?view=clinical&record='+record.id,'pending',date));
   await env.DB.batch(statements);return json({assigned:b.active,staffUserId:b.staffUserId,expiresAt:expiry});
  }
  // Operations see only case references and states. Owning HQ does not grant prescribing access.
  if(operations)fail(403,'clinical_role_required');
  await clinicalStaff(env,actor,'clinician');
  const id=parts[0];if(!/^[a-f0-9-]{36}$/.test(id))fail(404,'case_not_found');
  const record=await env.DB.prepare('SELECT * FROM clinical_member_records WHERE id=?').bind(id).first();
  const assigned=await env.DB.prepare('SELECT 1 FROM clinical_case_assignments WHERE record_id=? AND hq_user_id=? AND active=1 AND expires_at>?').bind(id,actor.id,new Date().toISOString()).first();
  if(!record||!assigned||!record.review_sharing)fail(404,'case_not_found');auditRecord=record.id;
  const assertAccess=async(sharingRevision)=>{
   await clinicalStaff(env,actor,'clinician');
   const live=await env.DB.prepare('SELECT r.revision FROM clinical_member_records r JOIN clinical_case_assignments a ON a.record_id=r.id WHERE r.id=? AND r.review_sharing=1 AND a.hq_user_id=? AND a.active=1 AND a.expires_at>?').bind(id,actor.id,new Date().toISOString()).first();
   if(!live)fail(404,'case_not_found');if(live.revision!==record.revision)fail(409,'case_changed');
   if(sharingRevision!==undefined&&(await contextSharing(env,record)).revision!==sharingRevision)fail(409,'sharing_changed');
  };
  if(parts.length===1&&request.method==='GET'){
   const assessment=await env.DB.prepare('SELECT * FROM clinical_member_versions WHERE record_id=? ORDER BY version DESC LIMIT 1').bind(id).first();
   if(!assessment?.submitted)fail(409,'submitted_assessment_required');
   await env.DB.prepare('INSERT INTO clinical_member_audit VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),id,actor.id,'hq_clinician_viewed',JSON.stringify({actorKind:'hq',version:assessment.version}),new Date().toISOString()).run();
   const workflow=await caseView(env,record,true);await assertAccess();
   return json({record,assessment:{version:assessment.version,answers:clinicianAnswers(JSON.parse(assessment.answers_json)),evidence:JSON.parse(assessment.evidence_json),declarations:JSON.parse(assessment.declarations_json),digest:assessment.digest},workflow,answerLabels:Object.fromEntries(Object.keys(clinicianAnswers(JSON.parse(assessment.answers_json))).map(k=>[k,questionLabel(k)])),questionContext:questionnaireContext(assessment),contactFieldsWithheld:true,displayStatus:caseLabels[workflow.status]||'Pending',prescriptionIssued:false,pharmacyReleased:false});
  }
  if(parts[1]==='context'&&parts.length===2&&request.method==='GET'){
   const context=await clinicalContext(env,record);
   if(context.enabled)await env.DB.prepare('INSERT INTO clinical_member_audit VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),id,actor.id,'hq_clinical_context_viewed',JSON.stringify({actorKind:'hq',sharingRevision:context.sharing.revision,digest:context.digest}),new Date().toISOString()).run();
   await assertAccess(context.sharing.revision);
   return json(context);
  }
  if(parts[1]==='audit'&&parts.length===2&&request.method==='GET'){
   const url=new URL(request.url),before=url.searchParams.get('before'),beforeId=url.searchParams.get('beforeId');
   if(before&&(!/^\d{4}-\d\d-\d\dT/.test(before)||!beforeId))fail(400,'invalid_audit_cursor');
   await env.DB.prepare('INSERT INTO clinical_member_audit VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),id,actor.id,'hq_audit_viewed',JSON.stringify({actorKind:'hq'}),new Date().toISOString()).run();
   const sql="SELECT id,actor_user_id,action,details_json,created_at FROM clinical_member_audit WHERE record_id=? UNION ALL SELECT id,actor_user_id,kind AS action,json_object('actorKind',actor_kind,'assessmentVersion',assessment_version,'public',json(public_json),'clinical',json(private_json)) AS details_json,created_at FROM clinical_case_events WHERE record_id=?";
   const all=(await env.DB.prepare('SELECT * FROM ('+sql+')'+(before?' WHERE (created_at<? OR (created_at=? AND id<?))':'')+' ORDER BY created_at DESC,id DESC LIMIT 101').bind(id,id,...before?[before,before,beforeId]:[]).all()).results;
   const events=all.slice(0,100).map(e=>({...e,details:JSON.parse(e.details_json),details_json:undefined}));const last=events.at(-1);
   await assertAccess();
   return json({events,next:all.length>100?{before:last.created_at,beforeId:last.id}:null});
  }
  if(parts[1]==='evidence'&&parts.length===3&&request.method==='GET'){
   const purpose=new URL(request.url).searchParams.get('view')||'preview';if(!['preview','enlarge'].includes(purpose))fail(400,'invalid_evidence_view');if(['document','iframe'].includes(request.headers.get('Sec-Fetch-Dest')))fail(403,'portal_view_required');
   const latest=await env.DB.prepare('SELECT version,evidence_json FROM clinical_member_versions WHERE record_id=? ORDER BY version DESC LIMIT 1').bind(id).first();
   if(!latest||!JSON.parse(latest.evidence_json).some(e=>e.id===parts[2]))fail(404,'evidence_not_found');
   const e=await env.DB.prepare('SELECT * FROM clinical_member_evidence WHERE id=? AND record_id=?').bind(parts[2],id).first();if(!e)fail(404,'evidence_not_found');
   const object=await env.CLINICAL_PRIVATE_FILES.get(e.object_key);if(!object)fail(503,'evidence_unavailable');
   await env.DB.prepare('INSERT INTO clinical_member_audit VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),id,actor.id,purpose==='enlarge'?'hq_evidence_enlarged':'hq_evidence_previewed',JSON.stringify({actorKind:'hq',evidenceId:e.id,assessmentVersion:latest.version}),new Date().toISOString()).run();
   await assertAccess();
   return new Response(object.body,{headers:{'Content-Type':e.mime,'Content-Disposition':'inline','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'",'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Credentials':'true'}});
  }
  if(parts[1]==='action'&&parts.length===2&&request.method==='POST'){
   const reader=request.body?.getReader();let n=0,chunks=[];if(reader)while(true){const {value,done}=await reader.read();if(done)break;n+=value.length;if(n>20000){await reader.cancel();fail(413,'request_too_large');}chunks.push(value);}
   const bytes=new Uint8Array(n);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}let b;try{b=JSON.parse(new TextDecoder().decode(bytes));}catch{fail(400,'invalid_json');}
   return json(await caseAction(env,record,actor,true,b));
  }
  fail(404,'not_found');
 }catch(e){if(auditActor&&auditRecord){try{await env.DB.prepare('INSERT INTO clinical_member_audit VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),auditRecord,auditActor.id,'hq_case_action_denied',JSON.stringify({actorKind:'hq',method:request.method,reason:e.status?e.message:'unavailable'}),new Date().toISOString()).run();}catch{return json({error:'clinical_audit_unavailable'},503);}}return json({error:e.status?e.message:'clinical_casework_unavailable'},e.status||503);}
}
