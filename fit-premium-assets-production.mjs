import fs from 'node:fs';
const BASE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const OUT=process.env.FIT_PREMIUM_ASSET_EVIDENCE_DIR||'fit-premium-asset-evidence';fs.mkdirSync(OUT,{recursive:true});
const decisions=JSON.parse(fs.readFileSync('evidence/fit-v1-final-decisions-2026-08-14.json','utf8'));
const ledger=JSON.parse(fs.readFileSync('content/fit/premium-visual-production-v1.json','utf8'));
const accepted=new Set((decisions.decisions||[]).filter(x=>x.decision==='PASS').map(x=>String(x.movement_id)));
if(accepted.size!==26)throw new Error(`expected 26 accepted Fit movements, got ${accepted.size}`);
const candidates=new Map((ledger.produced_candidates||[]).map(x=>[String(x.canonical_movement),x]));
const rows=[];
for(const id of [...accepted].sort()){
  if(!candidates.has(id))throw new Error(`accepted Fit candidate missing: ${id}`);
  const path=`/assets/fit/premium/${id}.svg`,url=BASE+path,r=await fetch(url,{cache:'no-store'}),ct=String(r.headers.get('content-type')||'').toLowerCase(),authority=r.headers.get('x-shift-fit-visual-authority')||'';
  const text=await r.text();const ok=r.status===200&&ct.includes('image/svg+xml')&&text.startsWith('<svg')&&text.includes('START')&&text.includes('MOVE')&&text.includes('FINISH');
  rows.push({id,path,status:r.status,contentType:ct,authority,bytes:text.length,ok});if(!ok)throw new Error(`${id} premium asset not production-servable: ${r.status} ${ct} ${text.slice(0,80)}`);
}
const proof={proof:'FIT_V1_26_PREMIUM_ASSETS_PRODUCTION_HTTP_V1',status:'PASS',base:BASE,accepted:26,served:rows.length,allThreeStates:rows.every(x=>x.ok),rows};
fs.writeFileSync(`${OUT}/fit-v1-26-premium-assets-production.json`,JSON.stringify(proof,null,2));
console.log(JSON.stringify({proof:proof.proof,status:proof.status,served:proof.served},null,2));
console.log('PASS all 26 human-accepted Shift Fit premium START/MOVE/FINISH visuals are genuinely served over production HTTP at their published asset references.');
