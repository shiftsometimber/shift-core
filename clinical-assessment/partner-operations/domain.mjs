// Shared domain: server-authenticated actors only. UI never supplies authority.
export const AREAS=['weight_management','testosterone','sexual_health','other'];
export const ACTIONS={clinician:['review','query','clinical_decision','issue_prescription'],dispensing:['view_fulfilment','query','supply_decision','prepare','dispatch','record_delivery','record_exception','cancel_supply']};
export const EVIDENCE=['photo_id','selfie','indemnity','qualification','agreement'];
export const CHECKS=['identity','registration','indemnity','agreements','competence'];
export const fail=(status,code)=>{throw Object.assign(Error(code),{status});};
export const text=(v,max=1000)=>{if(typeof v!=='string'||!v.trim()||v.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v))fail(422,'valid_text_required');return v.trim();};
export const future=(v,now)=>{if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString()!==v||v<=now)fail(422,'future_review_date_required');return v;};
const ops=a=>a?.mfa===true&&['owner','admin'].includes(a.role);
const own=(s,a)=>String(s.hqUserId)===String(a.id);
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function newStaff(b,id,now){
 if(!Object.hasOwn(ACTIONS,b.kind))fail(422,'invalid_staff_kind');
 return{id,kind:b.kind,orgId:text(b.orgId,100),version:0,status:'draft',hqUserId:null,username:null,credentialVersion:0,
  details:{name:text(b.name,160),email:text(b.email,200).toLowerCase()},evidence:[],checks:[],grants:[],createdAt:now,updatedAt:now};
}
export function credentialsCurrent(s,now){return CHECKS.every(kind=>s.checks.some(c=>c.kind===kind&&c.credentialVersion===s.credentialVersion&&c.outcome==='verified'&&c.expiresAt>now));}
export function permission(s,area,action,now,medicine){
 if(s.status!=='active'||!s.hqUserId||!credentialsCurrent(s,now))return false;
 return s.grants.some(g=>g.credentialVersion===s.credentialVersion&&!g.revokedAt&&g.area===area&&g.actions.includes(action)&&g.startsAt<=now&&g.expiresAt>now&&(!g.medicines.length||medicine&&g.medicines.includes(medicine)));
}
export function staffAction(original,b,actor,now,id){
 if(!Number.isInteger(b.version)||b.version!==original.version)fail(409,'profile_changed');
 const s=structuredClone(original),admin=ops(actor),app=actor.application===s.id;
 const requireAdmin=()=>{if(!admin)fail(403,'owner_approval_required');if(own(s,actor))fail(403,'self_approval_forbidden');};
 const metadata={};
 if(b.action==='details'){
  if(!admin&&!app)fail(403,'application_access_required');
  if(['approved','credentials_pending','active','suspended','rejected'].includes(s.status))fail(409,'approved_details_require_reapplication');
  const d=b.details;if(!d||typeof d!=='object')fail(422,'details_required');
  if(s.hqUserId&&['name','email'].some(k=>d[k]!==undefined&&d[k]!==s.details[k]))fail(409,'provisioned_identity_change_requires_separate_review');
  const keys=['name','email','professionalContact','profession','regulator','registrationNumber','prescribingEntitlement','experience','indemnityProvider','policyReference','registrationReviewAt'];
  if(Object.keys(d).some(k=>!keys.includes(k)))fail(422,'unknown_application_field');
  for(const [k,v]of Object.entries(d))s.details[k]=text(v,k==='experience'?4000:300);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.details.email))fail(422,'valid_email_required');
  s.details.email=s.details.email.toLowerCase();s.credentialVersion++;s.status='draft';
 }else if(b.action==='evidence'){
  if(!admin&&!app)fail(403,'application_access_required');if(!['draft','more_information','submitted'].includes(s.status))fail(409,'reapplication_required');
  if(!EVIDENCE.includes(b.evidence?.kind)||!/^[a-f0-9]{64}$/.test(b.evidence.digest)||!b.evidence.id)fail(422,'verified_upload_required');
  s.evidence.push(b.evidence);s.credentialVersion++;s.status='draft';metadata.kind=b.evidence.kind;metadata.evidenceId=b.evidence.id;
 }else if(b.action==='hold_evidence'||b.action==='release_evidence_hold'){
  requireAdmin();const e=s.evidence.find(e=>e.id===b.evidenceId&&!e.purgedAt);if(!e)fail(404,'evidence_not_found');if(e.deletionPendingAt)fail(409,'evidence_deletion_already_pending');
  metadata.evidenceId=e.id;metadata.reason=text(b.reason,2000);
  if(b.action==='hold_evidence'){e.legalHold={reason:metadata.reason,actorId:String(actor.id),at:now,reviewAt:future(b.reviewAt,now)};metadata.reviewAt=e.legalHold.reviewAt;}
  else{if(!e.legalHold)fail(409,'evidence_not_on_hold');delete e.legalHold;}
 }else if(b.action==='submit'){
  if(!admin&&!app)fail(403,'application_access_required');if(!['draft','more_information'].includes(s.status))fail(409,'application_not_editable');
  for(const k of ['name','email','professionalContact','profession','regulator','registrationNumber','indemnityProvider','experience'])text(s.details[k],4000);
  for(const k of EVIDENCE)if(!s.evidence.some(e=>e.kind===k&&e.retentionUntil>now))fail(422,'missing_'+k);
  if(b.declaration!==true)fail(422,'application_declaration_required');s.status='submitted';s.submittedAt=now;
 }else if(b.action==='check'){
  requireAdmin();if(!['submitted','checks_underway','more_information'].includes(s.status))fail(409,'submitted_application_required');
  if(!CHECKS.includes(b.kind)||!['verified','rejected'].includes(b.outcome))fail(422,'invalid_verification_check');
  const check={id,kind:b.kind,outcome:b.outcome,source:text(b.source,2000),reviewedBy:String(actor.id),checkedAt:now,expiresAt:future(b.expiresAt,now),credentialVersion:s.credentialVersion};
  s.checks=s.checks.filter(c=>c.kind!==b.kind||c.credentialVersion!==s.credentialVersion);s.checks.push(check);s.status=b.outcome==='verified'?'checks_underway':'more_information';metadata.kind=b.kind;metadata.outcome=b.outcome;
 }else if(b.action==='query'||b.action==='reject'){
  requireAdmin();if(s.status==='active')fail(409,'suspend_active_profile_first');s.status=b.action==='query'?'more_information':'rejected';s.applicationMessage=text(b.message,3000);
 }else if(b.action==='approve'){
  requireAdmin();if(s.status!=='checks_underway'||!credentialsCurrent(s,now))fail(422,'current_verifications_required');
  if(!/^(CLN|DSP)-[A-F0-9]{12}$/.test(b.username)||!b.username.startsWith(s.kind==='clinician'?'CLN-':'DSP-'))fail(422,'generated_username_required');
  if(s.username&&s.username!==b.username)fail(409,'allocated_username_is_permanent');s.username=b.username;s.status=s.hqUserId?'credentials_pending':'approved';s.approvedBy=String(actor.id);s.approvedAt=now;metadata.username=s.username;
 }else if(b.action==='grant'){
  if(!actor.mfa||!(s.kind==='clinician'?actor.clinicalGovernor:actor.pharmacyGovernor))fail(403,'qualified_scope_approver_required');
  if(own(s,actor))fail(403,'self_approval_forbidden');if(!['approved','credentials_pending','active'].includes(s.status)||!credentialsCurrent(s,now))fail(422,'approved_current_profile_required');
  if(!AREAS.includes(b.area)||!Array.isArray(b.actions)||!b.actions.length||new Set(b.actions).size!==b.actions.length||b.actions.some(x=>!ACTIONS[s.kind].includes(x)))fail(422,'invalid_scope');
  if(!Array.isArray(b.medicines)||b.medicines.length>30||b.medicines.some(v=>typeof v!=='string'||!v.trim()||v.length>120))fail(422,'invalid_medicine_restrictions');
  const grant={id,credentialVersion:s.credentialVersion,area:b.area,actions:b.actions,medicines:b.medicines,restrictions:text(b.restrictions,2000),approvalReference:text(b.approvalReference,1000),approvedBy:String(actor.id),startsAt:now,expiresAt:future(b.expiresAt,now)};
  s.grants.push(grant);metadata.grantId=id;metadata.area=b.area;metadata.actions=b.actions;
 }else if(b.action==='revoke_grant'){
  requireAdmin();const g=s.grants.find(g=>g.id===b.grantId&&!g.revokedAt);if(!g)fail(404,'grant_not_found');g.revokedAt=now;metadata.grantId=g.id;metadata.reason=text(b.reason);
 }else if(b.action==='activate'){
  requireAdmin();if(s.status!=='credentials_pending'||!s.passwordSetAt||!b.accountMfaVerified||!s.hqUserId||!credentialsCurrent(s,now))fail(422,'credentials_mfa_and_checks_required');
  if(!s.grants.some(g=>g.credentialVersion===s.credentialVersion&&!g.revokedAt&&g.expiresAt>now))fail(422,'approved_scope_required');s.status='active';
 }else if(b.action==='renew'){
  requireAdmin();if(!['active','suspended','approved','credentials_pending'].includes(s.status))fail(409,'approved_profile_required');s.status='draft';s.credentialVersion++;metadata.reason=text(b.reason);
 }else if(b.action==='suspend'){
  requireAdmin();if(!['active','approved','credentials_pending'].includes(s.status))fail(409,'profile_not_approved');s.status='suspended';metadata.reason=text(b.reason);
 }else fail(422,'unknown_staff_action');
 s.version++;s.updatedAt=now;return{state:s,event:{id,action:'staff_'+b.action,actorId:String(actor.id),at:now,details:metadata}};
}
export const CARRIERS={royal_mail:n=>'https://www.royalmail.com/track-your-item#/tracking-results/'+encodeURIComponent(n),dpd:n=>'https://track.dpd.co.uk/parcels/'+encodeURIComponent(n)};
export function fulfilmentAction(original,b,staff,actor,now,id,{prescriptionCurrent=false,stockAvailable=false}={}){
 if(b.version!==original.version||!Number.isInteger(b.version))fail(409,'order_changed');
 if(!actor.mfa||staff.orgId!==original.partnerId||String(staff.hqUserId)!==String(actor.id))fail(404,'order_not_found');
 const required={accept:'supply_decision',reject:'supply_decision',query:'query',prepare:'prepare',dispatch:'dispatch',delivered:'record_delivery',delivery_exception:'record_exception',returned:'record_delivery',cancel:'cancel_supply'}[b.action];
 if(!required||!permission(staff,original.area,required,now,original.medicine))fail(403,'dispensing_permission_required');
 const transitions={accept:['received','query'],reject:['received','query','accepted','preparing'],query:['received','accepted','preparing'],prepare:['accepted'],dispatch:['preparing'],delivered:['dispatched','delivery_exception'],delivery_exception:['dispatched'],returned:['dispatched','delivery_exception','delivered'],cancel:['received','query','accepted','preparing']};
 if(!transitions[b.action].includes(original.status))fail(409,'invalid_fulfilment_transition');
 if(['accept','prepare','dispatch'].includes(b.action)&&(!prescriptionCurrent||!original.prescriptionId))fail(422,'current_issued_prescription_required');
 if(['prepare','dispatch'].includes(b.action)&&!stockAvailable)fail(409,'stock_unavailable');
 const s=structuredClone(original),detail={};s.status={accept:'accepted',reject:'rejected',query:'query',prepare:'preparing',dispatch:'dispatched',delivered:'delivered',delivery_exception:'delivery_exception',returned:'returned',cancel:'cancelled'}[b.action];
 if(['reject','query','delivery_exception','returned','cancel','delivered'].includes(b.action)){s.message=text(b.message,2000);detail.messagePresent=true;}
 if(b.action==='query'){s.queryId=id;s.memberReply=null;}
 if(['delivered','delivery_exception','returned'].includes(b.action))s.deliveryUpdate={kind:b.action,source:'pharmacy_manual_record',recordedAt:now,note:s.message};
 if(b.action==='dispatch'){
  if(!Object.hasOwn(CARRIERS,b.carrier)||typeof b.trackingNumber!=='string'||!/^[A-Za-z0-9-]{6,50}$/.test(b.trackingNumber))fail(422,'valid_carrier_tracking_required');
  s.tracking={carrier:b.carrier,number:b.trackingNumber,url:CARRIERS[b.carrier](b.trackingNumber),dispatchedAt:now};detail.carrier=b.carrier;
 }
 s.version++;s.updatedAt=now;return{state:s,event:{id,action:'fulfilment_'+b.action,actorId:String(actor.id),at:now,details:detail}};
}
export function memberTracking(s){return{orderNumber:s.orderNumber,status:s.status,updatedAt:s.updatedAt,tracking:s.tracking||null,actionNeeded:s.status==='query'&&!s.memberReply,prescriptionId:s.prescriptionId,deliveryUpdate:s.deliveryUpdate||null};}
