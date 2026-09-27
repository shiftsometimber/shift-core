// Read-only HTTP acceptance of the exact production release (no member data).
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {passportClient} from './client.mjs';
import {passportCSS} from './presentation.mjs';
import {PASSPORT_HEAD} from './production-preservation.mjs';
import {hash} from './production-release.mjs';
const origin='https://shiftsometimber.co.uk',out='passport-release';mkdirSync(out,{recursive:true});
const before=JSON.parse(readFileSync(out+'/release.json'));
assert.equal(before.release,process.env.GITHUB_SHA);assert.equal(before.schemaReady,true);
const report={release:process.env.GITHUB_SHA,checkedAt:new Date().toISOString(),scope:'exact public delivery and unauthenticated API protection; not signed-in acceptance',checks:[]};
async function run(name,fn){try{report.checks.push({name,pass:true,...await fn()})}catch(e){report.checks.push({name,pass:false,error:e.message})}}
const get=(path,options={})=>fetch(origin+path,{signal:AbortSignal.timeout(30000),cache:'no-store',redirect:'manual',...options});
for(const [path,body,type]of [['/assets/member-experience/passport.js',passportClient,/javascript/],['/assets/member-experience/passport.css',passportCSS,/text\/css/]])await run(path,async()=>{const r=await get(path),actual=await r.text();assert.equal(r.status,200);assert.match(r.headers.get('content-type')||'',type);assert.equal(actual,body);return {status:r.status,sha256:hash(actual)}});
await run('Start Here client changes only the approved raw-answer cache fields',async()=>{const r=await get('/start-here-v72.js?v=direct-detail-20260912'),body=await r.text();assert.equal(r.status,200);assert.equal(hash(body),before.startHereExpected);return {status:r.status,sha256:hash(body)}});
for(const path of ['/start-here','/member/dashboard'])await run(path+' one Passport client',async()=>{const r=await get(path),html=await r.text();assert.equal(r.status,200);assert.equal(html.split('data-health-passport-client').length-1,1);assert.ok(html.includes(PASSPORT_HEAD));return {status:r.status}});
for(const path of ['/','/programme','/about'])await run(path+' unchanged scope',async()=>{const r=await get(path),html=await r.text();assert.equal(r.status,200);assert.ok(!html.includes('data-health-passport-client'));return {status:r.status}});
for(const [path,method,body]of [['/v1/health-passport','GET'],['/v1/health-passport/records','POST',{expectedAccountId:0,type:'start_here'}]])await run(method+' '+path+' rejects anonymous access',async()=>{const r=await get(path,{method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});assert.equal(r.status,401);assert.match(r.headers.get('cache-control')||'',/no-store/);return {status:r.status}});
report.pass=report.checks.length===10&&report.checks.every(x=>x.pass);writeFileSync(out+'/live-http.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;
