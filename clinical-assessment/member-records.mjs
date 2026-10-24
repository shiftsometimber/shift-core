import {notificationEventStatements} from './partner-operations/notification-events.mjs';
import {questionnaireSnapshot} from './clinician-presentation.mjs';
import {caseworkRoute} from './casework.mjs';
import {memberFulfilment,replyToFulfilment} from './partner-operations/member-fulfilment.mjs';
import {schema,validateAnswers} from './compact-schema.mjs';
const PREFIX='/v1/member/clinical-records',REVIEW='/v1/clinical-review/records';
const origins=new Set(['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk']);
const kinds=new Set(['photo_id','front_photo','scale_photo','prescription']);
const idPattern=/^[a-f0-9-]{36}$/;
const headers={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json'}});
const problem=(status,code)=>{throw Object.assign(Error(code),{status});};
const hash=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
const bytesOf=async(request,limit)=>{let total=0,chunks=[];if(Number(request.headers.get('content-length'))>limit)problem(413,'request_too_large');for await(const chunk of request.body||[]){total+=chunk.length;if(total>limit)problem(413,'request_too_large');chunks.push(chunk);}const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return bytes;};
async function body(request){try{return JSON.parse(new TextDecoder().decode(await bytesOf(request,200000)));}catch(e){if(e.status)throw e;problem(400,'invalid_json');}}
const rows=async stmt=>(await stmt.all()).results;
async function audit(env,record,actor,action,details={}){await env.DB.prepare('INSERT INTO clinical_member_audit VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),record.id,actor.id,action,JSON.stringify(details),new Date().toISOString()).run();}
async function evidence(env,id){return rows(env.DB.prepare('SELECT id,kind,mime,size,digest,uploaded_at FROM clinical_member_evidence WHERE record_id=? ORDER BY uploaded_at,id').bind(id));}
async function payload(env,record){const v=await env.DB.prepare('SELECT * FROM clinical_member_versions WHERE record_id=? ORDER BY version DESC LIMIT 1').bind(record.id).first();return {record,assessment:v?{version:v.version,schemaVersion:v.schema_version,answers:JSON.parse(v.answers_json),evidence:JSON.parse(v.evidence_json),declarations:JSON.parse(v.declarations_json),digest:v.digest,submitted:!!v.submitted}:null,evidence:await evidence(env,record.id),fulfilment:await memberFulfilment(env,record),prescriptionIssued:false};}
export async function memberClinicalRoutes(request,env,authenticate){
 const path=new URL(request.url).pathname;const reviewer=path===REVIEW||path.startsWith(REVIEW+'/');if(!reviewer&&path!==PREFIX&&!path.startsWith(PREFIX+'/'))return null;
 const origin=request.headers.get('Origin');
 const reply=response=>{if(origins.has(origin)){response.headers.set('Access-Control-Allow-Origin',origin);response.headers.set('Access-Control-Allow-Credentials','true');response.headers.set('Vary','Origin');}return response;};
 try{
  if(origin&&!origins.has(origin))problem(403,'origin_not_allowed');
  if(request.method==='OPTIONS')return reply(new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Record-Revision, X-Evidence-Kind'}}));
  if(!['GET','POST'].includes(request.method))problem(405,'method_not_allowed');
  if(request.method==='POST'&&!origins.has(origin))problem(403,'origin_required');
  const actor=await authenticate(request,env);if(!actor)problem(401,'sign_in_required');
  if(Number(actor.email_verified)!==1)problem(403,'verified_account_required');
  if(env.CLINICAL_REVIEW_READY!=='true'&&(reviewer||!env.CLINICAL_TEST_MEMBER_EMAIL||String(actor.email).toLowerCase()!==env.CLINICAL_TEST_MEMBER_EMAIL.toLowerCase()))problem(403,'clinical_service_not_open');
  if(env.CLINICAL_MEMBER_RECORDS_ENABLED!=='true'||!env.CLINICAL_PRIVATE_FILES||!env.DB)problem(503,'private_clinical_storage_not_enabled');
  const base=reviewer?REVIEW:PREFIX,parts=path.slice(base.length).split('/').filter(Boolean),id=parts[0];
  if(!id){
   if(reviewer)problem(404,'not_found');
   if(request.method==='GET')return reply(json({records:await rows(env.DB.prepare('SELECT * FROM clinical_member_records WHERE user_id=? ORDER BY created_at DESC').bind(actor.id)),schemaVersion:schema.version}));
   const b=await body(request);if(b.orderNumber!==undefined&&(typeof b.orderNumber!=='string'||b.orderNumber.length>100))problem(400,'invalid_order_reference');if(b.orderNumber){const order=await env.DB.prepare('SELECT order_number FROM medicine_orders WHERE order_number=? AND user_id=?').bind(String(b.orderNumber),actor.id).first();if(!order)problem(404,'order_not_found');const prior=await env.DB.prepare('SELECT id,revision,schema_version FROM clinical_member_records WHERE user_id=? AND order_number=?').bind(actor.id,b.orderNumber).first();if(prior)return reply(json({id:prior.id,revision:prior.revision,schemaVersion:prior.schema_version}));}
   const now=new Date().toISOString(),recordId=crypto.randomUUID();await env.DB.prepare('INSERT INTO clinical_member_records(id,user_id,order_number,schema_version,created_at,updated_at) VALUES(?,?,?,?,?,?)').bind(recordId,actor.id,b.orderNumber||null,schema.version,now,now).run();const record={id:recordId,user_id:actor.id};await audit(env,record,actor,'record_created');return reply(json({id:recordId,revision:0,schemaVersion:schema.version},201));
  }
  if(!idPattern.test(id))problem(404,'record_not_found');
  const record=await env.DB.prepare('SELECT * FROM clinical_member_records WHERE id=?').bind(id).first();if(!record)problem(404,'record_not_found');
  if(reviewer){const assignment=await env.DB.prepare('SELECT * FROM clinical_reviewer_assignments WHERE record_id=? AND reviewer_user_id=? AND active=1 AND expires_at>?').bind(id,actor.id,new Date().toISOString()).first();if(!assignment||!record.review_sharing)problem(404,'record_not_found');if(request.method!=='GET')problem(405,'read_only_review');}
  else if(record.user_id!==actor.id)problem(404,'record_not_found');
  if(!reviewer&&parts[1]==='fulfilment'){
   if(parts.length===2&&request.method==='GET'){await audit(env,record,actor,'member_fulfilment_viewed');return reply(json({fulfilment:await memberFulfilment(env,record)}));}
   if(parts.length===3&&parts[2]==='reply'&&request.method==='POST')return reply(json(await replyToFulfilment(request,env,record,actor,await body(request))));
   problem(404,'not_found');
  }
  if(!reviewer&&env.CLINICAL_CASEWORK_ENABLED==='true'){const result=await caseworkRoute(request,env,actor,record,false,parts,body);if(result)return reply(json(result));}
  if(request.method==='GET'&&!parts[1]){await audit(env,record,actor,reviewer?'reviewer_record_viewed':'member_record_viewed');return reply(json(await payload(env,record)));}
  if(parts[1]==='evidence'&&parts[2]&&request.method==='GET'){
   if(!idPattern.test(parts[2]))problem(404,'evidence_not_found');const e=await env.DB.prepare('SELECT * FROM clinical_member_evidence WHERE id=? AND record_id=?').bind(parts[2],id).first();if(!e)problem(404,'evidence_not_found');
   if(reviewer){const v=await env.DB.prepare('SELECT evidence_json FROM clinical_member_versions WHERE record_id=? ORDER BY version DESC LIMIT 1').bind(id).first();if(!v||!JSON.parse(v.evidence_json).some(x=>x.id===e.id))problem(404,'evidence_not_in_version');}
   const object=await env.CLINICAL_PRIVATE_FILES.get(e.object_key);if(!object)problem(503,'evidence_temporarily_unavailable');await audit(env,record,actor,'evidence_viewed',{evidenceId:e.id});return reply(new Response(object.body,{headers:{...headers,'Content-Type':e.mime,'Content-Disposition':'attachment; filename="clinical-evidence.'+(e.mime==='application/pdf'?'pdf':e.mime==='image/png'?'png':'jpg')+'"'}}));
  }
  if(request.method!=='POST')problem(404,'not_found');
  if(parts[1]==='evidence'&&!parts[2]){
   const revision=request.headers.has('X-Record-Revision')?Number(request.headers.get('X-Record-Revision')):NaN,kind=request.headers.get('X-Evidence-Kind'),mime=request.headers.get('Content-Type');if(!Number.isInteger(revision)||revision!==record.revision)problem(409,'record_changed');if(!kinds.has(kind))problem(400,'invalid_evidence_kind');
   const existing=await evidence(env,id);if(existing.length>=20)problem(409,'evidence_limit');const bytes=await bytesOf(request,8*1024*1024),text=new TextDecoder();const png=bytes.length>=24&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)&&text.decode(bytes.slice(12,16))==='IHDR',jpg=bytes.length>=24&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255&&bytes.at(-2)===255&&bytes.at(-1)===217,pdf=kind==='prescription'&&text.decode(bytes.slice(0,5))==='%PDF-'&&text.decode(bytes.slice(-1024)).includes('%%EOF');if(!((png&&mime==='image/png')||(jpg&&mime==='image/jpeg')||(pdf&&mime==='application/pdf')))problem(400,'invalid_file_content');
   const eid=crypto.randomUUID(),key='clinical/'+id+'/'+eid,digest=await hash(bytes),now=new Date().toISOString();await env.CLINICAL_PRIVATE_FILES.put(key,bytes,{httpMetadata:{contentType:mime}});
   try{const result=await env.DB.batch([env.DB.prepare('INSERT INTO clinical_member_evidence SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM clinical_member_records WHERE id=? AND revision=?)').bind(eid,id,key,kind,mime,bytes.length,digest,now,id,revision),env.DB.prepare("UPDATE clinical_member_records SET revision=revision+1,status='draft',review_sharing=0,updated_at=? WHERE id=? AND revision=?").bind(now,id,revision),...notificationEventStatements(env,record,{id:'evidence:'+eid,kind:'evidence_uploaded',source:'evidence',sourceId:eid,at:now})]);if(Number(result[0].meta?.changes)!==1)problem(409,'record_changed');}catch(e){await env.CLINICAL_PRIVATE_FILES.delete(key).catch(()=>{});throw e;}
   await audit(env,record,actor,'evidence_uploaded',{evidenceId:eid,digest});return reply(json({id:eid,revision:revision+1},201));
  }
  if(parts[1]==='assessment'){
   const b=await body(request);if(b.schemaVersion!==schema.version)problem(409,'schema_changed');if(!Number.isInteger(b.revision)||b.revision!==record.revision)problem(409,'record_changed');
   const submitted=b.submit===true;let answers;try{answers=validateAnswers({...b.answers,...submitted||b.answers?.email!==undefined?{email:actor.email}:{}},submitted);}catch(e){problem(422,e.message);}
   const files=await evidence(env,id);if(submitted){if(b.accuracy!==true||b.reviewSharing!==true)problem(422,'confirmation_required');const required=['photo_id','front_photo','scale_photo',...answers.requestPath!=='Starting treatment'?['prescription']:[]];if(required.some(k=>!files.some(e=>e.kind===k)))problem(422,'required_evidence_missing');}
   const version=record.revision+1,now=new Date().toISOString(),declarations={accuracy:submitted,reviewSharing:submitted,version:schema.version,recordedAt:now,questionnaire:questionnaireSnapshot()},digest=await hash(new TextEncoder().encode(JSON.stringify({schemaVersion:schema.version,answers,evidence:files,submitted,declarations})));
   const writes=[env.DB.prepare('INSERT INTO clinical_member_versions SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM clinical_member_records WHERE id=? AND revision=?)').bind(id,version,schema.version,JSON.stringify(answers),JSON.stringify(files),JSON.stringify(declarations),digest,submitted?1:0,now,id,b.revision),env.DB.prepare('UPDATE clinical_member_records SET revision=?,status=?,review_sharing=?,updated_at=? WHERE id=? AND revision=?').bind(version,submitted?'awaiting_review':'draft',submitted?1:0,now,id,b.revision)];
   if(submitted&&env.CLINICAL_CASEWORK_ENABLED==='true')writes.push(env.DB.prepare("INSERT OR IGNORE INTO clinical_case_outbox SELECT 'submission:'||?||':'||?||':'||a.hq_user_id,?,a.hq_user_id,'hq','reviewer_case_update',?,'pending',? FROM clinical_case_assignments a JOIN clinical_hq_staff s ON s.user_id=a.hq_user_id WHERE a.record_id=? AND a.active=1 AND a.expires_at>? AND s.active=1 AND s.role='clinician' AND s.expires_at>? AND EXISTS(SELECT 1 FROM clinical_member_versions WHERE record_id=? AND version=?)").bind(id,version,'assessment:'+id+':'+version,'/?view=clinical&record='+id,now,id,now,now,id,version));
   if(submitted)writes.push(...notificationEventStatements(env,record,{id:'assessment:'+id+':'+version,kind:'assessment_submitted',source:'assessment',sourceId:version,at:now}));
   const result=await env.DB.batch(writes);if(Number(result[0].meta?.changes)!==1)problem(409,'record_changed');await audit(env,record,actor,submitted?'assessment_submitted':'draft_saved',{version,digest});return reply(json({revision:version,status:submitted?'awaiting_review':'draft',prescriptionIssued:false}));
  }
  problem(404,'not_found');
 }catch(e){return reply(json({error:e.status?e.message:'clinical_record_unavailable'},e.status||503));}
}
