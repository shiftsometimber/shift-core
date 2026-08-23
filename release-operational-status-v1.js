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

export function buildOperationalStatus(input={}){
  const nowMs=Number.isFinite(Date.parse(input.now||''))?Date.parse(input.now):Date.now();
  const maxAgeDays=Number.isFinite(input.maxEvidenceAgeDays)&&input.maxEvidenceAgeDays>0?input.maxEvidenceAgeDays:90;
  const proofStatus=Object.fromEntries(ENGINEERING_PROOFS.map(key=>[key,input.engineering?.[key]===VERIFIED?VERIFIED:BLOCKED]));
  const evidence=Object.fromEntries(EXTERNAL_EVIDENCE.map(key=>[key,normaliseRecord(input.external?.[key])]));
  const evidenceStatus=Object.fromEntries(EXTERNAL_EVIDENCE.map(key=>[key,isCurrentVerified(evidence[key],nowMs,maxAgeDays)?VERIFIED:BLOCKED]));
  const candidateReady=ENGINEERING_PROOFS.every(key=>proofStatus[key]===VERIFIED);
  const externalReady=EXTERNAL_EVIDENCE.every(key=>evidenceStatus[key]===VERIFIED);
  const approvals={
    commercial:input.approvals?.commercial===VERIFIED?VERIFIED:BLOCKED,
    clinical:input.approvals?.clinical===VERIFIED?VERIFIED:BLOCKED,
    production:input.approvals?.production===VERIFIED?VERIFIED:BLOCKED
  };
  const approvalsReady=Object.values(approvals).every(value=>value===VERIFIED);
  const explicitRelease=input.releaseAuthorization==='SHIFT_MEDICINE_SALE_ENABLE';
  const saleEnabled=candidateReady&&externalReady&&approvalsReady&&explicitRelease;
  return Object.freeze({
    model:'SHIFT_OPERATIONAL_STATUS_V1',
    generatedAt:new Date(nowMs).toISOString(),
    engineering:{status:candidateReady?VERIFIED:BLOCKED,proofs:proofStatus},
    external:{status:externalReady?VERIFIED:BLOCKED,evidence:evidenceStatus},
    approvals,
    release:{candidate:candidateReady?'ready':BLOCKED,commercial:externalReady&&approvalsReady?'ready':BLOCKED},
    medicinePurchase:{state:saleEnabled?'enabled':BLOCKED,reason:saleEnabled?'explicitly_authorised':'fail_closed'},
    productionDeploy:{state:candidateReady&&approvals.production===VERIFIED?'permitted':BLOCKED}
  });
}

export {ENGINEERING_PROOFS,EXTERNAL_EVIDENCE};
