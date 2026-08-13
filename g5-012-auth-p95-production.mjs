import fs from 'node:fs';
import {SLOS} from './operational-slos-v1.js';
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const ORIGIN='https://shiftsometimber.co.uk';
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const OUT=process.env.G5_012_EVIDENCE_DIR||'g5-012-auth-p95-evidence';
if(!OIDC)throw new Error('SHIFT_COMMISSIONING_OIDC required');fs.mkdirSync(OUT,{recursive:true});
const password='Shift-Perf-P95-2026!';
const REG_N=5,LOGIN_N=20,stamp=`perf-${Date.now()}`,registration=[],login=[];
const p95=xs=>{const s=[...xs].sort((a,b)=>a-b);return s[Math.min(s.length-1,Math.ceil(s.length*.95)-1)]};
const median=xs=>{const s=[...xs].sort((a,b)=>a-b);return s[Math.floor(s.length/2)]};
const timed=async fn=>{const t=performance.now();const value=await fn();return{ms:Math.round(performance.now()-t),value}};
async function reg(email){return fetch(`${API}/v1/auth/register`,{method:'POST',headers:{Origin:ORIGIN,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':OIDC},body:JSON.stringify({email,password,firstName:'PerfP95',source:'commissioning-g5-012-p95'})})}
async function signIn(email){return fetch(`${API}/v1/auth/login`,{method:'POST',headers:{Origin:ORIGIN,'Content-Type':'application/json'},body:JSON.stringify({email,password})})}
const emails=[];
for(let i=0;i<REG_N;i++){
 const email=`shiftsometimber+finish-${stamp}-${i}@gmail.com`;emails.push(email);
 const x=await timed(()=>reg(email));let body={};try{body=await x.value.clone().json()}catch{}
 if(x.value.status!==201)throw new Error(`registration sample ${i} failed ${x.value.status} ${JSON.stringify(body)}`);
 registration.push(x.ms);
}
for(let i=0;i<LOGIN_N;i++){
 const email=emails[i%emails.length],x=await timed(()=>signIn(email));let body={};try{body=await x.value.clone().json()}catch{}
 if(!x.value.ok)throw new Error(`login sample ${i} failed ${x.value.status} ${JSON.stringify(body)}`);
 login.push(x.ms);
}
const summary={proof:'G5_012_AUTH_P95_PRODUCTION_V2',registrationSampleCount:REG_N,loginSampleCount:LOGIN_N,budgetMs:SLOS.apiP95Ms,registration:{samplesMs:registration,p95Ms:p95(registration),maxMs:Math.max(...registration),medianMs:median(registration)},login:{samplesMs:login,p95Ms:p95(login),maxMs:Math.max(...login),medianMs:median(login)},passwordSecurityChanged:false,commissioningIdentity:'restricted_github_oidc'};
summary.status=summary.registration.p95Ms<=SLOS.apiP95Ms&&summary.login.p95Ms<=SLOS.apiP95Ms?'PASS':'FAIL';
fs.writeFileSync(`${OUT}/report.json`,JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
if(summary.status!=='PASS')throw new Error(`G5-012 API p95 failed: registration ${summary.registration.p95Ms}ms, login ${summary.login.p95Ms}ms, budget ${SLOS.apiP95Ms}ms`);
console.log(`PASS G5-012 auth latency: registration p95 ${summary.registration.p95Ms}ms over ${REG_N} fresh registrations; login p95 ${summary.login.p95Ms}ms over ${LOGIN_N} production logins; budget ${SLOS.apiP95Ms}ms.`);
