const ENGINEERING_PROOFS=Object.freeze([
  'catalogue_foundations','hq_catalogue_management','route_catalogue_connection',
  'governed_product_journey','decision_content_foundations','my_timber_depth',
  'release_scenarios'
]);

const EXTERNAL_EVIDENCE=Object.freeze([
  'supplier','cost','stock','partner','clinical','claims'
]);

const VERIFIED='verified';
const BLOCKED='blocked';
const COMMIT_SHA=/^[a-f0-9]{40}$/;
const SHA256=/^[a-f0-9]{64}$/;
const allowedEvidenceStates=new Set(['tbc','in_review',VERIFIED,'rejected','expired']);

function normaliseRecord(value){
  if(!value||typeof value!=='object') return {state:'tbc',reference:null,verifiedAt:null};
  return {
    state:allowedEvidenceStates.has(value.state)?value.state:'tbc',
    reference:typeof value.reference==='string'&&value.reference.trim()?value.reference.trim():null,
    verifiedAt:typeof value.verifiedAt==='string'&&Number.isFinite(Date.parse(value.verifiedAt))?value.verifiedAt:null
  };
}

function isCurrentVerified(record,nowMs,maxAgeDays){
  if(record.state!==VERIFIED||!record.reference||!record.verifiedAt) return false;
  const age=nowMs-Date.parse(record.verifiedAt);
  return age>=0&&age<=maxAgeDays*86400000;
}

function normaliseApproval(value){
  if(!value||typeof value!=='object') return {state:BLOCKED,actor:null,approvedAt:null,targetCommit:null,candidateDigest:null};
  return {
    state:value.state===VERIFIED?VERIFIED:BLOCKED,
    actor:typeof value.actor==='string'&&value.actor.trim()?value.actor.trim():null,
    approvedAt:typeof value.approvedAt==='string'&&Number.isFinite(Date.parse(value.approvedAt))?value.approvedAt:null,
    targetCommit:typeof value.targetCommit==='string'&&COMMIT_SHA.test(value.targetCommit)?value.targetCommit:null,
    candidateDigest:typeof value.candidateDigest==='string'&&SHA256.test(value.candidateDigest)?value.candidateDigest:null
  };
}

function validateCandidateEvidence(value,targetCommit,nowMs,maxAgeDays){
  const manifest=value&&typeof value==='object'?value:{};
  const digest=typeof manifest.digest==='string'&&SHA256.test(manifest.digest)?manifest.digest:null;
  const generatedAt=typeof manifest.generatedAt==='string'&&Number.isFinite(Date.parse(manifest.generatedAt))?manifest.generatedAt:null;
  const age=generatedAt?nowMs-Date.parse(generatedAt):Number.POSITIVE_INFINITY;
  const rows=Array.isArray(manifest.proofs)?manifest.proofs:[];
  const keys=rows.map(row=>row?.key);
  const exactProofSet=rows.length===ENGINEERING_PROOFS.length&&new Set(keys).size===ENGINEERING_PROOFS.length&&ENGINEERING_PROOFS.every(key=>keys.includes(key));
  const proofsBound=exactProofSet&&rows.every(row=>
    row?.state===VERIFIED&&row?.commit===targetCommit&&
    typeof row?.artifactReference==='string'&&Boolean(row.artifactReference.trim())&&
    typeof row?.artifactDigest==='string'&&SHA256.test(row.artifactDigest)
  );
  const ready=Boolean(targetCommit&&manifest.targetCommit===targetCommit&&digest&&age>=0&&age<=maxAgeDays*86400000&&proofsBound);
  return {state:ready?VERIFIED:BLOCKED,digest:ready?digest:null,proofs:ready?Object.freeze([...keys].sort()):Object.freeze([])};
}

function buildReleaseControl(input,nowMs,maxAgeDays){
  const targetCommit=typeof input.targetCommit==='string'&&COMMIT_SHA.test(input.targetCommit)?input.targetCommit:null;
  const evidenceCommit=typeof input.evidenceCommit==='string'&&COMMIT_SHA.test(input.evidenceCommit)?input.evidenceCommit:null;
  const commitBound=Boolean(targetCommit&&evidenceCommit&&targetCommit===evidenceCommit);
  const candidateEvidence=validateCandidateEvidence(input.candidateEvidence,targetCommit,nowMs,maxAgeDays);
  const rollback=input.rollback&&typeof input.rollback==='object'?input.rollback:{};
  const rollbackVerifiedAt=typeof rollback.verifiedAt==='string'&&Number.isFinite(Date.parse(rollback.verifiedAt))?rollback.verifiedAt:null;
  const rollbackAge=rollbackVerifiedAt?nowMs-Date.parse(rollbackVerifiedAt):Number.POSITIVE_INFINITY;
  const rollbackReady=Boolean(
    targetCommit&&rollback.commit===targetCommit&&
    typeof rollback.reference==='string'&&rollback.reference.trim()&&
    rollbackAge>=0&&rollbackAge<=maxAgeDays*86400000
  );
  return {
    targetCommit,
    evidenceCommit,
    commitBinding:commitBound?VERIFIED:BLOCKED,
    rollback:{state:rollbackReady?VERIFIED:BLOCKED,reference:rollbackReady?rollback.reference.trim():null},
    candidateEvidence,
    ready:commitBound&&rollbackReady&&candidateEvidence.state===VERIFIED
  };
}

export function buildOperationalStatus(input={}){
  const nowMs=Number.isFinite(Date.parse(input.now||''))?Date.parse(input.now):Date.now();
  const maxAgeDays=Number.isFinite(input.maxEvidenceAgeDays)&&input.maxEvidenceAgeDays>0?input.maxEvidenceAgeDays:90;
  const proofStatus=Object.fromEntries(ENGINEERING_PROOFS.map(key=>[key,input.engineering?.[key]===VERIFIED?VERIFIED:BLOCKED]));
  const evidence=Object.fromEntries(EXTERNAL_EVIDENCE.map(key=>[key,normaliseRecord(input.external?.[key])]));
  const evidenceStatus=Object.fromEntries(EXTERNAL_EVIDENCE.map(key=>[key,isCurrentVerified(evidence[key],nowMs,maxAgeDays)?VERIFIED:BLOCKED]));
  const candidateReady=ENGINEERING_PROOFS.every(key=>proofStatus[key]===VERIFIED);
  const externalReady=EXTERNAL_EVIDENCE.every(key=>evidenceStatus[key]===VERIFIED);
  const releaseControl=buildReleaseControl(input.releaseControl||{},nowMs,maxAgeDays);
  const approvalRecords=Object.fromEntries(['commercial','clinical','production'].map(key=>[key,normaliseApproval(input.approvals?.[key])]));
  const approvalActors=Object.values(approvalRecords).map(record=>record.actor).filter(Boolean);
  const approvalsSeparated=approvalActors.length===3&&new Set(approvalActors).size===3;
  const approvals=Object.fromEntries(Object.entries(approvalRecords).map(([key,record])=>[key,
    record.state===VERIFIED&&record.actor&&record.approvedAt&&
    releaseControl.candidateEvidence.state===VERIFIED&&Boolean(releaseControl.targetCommit)&&
    record.targetCommit===releaseControl.targetCommit&&record.candidateDigest===releaseControl.candidateEvidence.digest?VERIFIED:BLOCKED
  ]));
  const approvalsReady=Object.values(approvals).every(value=>value===VERIFIED)&&approvalsSeparated;
  const explicitProductionRelease=input.productionAuthorization==='SHIFT_PRODUCTION_DEPLOY_ENABLE';
  const explicitRelease=input.releaseAuthorization==='SHIFT_MEDICINE_SALE_ENABLE';
  const productionReady=candidateReady&&approvalsReady&&releaseControl.ready&&explicitProductionRelease;
  const saleEnabled=productionReady&&externalReady&&explicitRelease;
  return Object.freeze({
    model:'SHIFT_OPERATIONAL_STATUS_V1',
    generatedAt:new Date(nowMs).toISOString(),
    engineering:{status:candidateReady?VERIFIED:BLOCKED,proofs:proofStatus},
    external:{status:externalReady?VERIFIED:BLOCKED,evidence:evidenceStatus},
    approvals:{...approvals,separation:approvalsSeparated?VERIFIED:BLOCKED},
    releaseControl:{commitBinding:releaseControl.commitBinding,candidateEvidence:releaseControl.candidateEvidence,rollback:releaseControl.rollback},
    release:{candidate:candidateReady?'ready':BLOCKED,commercial:externalReady&&approvalsReady?'ready':BLOCKED},
    medicinePurchase:{state:saleEnabled?'enabled':BLOCKED,reason:saleEnabled?'explicitly_authorised':'fail_closed'},
    productionDeploy:{state:productionReady?'permitted':BLOCKED}
  });
}

export {ENGINEERING_PROOFS,EXTERNAL_EVIDENCE};
