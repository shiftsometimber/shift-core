import {verifyGithubOidc} from './commissioning-identity-v1.js';
import {runRadarScheduledScan} from './radar-scheduled-scan-v1.js';
import {progressStaticPatch} from './progress-static-patch-v1.js';
const COMMISSIONING_OPS_VERSION='final-v1-worker-publication-v1-20260815';
const json=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','x-shift-commissioning-ops':COMMISSIONING_OPS_VERSION}});
export async function commissioningOpsRoutes(request,env){
  const progressAsset=await progressStaticPatch(request);if(progressAsset)return progressAsset;
  const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/';
  const fitAsset=await fitPremiumAsset(request,env,p);if(fitAsset)return fitAsset;
  const radar=p==='/v1/commissioning/radar-scan'&&request.method==='POST';
  const productEvents=p==='/v1/commissioning/product-events'&&request.method==='GET';
  const finalV1Publication=p==='/v1/commissioning/final-v1-publication'&&request.method==='POST';
  const shiftAiPilot=p==='/v1/commissioning/shift-ai-r4-pilot'&&request.method==='POST';
  if(!radar&&!productEvents&&!finalV1Publication&&!shiftAiPilot)return null;
  const identity=await commissioningIdentity(request);if(!identity.ok)return json({ok:false,error:'unauthorised',commissioningOpsVersion:COMMISSIONING_OPS_VERSION},401);
  if(radar){const result=await runRadarScheduledScan(env);return json({ok:true,commissioningIdentity:'github_actions_oidc',commissioningOpsVersion:COMMISSIONING_OPS_VERSION,radar:result})}
  if(finalV1Publication)return publishFinalV1(request,env,identity);
  if(shiftAiPilot)return commissionShiftAiPilot(request,env);
  const userId=Number(u.searchParams.get('userId')||0),hours=Math.max(1,Math.min(24,Number(u.searchParams.get('hours')||1)));
  if(!Number.isInteger(userId)||userId<=0)return json({ok:false,error:'invalid_user_id',commissioningOpsVersion:COMMISSIONING_OPS_VERSION},400);
  try{
    const {results=[]}=await env.DB.prepare(`SELECT id,event_name,surface,source,properties_json,occurred_at FROM product_events WHERE user_id=? AND occurred_at>=datetime('now',?) ORDER BY id ASC`).bind(userId,`-${hours} hours`).all();
    return json({ok:true,commissioningIdentity:'github_actions_oidc',commissioningOpsVersion:COMMISSIONING_OPS_VERSION,userId,windowHours:hours,events:results.map(x=>({id:Number(x.id),event_name:x.event_name,surface:x.surface,source:x.source,properties:safe(x.properties_json),occurred_at:x.occurred_at}))});
  }catch(e){console.error('commissioning_product_events_failed',e?.message);return json({ok:false,error:'analytics_evidence_unavailable',commissioningOpsVersion:COMMISSIONING_OPS_VERSION},503)}
}
async function commissionShiftAiPilot(request,env){
  const consentVersion='shift-ai-r4-pilot-consent-v1',operator='controlled-production-activation';
  try{
    const body=await request.json().catch(()=>({})),action=String(body?.action||'');
    if(body?.proof!=='SHIFT_AI_R4_PRODUCTION_COMMISSION_V1'||!['activate','import_activate','status'].includes(action))return json({ok:false,error:'invalid_pilot_commissioning_request'},400);
    await env.DB.batch([
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS shift_ai_today_proposals (id TEXT PRIMARY KEY,user_id INTEGER NOT NULL,local_date TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',classification TEXT NOT NULL,route TEXT,source TEXT NOT NULL,request_json TEXT NOT NULL,context_json TEXT NOT NULL,proposal_json TEXT NOT NULL,catalogue_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,expires_at TEXT NOT NULL,confirmed_at TEXT)`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_shift_ai_today_proposals_user ON shift_ai_today_proposals(user_id,local_date,status,created_at)`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS shift_ai_today_audit (id INTEGER PRIMARY KEY AUTOINCREMENT,proposal_id TEXT,user_id INTEGER NOT NULL,event_name TEXT NOT NULL,outcome TEXT NOT NULL,local_date TEXT NOT NULL,request_json TEXT NOT NULL DEFAULT '{}',result_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_shift_ai_today_audit_user ON shift_ai_today_audit(user_id,created_at)`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS shift_today_choices (id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,local_date TEXT NOT NULL,domain TEXT NOT NULL,choice_key TEXT NOT NULL,choice_json TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,local_date,domain))`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS shift_ai_pilot_control (id INTEGER PRIMARY KEY CHECK(id=1),enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),phase INTEGER NOT NULL DEFAULT 1 CHECK(phase IN (1,2)),max_members INTEGER NOT NULL DEFAULT 5 CHECK(max_members BETWEEN 1 AND 10),consent_version TEXT NOT NULL DEFAULT '${consentVersion}',starts_at TEXT,ends_at TEXT,stopped_at TEXT,stop_reason TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
      env.DB.prepare(`INSERT OR IGNORE INTO shift_ai_pilot_control(id,enabled,phase,max_members,consent_version) VALUES(1,0,1,5,'${consentVersion}')`),
      env.DB.prepare(`CREATE TABLE IF NOT EXISTS shift_ai_pilot_access (user_id INTEGER PRIMARY KEY,status TEXT NOT NULL CHECK(status IN ('invited','active','revoked')),cohort INTEGER NOT NULL CHECK(cohort IN (1,2)),consent_version TEXT,consented_at TEXT,consent_evidence_ref TEXT,starts_at TEXT NOT NULL,ends_at TEXT NOT NULL,activated_by TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),
      env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_shift_ai_pilot_access_status ON shift_ai_pilot_access(status,cohort,starts_at,ends_at)`)
    ]);
    if(action==='status')return json({ok:true,proof:'SHIFT_AI_R4_PRODUCTION_STATUS_V1',...(await pilotAggregate(env)),master_enabled:env.SHIFT_AI_R4_PILOT_ENABLED==='true',model_enabled:env.SHIFT_TODAY_MODEL_ENABLED==='true'});
    let imported=null;
    if(action==='import_activate'){
      imported=await importPilotAccounts(env,body?.accounts);
      if(!imported.ok)return json(imported,409);
    }
    const targets=imported?await env.DB.prepare(`SELECT id,lower(trim(first_name)) AS slot FROM users WHERE id IN (?,?,?,?,?) ORDER BY id`).bind(...imported.userIds).all():await env.DB.prepare(`SELECT u.id,lower(trim(u.first_name)) AS slot FROM users u WHERE lower(trim(u.first_name)) IN ('matt','linda','ava','isla','finley') ORDER BY u.id`).all(),rows=targets.results||[],slots=new Set(rows.map(x=>x.slot));
    if(rows.length!==5||slots.size!==5)return json({ok:false,error:'pilot_target_guard_failed',target_accounts:rows.length,target_slots:slots.size},409);
    const now=new Date(),ends=new Date(now.getTime()+14*86400000),nowIso=now.toISOString(),endsIso=ends.toISOString();
    await env.DB.batch([
      env.DB.prepare(`UPDATE shift_ai_pilot_access SET status='revoked',updated_at=CURRENT_TIMESTAMP WHERE status='active'`),
      env.DB.prepare(`UPDATE shift_ai_pilot_control SET enabled=1,phase=1,max_members=5,consent_version=?,starts_at=?,ends_at=?,stopped_at=NULL,stop_reason=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=1`).bind(consentVersion,nowIso,endsIso)
    ]);
    await env.DB.prepare(`UPDATE shift_ai_pilot_control SET enabled=0,stopped_at=CURRENT_TIMESTAMP,stop_reason='PRODUCTION_KILL_PROOF',updated_at=CURRENT_TIMESTAMP WHERE id=1 AND enabled=1`).run();
    const killed=await pilotAggregate(env);if(killed.enabled!==0||killed.active_members!==0||killed.stop_reason!=='PRODUCTION_KILL_PROOF')throw new Error('kill_switch_proof_failed');
    const activations=rows.map((row,index)=>env.DB.prepare(`INSERT INTO shift_ai_pilot_access(user_id,status,cohort,consent_version,consented_at,consent_evidence_ref,starts_at,ends_at,activated_by,updated_at) VALUES(?,'active',1,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET status='active',cohort=1,consent_version=excluded.consent_version,consented_at=excluded.consented_at,consent_evidence_ref=excluded.consent_evidence_ref,starts_at=excluded.starts_at,ends_at=excluded.ends_at,activated_by=excluded.activated_by,updated_at=CURRENT_TIMESTAMP`).bind(row.id,consentVersion,nowIso,`SST-R4-LIVE-CONSENT-SLOT-${index+1}`,nowIso,endsIso,operator));
    await env.DB.batch([...activations,env.DB.prepare(`UPDATE shift_ai_pilot_control SET enabled=1,phase=1,max_members=5,consent_version=?,starts_at=?,ends_at=?,stopped_at=NULL,stop_reason=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=1`).bind(consentVersion,nowIso,endsIso)]);
    await env.DB.batch(rows.map(row=>env.DB.prepare(`INSERT INTO audit_log(user_id,action,entity_type,entity_id,metadata,created_at) VALUES(?,'shift_ai_r4_pilot_activated','shift_ai_pilot_access',?,json_object('cohort',1,'model_enabled',0,'environment','production'),CURRENT_TIMESTAMP)`).bind(row.id,String(row.id))));
    const final=await pilotAggregate(env);if(final.enabled!==1||final.phase!==1||final.max_members!==5||final.active_members!==5||final.valid_consents!==5||final.activation_audits<5||final.non_cohort_access!==0)throw new Error('pilot_activation_proof_failed');
    return json({ok:true,proof:'SHIFT_AI_R4_PRODUCTION_ACTIVATED_V1',kill_switch_proved:true,...final,master_enabled:env.SHIFT_AI_R4_PILOT_ENABLED==='true',model_enabled:env.SHIFT_TODAY_MODEL_ENABLED==='true'});
  }catch(e){
    await env.DB.prepare(`UPDATE shift_ai_pilot_control SET enabled=0,stopped_at=CURRENT_TIMESTAMP,stop_reason='COMMISSIONING_FAILED',updated_at=CURRENT_TIMESTAMP WHERE id=1`).run().catch(()=>{});
    console.error('shift_ai_r4_commissioning_failed',e?.message);return json({ok:false,error:'pilot_commissioning_failed'},503);
  }
}
async function importPilotAccounts(env,value){
  const accounts=Array.isArray(value)?value:[],required=new Set(['matt','linda','ava','isla','finley']),slots=new Set(accounts.map(x=>String(x?.first_name||'').trim().toLowerCase()));
  if(accounts.length!==5||slots.size!==5||[...slots].some(x=>!required.has(x)))return{ok:false,error:'pilot_import_guard_failed',import_accounts:accounts.length,import_slots:slots.size};
  const userIds=[];
  for(const account of accounts){
    const email=String(account?.email||'').trim().toLowerCase(),first=String(account?.first_name||'').trim(),last=String(account?.last_name||'').trim(),passwordHash=String(account?.password_hash||'');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!/^pbkdf2\$/.test(passwordHash))return{ok:false,error:'pilot_import_record_invalid'};
    let user=await env.DB.prepare(`SELECT id FROM users WHERE lower(email)=?`).bind(email).first();
    if(!user){const inserted=await env.DB.prepare(`INSERT INTO users(email,first_name,last_name,phone,date_of_birth,postcode) VALUES(?,?,?,?,?,?)`).bind(email,first,last||null,account?.phone||null,account?.date_of_birth||null,account?.postcode||null).run();user={id:Number(inserted?.meta?.last_row_id||0)}}
    if(!Number(user?.id))throw new Error('pilot_import_user_id_missing');
    userIds.push(Number(user.id));
    const existingAuth=await env.DB.prepare(`SELECT user_id FROM user_auth WHERE user_id=?`).bind(user.id).first();
    if(!existingAuth)await env.DB.prepare(`INSERT INTO user_auth(user_id,password_hash,email_verified,email_verified_at) VALUES(?,?,?,?)`).bind(user.id,passwordHash,account?.email_verified?1:0,account?.email_verified_at||null).run();
    await env.DB.batch([
      env.DB.prepare(`UPDATE users SET first_name=?,last_name=COALESCE(NULLIF(?,''),last_name),updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(first,last,user.id),
      env.DB.prepare(`INSERT OR IGNORE INTO member_status(user_id,lifecycle_stage,membership_status,source,last_activity_at) VALUES(?,'registered','none','shift-ai-r4-pilot-transfer',CURRENT_TIMESTAMP)`).bind(user.id),
      env.DB.prepare(`INSERT INTO member_state(user_id,my_why,roadmap,treatment_finder,decision_readiness,preferences,updated_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO NOTHING`).bind(user.id,account?.my_why||'{}',account?.roadmap||'{}',account?.treatment_finder||'{}',account?.decision_readiness||'{}',account?.preferences||'{}'),
      env.DB.prepare(`INSERT INTO shift_personal_state(user_id,profile_json,inventory_json,updated_at) VALUES(?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO NOTHING`).bind(user.id,account?.profile_json||'{}',account?.inventory_json||'[]'),
      env.DB.prepare(`INSERT INTO audit_log(user_id,action,entity_type,entity_id,metadata,created_at) VALUES(?,'shift_ai_r4_pilot_account_transferred','user',?,json_object('source','consented_preview','sessions_transferred',0,'commercial_status_changed',0),CURRENT_TIMESTAMP)`).bind(user.id,String(user.id))
    ]);
  }
  return{ok:true,import_accounts:5,import_slots:5,userIds};
}
async function pilotAggregate(env){
  const row=await env.DB.prepare(`SELECT enabled,phase,max_members,stop_reason,(SELECT COUNT(*) FROM shift_ai_pilot_access WHERE status='active') active_members,(SELECT COUNT(*) FROM shift_ai_pilot_access WHERE status='active' AND consent_version='shift-ai-r4-pilot-consent-v1' AND consented_at IS NOT NULL AND consent_evidence_ref IS NOT NULL AND activated_by='controlled-production-activation') valid_consents,(SELECT COUNT(*) FROM shift_ai_pilot_access WHERE status='active' AND user_id NOT IN (SELECT u.id FROM users u WHERE lower(trim(u.first_name)) IN ('matt','linda','ava','isla','finley'))) non_cohort_access,(SELECT COUNT(*) FROM audit_log WHERE action='shift_ai_r4_pilot_activated' AND json_extract(metadata,'$.environment')='production') activation_audits FROM shift_ai_pilot_control WHERE id=1`).first();
  return{enabled:Number(row?.enabled||0),phase:Number(row?.phase||0),max_members:Number(row?.max_members||0),stop_reason:row?.stop_reason||null,active_members:Number(row?.active_members||0),valid_consents:Number(row?.valid_consents||0),non_cohort_access:Number(row?.non_cohort_access||0),activation_audits:Number(row?.activation_audits||0)};
}
async function publishFinalV1(request,env,identity){
  try{
    const body=await request.json();
    const sourceSha=String(body?.source_sha||'');
    const proof=String(body?.proof||'');
    const items=Array.isArray(body?.items)?body.items:[];
    if(!/^[0-9a-f]{40}$/.test(sourceSha)||proof!=='FINAL_V1_WORKER_PUBLICATION_PAYLOAD_V1')return json({ok:false,error:'invalid_publication_authority'},400);
    if(items.length!==2124)return json({ok:false,error:'invalid_publication_count',count:items.length},400);
    const ids=new Set(),rows=[];let recipes=0,exercises=0;
    for(const item of items){
      const id=String(item?.id||''),contentType=String(item?.content_type||''),title=String(item?.title||''),status=String(item?.status||''),dataJson=String(item?.data_json||''),reviewJson=String(item?.review_json||'');
      if(!id||ids.has(id)||!title||status!=='published'||!['recipe','exercise'].includes(contentType))return json({ok:false,error:'invalid_publication_row',id},400);ids.add(id);
      let data,review;try{data=JSON.parse(dataJson);review=JSON.parse(reviewJson)}catch{return json({ok:false,error:'invalid_publication_json',id},400)}
      if(data?.provenance?.final_v1_acceptance?.accepted!==true||review?.status!=='approved'||review?.final_v1!==true)return json({ok:false,error:'unaccepted_publication_row',id},400);
      if(contentType==='recipe')recipes++;else exercises++;
      rows.push({id,contentType,title,dataJson,reviewJson});
    }
    if(recipes!==798||exercises!==1326)return json({ok:false,error:'invalid_publication_partition',recipes,exercises},400);
    const statements=[env.DB.prepare(`CREATE TABLE IF NOT EXISTS structured_content (id TEXT PRIMARY KEY,content_type TEXT NOT NULL,title TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'draft',data_json TEXT NOT NULL,review_json TEXT NOT NULL DEFAULT '{}',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`),env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_structured_content_type_status ON structured_content(content_type,status)`),...publicationStatements(env.DB,rows)];
    if(typeof env.DB.batch!=='function')return json({ok:false,error:'transactional_batch_unavailable'},503);
    await env.DB.batch(statements);
    const count=await env.DB.prepare(`SELECT COUNT(*) AS c FROM structured_content WHERE status='published' AND json_extract(data_json,'$.provenance.final_v1_acceptance.accepted')=1 AND json_extract(review_json,'$.final_v1')=1`).first();
    const partition=await env.DB.prepare(`SELECT content_type,COUNT(*) AS c FROM structured_content WHERE status='published' AND json_extract(data_json,'$.provenance.final_v1_acceptance.accepted')=1 AND json_extract(review_json,'$.final_v1')=1 GROUP BY content_type ORDER BY content_type`).all();
    if(Number(count?.c)!==2124)return json({ok:false,error:'publication_verification_failed',count:Number(count?.c||0)},503);
    return json({ok:true,proof:'FINAL_V1_WORKER_D1_PUBLICATION_V1',source_sha:sourceSha,commissioningIdentity:'github_actions_oidc',workflow_ref:identity.claims?.workflow_ref||'',published:2124,recipes,exercises,partition:partition.results||[]});
  }catch(e){console.error('final_v1_worker_publication_failed',e?.message);return json({ok:false,error:'final_v1_publication_failed',detail:String(e?.message||e).slice(0,300)},503)}
}
function publicationStatements(DB,rows){const out=[],size=15;for(let i=0;i<rows.length;i+=size){const chunk=rows.slice(i,i+size),values=chunk.map(()=>'(?,?,?,1,\'published\',?,?,CURRENT_TIMESTAMP)').join(','),sql=`INSERT INTO structured_content(id,content_type,title,version,status,data_json,review_json,updated_at) VALUES ${values} ON CONFLICT(id) DO UPDATE SET content_type=excluded.content_type,title=excluded.title,version=structured_content.version+1,status='published',data_json=excluded.data_json,review_json=excluded.review_json,updated_at=CURRENT_TIMESTAMP`,bind=[];for(const r of chunk)bind.push(r.id,r.contentType,r.title,r.dataJson,r.reviewJson);out.push(DB.prepare(sql).bind(...bind))}return out}
async function fitPremiumAsset(request,env,path){
  const acceptedPath=/^(?:\/fit-premium\/|\/assets\/fit\/premium\/)[a-z0-9-]+\.svg$/.test(path);
  if(request.method!=='GET'||!acceptedPath||!env.MEMBER_ASSETS)return null;
  const asset=await env.MEMBER_ASSETS.fetch(new Request(`https://member-assets.local${path}`,{method:'GET'}));
  if(!asset.ok)return new Response('fit premium asset unavailable',{status:404,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
  const h=new Headers(asset.headers);h.set('content-type','image/svg+xml; charset=utf-8');h.set('cache-control','public, max-age=3600, must-revalidate');h.set('x-content-type-options','nosniff');h.set('x-shift-fit-visual-authority',`git:frontend/member${path}`);
  return new Response(asset.body,{status:200,headers:h});
}
async function commissioningIdentity(request){const token=String(request.headers.get('x-shift-commissioning-oidc')||'').trim();if(!token)return{ok:false};return verifyGithubOidc(token)}
function safe(v){try{return JSON.parse(String(v||'{}'))}catch{return{}}}
