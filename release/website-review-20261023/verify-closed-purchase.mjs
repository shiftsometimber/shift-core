// Read-only regression evidence. This script has no activation or payment path.
import assert from 'node:assert/strict';
const origin='https://shiftsometimber.co.uk',rows=[];
for(const path of ['/start-here','/cart','/checkout']){
 const r=await fetch(origin+path,{redirect:'manual',headers:{'User-Agent':'SHIFT-approved-publication-verify/1.0'},signal:AbortSignal.timeout(20000)}),body=await r.text();
 if(path==='/start-here'){assert.equal(r.status,200);assert(body.includes('Ordering is currently unavailable. No payment can be taken here.'),'Closed purchase message must remain present');}
 else assert.equal(r.status,404,'Do not accidentally expose '+path);
 rows.push({path,status:r.status,closedMessage:path==='/start-here'?true:undefined});
}
console.log(JSON.stringify({at:new Date().toISOString(),pass:true,scope:'Public entry points only; not proof about every backend payment path',rows},null,2));
