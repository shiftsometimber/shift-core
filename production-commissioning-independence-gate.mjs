import fs from 'node:fs';
const yaml=fs.readFileSync('.github/workflows/production-commissioning.yml','utf8');
const independent=[
  'Wait for Worker deployment propagation',
  'Core production health and route contract',
  'G1-010 / M05 deployed release security and privacy',
  'Trigger genuine production regulator scan',
  'M03 production Radar freshness',
  'Authenticated isolation and retained state in production',
  'Longitudinal Grub/Fit learning in production',
  'Final B03 Progress Picture and Shift AI production closure',
  'M07 structured Grub/Fit production serving',
  'Refresh short-lived Shift commissioning identity for Fit duration',
  'G2-006 Fit duration/session quality production matrix',
  'Refresh short-lived Shift commissioning identity for Dave',
  'G1-012 fresh unattended synthetic Dave release gate',
  'G5-012 aggregate natural production auth p95'
];
const fail=[];
for(const name of independent){const marker=`- name: ${name}`,i=yaml.indexOf(marker);if(i<0){fail.push(`${name}:missing`);continue}const next=yaml.slice(i,i+220);if(!next.includes('if: always()'))fail.push(`${name}:not independent`)}
if(fail.length){console.error(JSON.stringify({proof:'PRODUCTION_COMMISSIONING_INDEPENDENCE',status:'FAIL',fail},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'PRODUCTION_COMMISSIONING_INDEPENDENCE',status:'PASS',lanes:independent.length,boundary:'A failed external or product lane remains RED but does not cancel unrelated production commissioning evidence.'},null,2));
