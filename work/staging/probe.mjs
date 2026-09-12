import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const origin=process.env.WORK_STAGING_URL;if(!/^https:\/\/shift-core-work-staging\.[a-z0-9-]+\.workers\.dev$/.test(origin??''))throw Error('Not the isolated staging origin');
const fixture=JSON.parse(readFileSync('work/staging/generated/probe.json')),checks=[];
const call=(path,body,cookie='')=>fetch(origin+path,{redirect:'manual',method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie},body:body?JSON.stringify(body):undefined});
// A newly published workers.dev route can briefly return 404. Check the actual
// anonymous auth route before attempting any seeded account; do not retry logins.
let ready=false,last='';
for(let attempt=0;attempt<6;attempt++){
 const r=await call('/v1/auth/login',{email:'readiness@example.invalid',password:'not-a-real-account'});
 if(r.status===401){ready=true;break}
 last='status '+r.status+': '+(await r.text()).slice(0,180);
 if(r.status!==404)break;
 await new Promise(resolve=>setTimeout(resolve,Math.min(1000*2**attempt,8000)));
}
assert(ready,'Isolated auth route is not ready: '+last);
async function login(id,hq=false){const r=await call(hq?'/v1/hq/auth/login':'/v1/auth/login',{email:(hq?'hq':'probe')+id+'@example.invalid',password:fixture.password});assert.equal(r.status,200,'Password login failed');const cookie=r.headers.get('Set-Cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/Secure/);return cookie.split(';')[0]}
const employee=await login(fixture.ids[0]),employer=await login(fixture.ids[1]),other=await login(fixture.ids[2]),hq=await login(fixture.hqId,true);checks.push('Separate real member and HQ password logins');
assert.equal((await call('/v1/hq/work',undefined,employee)).status,401);assert.equal((await call('/v1/work',undefined,hq)).status,401);checks.push('HQ/member session separation');
assert.equal((await call('/v1/work/join',{code:fixture.code,consent:true,noticeVersion:'work-pilot-2026-09-12-v1'},employee)).status,200);
assert.equal((await call('/v1/work/review',{employerId:fixture.id,week:1,completed:true},employee)).status,200);
const own=await(await call('/v1/work',undefined,employee)).json();assert.deepEqual(own.workplaces.find(s=>s.employerId===fixture.id).completedWeeks,[1]);checks.push('Code claim and review persisted across remote requests');
assert.equal((await(await call('/v1/employer/work',undefined,other)).json()).reports.length,0);checks.push('Foreign employer cannot access reports');
assert.equal((await call('/v1/work/testing',{},employee)).status,409);checks.push('Clinical ordering remains blocked');
const all=await(await call('/v1/hq/work',undefined,hq)).json(),closed=all.employers.find(s=>s.id===fixture.closedId);
const release=await call('/v1/hq/work',{action:'report',id:closed.id,revision:closed.revision,safeToRelease:true,reviewReference:'Fictional remote fixture; not a real pilot or privacy approval'},hq);assert.equal(release.status,200);
const after=await release.json(),reports=await(await call('/v1/employer/work',undefined,employer)).json(),report=reports.reports.find(s=>s.employerId===closed.id).report;assert.equal(report.activations.count,35);assert(!JSON.stringify(reports).includes('completedWeeks'));checks.push('Fixed closed-fixture report released without member records');
assert.equal((await call('/v1/hq/work',{action:'reporters',id:closed.id,revision:after.employer.revision,reporterIds:[]},hq)).status,200);assert(!(await(await call('/v1/employer/work',undefined,employer)).json()).reports.some(s=>s.employerId===closed.id));checks.push('Reporting-access revocation takes effect');
assert.equal((await call('/v1/auth/logout',{},employee)).status,200);assert.equal((await call('/v1/work',undefined,employee)).status,401);await call('/v1/auth/logout',{},employer);await call('/v1/auth/logout',{},other);await call('/v1/hq/auth/logout',{},hq);checks.push('Logout invalidates the saved member session');
const result={origin,checkedAt:new Date().toISOString(),status:'pass',checks,limits:['Fictional accounts only','Closed period is a seeded fixture','No browser sign-in claim','No clinical or real-employee commissioning']};writeFileSync('work/staging/generated/probe-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
