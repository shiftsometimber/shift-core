import {fail} from './domain.mjs';
export function evidencePurgePlan(s,date){
 return s.evidence.filter(e=>!e.purgedAt&&e.retentionUntil<=date).map(e=>({evidenceId:e.id,kind:e.kind,retentionUntil:e.retentionUntil,held:!!e.legalHold,pending:!!e.deletionPendingAt,eligible:!e.legalHold}));
}
// No timer, external endpoint or autonomous deletion. Caller supplies an authenticated, transactional audit committer.
// Retention must be explicitly commissioned; legal hold can only be released by a separate audited owner action.
export async function purgeStaffEvidence(env,original,evidenceId,actor,commit,{date=new Date().toISOString(),id=crypto.randomUUID(),dryRun=true}={}){
 const plan=evidencePurgePlan(original,date),item=plan.find(e=>e.evidenceId===evidenceId);
 if(dryRun)return{dryRun:true,plan};
 if(!actor?.mfa||!['owner','admin'].includes(actor.role))fail(403,'owner_approval_required');
 if(env.PARTNER_EVIDENCE_PURGE_ENABLED!=='true'||typeof env.PARTNER_RETENTION_POLICY_REFERENCE!=='string'||!env.PARTNER_RETENTION_POLICY_REFERENCE.trim()||!env.PARTNER_PRIVATE_FILES)fail(503,'retention_policy_not_commissioned');
 if(!item)fail(422,'expired_evidence_required');if(item.held)fail(409,'evidence_on_legal_hold');
 let s=structuredClone(original),e=s.evidence.find(e=>e.id===evidenceId);if(!e.objectKey||!e.objectKey.startsWith('staff/'+s.id+'/'))fail(422,'verified_private_evidence_key_required');
 if(!e.deletionPendingAt){
  e.deletionPendingAt=date;s.version++;s.updatedAt=date;
  s=await commit(original,{state:s,event:{id,action:'staff_evidence_purge_requested',actorId:String(actor.id),at:date,details:{evidenceId,policyReference:env.PARTNER_RETENTION_POLICY_REFERENCE}}});
 }
 // Pending deletions reject new holds. Storage failure leaves a durable request for explicit retry, not a false success.
 try{await env.PARTNER_PRIVATE_FILES.delete(e.objectKey);}catch{fail(503,'private_evidence_deletion_pending');}
 const next=structuredClone(s),entry=next.evidence.find(e=>e.id===evidenceId);delete entry.objectKey;delete entry.deletionPendingAt;entry.purgedAt=date;
 next.version++;next.updatedAt=date;
 const saved=await commit(s,{state:next,event:{id:crypto.randomUUID(),action:'staff_evidence_purged',actorId:String(actor.id),at:date,details:{evidenceId,policyReference:env.PARTNER_RETENTION_POLICY_REFERENCE}}});
 return{dryRun:false,state:saved,evidenceId,purged:true};
}
