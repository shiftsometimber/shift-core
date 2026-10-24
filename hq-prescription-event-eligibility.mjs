// Read-only source checks for generic prescription alerts. This never issues or supplies medicine.
const states = Object.freeze({
 prescription_proposed:'awaiting_member', prescription_query:'clinician_query',
 prescription_accepted:'accepted', prescription_cancelled:'cancelled',
 prescription_question:'member_question', prescription_declined:'declined', prescription_issued:'issued'
});
const checks=['identity','registration','indemnity','agreements','competence'];
export const isPrescriptionEventKind=kind=>Object.hasOwn(states,kind);
const denied=reason=>({eligible:false,reason});
const first=(DB,sql,...args)=>DB.prepare(sql).bind(...args).first();
const currentChecks=checks.map(kind=>`EXISTS(SELECT 1 FROM json_each(p.state_json,'$.checks') c WHERE json_extract(c.value,'$.kind')='${kind}' AND json_extract(c.value,'$.outcome')='verified' AND json_extract(c.value,'$.credentialVersion')=json_extract(p.state_json,'$.credentialVersion') AND json_extract(c.value,'$.expiresAt')>?)`).join(' AND ');
const currentGrant=`EXISTS(SELECT 1 FROM json_each(p.state_json,'$.grants') g WHERE json_extract(g.value,'$.credentialVersion')=json_extract(p.state_json,'$.credentialVersion') AND json_extract(g.value,'$.revokedAt') IS NULL AND json_extract(g.value,'$.area')='weight_management' AND json_extract(g.value,'$.startsAt')<=? AND json_extract(g.value,'$.expiresAt')>? AND EXISTS(SELECT 1 FROM json_each(g.value,'$.actions') a WHERE a.value=?) AND (json_array_length(g.value,'$.medicines')=0 OR EXISTS(SELECT 1 FROM json_each(g.value,'$.medicines') m WHERE m.value=json_extract(r.state_json,'$.treatment.medicine'))))`;

async function currentProfessional(DB,row,id,pharmacy,date){
 const staff=await first(DB,`SELECT 1 ok FROM partner_staff p JOIN hq_users h ON h.id=p.hq_user_id JOIN partner_organisations o ON o.id=p.org_id JOIN clinical_prescription_requests r ON r.record_id=? WHERE p.hq_user_id=? AND p.kind=? AND h.role='clinical' AND h.status='active' AND h.mfa_enabled=1 AND json_extract(p.state_json,'$.status')='active' AND json_extract(o.state_json,'$.status')='approved' AND json_extract(o.state_json,'$.expiresAt')>? AND ${pharmacy?"p.org_id=json_extract(r.state_json,'$.partnerId') AND json_extract(o.state_json,'$.kind')='pharmacy'":"p.id=json_extract(r.state_json,'$.prescriber.profileId') AND p.version=json_extract(r.state_json,'$.prescriber.profileVersion') AND o.id=json_extract(r.state_json,'$.prescriber.organisationId') AND o.version=json_extract(r.state_json,'$.prescriber.organisationVersion')"} AND ${currentChecks} AND ${currentGrant}`,
  row.record_id,id,pharmacy?'dispensing':'clinician',date,...checks.map(()=>date),date,date,pharmacy?'view_fulfilment':'issue_prescription');
 if(!staff)return false;
 if(pharmacy)return true;
 return !!await first(DB,"SELECT 1 ok FROM clinical_case_assignments a JOIN clinical_hq_staff h ON h.user_id=a.hq_user_id WHERE a.record_id=? AND a.hq_user_id=? AND a.active=1 AND a.expires_at>? AND h.active=1 AND h.role='clinician' AND h.expires_at>? AND trim(COALESCE(h.verified_by,''))<>'' AND trim(COALESCE(h.registration_body,''))<>'' AND trim(COALESCE(h.registration_number,''))<>''",row.record_id,id,date,date);
}

export async function prescriptionEventEligibility(DB,target,now=new Date()){
 try{
  const date=now.toISOString();
  const row=await first(DB,`SELECT e.id,e.record_id,e.version,e.kind,e.created_at,r.member_id,r.order_number,r.version current_version,
   json_extract(r.state_json,'$.recordId') snapshot_record,json_extract(r.state_json,'$.memberId') snapshot_member,json_extract(r.state_json,'$.orderNumber') snapshot_order,
   json_extract(r.state_json,'$.version') snapshot_version,json_extract(r.state_json,'$.status') status,json_extract(r.state_json,'$.expiresAt') expires_at,
   json_extract(r.state_json,'$.prescriber.id') prescriber_id,json_extract(r.state_json,'$.prescriptionId') prescription_id
   FROM clinical_prescription_events e JOIN clinical_prescription_requests r ON r.record_id=e.record_id
   JOIN clinical_prescription_versions v ON v.record_id=e.record_id AND v.version=e.version AND v.state_json=r.state_json
   JOIN clinical_member_records m ON m.id=r.record_id AND m.user_id=r.member_id AND m.order_number=r.order_number AND m.review_sharing=1
   WHERE e.id=?`,target.eventId);
  if(!row||!Object.hasOwn(states,row.kind)||row.current_version!==row.version||row.snapshot_version!==row.version||row.snapshot_record!==row.record_id||row.snapshot_member!==row.member_id||row.snapshot_order!==row.order_number||row.status!==states[row.kind]||!Number.isFinite(Date.parse(row.created_at))||row.created_at>date)return denied('prescription_event_superseded_or_changed');
  for(const [field,value]of [['record_id',target.recordId],['order_number',target.orderNumber],['member_id',target.memberId],['kind',target.kind]])if(value!==undefined&&value!==row[field])return denied('prescription_event_identity_changed');
  if(['awaiting_member','clinician_query','accepted'].includes(row.status)&&(!Number.isFinite(Date.parse(row.expires_at))||row.expires_at<=date))return denied('prescription_action_expired');
  // Withdrawal and questions must still reach the assigned clinician after an old quote expires.
  if(!['cancelled','declined','member_question'].includes(row.status)){
   const current=await first(DB,`SELECT 1 ok FROM clinical_prescription_requests r JOIN clinical_member_records m ON m.id=r.record_id
    JOIN clinical_member_versions a ON a.record_id=m.id AND a.version=(SELECT MAX(version) FROM clinical_member_versions WHERE record_id=m.id)
    JOIN clinical_case_state c ON c.record_id=m.id JOIN medicine_orders o ON o.order_number=r.order_number AND o.user_id=r.member_id
    JOIN medicine_variants v ON v.id=json_extract(r.state_json,'$.treatment.variantId') AND v.medicine_id=o.medicine_id
    WHERE r.record_id=? AND m.revision=json_extract(r.state_json,'$.recordRevision') AND a.submitted=1 AND a.version=json_extract(r.state_json,'$.assessmentVersion') AND a.digest=json_extract(r.state_json,'$.assessmentDigest') AND c.version=json_extract(r.state_json,'$.caseVersion') AND c.assessment_version=a.version AND c.status IN ('ready_for_prescription','prescription_issued')
    AND o.currency='GBP' AND o.total_pence=json_extract(r.state_json,'$.quote.originalTotalPence') AND o.variant_id=json_extract(r.state_json,'$.quote.originalVariantId') AND o.status=json_extract(r.state_json,'$.quote.orderStatus') AND o.updated_at=json_extract(r.state_json,'$.quote.orderUpdatedAt') AND o.discount_pence=json_extract(r.state_json,'$.quote.originalDiscountPence') AND COALESCE(o.discount_code,'')=COALESCE(json_extract(r.state_json,'$.quote.originalDiscountCode'),'')
    AND v.status IN ('active','published') AND v.selling_price_pence=json_extract(r.state_json,'$.quote.unitPricePence') AND v.updated_at=json_extract(r.state_json,'$.quote.catalogueUpdatedAt')`,row.record_id);
   if(!current)return denied('prescription_clinical_or_price_source_changed');
  }
  if(row.status==='issued'){
   const signature=await first(DB,`SELECT 1 ok FROM clinical_prescription_signatures s JOIN clinical_prescriber_signing_keys k ON k.id=s.key_id JOIN clinical_prescription_requests r ON r.record_id=s.record_id WHERE s.id=? AND s.record_id=? AND s.version=? AND k.hq_user_id=? AND k.status='approved' AND k.expires_at>? AND k.profile_version=json_extract(r.state_json,'$.prescriber.profileVersion') AND k.organisation_version=json_extract(r.state_json,'$.prescriber.organisationVersion') AND k.reviewed_by IS NOT NULL AND k.reviewed_by<>k.hq_user_id AND trim(COALESCE(k.verification_reference,''))<>''`,row.prescription_id,row.record_id,row.version,row.prescriber_id,date);
   if(!signature||!await currentProfessional(DB,row,row.prescriber_id,false,date))return denied('prescription_signature_or_prescriber_changed');
  }
  if(target.recipientKind==='member'){
   if(target.recipientId!==row.member_id)return denied('prescription_recipient_changed');
   if(['awaiting_member','clinician_query'].includes(row.status)&&!await currentProfessional(DB,row,row.prescriber_id,false,date))return denied('prescription_prescriber_changed');
   return{eligible:true,reason:null};
  }
  if(target.recipientKind!=='hq_user')return denied('prescription_recipient_kind_changed');
  if(target.pharmacy){
   if(row.kind!=='prescription_issued')return denied('prescription_pharmacy_event_changed');
   const handover=await first(DB,"SELECT 1 ok FROM partner_fulfilment f JOIN clinical_prescription_requests r ON r.order_number=f.order_number AND r.member_id=f.member_id WHERE f.order_number=? AND f.member_id=? AND f.partner_id=json_extract(r.state_json,'$.partnerId') AND json_extract(f.state_json,'$.recordId')=? AND json_extract(f.state_json,'$.prescriptionId')=? AND json_extract(f.state_json,'$.prescriptionVersion')=? AND json_extract(f.state_json,'$.status')='received'",row.order_number,row.member_id,row.record_id,row.prescription_id,row.version);
   if(!handover||!await currentProfessional(DB,row,target.recipientId,true,date))return denied('prescription_pharmacy_assignment_changed');
  }else if(!['prescription_accepted','prescription_cancelled','prescription_question'].includes(row.kind)||target.recipientId!==row.prescriber_id||!await currentProfessional(DB,row,target.recipientId,false,date))return denied('prescription_clinician_assignment_changed');
  return{eligible:true,reason:null};
 }catch{return{eligible:null,reason:'prescription_source_unavailable'}}
}

export async function prescriptionOutboxEligibility(DB,item,now=new Date()){
 try{
  const row=await first(DB,"SELECT event_id,recipient_user_id,recipient_kind,template FROM clinical_case_outbox WHERE id=? AND status='pending'",item.source_id);
  if(!row||row.recipient_kind!=='hq'||item.recipient_kind!=='hq_user'||row.recipient_user_id!==item.recipient_user_id)return denied('prescription_recipient_changed');
  const pharmacy=row.template==='dispensing_action_needed',expected=pharmacy?'pharmacy:'+row.event_id+':'+row.recipient_user_id:'prescription:'+row.event_id;
  if(item.source_id!==expected||(!pharmacy&&row.template!=='reviewer_case_update'))return denied('prescription_source_reference_changed');
  return prescriptionEventEligibility(DB,{eventId:row.event_id,recipientKind:item.recipient_kind,recipientId:item.recipient_user_id,pharmacy},now);
 }catch{return{eligible:null,reason:'prescription_source_unavailable'}}
}
