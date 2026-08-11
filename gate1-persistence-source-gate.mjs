import fs from 'node:fs';

let failed=false;
const fail=(m)=>{console.error(m);failed=true};
const worker=fs.readFileSync('worker.js','utf8');
const entry=fs.readFileSync('worker-entry-v6.js','utf8');

for(const route of ["/v1/profile","/v1/member-state","/v1/auth/login","/v1/auth/logout"]){
  if(!worker.includes(route)) fail(`Missing Gate 1 persistence/auth route: ${route}`);
}
if(!worker.includes('ON CONFLICT(user_id) DO UPDATE SET')) fail('member_state must use durable upsert persistence');
if(!worker.includes("UPDATE users SET first_name=COALESCE")) fail('profile patch must persist to canonical users table');
if(!worker.includes("headers.set('X-Shift-Request-Id', requestId)")) fail('Core responses must carry X-Shift-Request-Id');
if(!worker.includes("error: 'internal_error', requestId")) fail('Unhandled Core errors must expose a safe requestId');
if(!worker.includes("error: 'not_found', requestId")) fail('404 responses must expose a requestId');

const authIndex=entry.indexOf('const authRecovery=await handleAuthRecovery');
const productIndex=entry.indexOf('const commissioning=await memberCommissioningRoute');
if(authIndex<0||productIndex<0||authIndex>productIndex) fail('Authoritative auth recovery must execute before member/product fallbacks');

if(failed) process.exit(1);
console.log('Gate 1 persistence/source contract passed.');
