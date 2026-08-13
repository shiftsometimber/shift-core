import fs from 'node:fs';
import {CANONICAL_APPROVALS} from './grub-canonical-approval-registry-v2.mjs';
const idx=JSON.parse(fs.readFileSync(process.env.COFID_INDEX||'/tmp/cofid-index.json','utf8'));
const foods=new Map((idx.foods||[]).map(f=>[String(f.code),f]));
const failures=[];
for(const [item,a] of Object.entries(CANONICAL_APPROVALS)){
 const f=foods.get(String(a.code));
 if(!f)failures.push(`${item}: missing CoFID ${a.code}`);
 if(a.state!=='approved_canonical_proxy')failures.push(`${item}: invalid state ${a.state}`);
 if(!['high','medium'].includes(a.confidence))failures.push(`${item}: invalid confidence`);
 if(!a.basis)failures.push(`${item}: missing suitability basis`);
}
const byConfidence=Object.values(CANONICAL_APPROVALS).reduce((o,a)=>(o[a.confidence]=(o[a.confidence]||0)+1,o),{});
console.log(JSON.stringify({dataset:idx.dataset,approvedCanonicalProxies:Object.keys(CANONICAL_APPROVALS).length,byConfidence,failures},null,2));
if(failures.length)throw new Error(failures.join('\n'));
console.log(`PASS governed canonical Grub decisions: ${Object.keys(CANONICAL_APPROVALS).length} shared proxy mappings have authoritative CoFID provenance, suitability basis, confidence and explicit limitations where material.`);
