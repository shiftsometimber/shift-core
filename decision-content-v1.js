import {resolveApprovedClaim} from './claims-library-v1.js';

const CHANNELS=new Set(['public_service','treatment_pathway','member_support']);
const NEXT_ACTIONS=new Set(['education','route_finder','member_support','urgent_help']);
const SHA256=/^[a-f0-9]{64}$/;
const safe=(v,d=null)=>{try{return typeof v==='string'?JSON.parse(v):v??d}catch{return d}};
const iso=value=>{const date=value instanceof Date?value:new Date(value);return Number.isNaN(date.getTime())?null:date.toISOString()};

export async function ensureDecisionContentSchema(env){
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS decision_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT, decision_key TEXT NOT NULL, version INTEGER NOT NULL,
      title TEXT NOT NULL, channel TEXT NOT NULL, destination TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft',
      content_json TEXT NOT NULL, evidence_json TEXT NOT NULL, review_json TEXT NOT NULL, provenance_json TEXT,
      effective_at TEXT, review_due_at TEXT NOT NULL, expires_at TEXT, withdrawn_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(decision_key,version), CHECK(status IN ('draft','review','approved','withdrawn','expired')))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS decision_outcome_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT, decision_content_id INTEGER NOT NULL, outcome_key TEXT NOT NULL,
      channel TEXT NOT NULL, destination TEXT NOT NULL, correlation_id TEXT NOT NULL,
      rendered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(decision_content_id) REFERENCES decision_content(id))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS decision_outcome_proof (
      id INTEGER PRIMARY KEY AUTOINCREMENT, decision_content_id INTEGER NOT NULL,
      decision_version INTEGER NOT NULL, outcome_key TEXT NOT NULL, correlation_id TEXT NOT NULL,
      evidence_fingerprint TEXT NOT NULL, claim_versions_json TEXT NOT NULL,
      rendered_snapshot_json TEXT NOT NULL, rendered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(decision_content_id) REFERENCES decision_content(id))`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_decision_content_lookup ON decision_content(decision_key,channel,destination,status,review_due_at)')
  ]);
}

export function validateDecisionContent(record,{at=new Date()}={}){
  const errors=[];
  const content=safe(record?.content_json??record?.content,{});
  const evidence=safe(record?.evidence_json??record?.evidence,[]);
  const review=safe(record?.review_json??record?.review,{});
  const provenance=safe(record?.provenance_json??record?.provenance??review?.provenance,{});
  const when=iso(at),reviewDue=iso(record?.review_due_at),effective=record?.effective_at?iso(record.effective_at):null,expires=record?.expires_at?iso(record.expires_at):null;
  if(!record?.decision_key)errors.push('decision_key_required');
  if(!Number.isInteger(record?.version)||record.version<1)errors.push('valid_version_required');
  if(!CHANNELS.has(record?.channel))errors.push('channel_not_permitted');
  if(!record?.destination)errors.push('destination_required');
  if(record?.status!=='approved')errors.push('approval_required');
  if(review?.status!=='approved'||!review?.reviewed_by||!iso(review?.reviewed_at))errors.push('governance_review_required');
  if(review?.reviewed_by&&provenance?.authored_by&&review.reviewed_by===provenance.authored_by)errors.push('independent_review_required');
  if(review?.content_version!==record?.version)errors.push('review_version_mismatch');
  if(!provenance?.source_system||!provenance?.authored_by||!provenance?.change_reason||provenance?.schema_version!==1)errors.push('provenance_required');
  if(!Array.isArray(evidence)||!evidence.length||evidence.some(x=>
    !x?.evidence_id||!Number.isInteger(x?.version)||x.version<1||x?.state!=='verified'||!x?.source||
    !iso(x?.verified_at)||iso(x.verified_at)>when||!iso(x?.expires_at)||iso(x.expires_at)<=when||
    !x?.owner||!SHA256.test(String(x?.digest||''))
  ))errors.push('verified_evidence_required');
  const evidenceRefs=Array.isArray(review?.evidence_refs)?review.evidence_refs:[];
  const evidenceKeys=evidence.map(x=>`${x.evidence_id}@${x.version}:${x.digest}`).sort();
  if(evidenceRefs.length!==evidenceKeys.length||evidenceRefs.slice().sort().some((x,i)=>x!==evidenceKeys[i]))errors.push('review_evidence_mismatch');
  if(!when||!reviewDue||reviewDue<when)errors.push('review_stale');
  if(effective&&effective>when)errors.push('not_effective');
  if(expires&&expires<=when)errors.push('expired');
  if(record?.withdrawn_at)errors.push('withdrawn');
  if(!Array.isArray(content?.questions)||!content.questions.length)errors.push('questions_required');
  const outcomes=content?.outcomes;
  if(!Array.isArray(outcomes)||!outcomes.length)errors.push('outcomes_required');
  else{
    if(outcomes.filter(x=>x?.default===true).length!==1)errors.push('single_default_outcome_required');
    const keys=new Set();
    for(const outcome of outcomes){
      if(!outcome?.key||keys.has(outcome.key))errors.push('unique_outcome_key_required');else keys.add(outcome.key);
      if(!outcome?.title||!outcome?.summary)errors.push('outcome_copy_required');
      if(!NEXT_ACTIONS.has(outcome?.next_action?.type))errors.push('safe_next_action_required');
      if(typeof outcome?.next_action?.href!=='string'||!/^\/(?!\/)/.test(outcome.next_action.href))errors.push('safe_destination_required');
      if(['purchase','checkout','order','prescribe'].includes(String(outcome?.next_action?.type)))errors.push('commercial_action_forbidden');
      if(!Array.isArray(outcome?.claim_keys))errors.push('claim_keys_required');
    }
  }
  return{ok:errors.length===0,errors:[...new Set(errors)],content,evidence,review,provenance,evidenceFingerprint:evidenceKeys.join('|')};
}

function conditionMatches(condition,answers){
  const actual=answers?.[condition?.field];
  if(condition?.operator==='equals')return actual===condition.value;
  if(condition?.operator==='in')return Array.isArray(condition.values)&&condition.values.includes(actual);
  if(condition?.operator==='truthy')return Boolean(actual);
  return false;
}

export function selectDecisionOutcome(content,answers={}){
  const outcomes=content?.outcomes||[];
  return outcomes.find(x=>!x.default&&Array.isArray(x.when)&&x.when.length&&x.when.every(c=>conditionMatches(c,answers)))||outcomes.find(x=>x.default===true)||null;
}

export async function resolveGovernedDecisionOutcome(env,{decisionKey,channel,destination,answers={},correlationId,at=new Date(),claimResolver=resolveApprovedClaim}={}){
  if(!decisionKey||!CHANNELS.has(channel)||!destination||!correlationId)return null;
  await ensureDecisionContentSchema(env);
  const {results=[]}=await env.DB.prepare(`SELECT * FROM decision_content WHERE decision_key=? AND channel=? AND destination=? AND status='approved' ORDER BY version DESC LIMIT 1`).bind(decisionKey,channel,destination).all();
  const candidate=results[0];if(!candidate)return null;
  const checked=validateDecisionContent(candidate,{at});if(!checked.ok)return null;
  const outcome=selectDecisionOutcome(checked.content,answers);if(!outcome)return null;
  const claims=[];
  for(const claimKey of outcome.claim_keys){
    const claim=await claimResolver(env,{claimKey,channel,destination,correlationId});
    if(!claim||claim.key!==claimKey||!Number.isInteger(claim.version)||claim.version<1)return null;
    claims.push(claim);
  }
  const safeCorrelation=String(correlationId).slice(0,120);
  const claimVersions=claims.map(x=>({key:x.key,version:x.version}));
  const snapshot={decisionKey:candidate.decision_key,decisionVersion:candidate.version,outcomeKey:outcome.key,channel,destination,nextAction:{type:outcome.next_action.type,href:outcome.next_action.href}};
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO decision_outcome_audit(decision_content_id,outcome_key,channel,destination,correlation_id) VALUES(?,?,?,?,?)`).bind(candidate.id,outcome.key,channel,destination,safeCorrelation),
    env.DB.prepare(`INSERT INTO decision_outcome_proof(decision_content_id,decision_version,outcome_key,correlation_id,evidence_fingerprint,claim_versions_json,rendered_snapshot_json) VALUES(?,?,?,?,?,?,?)`).bind(candidate.id,candidate.version,outcome.key,safeCorrelation,checked.evidenceFingerprint,JSON.stringify(claimVersions),JSON.stringify(snapshot))
  ]);
  return{decision:{key:candidate.decision_key,version:candidate.version,title:candidate.title},outcome:{key:outcome.key,title:outcome.title,summary:outcome.summary,nextAction:outcome.next_action,claims},governance:{reviewDueAt:candidate.review_due_at,evidenceCount:checked.evidence.length,evidenceFingerprint:checked.evidenceFingerprint,provenance:checked.provenance}};
}

export const decisionContentChannels=Object.freeze([...CHANNELS]);
