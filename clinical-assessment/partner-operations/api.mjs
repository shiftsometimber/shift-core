import {newStaff,staffAction,fulfilmentAction,permission,credentialsCurrent,memberTracking,EVIDENCE,fail,text,future} from './domain.mjs';
import {limitProfessionalAuth} from './auth-limits.mjs';
import {purgeStaffEvidence} from './evidence-retention.mjs';
import {orderEventStatements} from './notification-events.mjs';
import {prepareInvitation} from './invitation-drafts.mjs';
import {orderNotificationReviewStatements} from './notification-review.mjs';
export const PARTNER_BASE='/v1/hq/clinical/partners';
const ORIGIN='https://hq.shiftsometimber.co.uk';
const now=()=>new Date().toISOString(),uid=()=>crypto.randomUUID();
const digest=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',typeof data==='string'?new TextEncoder().encode(data):data)),n=>n.toString(16).padStart(2,'0')).join('');
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store, private','Vary':'Origin','Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Credentials':'true','X-Content-Type-Options':'nosniff'}});
const query=(env,sql,...args)=>env.DB.prepare(sql).bind(...args);
const rows=async q=>(await q.all()).results||[];
const admin=a=>a.mfa&&['owner','admin'].includes(a.role);
const parse=row=>row?JSON.parse(row.state_json):null;
const staff=async(env,id)=>parse(await query(env,'SELECT state_json FROM partner_staff WHERE id=?',id).first());
async function body(request,max=24000){
 const reader=request.body?.getReader();let length=0,parts=[];if(reader)while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>max){await reader.cancel();fail(413,'request_too_large');}parts.push(value);}
 const all=new Uint8Array(length);let offset=0;for(const p of parts){all.set(p,offset);offset+=p.length;}return all;
}
export async function readJson(request){try{return JSON.parse(new TextDecoder().decode(await body(request)));}catch(e){if(e.status)throw e;fail(400,'invalid_json');}}
export function authCondition(a,date){
 if(a.application)return{sql:'EXISTS(SELECT 1 FROM partner_access_tokens WHERE token_hash=? AND staff_id=? AND kind=\'application\' AND used_at IS NULL AND expires_at>?)',args:[a.tokenHash,a.application,date]};
 return{sql:'EXISTS(SELECT 1 FROM hq_users h JOIN hq_sessions ss ON ss.hq_user_id=h.id WHERE h.id=? AND h.role=? AND h.status=\'active\' AND h.mfa_enabled=1 AND ss.token_hash=? AND ss.revoked_at IS NULL AND julianday(ss.expires_at)>julianday(?))'+(a.clinicalGovernor||a.pharmacyGovernor?' AND EXISTS(SELECT 1 FROM clinical_hq_staff WHERE user_id=? AND active=1 AND expires_at>? AND registration_number<>\'\' AND verified_by<>\'\')':''),args:[a.id,a.role,a.sessionHash,date,...a.clinicalGovernor||a.pharmacyGovernor?[a.id,date]:[]]};
}
export async function audit(env,a,type,id,action,details={}){
 const g=authCondition(a,now()),n=await query(env,'INSERT INTO partner_audit SELECT ?,?,?,(SELECT COALESCE(MAX(version),-1)+1 FROM partner_audit WHERE entity_type=? AND entity_id=?),?,?,?,? WHERE '+g.sql,uid(),type,id,type,id,String(a.id),action,JSON.stringify(details),now(),...g.args).run();
 if(n.meta?.changes!==1)fail(403,'access_revoked');
}
async function saveStaff(env,original,result,a,extra=[],organisation=null){
 const s=result.state,e=result.event,g=authCondition(a,e.at);
 const r=await env.DB.batch([
  query(env,'UPDATE partner_staff SET state_json=?,version=?,username=?,hq_user_id=?,updated_at=? WHERE id=? AND version=? AND '+g.sql+(organisation?' AND EXISTS(SELECT 1 FROM partner_organisations WHERE id=? AND version=? AND state_json=?)':''),JSON.stringify(s),s.version,s.username,s.hqUserId,e.at,s.id,original.version,...g.args,...organisation?[organisation.id,organisation.version,JSON.stringify(organisation)]:[]),
  query(env,'INSERT INTO partner_audit SELECT ?,?,?,(SELECT COALESCE(MAX(version),-1)+1 FROM partner_audit WHERE entity_type=? AND entity_id=?),?,?,?,? WHERE changes()=1',e.id,'staff',s.id,'staff',s.id,e.actorId,e.action,JSON.stringify({...e.details,profileVersion:s.version,snapshot:publicStaff(s)}),e.at),...extra
 ]);if(r[0].meta?.changes!==1)fail(409,'profile_changed_or_access_revoked');return s;
}
export async function currentPartner(env,s,date=now()){
 const org=parse(await query(env,'SELECT state_json FROM partner_organisations WHERE id=?',s.orgId).first());
 if(!org||org.status!=='approved'||org.expiresAt<=date||org.kind!==(s.kind==='clinician'?'clinical':'pharmacy'))fail(403,'approved_current_partner_required');return org;
}
export async function clinicianPermission(env,actor,action='review',medicine){
 if(env.PARTNER_OPERATIONS_ENABLED!=='true')return null;
 const s=parse(await query(env,'SELECT state_json FROM partner_staff WHERE hq_user_id=?',actor.id).first());
 if(!s||s.kind!=='clinician'||actor.role==='clinical'&&actor.mfaEnabled!==true||!permission(s,'weight_management',action,now(),medicine))fail(403,'clinical_scope_not_approved');
 const org=await currentPartner(env,s);return{staffId:s.id,version:s.version,organisationId:org.id,organisationVersion:org.version};
}
function summary(s){return{id:s.id,kind:s.kind,orgId:s.orgId,version:s.version,status:s.status,username:s.username,name:s.details.name,updatedAt:s.updatedAt};}
function publicStaff(s){return{...s,evidence:s.evidence.map(({objectKey,...e})=>e)};}
export async function actorFor(request,env,authenticate,application=false){
 if(application){const raw=request.headers.get('X-Application-Token');if(!raw||!/^[a-f0-9]{64}$/.test(raw))fail(401,'application_link_required');const tokenHash=await digest(raw),row=await query(env,"SELECT staff_id FROM partner_access_tokens WHERE token_hash=? AND kind='application' AND used_at IS NULL AND expires_at>?",tokenHash,now()).first();if(!row)fail(401,'application_link_expired');return{id:'application:'+row.staff_id,application:row.staff_id,tokenHash};}
 const access=await authenticate(request,env);if(access.response)return{response:access.response};const u=access.user;if(!u)fail(401,'hq_sign_in_required');
 if(!u.mfaEnabled)fail(403,'hq_mfa_required');const token=(request.headers.get('cookie')||'').match(/(?:^|;\s*)sst_hq_session=([^;]+)/)?.[1];if(!token)fail(401,'hq_session_required');
 const a={id:u.id,role:u.role,mfa:true,sessionHash:await digest(decodeURIComponent(token))};
 // Designated professional reviewers are explicitly commissioned, never elected by applicants.
 for(const [field,key]of [['clinicalGovernor','PARTNER_CLINICAL_APPROVER_IDS'],['pharmacyGovernor','PARTNER_PHARMACY_APPROVER_IDS']]){
  if((env[key]||'').split(',').map(x=>x.trim()).includes(String(u.id))){const verified=await query(env,"SELECT user_id FROM clinical_hq_staff WHERE user_id=? AND active=1 AND role='clinician' AND expires_at>? AND registration_number<>'' AND verified_by<>''",u.id,now()).first();a[field]=!!verified;}
 }
 return a;
}
async function token(env,s,kind,a){
 const raw=random(),date=now(),expiresAt=new Date(Date.now()+(kind==='application'?7*86400000:86400000)).toISOString(),g=authCondition(a,date),auditId=uid();
 const rs=await env.DB.batch([
  query(env,'INSERT INTO partner_audit SELECT ?,?,?,(SELECT COALESCE(MAX(version),-1)+1 FROM partner_audit WHERE entity_type=? AND entity_id=?),?,?,?,? WHERE '+g.sql,auditId,'staff',s.id,'staff',s.id,String(a.id),kind+'_link_created','{}',date,...g.args),
  query(env,'UPDATE partner_access_tokens SET used_at=? WHERE staff_id=? AND kind=? AND used_at IS NULL AND changes()=1',date,s.id,kind),
  query(env,'INSERT INTO partner_access_tokens SELECT ?,?,?,?,NULL,?,? WHERE EXISTS(SELECT 1 FROM partner_audit WHERE id=?)',await digest(raw),s.id,kind,expiresAt,a.id,date,auditId)
 ]);if(rs[0].meta?.changes!==1)fail(403,'access_revoked');
 return{link:ORIGIN+'/clinical-portal/partners/'+kind+'#'+raw,expiresAt,sent:false};
}
async function passwordHash(password){
 if(typeof password!=='string'||password.length<15||password.length>128)fail(422,'password_15_to_128_characters_required');
 const salt=crypto.getRandomValues(new Uint8Array(16)),key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']),bits=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:100000},key,256));
 const b64=v=>btoa(String.fromCharCode(...v)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
 return'pbkdf2$100000$'+b64(salt)+'$'+b64(bits);
}
export async function partnerRoute(request,env,authenticate,adapters={}){
 const path=new URL(request.url).pathname;if(path!==PARTNER_BASE&&!path.startsWith(PARTNER_BASE+'/'))return null;
 try{
  if(request.headers.has('Origin')&&request.headers.get('Origin')!==ORIGIN)fail(403,'origin_forbidden');
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Credentials':'true','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Application-Token, X-Profile-Version, X-Evidence-Kind','Cache-Control':'no-store'}});
  if(!['GET','POST'].includes(request.method))fail(405,'method_not_allowed');if(request.method==='POST'&&request.headers.get('Origin')!==ORIGIN)fail(403,'origin_required');
  if(env.PARTNER_OPERATIONS_ENABLED!=='true')fail(503,'partner_operations_not_commissioned');
  const p=path.slice(PARTNER_BASE.length).split('/').filter(Boolean),internalSetup=env.PARTNER_INTERNAL_SETUP_ONLY==='true';
  // Internal preparation is not professional onboarding. Token links, files, credentials and supply remain closed in source.
  if(internalSetup&&(p[0]==='login'||p[0]==='activation'||p[0]==='application'||p[0]==='fulfilment'||p.length>1&&!['action','audit'].includes(p[1])&&p[0]!=='organisations'))fail(503,'professional_onboarding_not_open');
  if(p[0]==='login'&&p[1]==='verify'&&p.length===2&&request.method==='POST'){
   if(env.PARTNER_LOGIN_ENABLED!=='true'||!env.HQ_AUTH)fail(503,'partner_login_not_commissioned');const b=await readJson(request);
   await limitProfessionalAuth(request,env,'mfa',text(b.challenge,200));
   return env.HQ_AUTH.fetch(new Request('https://api.shiftsometimber.co.uk/v1/hq/auth/mfa/verify',{method:'POST',headers:{Origin:ORIGIN,'Content-Type':'application/json'},body:JSON.stringify({challenge:text(b.challenge,200),code:text(b.code,6)}),redirect:'manual'}));
  }
  if(p[0]==='activation'&&p.length===1&&request.method==='POST'){
   const b=await readJson(request),t=await query(env,"SELECT * FROM partner_access_tokens WHERE token_hash=? AND kind='activation' AND used_at IS NULL AND expires_at>?",await digest(text(b.token,64)),now()).first();if(!t)fail(401,'activation_link_expired');
   const s=await staff(env,t.staff_id);if(s.status!=='credentials_pending'||!s.hqUserId)fail(409,'activation_not_pending');
   const date=now(),hash=await passwordHash(b.password),next={...s,passwordSetAt:date,version:s.version+1,updatedAt:date},event=uid();
   const rs=await env.DB.batch([
    query(env,"UPDATE partner_access_tokens SET used_at=? WHERE token_hash=? AND used_at IS NULL AND expires_at>? AND EXISTS(SELECT 1 FROM partner_staff WHERE id=? AND version=?)",date,t.token_hash,date,s.id,s.version),
    query(env,'UPDATE hq_users SET password_hash=?,updated_at=? WHERE id=? AND changes()=1',hash,date,s.hqUserId),
    query(env,'UPDATE partner_staff SET state_json=?,version=?,updated_at=? WHERE id=? AND version=? AND changes()=1',JSON.stringify(next),next.version,date,s.id,s.version),
    query(env,'INSERT INTO partner_audit SELECT ?,?,?,(SELECT COALESCE(MAX(version),-1)+1 FROM partner_audit WHERE entity_type=? AND entity_id=?),?,?,?,? WHERE changes()=1',event,'staff',s.id,'staff',s.id,String(s.hqUserId),'password_created','{}',date)
   ]);if(rs[2].meta?.changes!==1)fail(409,'activation_already_used');return json({passwordCreated:true,username:s.username,next:'Sign in and configure HQ MFA. Patient access remains unavailable until HQ activation.'});
  }
  if(p[0]==='login'&&p.length===1&&request.method==='POST'){
   if(env.PARTNER_LOGIN_ENABLED!=='true')fail(503,'partner_login_not_commissioned');
   const b=await readJson(request),username=text(b.username,32).toUpperCase();
   await limitProfessionalAuth(request,env,'login',username);
   const r=await query(env,'SELECT state_json FROM partner_staff WHERE username=?',username).first(),s=parse(r);
   if(!s||!s.passwordSetAt||!['credentials_pending','active'].includes(s.status))fail(401,'invalid_credentials');
   if(typeof b.password!=='string'||b.password.length>128)fail(401,'invalid_credentials');
   // Delegate password verification, sessions and MFA challenges to retained HQ auth.
   // This route remains separately closed until actual-session and recovery acceptance is complete.
   if(!env.HQ_AUTH)fail(503,'hq_authentication_unavailable');return env.HQ_AUTH.fetch(new Request('https://api.shiftsometimber.co.uk/v1/hq/auth/login',{method:'POST',headers:{Origin:ORIGIN,'Content-Type':'application/json'},body:JSON.stringify({email:s.details.email,password:b.password}),redirect:'manual'}));
  }
  const app=p[0]==='application',a=await actorFor(request,env,authenticate,app);if(a.response)return a.response;
  const administrator=admin(a),governor=a.clinicalGovernor||a.pharmacyGovernor;
  if(internalSetup&&!administrator)fail(403,'internal_owner_access_required');
  if(p[0]==='invitations'&&p.length===1){
   if(!administrator)fail(403,'owner_approval_required');
   await audit(env,a,'directory','invitations','invitation_drafts_viewed');
   if(request.method==='GET')return json({drafts:await rows(query(env,'SELECT * FROM partner_invitation_drafts ORDER BY created_at DESC LIMIT 100')),sent:false});
   return json(await prepareInvitation(env,await readJson(request),a,()=>authCondition(a,now())),201);
  }
  if(p[0]==='organisations'){
   if(!administrator)fail(403,'owner_approval_required');
   if(p.length===2&&request.method==='POST'){
    const original=parse(await query(env,'SELECT state_json FROM partner_organisations WHERE id=?',p[1]).first());if(!original)fail(404,'partner_not_found');const b=await readJson(request);if(b.version!==original.version)fail(409,'partner_changed');if(!['approve','suspend'].includes(b.action))fail(422,'invalid_partner_action');
    const date=now(),s={...original,version:original.version+1,status:b.action==='approve'?'approved':'suspended',verifiedBy:String(a.id),verifiedAt:date,verificationReference:text(b.verificationReference,2000),expiresAt:future(b.expiresAt,date)},g=authCondition(a,date),event=uid();
    const rs=await env.DB.batch([query(env,'UPDATE partner_organisations SET state_json=?,version=?,updated_at=? WHERE id=? AND version=? AND '+g.sql,JSON.stringify(s),s.version,date,s.id,original.version,...g.args),query(env,'INSERT INTO partner_audit SELECT ?,?,?,(SELECT COALESCE(MAX(version),-1)+1 FROM partner_audit WHERE entity_type=? AND entity_id=?),?,?,?,? WHERE changes()=1',event,'organisation',s.id,'organisation',s.id,String(a.id),'organisation_'+b.action,JSON.stringify({verificationReference:s.verificationReference}),date)]);if(rs[0].meta?.changes!==1)fail(409,'partner_changed');return json(s);
   }
   if(p.length!==1)fail(404,'not_found');
   if(request.method==='GET'){await audit(env,a,'directory','organisations','organisations_viewed');return json({organisations:(await rows(query(env,'SELECT state_json FROM partner_organisations ORDER BY updated_at DESC LIMIT 200'))).map(parse)});}
   const b=await readJson(request);if(!['clinical','pharmacy'].includes(b.kind))fail(422,'invalid_organisation_kind');
   const id=uid(),date=now(),s={id,kind:b.kind,name:text(b.name,200),registration:text(b.registration,100),premises:text(b.premises,1000),superintendent:text(b.superintendent,300),contact:text(b.contact,300),status:'pending',version:0};
   const g=authCondition(a,date);const rs=await env.DB.batch([query(env,'INSERT INTO partner_organisations SELECT ?,0,?,? WHERE '+g.sql,id,JSON.stringify(s),date,...g.args),query(env,'INSERT INTO partner_audit SELECT ?,?,?,0,?,?,?,? WHERE changes()=1',uid(),'organisation',id,String(a.id),'organisation_created','{}',date)]);if(rs[0].meta?.changes!==1)fail(403,'access_revoked');return json(s,201);
  }
  if(p[0]==='fulfilment')return await fulfilmentRoute(request,env,a,p.slice(1),adapters);
  if(!p.length){
   if(!administrator&&!governor)fail(403,'partner_directory_forbidden');
   if(request.method==='GET'){await audit(env,a,'directory','staff','staff_directory_viewed');return json({staff:(await rows(query(env,'SELECT state_json FROM partner_staff ORDER BY updated_at DESC LIMIT 200'))).map(r=>summary(parse(r))),capabilities:{administrator,internalSetupOnly:internalSetup,clinicalGovernor:!!a.clinicalGovernor,pharmacyGovernor:!!a.pharmacyGovernor}});}
   if(!administrator)fail(403,'owner_approval_required');const b=await readJson(request),id=uid(),date=now(),s=newStaff(b,id,date);
   const organisation=parse(await query(env,'SELECT state_json FROM partner_organisations WHERE id=?',s.orgId).first());if(!organisation||organisation.kind!==(s.kind==='clinician'?'clinical':'pharmacy'))fail(422,'matching_partner_organisation_required');
   const g=authCondition(a,date);const rs=await env.DB.batch([query(env,'INSERT INTO partner_staff SELECT ?,NULL,NULL,?,?,0,?,? WHERE '+g.sql,id,s.kind,s.orgId,JSON.stringify(s),date,...g.args),query(env,'INSERT INTO partner_audit SELECT ?,?,?,0,?,?,?,? WHERE changes()=1',uid(),'staff',id,String(a.id),'application_created','{}',date)]);if(rs[0].meta?.changes!==1)fail(403,'access_revoked');return json(publicStaff(s),201);
  }
  let s;if(app)s=await staff(env,a.application);else if(p[0]==='me')s=parse(await query(env,'SELECT state_json FROM partner_staff WHERE hq_user_id=?',a.id).first());else s=await staff(env,p[0]);
  const relevantGovernor=s&&(s.kind==='clinician'?a.clinicalGovernor:a.pharmacyGovernor);
  if(!s||!(administrator||relevantGovernor||String(s.hqUserId)===String(a.id)||a.application===s.id))fail(404,'staff_not_found');
  if(app&&!['draft','submitted','checks_underway','more_information'].includes(s.status))fail(401,'application_link_closed');
  if(p.length===1&&request.method==='GET'){await audit(env,a,'staff',s.id,'staff_profile_viewed');return json(publicStaff(s));}
  if(p[1]==='audit'&&p.length===2&&request.method==='GET'){
   if(!administrator&&!relevantGovernor)fail(403,'compliance_audit_forbidden');await audit(env,a,'staff',s.id,'staff_audit_viewed');return json({events:await rows(query(env,"SELECT id,actor_id,action,details_json,created_at FROM partner_audit WHERE entity_type='staff' AND entity_id=? ORDER BY version DESC LIMIT 300",s.id))});
  }
  if(p[1]==='link'&&request.method==='POST'&&p.length===2){if(!administrator)fail(403,'owner_approval_required');if(!['draft','more_information','submitted','checks_underway'].includes(s.status))fail(409,'application_not_editable');return json(await token(env,s,'application',a));}
  if(p[1]==='credentials'&&request.method==='POST'&&p.length===2){
   if(!administrator)fail(403,'owner_approval_required');if(!['approved','credentials_pending'].includes(s.status)||!credentialsCurrent(s,now()))fail(422,'approved_current_profile_required');
   if(!s.hqUserId){
    const date=now(),next={...s,status:'credentials_pending',version:s.version+1,updatedAt:date},g=authCondition(a,date),event=uid();
    const rs=await env.DB.batch([
     query(env,'UPDATE partner_staff SET version=?,updated_at=? WHERE id=? AND version=? AND '+g.sql,next.version,date,s.id,s.version,...g.args),
     query(env,"INSERT INTO hq_users(email,name,password_hash,role,status,mfa_enabled,created_at,updated_at) SELECT ?,?,'!activation_pending','clinical','active',0,?,? WHERE changes()=1",s.details.email,s.details.name,date,date),
     query(env,'UPDATE partner_staff SET hq_user_id=(SELECT id FROM hq_users WHERE email=?),state_json=json_set(?,\'$.hqUserId\',(SELECT id FROM hq_users WHERE email=?)) WHERE id=? AND version=? AND changes()=1',s.details.email,JSON.stringify(next),s.details.email,s.id,next.version),
     query(env,'INSERT INTO partner_audit SELECT ?,?,?,(SELECT COALESCE(MAX(version),-1)+1 FROM partner_audit WHERE entity_type=? AND entity_id=?),?,?,?,? WHERE changes()=1',event,'staff',s.id,'staff',s.id,String(a.id),'credentials_prepared','{}',date)
    ]);if(rs[0].meta?.changes!==1)fail(409,'profile_changed');s=await staff(env,s.id);
   }
   if(s.passwordSetAt)fail(409,'use_existing_hq_password_recovery');return json(await token(env,s,'activation',a));
  }
  if(p[1]==='retention'&&p.length===2&&request.method==='POST'){
   if(!administrator)fail(403,'owner_approval_required');const b=await readJson(request);if(b.version!==s.version)fail(409,'profile_changed');if(b.dryRun!==undefined&&typeof b.dryRun!=='boolean')fail(422,'boolean_dry_run_required');
   const result=await purgeStaffEvidence(env,s,b.evidenceId,a,(original,result)=>saveStaff(env,original,result,a),{dryRun:b.dryRun!==false});return json({...result,...result.state?{state:publicStaff(result.state)}:{}});
  }
  if(p[1]==='evidence'){
   if(!administrator&&!app)fail(403,'identity_evidence_restricted_to_verifiers');
   if(request.method==='POST'&&p.length===2){
    if(!env.PARTNER_PRIVATE_FILES)fail(503,'private_staff_storage_unavailable');
    const kind=request.headers.get('X-Evidence-Kind'),mime=(request.headers.get('Content-Type')||'').split(';')[0];if(!EVIDENCE.includes(kind)||!['image/png','image/jpeg'].includes(mime))fail(422,'png_or_jpeg_required');
    const data=await body(request,5*1024*1024),png=data[0]===137&&data[1]===80&&data[2]===78&&data[3]===71&&data[4]===13&&data[5]===10&&data[6]===26&&data[7]===10,jpeg=data[0]===255&&data[1]===216&&data[2]===255;
    if(data.length<16||!(mime==='image/png'?png:jpeg))fail(422,'invalid_image');
    const retentionUntil=future(env.PARTNER_EVIDENCE_RETENTION_UNTIL,now());
    const id=uid(),objectKey='staff/'+s.id+'/'+id,e={id,kind,mime,objectKey,digest:await digest(data),uploadedAt:now(),retentionUntil};
    const result=staffAction(s,{action:'evidence',version:Number(request.headers.get('X-Profile-Version')),evidence:e},a,now(),uid());
    await env.PARTNER_PRIVATE_FILES.put(objectKey,data,{httpMetadata:{contentType:mime}});
    try{s=await saveStaff(env,s,result,a);}catch(error){await env.PARTNER_PRIVATE_FILES.delete(objectKey);throw error;}return json(publicStaff(s),201);
   }
   if(request.method==='GET'&&p.length===3){
    const e=s.evidence.find(e=>e.id===p[2]);if(!e||e.retentionUntil<=now())fail(404,'evidence_not_available');const object=await env.PARTNER_PRIVATE_FILES?.get(e.objectKey);if(!object)fail(503,'evidence_unavailable');
    const current=await staff(env,s.id);if(current.version!==s.version)fail(409,'profile_changed');await audit(env,a,'staff',s.id,'staff_evidence_viewed',{evidenceId:e.id});
    return new Response(object.body,{headers:{'Content-Type':e.mime,'Content-Disposition':'inline','Cache-Control':'no-store, private','Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Credentials':'true','Vary':'Origin','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"}});
   }
  }
  if(p[1]==='action'&&request.method==='POST'&&p.length===2){
   const b=await readJson(request);if(internalSetup&&!['details','query','reject','suspend','revoke_grant','hold_evidence','release_evidence_hold'].includes(b.action))fail(503,'professional_onboarding_not_open');if(b.action==='evidence')fail(403,'use_verified_upload_route');
   const organisation=['approve','activate','grant'].includes(b.action)?await currentPartner(env,s):null;
   if(b.action==='approve')b.username=s.username||(s.kind==='clinician'?'CLN-':'DSP-')+random().slice(0,12).toUpperCase();
   if(b.action==='activate'){const u=await query(env,'SELECT mfa_enabled,status FROM hq_users WHERE id=?',s.hqUserId).first();b.accountMfaVerified=u?.mfa_enabled===1&&u.status==='active';}
   const result=staffAction(s,b,a,now(),uid()),projection=[];
   if(b.action==='activate'&&result.state.kind==='clinician'){
    // Credential projection for the retained casework boundary; scope is checked
    // separately on every read/action and again in its mutation transaction.
    const next=result.state,expires=next.checks.map(c=>c.expiresAt).sort()[0];projection.push(query(env,"INSERT INTO clinical_hq_staff(user_id,role,active,verified_by,registration_body,registration_number,expires_at) SELECT ?,'clinician',1,?,?,?,? WHERE EXISTS(SELECT 1 FROM partner_audit WHERE id=?) ON CONFLICT(user_id) DO UPDATE SET active=excluded.active,verified_by=excluded.verified_by,registration_body=excluded.registration_body,registration_number=excluded.registration_number,expires_at=excluded.expires_at",next.hqUserId,next.approvedBy,next.details.regulator,next.details.registrationNumber,expires,result.event.id));
   }
   s=await saveStaff(env,s,result,a,projection,organisation);
   return json(publicStaff(s));
  }
  fail(404,'not_found');
 }catch(e){return json({error:e.status?e.message:'partner_operations_unavailable'},e.status||503);}
}
async function fulfilmentRoute(request,env,a,p,adapters){
 if(!a.mfa)fail(403,'hq_mfa_required');const administrator=admin(a),s=parse(await query(env,'SELECT state_json FROM partner_staff WHERE hq_user_id=?',a.id).first());
 if(!administrator&&(!s||s.kind!=='dispensing'||s.status!=='active'||!credentialsCurrent(s,now())))fail(403,'verified_dispensing_account_required');
 const organisation=!administrator?await currentPartner(env,s):null;
 if(!p.length&&request.method==='GET'){
  const result=await rows(administrator?query(env,'SELECT state_json FROM partner_fulfilment ORDER BY updated_at DESC LIMIT 200'):query(env,'SELECT state_json FROM partner_fulfilment WHERE partner_id=? ORDER BY updated_at DESC LIMIT 200',s.orgId));await audit(env,a,'directory','fulfilment','fulfilment_queue_viewed');
  return json({orders:result.map(parse).filter(o=>administrator||permission(s,o.area,'view_fulfilment',now(),o.medicine)).map(o=>({orderNumber:o.orderNumber,status:o.status,version:o.version,updatedAt:o.updatedAt,memberReplyReceived:!!o.memberReply})),oversight:administrator});
 }
 const order=decodeURIComponent(p[0]||''),f=parse(await query(env,'SELECT state_json FROM partner_fulfilment WHERE order_number=?',order).first());
 if(!f||!administrator&&(s.orgId!==f.partnerId||!permission(s,f.area,'view_fulfilment',now(),f.medicine)))fail(404,'order_not_found');
 if(p.length===1&&request.method==='GET'){
  await audit(env,a,'order',order,'fulfilment_viewed');const events=await rows(query(env,"SELECT actor_id,action,created_at FROM partner_audit WHERE entity_type='order' AND entity_id=? ORDER BY version",order));
  return json({order:administrator?{...memberTracking(f),version:f.version,partnerId:f.partnerId}:f,events,oversight:administrator});
 }
 if(p[1]==='action'&&p.length===2&&request.method==='POST'){
  if(administrator)fail(403,'pharmacy_staff_account_required');if(env.PARTNER_FULFILMENT_ENABLED!=='true')fail(503,'dispensing_not_commissioned');
  const b=await readJson(request),current=['accept','prepare','dispatch'].includes(b.action)?await adapters.prescriptionCurrent?.(f):false,stock=['prepare','dispatch'].includes(b.action)?await adapters.stockAvailable?.(f):false,date=now(),result=fulfilmentAction(f,b,s,a,date,uid(),{prescriptionCurrent:current===true,stockAvailable:stock===true}),g=authCondition(a,date);
  const rs=await env.DB.batch([
   query(env,'UPDATE partner_fulfilment SET state_json=?,version=?,updated_at=? WHERE order_number=? AND version=? AND '+g.sql+' AND EXISTS(SELECT 1 FROM partner_staff WHERE id=? AND version=? AND state_json=?) AND EXISTS(SELECT 1 FROM partner_organisations WHERE id=? AND version=? AND state_json=?)',JSON.stringify(result.state),result.state.version,date,order,f.version,...g.args,s.id,s.version,JSON.stringify(s),organisation.id,organisation.version,JSON.stringify(organisation)),
   query(env,'INSERT INTO partner_audit SELECT ?,?,?,(SELECT COALESCE(MAX(version),-1)+1 FROM partner_audit WHERE entity_type=? AND entity_id=?),?,?,?,? WHERE changes()=1',result.event.id,'order',order,'order',order,String(a.id),result.event.action,JSON.stringify({...result.event.details,source:'partner_portal',orderVersion:result.state.version,permissionVersion:s.version,beforeStatus:f.status,afterStatus:result.state.status,memberMessage:result.state.message||null,tracking:result.state.tracking||null}),date),
   query(env,"INSERT INTO partner_notification_outbox SELECT ?,?,?,?,?,'draft',? WHERE EXISTS(SELECT 1 FROM partner_audit WHERE id=?)",uid(),result.event.id,order,f.memberId,'order_status_update',date,result.event.id),
   ...orderNotificationReviewStatements(env,result.state,result.event),...await orderEventStatements(env,result.state,result.event)
  ]);if(rs[0].meta?.changes!==1)fail(409,'order_or_permissions_changed');return json({order:result.state,notificationStatus:'draft_not_sent'});
 }
 fail(404,'not_found');
}
// Integration seam, not a public route: only a verified prescribing-system adapter
// may create a pharmacy handover. An assessment "proceed" decision cannot do so.
export async function receiveIssuedPrescription(env,input,verify){
 if(env.PARTNER_FULFILMENT_ENABLED!=='true'||typeof verify!=='function')fail(503,'dispensing_not_commissioned');
 const proof=await verify(input);if(!proof||proof.issued!==true||!proof.prescriptionId||!proof.orderNumber||!proof.partnerId||!proof.memberId||!proof.medicine||!proof.area)fail(422,'verified_issued_prescription_required');
 const date=now(),s={...Object.fromEntries(['prescriptionId','orderNumber','partnerId','memberId','medicine','area','patient','delivery','directions','quantity','prescriptionVersion'].filter(k=>proof[k]!==undefined).map(k=>[k,proof[k]])),status:'received',version:0,updatedAt:date},id=uid();
 const previous=parse(await query(env,'SELECT state_json FROM partner_fulfilment WHERE order_number=?',proof.orderNumber).first());
 if(previous&&['prescriptionId','partnerId','memberId','medicine','area'].some(k=>previous[k]!==proof[k]))fail(409,'conflicting_prescription_handover');
 const repeated=await query(env,"SELECT order_number FROM partner_fulfilment WHERE json_extract(state_json,'$.prescriptionId')=?",proof.prescriptionId).first();if(repeated&&repeated.order_number!==proof.orderNumber)fail(409,'prescription_already_handed_over');
 const rs=await env.DB.batch([query(env,'INSERT OR IGNORE INTO partner_fulfilment VALUES(?,?,?,0,?,?)',proof.orderNumber,proof.partnerId,proof.memberId,JSON.stringify(s),date),query(env,'INSERT INTO partner_audit SELECT ?,?,?,0,?,?,?,? WHERE changes()=1',id,'order',proof.orderNumber,'verified_prescription_adapter','prescription_received',JSON.stringify({prescriptionId:proof.prescriptionId}),date),...orderNotificationReviewStatements(env,s,{id,at:date}),...await orderEventStatements(env,s,{id,at:date,action:'prescription_received'})]);
 return{created:rs[0].meta?.changes===1,orderNumber:proof.orderNumber};
}
// Member projection and replies retain BOTH order and authenticated member ownership.
export {memberFulfilment} from './member-fulfilment.mjs';
