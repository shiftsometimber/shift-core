import {fail,text} from './domain.mjs';
export function invitationContent(kind,name,organisation){
 if(!['partner','clinician'].includes(kind))fail(422,'invalid_invitation_kind');
 const clinician=kind==='clinician';
 return {subject:clinician?'Invitation to join SHIFT as a clinician / GP':'An invitation to partner with SHIFT',body:
 'Hello '+name+',\n\n'+(clinician?
 'We would like to invite you to complete a clinician / GP profile with SHIFT, linked to '+organisation+'.\n\nOur onboarding covers your professional registration, prescribing entitlement, relevant competence, indemnity and identity verification. HQ approval and a separately approved treatment scope are required before access. Verified prescribers may review cases and sign prescriptions only within their approved scope. Joining does not automatically grant prescribing permissions.':
 'We would like to explore bringing '+organisation+' into SHIFT as a clinical or dispensing partner. Our setup brings member information, clinical review, prescription handover and dispensing updates together under one order reference.\n\nWe will agree the relevant organisation checks, responsibilities and permissions before access is activated.')+
 '\n\nProfessional onboarding is not open yet. We will provide the secure next steps once it is available. Please do not email identity documents, selfies, passwords or patient information.\n\nBest wishes,\nThe SHIFT team'};
}
// Caller has authenticated the real HQ session. The same session and referenced profile are rechecked at commit.
export async function prepareInvitation(env,b,actor,guard,date=new Date().toISOString()){
 if(!actor.mfa||!['owner','admin'].includes(actor.role))fail(403,'owner_approval_required');
 const q=(sql,...args)=>env.DB.prepare(sql).bind(...args);
 const access=guard();if(!await q('SELECT 1 ok WHERE '+access.sql,...access.args).first())fail(403,'access_revoked');
 const orgRow=await q('SELECT state_json FROM partner_organisations WHERE id=?',text(b.orgId,100)).first();
 if(!orgRow)fail(404,'partner_not_found');const org=JSON.parse(orgRow.state_json);
 let staff=null,name,email;
 if(b.kind==='clinician'){
  const row=await q('SELECT state_json FROM partner_staff WHERE id=?',text(b.staffId,100)).first();
  if(!row)fail(404,'clinician_not_found');staff=JSON.parse(row.state_json);
  if(staff.kind!=='clinician'||staff.orgId!==org.id||org.kind!=='clinical')fail(422,'matching_clinician_and_partner_required');
  if(b.profileVersion!==staff.version)fail(409,'profile_changed');
  if(!['draft','submitted','checks_underway','more_information'].includes(staff.status))fail(409,'application_not_invitable');
  name=staff.details.name;email=staff.details.email.toLowerCase();
 }else if(b.kind==='partner'){name=text(b.name,160);email=text(b.email,200).toLowerCase();}
 else fail(422,'invalid_invitation_kind');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail(422,'valid_email_required');
 const previous=await q('SELECT * FROM partner_invitation_drafts WHERE kind=? AND org_id=? AND COALESCE(staff_id,\'\')=? AND COALESCE(profile_version,-1)=? AND recipient_email=?',b.kind,org.id,staff?.id||'',staff?.version??-1,email).first();
 if(previous)return{draft:previous,sent:false,accessGranted:false,reused:true};
 const id=crypto.randomUUID(),content=invitationContent(b.kind,name,org.name),g=guard();
 const rs=await env.DB.batch([
  q("INSERT INTO partner_invitation_drafts SELECT ?,?,?,?,?,?,?,?,?,'held_onboarding_closed',?,? WHERE "+g.sql+" AND EXISTS(SELECT 1 FROM partner_organisations WHERE id=? AND version=?)"+(staff?" AND EXISTS(SELECT 1 FROM partner_staff WHERE id=? AND version=?)":''),id,b.kind,org.id,staff?.id||null,staff?.version??null,name,email,content.subject,content.body,actor.id,date,...g.args,org.id,org.version,...staff?[staff.id,staff.version]:[]),
  q("INSERT INTO partner_audit SELECT ?,?,?,0,?,?,?,? WHERE EXISTS(SELECT 1 FROM partner_invitation_drafts WHERE id=?)",crypto.randomUUID(),'invitation',id,String(actor.id),'invitation_draft_prepared',JSON.stringify({kind:b.kind,orgId:org.id,staffId:staff?.id||null,sent:false,accessGranted:false}),date,id)
 ]);
 if(rs[0].meta?.changes!==1)fail(409,'profile_or_access_changed');
 return{draft:await q('SELECT * FROM partner_invitation_drafts WHERE id=?',id).first(),sent:false,accessGranted:false,reused:false};
}
