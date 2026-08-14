import fs from 'node:fs';
const src=fs.readFileSync('member-product-v8.js','utf8');
const failures=[];const need=(ok,msg)=>{if(!ok)failures.push(msg)};
need(src.includes("const analyticsAuth=await authenticate(request,env,ctx);"),'authenticated request context not captured before plan generation');
need(src.includes("'grub_plan_generated','grub'"),'Grub plan event missing');
need(src.includes("'fit_plan_generated','fit'"),'Fit plan event missing');
need(src.includes("recording:'authenticated_request'"),'plan event is not explicitly tied to authenticated request');
need(src.includes("occurred_at>=datetime('now','-2 minutes')"),'idempotent recent-event guard missing');
need(src.includes('if(recent?.id)return'),'duplicate suppression missing');
need(src.includes('await recordProductEvent(env'),'plan event write is not deterministic/awaited');
need(!src.includes('console.warn(`analytics_${surface}_plan_failed`'),'old swallowed plan analytics failure remains');
if(failures.length){console.error(JSON.stringify({proof:'M04_PLAN_ANALYTICS_DETERMINISM_V1',status:'FAIL',failures},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'M04_PLAN_ANALYTICS_DETERMINISM_V1',status:'PASS',events:['grub_plan_generated','fit_plan_generated'],idempotence:'2-minute same-member same-event guard',failureMode:'fail-visible'},null,2));
