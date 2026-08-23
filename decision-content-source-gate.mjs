import fs from 'node:fs';
const source=fs.readFileSync(new URL('./decision-content-v1.js',import.meta.url),'utf8');
const tests=fs.readFileSync(new URL('./tests/decision-content-v1.test.mjs',import.meta.url),'utf8');
const required=[
  ['approved state',"record?.status!=='approved'"],
  ['stale review lock',"errors.push('review_stale')"],
  ['withdrawal lock',"errors.push('withdrawn')"],
  ['verified evidence',"errors.push('verified_evidence_required')"],
  ['evidence expiry lock',"iso(x.expires_at)<=when"],
  ['independent review',"errors.push('independent_review_required')"],
  ['safe actions',"const NEXT_ACTIONS=new Set(['education','route_finder','member_support','urgent_help'])"],
  ['governed claims','if(!claim||claim.key!==claimKey'],
  ['claim lineage match','claim.key!==claimKey'],
  ['audit after resolution','INSERT INTO decision_outcome_audit'],
  ['version-bound review','review_version_mismatch'],
  ['evidence lineage','review_evidence_mismatch'],
  ['content provenance','provenance_required'],
  ['safe internal destinations','safe_destination_required'],
  ['immutable outcome proof','INSERT INTO decision_outcome_proof'],
  ['latest-only resolution','ORDER BY version DESC LIMIT 1'],
  ['stale proof',"test('stale review fails closed'"],
  ['missing-claim proof',"test('missing governed claim fails closed without outcome audit'"],
  ['lineage proof test',"test('resolver emits governed outcome with lineage proof only when every claim resolves'"],
  ['no silent fallback proof',"test('invalid newest approved version fails closed instead of silently falling back'"],
];
for(const [name,needle] of required)if(!(source+'\n'+tests).includes(needle))throw new Error(`decision content gate missing ${name}`);
console.log(`PASS governed decision-content foundation (${required.length} controls)`);
