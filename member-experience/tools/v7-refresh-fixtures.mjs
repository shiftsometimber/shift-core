// Refresh only already-owned synthetic fixtures through the real action route.
import fs from 'node:fs';import {chromium} from '/Users/shiftsometimberltd/SST/tools/apple-review-smoke/node_modules/playwright/index.mjs';
const origin='https://shift-programme-my-timber-v7-test.matobrien.workers.dev',cases=JSON.parse(fs.readFileSync('/private/tmp/my-timber-v7-test-access.json')).cases,b=await chromium.launch({headless:true});
for(const [name,a]of Object.entries(cases)){
 const c=await b.newContext();await c.addCookies([{name:'sst_session',value:a.token,url:origin,httpOnly:true,secure:true}]);const p=await c.newPage(),boot=await(await p.request.get(origin+'/v1/my-timber/boot')).json();
 const r=await p.request.post(origin+'/v1/life-back',{headers:{Origin:origin},data:{action:'v7-refresh',expectedAccount:a.id,operationId:crypto.randomUUID(),revision:boot.progress.revision}}),body=await r.json();if(!r.ok())throw Error('Refresh failed for '+name+': '+JSON.stringify(body));
 if(body.v7.action.kind==='food'&&body.v7.alternatives.length!==3)throw Error('Three sourced swaps not available for '+name);
 console.log(JSON.stringify({name,pile:body.v7.count,original:body.v7.action.proteinG,swaps:body.v7.alternatives.map(a=>a.proteinG)}));await c.close();
}await b.close();
