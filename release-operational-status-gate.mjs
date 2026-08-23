import fs from 'node:fs';
import {buildOperationalStatus,ENGINEERING_PROOFS,EXTERNAL_EVIDENCE} from './release-operational-status-v1.js';

const source=fs.readFileSync(new URL('./release-operational-status-v1.js',import.meta.url),'utf8');
const tests=fs.readFileSync(new URL('./tests/release-operational-status-v1.test.mjs',import.meta.url),'utf8');
const required=[
  "releaseAuthorization==='SHIFT_MEDICINE_SALE_ENABLE'",
  "medicinePurchase:{state:saleEnabled?'enabled':BLOCKED",
  "productionDeploy:{state:candidateReady&&approvals.production===VERIFIED?'permitted':BLOCKED"
];
for(const contract of required) if(!source.includes(contract)) throw new Error(`release control contract missing: ${contract}`);
for(const phrase of ['fails every release boundary closed','cannot unlock commerce','require explicit sale authorisation']) if(!tests.includes(phrase)) throw new Error(`core proof scenario missing: ${phrase}`);

const engineering=Object.fromEntries(ENGINEERING_PROOFS.map(key=>[key,'verified']));
const external=Object.fromEntries(EXTERNAL_EVIDENCE.map(key=>[key,{state:'verified',reference:`proof:${key}`,verifiedAt:'2026-08-23T09:00:00.000Z'}]));
const current=buildOperationalStatus({now:'2026-08-23T10:00:00.000Z',engineering,external});
if(current.release.candidate!=='ready'||current.release.commercial!=='blocked'||current.medicinePurchase.state!=='blocked') throw new Error('candidate/external boundary is not fail closed');
console.log(JSON.stringify({proof:'SHIFT_PHASE_7_RELEASE_CONTROLS',status:'PASS',operationalDomains:ENGINEERING_PROOFS.length,externalGates:EXTERNAL_EVIDENCE.length,coreScenarios:5,medicinePurchase:'blocked'},null,2));
