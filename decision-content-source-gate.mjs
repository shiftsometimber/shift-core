import fs from 'node:fs';
const source=fs.readFileSync(new URL('./decision-content-v1.js',import.meta.url),'utf8');
const tests=fs.readFileSync(new URL('./tests/decision-content-v1.test.mjs',import.meta.url),'utf8');
const required=[
  ['approved state',"record?.status!=='approved'"],
  ['stale review lock',"errors.push('review_stale')"],
  ['withdrawal lock',"errors.push('withdrawn')"],
  ['verified evidence',"errors.push('verified_evidence_required')"],
  ['safe actions',"const NEXT_ACTIONS=new Set(['education','route_finder','member_support','urgent_help'])"],
  ['governed claims','if(!claim)return null'],
  ['audit after resolution','INSERT INTO decision_outcome_audit'],
  ['stale proof',"test('stale review fails closed'"],
  ['missing-claim proof',"test('missing governed claim fails closed without outcome audit'"],
];
for(const [name,needle] of required)if(!(source+'\n'+tests).includes(needle))throw new Error(`decision content gate missing ${name}`);
console.log(`PASS governed decision-content foundation (${required.length} controls)`);
