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
const product=fs.readFileSync('member-product-v8.js','utf8');
for(const token of ["'grub_plan_generated'","'fit_plan_generated'","recordPlanAnalytics(request,env,ctx"]){if(!product.includes(token))throw new Error(`M04 successful-plan analytics boundary missing: ${token}`);}
if(!product.includes("if(response?.ok)await recordPlanAnalytics(request,env,ctx,'grub_plan_generated','grub')"))throw new Error('Grub analytics event must remain gated on successful member output');
if(!product.includes("if(repaired.ok)await recordPlanAnalytics(request,env,ctx,'fit_plan_generated','fit')"))throw new Error('Fit repetition-repair analytics event must remain gated on successful repaired member output');
console.log('PASS M04 route + product-event regression gate: production proof waits for the deployed restricted evidence route and successful Grub/Fit member outputs persist their server-side funnel events.');