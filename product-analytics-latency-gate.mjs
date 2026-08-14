import fs from 'node:fs';
const worker=fs.readFileSync('worker-entry-v6.js','utf8');
const ops=fs.readFileSync('commissioning-ops-v1.js','utf8');
const must=[
  'function deferAnalytics(ctx,work,label)',
  'if(ctx?.waitUntil)ctx.waitUntil(task)',
  "const loginAnalyticsRequest=request.method==='POST'&&path==='/v1/auth/login'?request.clone():null",
  "deferAnalytics(ctx,()=>recordFinalLogin(loginAnalyticsRequest,responseCopy,env),'analytics_login')",
  'deferAnalytics(ctx,async()=>{',
  "eventName:'registration_started'",
  "eventName:'registration_completed'"
];
for(const token of must)if(!worker.includes(token))throw new Error(`Async analytics contract missing: ${token}`);
if(worker.includes('if(emailVerification){await recordFinalLogin')||worker.includes('if(fastLogin){await recordFinalLogin'))throw new Error('Login analytics is back on the auth response critical path');
const cloneAt=worker.indexOf('const loginAnalyticsRequest=');
const fastAt=worker.indexOf('const fastLogin=await fastMemberLogin');
if(cloneAt<0||fastAt<0||cloneAt>fastAt)throw new Error('Login request must be cloned before the fast auth handler consumes its body');
if(!ops.includes("p==='/v1/commissioning/product-events'&&request.method==='GET'"))throw new Error('M04 restricted production evidence route missing from commissioning ops');
if(!ops.includes('verifyGithubOidc'))throw new Error('M04 evidence route lost OIDC identity protection');
console.log('PASS product analytics latency/deployment gate: registration and login analytics are retained behind waitUntil, auth responses are not blocked on analytics D1 work, and the restricted M04 evidence route remains OIDC-protected in source.');
