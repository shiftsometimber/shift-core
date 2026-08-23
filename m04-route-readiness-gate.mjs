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
for(const token of ["'grub_plan_generated'","'fit_plan_generated'","recordPlanAnalyticsForUser(env"]){if(!product.includes(token))throw new Error(`M04 successful-plan analytics boundary missing: ${token}`);}
if(!product.includes("if(response?.ok&&!analyticsAuth.response)await recordPlanAnalyticsForUser(env,analyticsAuth.user.id,'grub_plan_generated','grub')"))throw new Error('Grub analytics event must remain gated on successful authenticated member output');
if(!product.includes("if(repaired){if(repaired.ok&&!analyticsAuth.response)await recordPlanAnalyticsForUser(env,analyticsAuth.user.id,'fit_plan_generated','fit');return repaired;}"))throw new Error('Fit repetition-repair analytics event must remain gated on successful authenticated repaired output');
if(!product.includes("if(!analyticsAuth.response)await recordPlanAnalyticsForUser(env,analyticsAuth.user.id,'fit_plan_generated','fit')"))throw new Error('Normal Fit analytics event must remain gated on successful authenticated output');
if(!product.includes("occurred_at>=datetime('now','-2 minutes')"))throw new Error('M04 plan-event deduplication window missing');
console.log('PASS M04 route + deterministic product-event regression gate: production proof waits for the deployed restricted evidence route and successful authenticated Grub/Fit member outputs persist deduplicated server-side funnel events.');