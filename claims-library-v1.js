const CHANNELS=new Set(['public_service','treatment_pathway','factual_product','checkout','member_support','transactional']);
const STATES=new Set(['draft','review','approved','withdrawn','expired']);

export async function ensureClaimsLibrarySchema(env){
  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS claims_library (
      id INTEGER PRIMARY KEY AUTOINCREMENT, claim_key TEXT NOT NULL, version INTEGER NOT NULL,
      exact_wording TEXT NOT NULL, qualification TEXT, evidence_source TEXT NOT NULL,
      permitted_channel TEXT NOT NULL, permitted_destination TEXT NOT NULL,
      clinical_approval TEXT, regulatory_approval TEXT, owner TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'draft', effective_at TEXT, review_at TEXT NOT NULL, expires_at TEXT,
      withdrawn_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(claim_key,version), CHECK(state IN ('draft','review','approved','withdrawn','expired')),
      CHECK(permitted_channel IN ('public_service','treatment_pathway','factual_product','checkout','member_support','transactional')))`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS claims_render_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT, claim_id INTEGER NOT NULL, channel TEXT NOT NULL,
      destination TEXT NOT NULL, correlation_id TEXT NOT NULL, rendered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(claim_id) REFERENCES claims_library(id))`),
    env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_claims_lookup ON claims_library(claim_key,permitted_channel,state,review_at)')
  ]);
}

export function claimIsRenderable(claim,{channel,destination,at=new Date()}={}){
  if(!claim||!CHANNELS.has(channel)||claim.permitted_channel!==channel)return false;
  if(claim.state!=='approved'||!STATES.has(claim.state))return false;
  if(claim.permitted_destination!==destination)return false;
  const when=at instanceof Date?at:new Date(at);if(Number.isNaN(when.getTime()))return false;
  if(claim.effective_at&&new Date(claim.effective_at)>when)return false;
  if(claim.review_at&&new Date(claim.review_at)<when)return false;
  if(claim.expires_at&&new Date(claim.expires_at)<=when)return false;
  return !claim.withdrawn_at;
}

export async function resolveApprovedClaim(env,{claimKey,channel,destination,correlationId}){
  if(!claimKey||!CHANNELS.has(channel)||!destination||!correlationId)throw new TypeError('invalid_claim_request');
  await ensureClaimsLibrarySchema(env);
  const rows=await env.DB.prepare(`SELECT * FROM claims_library WHERE claim_key=? AND permitted_channel=? AND permitted_destination=? AND state='approved' ORDER BY version DESC LIMIT 5`).bind(claimKey,channel,destination).all();
  const claim=(rows.results||[]).find(row=>claimIsRenderable(row,{channel,destination}));if(!claim)return null;
  await env.DB.prepare(`INSERT INTO claims_render_audit(claim_id,channel,destination,correlation_id) VALUES(?,?,?,?)`).bind(claim.id,channel,destination,String(correlationId).slice(0,120)).run();
  return {id:claim.id,key:claim.claim_key,version:claim.version,wording:claim.exact_wording,qualification:claim.qualification};
}

export const claimsChannels=Object.freeze([...CHANNELS]);
