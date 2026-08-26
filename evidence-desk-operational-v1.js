import {createHash} from 'node:crypto';
import {decideEvidencePackage,ensureEvidenceDeskSchema,runEvidenceDeskScheduled} from './evidence-desk-v1.js';

const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const clean=(value,max=5000)=>String(value??'').trim().slice(0,max);
const sha256=value=>createHash('sha256').update(String(value)).digest('hex');
const now=()=>new Date().toISOString();
const parse=value=>{try{return JSON.parse(value||'null')}catch{return null}};
const actor=(name,role)=>({name:clean(name,200),role});

export async function ensureOperationalSchema(DB){
  await ensureEvidenceDeskSchema(DB);
  const schema=`
    CREATE TABLE IF NOT EXISTS evidence_desk_operational_control(
      id INTEGER PRIMARY KEY CHECK(id=1),monitoring_enabled INTEGER NOT NULL DEFAULT 0,
      drafting_enabled INTEGER NOT NULL DEFAULT 0,website_enabled INTEGER NOT NULL DEFAULT 0,
      newsletter_enabled INTEGER NOT NULL DEFAULT 0,social_enabled INTEGER NOT NULL DEFAULT 0,
      staging_publication_enabled INTEGER NOT NULL DEFAULT 0,production_authority_enabled INTEGER NOT NULL DEFAULT 0,
      control_epoch INTEGER NOT NULL DEFAULT 0,shutdown_reason TEXT,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    INSERT OR IGNORE INTO evidence_desk_operational_control(id) VALUES(1);
    CREATE TABLE IF NOT EXISTS evidence_desk_drafts(
      id INTEGER PRIMARY KEY AUTOINCREMENT,package_id INTEGER NOT NULL,revision INTEGER NOT NULL,
      page_path TEXT NOT NULL,content_key TEXT NOT NULL,proposed_text TEXT NOT NULL,copy_sha256 TEXT NOT NULL,
      source_trace_json TEXT NOT NULL,model_name TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'copy_required',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(package_id,revision)
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_page_baselines(
      package_id INTEGER PRIMARY KEY,page_path TEXT NOT NULL,baseline_sha256 TEXT NOT NULL,
      rollback_locator TEXT NOT NULL,captured_by TEXT NOT NULL,verified_by_connector INTEGER NOT NULL DEFAULT 0,
      control_epoch INTEGER NOT NULL DEFAULT 0,captured_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_publication_authority(
      package_id INTEGER PRIMARY KEY,authority_ref TEXT NOT NULL,actor_name TEXT NOT NULL,
      exact_copy_sha256 TEXT NOT NULL,granted_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_specialist_review_locks(
      package_id INTEGER NOT NULL,review_type TEXT NOT NULL,copy_sha256 TEXT NOT NULL,
      authority_ref TEXT NOT NULL,reviewer_name TEXT NOT NULL,reviewed_at TEXT NOT NULL,
      PRIMARY KEY(package_id,review_type)
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_publications(
      id INTEGER PRIMARY KEY AUTOINCREMENT,package_id INTEGER NOT NULL,destination TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,status TEXT NOT NULL,remote_ref TEXT,payload_sha256 TEXT NOT NULL,
      error_code TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_distribution_approvals(
      package_id INTEGER NOT NULL,destination TEXT NOT NULL,copy_sha256 TEXT NOT NULL,
      authority_ref TEXT NOT NULL,actor_name TEXT NOT NULL,approved_at TEXT NOT NULL,
      PRIMARY KEY(package_id,destination)
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_distribution_jobs(
      id INTEGER PRIMARY KEY AUTOINCREMENT,package_id INTEGER NOT NULL,destination TEXT NOT NULL,
      copy_sha256 TEXT NOT NULL,payload_json TEXT NOT NULL,payload_sha256 TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,status TEXT NOT NULL DEFAULT 'awaiting_approval',
      model_name TEXT NOT NULL,remote_ref TEXT,error_code TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,approved_at TEXT,completed_at TEXT,
      UNIQUE(package_id,destination,copy_sha256,payload_sha256)
    );
    CREATE TABLE IF NOT EXISTS evidence_desk_distribution_job_approvals(
      job_id INTEGER PRIMARY KEY,package_id INTEGER NOT NULL,destination TEXT NOT NULL,
      copy_sha256 TEXT NOT NULL,payload_sha256 TEXT NOT NULL,authority_ref TEXT NOT NULL,
      actor_name TEXT NOT NULL,approved_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_evidence_distribution_jobs_status
      ON evidence_desk_distribution_jobs(status,destination,created_at);
  `;
  const statements=schema.split(';').map(statement=>statement.trim()).filter(Boolean);
  if(typeof DB.batch==='function')await DB.batch(statements.map(statement=>DB.prepare(statement)));
  else for(const statement of statements)await DB.prepare(statement).run();
}

async function packageState(DB,packageId){
  const row=await DB.prepare(`SELECT * FROM evidence_desk_packages WHERE id=?`).bind(Number(packageId)).first();
  if(!row)return null;
  const changes=parse(row.proposed_changes_json)||[];
  const exact=changes.filter(x=>clean(x?.proposedText||x?.after,20000)).at(-1)||null;
  const draft=await DB.prepare(`SELECT * FROM evidence_desk_drafts WHERE package_id=? ORDER BY revision DESC LIMIT 1`).bind(Number(packageId)).first();
  const proposed=exact?.proposedText||exact?.after||draft?.proposed_text||null;
  return{row,exact,draft,proposed,copySha256:proposed?sha256(proposed):null};
}

async function exactReviewLocks(DB,packageId,copySha256){
  const {results=[]}=await DB.prepare(`SELECT review_type,copy_sha256,authority_ref,reviewer_name,reviewed_at FROM evidence_desk_specialist_review_locks WHERE package_id=?`).bind(Number(packageId)).all();
  const locks=Object.fromEntries(results.map(row=>[row.review_type,row]));
  return{clinical:locks.clinical?.copy_sha256===copySha256?locks.clinical:null,communications:locks.communications?.copy_sha256===copySha256?locks.communications:null};
}

async function controls(DB){
  const [operational,base]=await Promise.all([
    DB.prepare(`SELECT * FROM evidence_desk_operational_control WHERE id=1`).first(),
    DB.prepare(`SELECT * FROM evidence_desk_control WHERE id=1`).first()
  ]);
  return{operational,base};
}

async function audit(DB,packageId,decision,who={},detail={}){
  const state=packageId?await DB.prepare(`SELECT event_id FROM evidence_desk_packages WHERE id=?`).bind(Number(packageId)).first():null;
  await DB.prepare(`INSERT INTO evidence_desk_decisions(package_id,event_id,decision,actor_name,actor_role,note,detail_json) VALUES(?,?,?,?,?,?,?)`).bind(packageId?Number(packageId):null,state?.event_id||null,decision,clean(who.name||'Shift Evidence Desk',200),clean(who.role||'system',50),clean(detail.note,5000)||null,JSON.stringify(detail).slice(0,20000)).run();
}

export async function draftEvidencePackage(env,packageId,{model='@cf/meta/llama-3.1-8b-instruct-fast'}={}){
  await ensureOperationalSchema(env.DB);
  const initialControls=await controls(env.DB);
  if(!Number(initialControls.operational?.drafting_enabled)||!Number(initialControls.base?.enabled))return{ok:false,status:409,error:'drafting_disabled'};
  const state=await packageState(env.DB,packageId);if(!state)return{ok:false,status:404,error:'package_not_found'};
  if(state.proposed)return{ok:true,idempotent:true,packageId:Number(packageId),copySha256:state.copySha256,status:'existing_exact_copy'};
  if(!env.AI)return{ok:false,status:503,error:'model_binding_missing'};
  const evidence=parse(state.row.evidence_json)||[],changes=parse(state.row.proposed_changes_json)||[];
  const prompt=`You are the Shift Evidence Desk drafting assistant. Return JSON only with keys pagePath, contentKey, proposedText. Draft the smallest exact replacement wording supported only by the supplied authoritative evidence. Do not invent facts, diagnose, prescribe, imply clinical review or add promotional language. Preserve risk qualifiers and urgent instructions. Package risk: ${state.row.risk_lane}. Communications class: ${state.row.communication_class}. Evidence: ${JSON.stringify(evidence)}. Change instructions: ${JSON.stringify(changes)}.`;
  const generated=await env.AI.run(model,{messages:[{role:'system',content:'Evidence-bound UK health editor. JSON only.'},{role:'user',content:prompt}],temperature:0.1,max_tokens:900});
  const raw=clean(generated?.response||generated?.result?.response,20000).replace(/^```json\s*|\s*```$/g,'');
  const output=parse(raw),pagePath=clean(output?.pagePath,500),contentKey=clean(output?.contentKey,500),proposedText=clean(output?.proposedText,15000);
  if(!pagePath||!contentKey||!proposedText)return{ok:false,status:422,error:'model_output_invalid'};
  const mappedTargets=changes.filter(change=>change?.pagePath&&change?.contentKey).map(change=>`${clean(change.pagePath,500)}\n${clean(change.contentKey,500)}`);
  if(!mappedTargets.includes(`${pagePath}\n${contentKey}`))return{ok:false,status:422,error:'model_target_not_mapped'};
  const finalControls=await controls(env.DB);
  if(!Number(finalControls.operational?.drafting_enabled)||!Number(finalControls.base?.enabled)||Number(finalControls.operational?.control_epoch)!==Number(initialControls.operational?.control_epoch))return{ok:false,status:409,error:'shutdown_during_draft'};
  const revision=Number((await env.DB.prepare(`SELECT MAX(revision) n FROM evidence_desk_drafts WHERE package_id=?`).bind(Number(packageId)).first())?.n||0)+1;
  const hash=sha256(proposedText);
  await env.DB.prepare(`INSERT INTO evidence_desk_drafts(package_id,revision,page_path,content_key,proposed_text,copy_sha256,source_trace_json,model_name,status) VALUES(?,?,?,?,?,?,?,?,?)`).bind(Number(packageId),revision,pagePath,contentKey,proposedText,hash,JSON.stringify(evidence),model,state.row.risk_lane==='red'?'awaiting_specialist_review':'awaiting_editorial_review').run();
  await audit(env.DB,packageId,'automatic_draft_created',{name:'Shift Evidence Desk',role:'system'},{copySha256:hash,pagePath,contentKey,model});
  return{ok:true,packageId:Number(packageId),revision,copySha256:hash,status:state.row.risk_lane==='red'?'awaiting_specialist_review':'awaiting_editorial_review'};
}

export async function capturePageBaseline(DB,packageId,input={},who={}){
  await ensureOperationalSchema(DB);const state=await packageState(DB,packageId);if(!state)return{ok:false,status:404,error:'package_not_found'};
  const hash=clean(input.baselineSha256,64),locator=clean(input.rollbackLocator,2000),pagePath=clean(input.pagePath,500);
  const mappedPath=clean(state.exact?.pagePath||state.draft?.page_path,500);
  if(!/^[a-f0-9]{64}$/.test(hash)||!locator||!pagePath||pagePath!==mappedPath||who.role!=='publisher'||input.connectorVerified!==true)return{ok:false,status:400,error:'baseline_contract_invalid'};
  const control=await DB.prepare(`SELECT control_epoch FROM evidence_desk_operational_control WHERE id=1`).first(),at=now();
  await DB.prepare(`INSERT INTO evidence_desk_page_baselines(package_id,page_path,baseline_sha256,rollback_locator,captured_by,verified_by_connector,control_epoch,captured_at) VALUES(?,?,?,?,?,1,?,?) ON CONFLICT(package_id) DO UPDATE SET page_path=excluded.page_path,baseline_sha256=excluded.baseline_sha256,rollback_locator=excluded.rollback_locator,captured_by=excluded.captured_by,verified_by_connector=1,control_epoch=excluded.control_epoch,captured_at=excluded.captured_at`).bind(Number(packageId),pagePath,hash,locator,clean(who.name,200)||'publisher',Number(control?.control_epoch||0),at).run();
  await audit(DB,packageId,'page_baseline_verified',who,{baselineSha256:hash,pagePath,rollbackLocator:locator});
  return{ok:true,packageId:Number(packageId),baselineSha256:hash};
}

export async function capturePageBaselineFromPublisher(env,packageId){
  await ensureOperationalSchema(env.DB);const state=await packageState(env.DB,packageId);if(!state)return{ok:false,status:404,error:'package_not_found'};
  if(!env.WEBSITE_PUBLISHER||!env.STAGING_PUBLISH_TOKEN)return{ok:false,status:503,error:'website_connector_missing'};
  const pagePath=clean(state.exact?.pagePath||state.draft?.page_path,500);
  const response=await env.WEBSITE_PUBLISHER.fetch('https://publisher.internal/v1/baseline',{method:'POST',headers:{authorization:`Bearer ${env.STAGING_PUBLISH_TOKEN}`,'content-type':'application/json'},body:JSON.stringify({packageId:Number(packageId),pagePath})});
  const result=await response.json().catch(()=>({}));if(!response.ok||!result?.verified)return{ok:false,status:502,error:'baseline_connector_failed'};
  return capturePageBaseline(env.DB,packageId,{pagePath,baselineSha256:result.baselineSha256,rollbackLocator:result.rollbackLocator,connectorVerified:true},{name:'Website publisher',role:'publisher'});
}

export async function grantPublicationAuthority(DB,packageId,input={},who={}){
  await ensureOperationalSchema(DB);if(!['owner','admin'].includes(clean(who.role,30)))return{ok:false,status:403,error:'publication_authority_role_required'};
  const state=await packageState(DB,packageId);if(!state)return{ok:false,status:404,error:'package_not_found'};
  const supplied=clean(input.copySha256,64);if(!state.copySha256||supplied!==state.copySha256)return{ok:false,status:409,error:'publication_copy_hash_mismatch',expected:state.copySha256};
  const ref=clean(input.authorityRef,1000);if(!ref)return{ok:false,status:400,error:'authority_reference_required'};
  await DB.prepare(`INSERT INTO evidence_desk_publication_authority(package_id,authority_ref,actor_name,exact_copy_sha256,granted_at) VALUES(?,?,?,?,?) ON CONFLICT(package_id) DO UPDATE SET authority_ref=excluded.authority_ref,actor_name=excluded.actor_name,exact_copy_sha256=excluded.exact_copy_sha256,granted_at=excluded.granted_at`).bind(Number(packageId),ref,clean(who.name,200),supplied,now()).run();
  await audit(DB,packageId,'publication_authority_granted',who,{copySha256:supplied,authorityRef:ref});
  return{ok:true,packageId:Number(packageId),copySha256:supplied};
}

export async function evidencePublicationPreflight(DB,packageId){
  await ensureOperationalSchema(DB);const state=await packageState(DB,packageId);if(!state)return{ok:false,status:404,error:'package_not_found'};
  const baseline=await DB.prepare(`SELECT * FROM evidence_desk_page_baselines WHERE package_id=?`).bind(Number(packageId)).first();
  const authority=await DB.prepare(`SELECT * FROM evidence_desk_publication_authority WHERE package_id=?`).bind(Number(packageId)).first();
  const control=await DB.prepare(`SELECT * FROM evidence_desk_operational_control WHERE id=1`).first();
  const baseControl=await DB.prepare(`SELECT * FROM evidence_desk_control WHERE id=1`).first();
  const reviewLocks=await exactReviewLocks(DB,packageId,state.copySha256);
  const blockers=[];
  if(!state.copySha256)blockers.push('exact_copy_required');
  if(Number(state.row.qualified_review_required)&&!reviewLocks.clinical)blockers.push('qualified_clinical_review');
  if(Number(state.row.communications_review_required)&&!reviewLocks.communications)blockers.push('medicines_communications_review');
  if(state.row.status!=='approved_web_pending_publish'||!state.row.editorial_reviewed_at||!Number(state.row.web_eligible))blockers.push('editorial_approval');
  const mappedPath=clean(state.exact?.pagePath||state.draft?.page_path,500);
  if(!baseline?.rollback_locator||!/^[a-f0-9]{64}$/.test(baseline?.baseline_sha256||'')||!Number(baseline?.verified_by_connector)||baseline?.page_path!==mappedPath||Number(baseline?.control_epoch)!==Number(control?.control_epoch))blockers.push('page_baseline_and_rollback_capture');
  if(!authority||authority.exact_copy_sha256!==state.copySha256)blockers.push('publication_authority');
  if(!Number(baseControl?.enabled)||!Number(baseControl?.website_publish_enabled)||!Number(control?.website_enabled)||(!Number(control?.staging_publication_enabled)&&!Number(control?.production_authority_enabled)))blockers.push('website_destination_disabled');
  return{ok:true,packageId:Number(packageId),ready:blockers.length===0,copySha256:state.copySha256,controlEpoch:Number(control?.control_epoch||0),blockers,environment:'controlled',reviews:{editorial:!!state.row.editorial_reviewed_at,qualifiedClinical:!!reviewLocks.clinical,medicinesCommunications:!!reviewLocks.communications},baseline:baseline?{sha256:baseline.baseline_sha256,rollbackLocator:baseline.rollback_locator,verifiedByConnector:!!baseline.verified_by_connector}:null,publicationAuthority:authority?{authorityRef:authority.authority_ref,actor:authority.actor_name}:null};
}

export async function publishEvidencePackage(env,packageId){
  const preflight=await evidencePublicationPreflight(env.DB,packageId);if(!preflight.ok||!preflight.ready)return{...preflight,status:409,error:'publication_preflight_blocked'};
  if(!env.WEBSITE_PUBLISHER)return{ok:false,status:503,error:'website_connector_missing'};
  const state=await packageState(env.DB,packageId),baseline=preflight.baseline;
  const payload={packageId:Number(packageId),pagePath:state.exact?.pagePath||state.draft?.page_path,contentKey:state.exact?.contentKey||state.draft?.content_key,proposedText:state.proposed,copySha256:state.copySha256,baselineSha256:baseline.sha256,rollbackLocator:baseline.rollbackLocator};
  const key=`web:${packageId}:${state.copySha256}`,body=JSON.stringify(payload),payloadHash=sha256(body);
  const existing=await env.DB.prepare(`SELECT * FROM evidence_desk_publications WHERE idempotency_key=?`).bind(key).first();if(existing?.status==='published')return{ok:true,idempotent:true,publicationId:Number(existing.id),remoteRef:existing.remote_ref};
  if(!env.STAGING_PUBLISH_TOKEN)return{ok:false,status:503,error:'website_connector_credential_missing'};
  const fresh=await controls(env.DB);
  if(!Number(fresh.base?.enabled)||!Number(fresh.base?.website_publish_enabled)||!Number(fresh.operational?.website_enabled)||(!Number(fresh.operational?.staging_publication_enabled)&&!Number(fresh.operational?.production_authority_enabled))||Number(fresh.operational?.control_epoch)!==Number(preflight.controlEpoch))return{ok:false,status:409,error:'shutdown_during_publish'};
  const response=await env.WEBSITE_PUBLISHER.fetch('https://publisher.internal/v1/publish',{method:'POST',headers:{authorization:`Bearer ${env.STAGING_PUBLISH_TOKEN}`,'content-type':'application/json','idempotency-key':key,'x-payload-sha256':payloadHash,'x-control-epoch':String(preflight.controlEpoch)},body});
  const result=await response.json().catch(()=>({}));if(!response.ok||!result?.published)return{ok:false,status:502,error:'website_publish_failed'};
  if(result.copySha256!==state.copySha256||result.payloadSha256!==payloadHash||result.baselineSha256!==baseline.sha256)return{ok:false,status:502,error:'website_connector_hash_mismatch'};
  const inserted=await env.DB.prepare(`INSERT INTO evidence_desk_publications(package_id,destination,idempotency_key,status,remote_ref,payload_sha256,completed_at) VALUES(?,'website',?,'published',?,?,?) ON CONFLICT(idempotency_key) DO UPDATE SET status='published',remote_ref=excluded.remote_ref,payload_sha256=excluded.payload_sha256,completed_at=excluded.completed_at RETURNING id`).bind(Number(packageId),key,clean(result.url||result.versionId,2000),payloadHash,now()).first();
  await audit(env.DB,packageId,'website_published',{name:'Website publisher',role:'system'},{copySha256:state.copySha256,payloadSha256:payloadHash,remoteRef:clean(result.url||result.versionId,2000),versionId:result.versionId});
  return{ok:true,publicationId:Number(inserted?.id),remoteRef:clean(result.url||result.versionId,2000),versionId:clean(result.versionId,300),copySha256:state.copySha256};
}

export async function rollbackEvidencePublication(env,packageId){
  await ensureOperationalSchema(env.DB);if(!env.WEBSITE_PUBLISHER||!env.STAGING_PUBLISH_TOKEN)return{ok:false,status:503,error:'website_connector_missing'};
  const state=await packageState(env.DB,packageId);if(!state)return{ok:false,status:404,error:'package_not_found'};
  const publication=await env.DB.prepare(`SELECT * FROM evidence_desk_publications WHERE package_id=? AND destination='website' AND status='published' ORDER BY id DESC LIMIT 1`).bind(Number(packageId)).first();
  if(!publication)return{ok:false,status:409,error:'website_publication_required'};
  const versionId=clean(publication.remote_ref,2000).match(/\/preview\/(\d+)/)?.[1];if(!versionId)return{ok:false,status:409,error:'rollback_version_missing'};
  const response=await env.WEBSITE_PUBLISHER.fetch('https://publisher.internal/v1/rollback',{method:'POST',headers:{authorization:`Bearer ${env.STAGING_PUBLISH_TOKEN}`,'content-type':'application/json'},body:JSON.stringify({versionId,copySha256:state.copySha256})});
  const result=await response.json().catch(()=>({}));if(!response.ok||!result?.rolledBack)return{ok:false,status:502,error:'website_rollback_failed'};
  const baseline=await env.DB.prepare(`SELECT * FROM evidence_desk_page_baselines WHERE package_id=?`).bind(Number(packageId)).first();
  if(result.baselineSha256!==baseline?.baseline_sha256)return{ok:false,status:502,error:'rollback_baseline_hash_mismatch'};
  await env.DB.prepare(`UPDATE evidence_desk_publications SET status='rolled_back',completed_at=? WHERE id=?`).bind(now(),Number(publication.id)).run();
  await audit(env.DB,packageId,'website_rolled_back',{name:'Website publisher',role:'system'},{copySha256:state.copySha256,baselineSha256:result.baselineSha256,versionId});
  return{ok:true,rolledBack:true,packageId:Number(packageId),versionId,baselineSha256:result.baselineSha256};
}

export async function approveDistribution(DB,packageId,input={},who={}){
  await ensureOperationalSchema(DB);if(!['owner','admin'].includes(clean(who.role,30)))return{ok:false,status:403,error:'distribution_authority_role_required'};
  const state=await packageState(DB,packageId);if(!state)return{ok:false,status:404,error:'package_not_found'};
  if(clean(input.copySha256,64)!==state.copySha256)return{ok:false,status:409,error:'distribution_copy_hash_mismatch'};
  const destinations=Array.isArray(input.destinations)?input.destinations.filter(x=>['newsletter','facebook','instagram','linkedin','x'].includes(x)):[];
  if(!destinations.length)return{ok:false,status:400,error:'distribution_destination_required'};
  if(state.row.status!=='approved_web_pending_publish'||!state.row.editorial_reviewed_at||!Number(state.row.web_eligible))return{ok:false,status:409,error:'editorial_approval_required'};
  const reviewLocks=await exactReviewLocks(DB,packageId,state.copySha256);
  if((Number(state.row.qualified_review_required)&&!reviewLocks.clinical)||(Number(state.row.communications_review_required)&&!reviewLocks.communications))return{ok:false,status:409,error:'specialist_review_required'};
  const control=await DB.prepare(`SELECT * FROM evidence_desk_operational_control WHERE id=1`).first();
  const baseControl=await DB.prepare(`SELECT * FROM evidence_desk_control WHERE id=1`).first();
  const disabled=destinations.filter(destination=>!Number(baseControl?.enabled)||!distributionControlEnabled(control,destination)||(destination==='newsletter'?!Number(baseControl?.newsletter_enabled):!Number(baseControl?.social_enabled)));
  if(disabled.length)return{ok:false,status:409,error:'distribution_destination_disabled',destinations:disabled};
  const ref=clean(input.authorityRef,1000);if(!ref)return{ok:false,status:400,error:'authority_reference_required'};
  const payloadHashes=input.payloadHashes&&typeof input.payloadHashes==='object'?input.payloadHashes:{};
  const jobs=[];
  for(const destination of destinations){
    const payloadHash=clean(payloadHashes[destination],64);
    if(!/^[a-f0-9]{64}$/.test(payloadHash))return{ok:false,status:400,error:'distribution_payload_hash_required',destination};
    const job=await DB.prepare(`SELECT * FROM evidence_desk_distribution_jobs WHERE package_id=? AND destination=? AND copy_sha256=? AND payload_sha256=?`).bind(Number(packageId),destination,state.copySha256,payloadHash).first();
    if(!job)return{ok:false,status:409,error:'distribution_payload_not_found',destination};
    jobs.push(job);
  }
  const approvedAt=now(),actorName=clean(who.name,200);
  for(const job of jobs){
    await DB.batch([
      DB.prepare(`INSERT INTO evidence_desk_distribution_approvals(package_id,destination,copy_sha256,authority_ref,actor_name,approved_at) VALUES(?,?,?,?,?,?) ON CONFLICT(package_id,destination) DO UPDATE SET copy_sha256=excluded.copy_sha256,authority_ref=excluded.authority_ref,actor_name=excluded.actor_name,approved_at=excluded.approved_at`).bind(Number(packageId),job.destination,state.copySha256,ref,actorName,approvedAt),
      DB.prepare(`INSERT INTO evidence_desk_distribution_job_approvals(job_id,package_id,destination,copy_sha256,payload_sha256,authority_ref,actor_name,approved_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(job_id) DO UPDATE SET copy_sha256=excluded.copy_sha256,payload_sha256=excluded.payload_sha256,authority_ref=excluded.authority_ref,actor_name=excluded.actor_name,approved_at=excluded.approved_at`).bind(Number(job.id),Number(packageId),job.destination,state.copySha256,job.payload_sha256,ref,actorName,approvedAt),
      DB.prepare(`UPDATE evidence_desk_distribution_jobs SET status='queued',approved_at=?,error_code=NULL WHERE id=?`).bind(approvedAt,Number(job.id))
    ]);
  }
  await audit(DB,packageId,'distribution_payloads_approved',who,{copySha256:state.copySha256,destinations,payloadHashes:Object.fromEntries(jobs.map(job=>[job.destination,job.payload_sha256])),authorityRef:ref});
  return{ok:true,packageId:Number(packageId),destinations,copySha256:state.copySha256,payloadHashes:Object.fromEntries(jobs.map(job=>[job.destination,job.payload_sha256]))};
}

const DISTRIBUTION_DESTINATIONS=new Set(['newsletter','facebook','instagram','linkedin','x']);

function distributionControlEnabled(control,destination){
  return destination==='newsletter'?Number(control?.newsletter_enabled)===1:Number(control?.social_enabled)===1;
}

function distributionPrompt(state,destination,publication){
  const format=destination==='newsletter'
    ?'Return JSON only with keys subject, previewText, text and html.'
    :'Return JSON only with keys text and hashtags, where hashtags is an array of restrained, relevant hashtags.';
  return `Adapt the exact, already-published Shift website copy for ${destination}. ${format} Do not sharpen, broaden or add any clinical claim. Preserve every risk qualifier and urgent instruction. Do not imply clinical review beyond the supplied approval state. Do not promote a prescription-only medicine. Link readers back to the published page. Published URL: ${publication.remote_ref}. Exact source copy: ${state.proposed}`;
}

function validDistributionPayload(destination,output){
  if(!output||typeof output!=='object')return false;
  if(destination==='newsletter')return !!clean(output.subject,300)&&!!clean(output.text,15000)&&!!clean(output.html,30000);
  return !!clean(output.text,5000)&&Array.isArray(output.hashtags)&&output.hashtags.length<=12&&output.hashtags.every(tag=>typeof tag==='string'&&tag.length<=100);
}

export async function prepareDistributionJobs(env,packageId,{destinations=null,model='@cf/meta/llama-3.1-8b-instruct-fast'}={}){
  await ensureOperationalSchema(env.DB);
  const state=await packageState(env.DB,packageId);if(!state)return{ok:false,status:404,error:'package_not_found'};
  if(!state.copySha256)return{ok:false,status:409,error:'exact_copy_required'};
  if(state.row.status!=='approved_web_pending_publish'||!state.row.editorial_reviewed_at||!Number(state.row.web_eligible))return{ok:false,status:409,error:'editorial_approval_required'};
  const reviewLocks=await exactReviewLocks(env.DB,packageId,state.copySha256);
  if((Number(state.row.qualified_review_required)&&!reviewLocks.clinical)||(Number(state.row.communications_review_required)&&!reviewLocks.communications))return{ok:false,status:409,error:'specialist_review_required'};
  const publication=await env.DB.prepare(`SELECT * FROM evidence_desk_publications WHERE package_id=? AND destination='website' AND idempotency_key=? AND status='published' ORDER BY id DESC LIMIT 1`).bind(Number(packageId),`web:${packageId}:${state.copySha256}`).first();
  if(!publication)return{ok:false,status:409,error:'website_publication_required'};
  const requested=(Array.isArray(destinations)?destinations:destinations?[destinations]:['newsletter','facebook','instagram','linkedin','x']).filter(destination=>DISTRIBUTION_DESTINATIONS.has(destination));
  if(!requested.length)return{ok:false,status:400,error:'distribution_destination_required'};
  const initialControls=await controls(env.DB),control=initialControls.operational,baseControl=initialControls.base;
  const disabled=requested.filter(destination=>!distributionControlEnabled(control,destination)||(destination==='newsletter'?!Number(baseControl?.newsletter_enabled):!Number(baseControl?.social_enabled))||!Number(baseControl?.enabled));
  if(disabled.length)return{ok:false,status:409,error:'distribution_destination_disabled',destinations:disabled};
  if(!env.AI)return{ok:false,status:503,error:'model_binding_missing'};
  const jobs=[];
  for(const destination of requested){
    const generated=await env.AI.run(model,{messages:[{role:'system',content:'Evidence-bound UK health distribution editor. JSON only.'},{role:'user',content:distributionPrompt(state,destination,publication)}],temperature:0.1,max_tokens:1200});
    const raw=clean(generated?.response||generated?.result?.response,40000).replace(/^```json\s*|\s*```$/g,'');
    const output=parse(raw);if(!validDistributionPayload(destination,output))return{ok:false,status:422,error:'distribution_model_output_invalid',destination};
    const payload={destination,sourceUrl:publication.remote_ref,sourceCopySha256:state.copySha256,...output};
    const finalControls=await controls(env.DB);
    if(!Number(finalControls.base?.enabled)||!distributionControlEnabled(finalControls.operational,destination)||(destination==='newsletter'?!Number(finalControls.base?.newsletter_enabled):!Number(finalControls.base?.social_enabled))||Number(finalControls.operational?.control_epoch)!==Number(initialControls.operational?.control_epoch))return{ok:false,status:409,error:'shutdown_during_distribution_draft'};
    const payloadJson=JSON.stringify(payload),payloadHash=sha256(payloadJson),key=`distribution:${destination}:${packageId}:${state.copySha256}:${payloadHash}`;
    const row=await env.DB.prepare(`INSERT INTO evidence_desk_distribution_jobs(package_id,destination,copy_sha256,payload_json,payload_sha256,idempotency_key,status,model_name) VALUES(?,?,?,?,?,?,'awaiting_approval',?) ON CONFLICT(package_id,destination,copy_sha256,payload_sha256) DO UPDATE SET error_code=NULL RETURNING *`).bind(Number(packageId),destination,state.copySha256,payloadJson,payloadHash,key,model).first();
    jobs.push({id:Number(row.id),destination,payloadSha256:payloadHash,status:row.status,payload});
  }
  await audit(env.DB,packageId,'distribution_payloads_prepared',{name:'Shift Evidence Desk',role:'system'},{copySha256:state.copySha256,destinations:requested,payloadHashes:Object.fromEntries(jobs.map(job=>[job.destination,job.payloadSha256])),model});
  return{ok:true,packageId:Number(packageId),copySha256:state.copySha256,jobs};
}

export async function deliverDistributionJobs(env,{packageId=null,limit=25}={}){
  await ensureOperationalSchema(env.DB);
  const query=packageId
    ?`SELECT * FROM evidence_desk_distribution_jobs WHERE status='queued' AND package_id=? ORDER BY id LIMIT ?`
    :`SELECT * FROM evidence_desk_distribution_jobs WHERE status='queued' ORDER BY id LIMIT ?`;
  const statement=env.DB.prepare(query);
  const {results:queued=[]}=packageId?await statement.bind(Number(packageId),Math.min(Number(limit)||25,100)).all():await statement.bind(Math.min(Number(limit)||25,100)).all();
  if(!queued.length)return{ok:true,delivered:0,failed:0,jobs:[]};
  let delivered=0,failed=0;const jobs=[];
  for(const job of queued){
    const liveControls=await controls(env.DB),control=liveControls.operational,baseControl=liveControls.base;
    const destination=clean(job.destination,30),state=await packageState(env.DB,job.package_id);
    let error=null;
    if(!state||state.copySha256!==job.copy_sha256)error='distribution_source_hash_drift';
    else if(state.row.status!=='approved_web_pending_publish'||!state.row.editorial_reviewed_at||!Number(state.row.web_eligible))error='editorial_approval_required';
    else if(!Number(baseControl?.enabled)||!distributionControlEnabled(control,destination)||(destination==='newsletter'?!Number(baseControl?.newsletter_enabled):!Number(baseControl?.social_enabled)))error='distribution_destination_disabled';
    const reviewLocks=!error?await exactReviewLocks(env.DB,job.package_id,job.copy_sha256):null;
    if(!error&&((Number(state.row.qualified_review_required)&&!reviewLocks.clinical)||(Number(state.row.communications_review_required)&&!reviewLocks.communications)))error='specialist_review_required';
    const webPublication=!error?await env.DB.prepare(`SELECT id FROM evidence_desk_publications WHERE package_id=? AND destination='website' AND idempotency_key=? AND status='published'`).bind(Number(job.package_id),`web:${job.package_id}:${job.copy_sha256}`).first():null;
    if(!error&&!webPublication)error='website_publication_required';
    const sourceApproval=!error?await env.DB.prepare(`SELECT * FROM evidence_desk_distribution_approvals WHERE package_id=? AND destination=? AND copy_sha256=?`).bind(Number(job.package_id),destination,job.copy_sha256).first():null;
    if(!error&&!sourceApproval)error='distribution_approval_required';
    const jobApproval=!error?await env.DB.prepare(`SELECT * FROM evidence_desk_distribution_job_approvals WHERE job_id=? AND package_id=? AND destination=? AND copy_sha256=? AND payload_sha256=?`).bind(Number(job.id),Number(job.package_id),destination,job.copy_sha256,job.payload_sha256).first():null;
    if(!error&&!jobApproval)error='distribution_payload_approval_required';
    const binding=destination==='newsletter'?env.NEWSLETTER_PUBLISHER:env.SOCIAL_PUBLISHER;
    if(!error&&!binding)error=destination==='newsletter'?'newsletter_connector_missing':'social_connector_missing';
    if(!error&&!env.STAGING_DISTRIBUTION_TOKEN)error='distribution_connector_credential_missing';
    if(error){
      await env.DB.prepare(`UPDATE evidence_desk_distribution_jobs SET error_code=? WHERE id=?`).bind(error,Number(job.id)).run();failed++;jobs.push({id:Number(job.id),destination,status:'blocked',error});continue;
    }
    const immediateControls=await controls(env.DB);
    if(!Number(immediateControls.base?.enabled)||!distributionControlEnabled(immediateControls.operational,destination)||(destination==='newsletter'?!Number(immediateControls.base?.newsletter_enabled):!Number(immediateControls.base?.social_enabled))||Number(immediateControls.operational?.control_epoch)!==Number(control?.control_epoch)){
      await env.DB.prepare(`UPDATE evidence_desk_distribution_jobs SET status='queued',error_code='shutdown_during_distribution' WHERE id=?`).bind(Number(job.id)).run();failed++;jobs.push({id:Number(job.id),destination,status:'retry_pending',error:'shutdown_during_distribution'});continue;
    }
    let response;
    try{response=await binding.fetch(`https://publisher.internal/v1/${destination}`,{method:'POST',headers:{authorization:`Bearer ${env.STAGING_DISTRIBUTION_TOKEN}`,'content-type':'application/json','idempotency-key':job.idempotency_key,'x-payload-sha256':job.payload_sha256},body:job.payload_json})}
    catch(error){
      const errorCode=`distribution_connector_unavailable:${clean(error?.message||error,300)}`;
      await env.DB.prepare(`UPDATE evidence_desk_distribution_jobs SET status='queued',error_code=? WHERE id=?`).bind(errorCode,Number(job.id)).run();failed++;jobs.push({id:Number(job.id),destination,status:'retry_pending',error:'distribution_connector_unavailable'});continue;
    }
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!result?.published||result.copySha256!==job.copy_sha256||result.payloadSha256!==job.payload_sha256){
      error=!response.ok||!result?.published?'distribution_publish_failed':'distribution_connector_hash_mismatch';
      const retryable=response.status===429||response.status>=500,nextStatus=retryable?'queued':'failed';
      await env.DB.prepare(`UPDATE evidence_desk_distribution_jobs SET status=?,error_code=? WHERE id=?`).bind(nextStatus,error,Number(job.id)).run();failed++;jobs.push({id:Number(job.id),destination,status:retryable?'retry_pending':'failed',error});continue;
    }
    const at=now(),remoteRef=clean(result.url||result.messageId||result.postId,2000);
    await env.DB.batch([
      env.DB.prepare(`UPDATE evidence_desk_distribution_jobs SET status='published',remote_ref=?,error_code=NULL,completed_at=? WHERE id=?`).bind(remoteRef,at,Number(job.id)),
      env.DB.prepare(`INSERT INTO evidence_desk_publications(package_id,destination,idempotency_key,status,remote_ref,payload_sha256,completed_at) VALUES(?,?,?,'published',?,?,?) ON CONFLICT(idempotency_key) DO UPDATE SET status='published',remote_ref=excluded.remote_ref,payload_sha256=excluded.payload_sha256,completed_at=excluded.completed_at`).bind(Number(job.package_id),destination,job.idempotency_key,remoteRef,job.payload_sha256,at)
    ]);
    await audit(env.DB,job.package_id,'distribution_published',{name:`${destination} connector`,role:'system'},{destination,copySha256:job.copy_sha256,payloadSha256:job.payload_sha256,remoteRef});
    delivered++;jobs.push({id:Number(job.id),destination,status:'published',remoteRef});
  }
  return{ok:failed===0,delivered,failed,jobs};
}

export async function runOperationalSchedule(env){
  await ensureOperationalSchema(env.DB);const initial=await controls(env.DB),control=initial.operational;
  if(!Number(control?.monitoring_enabled)||!Number(initial.base?.enabled))return{ok:true,state:'sealed',sourcesChecked:0,draftsCreated:0};
  const monitored=await runEvidenceDeskScheduled(env);const drafts=[];
  if(Number(control.drafting_enabled)){
    const candidateIds=[];if(monitored?.adapter?.packageId)candidateIds.push(Number(monitored.adapter.packageId));
    const {results:pending=[]}=await env.DB.prepare(`SELECT id FROM evidence_desk_packages WHERE status IN ('awaiting_decision','awaiting_specialist_review','changes_required') ORDER BY id LIMIT 25`).all();
    for(const row of pending)if(!candidateIds.includes(Number(row.id))&&!(await packageState(env.DB,row.id))?.proposed)candidateIds.push(Number(row.id));
    for(const id of candidateIds)drafts.push(await draftEvidencePackage(env,id,{model:env.EVIDENCE_DESK_AI_MODEL||'@cf/meta/llama-3.1-8b-instruct-fast'}));
  }
  const distribution=await deliverDistributionJobs(env);
  const draftFailed=drafts.some(result=>result?.ok===false);
  return{ok:monitored.ok!==false&&!draftFailed&&distribution.ok!==false,state:monitored.ok===false||draftFailed||distribution.ok===false?'failed_closed':'operational',sourcesChecked:monitored.sourcesChecked,drafts,publication:'approval_driven_only',distribution};
}

export async function stopOperationalDesk(DB,reason='Operator stop'){
  await ensureOperationalSchema(DB);const at=now();
  await DB.batch([
    DB.prepare(`UPDATE evidence_desk_operational_control SET monitoring_enabled=0,drafting_enabled=0,website_enabled=0,newsletter_enabled=0,social_enabled=0,staging_publication_enabled=0,production_authority_enabled=0,control_epoch=control_epoch+1,shutdown_reason=?,updated_at=? WHERE id=1`).bind(clean(reason,1000),at),
    DB.prepare(`UPDATE evidence_desk_control SET enabled=0,ingestion_enabled=0,decision_email_enabled=0,website_publish_enabled=0,newsletter_enabled=0,social_enabled=0,stopped_at=?,stop_reason=?,updated_at=? WHERE id=1`).bind(at,clean(reason,1000),at)
  ]);
  await audit(DB,null,'operational_kill_switch',{name:'Evidence Desk operator',role:'owner'},{note:clean(reason,1000)});
  return{ok:true,state:'sealed',reason:clean(reason,1000)};
}

export async function specialistReview(DB,packageId,type,input,reviewer){
  await ensureOperationalSchema(DB);const state=await packageState(DB,packageId);if(!state)return{ok:false,status:404,error:'package_not_found'};
  if(clean(input.copySha256,64)!==state.copySha256)return{ok:false,status:409,error:'review_copy_hash_mismatch',expected:state.copySha256};
  const decision=type==='clinical'?'qualified_review_approved':'communications_approved';
  const result=await decideEvidencePackage(DB,packageId,{decision,authorityRef:input.authorityRef,note:input.note},actor(reviewer.name,type==='clinical'?'clinical':'owner'));
  if(!result.ok)return result;
  await DB.prepare(`INSERT INTO evidence_desk_specialist_review_locks(package_id,review_type,copy_sha256,authority_ref,reviewer_name,reviewed_at) VALUES(?,?,?,?,?,?) ON CONFLICT(package_id,review_type) DO UPDATE SET copy_sha256=excluded.copy_sha256,authority_ref=excluded.authority_ref,reviewer_name=excluded.reviewer_name,reviewed_at=excluded.reviewed_at`).bind(Number(packageId),type,state.copySha256,clean(input.authorityRef,1000),clean(reviewer.name,200),now()).run();
  return{...result,copySha256:state.copySha256};
}
