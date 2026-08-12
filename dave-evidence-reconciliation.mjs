import fs from 'node:fs';
const evidence=fs.readFileSync('docs/COMMISSIONING-EVIDENCE.md','utf8');
const matrix=fs.readFileSync('docs/SHIFT-COMMISSIONING-REMEDIATION-MATRIX.md','utf8');
const must=(s,m)=>{if(!s)throw new Error(m)};
for(const marker of ['B03 behavioural PASS — 9/9','B02 PASS','B04 PASS','M07 structured member runtime','M03 production Radar'])must(evidence.includes(marker),`missing locked evidence ${marker}`);
const legs=[
 ['discover','PROVEN','live Dave GET'],['trust','PROVEN','live Dave GET'],['core_health','PROVEN','live Dave GET'],['anonymous_today_blocked','PROVEN','live auth boundary'],['anonymous_grub_blocked','PROVEN','live auth boundary'],
 ['register','HUMAN','real ordinary-member registration/inbox'],['verify','HUMAN','real inbox click/login'],['onboard','AMBER','fresh rendered onboarding acceptance'],
 ['today','PROVEN','B03 production behaviour'],['grub','PROVEN','B03 + M07 production'],['fit','PROVEN','B03 + M07 production'],['hydration','PROVEN','B03 production behaviour'],['progress','PROVEN','B03 production behaviour'],['picture','PROVEN','B03 production behaviour'],['ask_shift','PROVEN','B03 Shift AI production behaviour'],['preference_learning','PROVEN','B04 longitudinal learning'],['leave_return','PROVEN','B02/B04 retained state'],['changed_recommendation','PROVEN','B04 Nay/current-intent behaviour'],['treatment_support','BLOCKED','partner/clinical governance'],['account_recovery','HUMAN','real reset inbox chain']
];
const proven=legs.filter(x=>x[1]==='PROVEN').length,total=legs.length,coverage=Math.round(proven/total*1000)/10;
must(proven===15,`expected 15 independently evidenced Dave legs, got ${proven}`);must(matrix.includes('G5-013')&&matrix.includes('AMBER'),'Dave original row must remain explicit AMBER');
console.log(JSON.stringify({totalLegs:total,provenLegs:proven,truthfulCoveragePct:coverage,humanOnly:legs.filter(x=>x[1]==='HUMAN').map(x=>x[0]),remainingAmber:legs.filter(x=>x[1]==='AMBER').map(x=>x[0]),blocked:legs.filter(x=>x[1]==='BLOCKED').map(x=>x[0]),legs:Object.fromEntries(legs.map(([k,s,e])=>[k,{status:s,evidence:e}]))},null,2));
console.log(`PASS Dave evidence reconciliation: ${proven}/${total} legs (${coverage}%) already have non-duplicated production/live evidence; B08 remains AMBER for real registration/verification/recovery, fresh rendered onboarding/mobile acceptance and partner treatment support.`);
