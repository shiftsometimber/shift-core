import fs from 'node:fs';
const src=fs.readFileSync('m04-product-analytics-production.mjs','utf8');
const must=[
  "analytics-route-readiness",
  "analytics-route-readiness-timeout",
  "attempt<150",
  "await sleep(2000)",
  "readiness.r.status===200||readiness.r.status===503",
  "readiness.r.status!==404&&readiness.r.status!==502"
];
for(const token of must)if(!src.includes(token))throw new Error(`M04 route readiness contract missing: ${token}`);
if(src.includes('await new Promise(r=>setTimeout(r,1000))'))throw new Error('Use the bounded shared sleep helper in M04 production proof');
console.log('PASS M04 route readiness regression gate: production proof waits for the deployed restricted evidence route instead of assuming a fixed propagation delay.');