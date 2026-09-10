import fs from 'node:fs';
const worker=fs.readFileSync('worker-entry-v6.js','utf8');
const ops=fs.readFileSync('commissioning-ops-v1.js','utf8');
const compact=value=>value.replace(/"/g,"'").replace(/\s+/g,'');
const workerCompact=compact(worker),opsCompact=compact(ops);
const must=[
  'function deferAnalytics(ctx,work,label)',
  'if(ctx?.waitUntil)ctx.waitUntil(task)',
  "const loginAnalyticsRequest=request.method==='POST'&&path==='/v1/auth/login'?request.clone():null",
  'deferAnalytics(ctx,async()=>{',
  "eventName:'registration_started'",
  "eventName:'registration_completed'"
];
for(const token of must)if(!workerCompact.includes(compact(token)))throw new Error(`Async analytics contract missing: ${token}`);
if(!/deferAnalytics\(ctx,\(\)=>recordFinalLogin\(loginAnalyticsRequest,responseCopy,env\),'analytics_login',?\)/.test(workerCompact))throw new Error('Async analytics contract missing: deferred final-login recording');
if(workerCompact.includes('if(emailVerification){awaitrecordFinalLogin')||workerCompact.includes('if(fastLogin){awaitrecordFinalLogin'))throw new Error('Login analytics is back on the auth response critical path');
const cloneAt=workerCompact.indexOf('constloginAnalyticsRequest=');
const fastAt=workerCompact.indexOf('constfastLogin=awaitfastMemberLogin');
if(cloneAt<0||fastAt<0||cloneAt>fastAt)throw new Error('Login request must be cloned before the fast auth handler consumes its body');
if(!opsCompact.includes("p==='/v1/commissioning/product-events'&&request.method==='GET'"))throw new Error('M04 restricted production evidence route missing from commissioning ops');
if(!opsCompact.includes('verifyGithubOidc'))throw new Error('M04 evidence route lost OIDC identity protection');
console.log('PASS product analytics latency/deployment gate: registration and login analytics are retained behind waitUntil, auth responses are not blocked on analytics D1 work, and the restricted M04 evidence route remains OIDC-protected in source.');
