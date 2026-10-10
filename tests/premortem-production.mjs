import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const site='https://shiftsometimber.co.uk',api='https://api.shiftsometimber.co.uk';
const report={source:process.env.ACCEPTANCE_SOURCE,scope:'New fictional commissioning identity: only current live observability and private-read/logout recovery; no completed browser acceptance repeated',requests:[],pass:false};
mkdirSync('reliability-evidence',{recursive:true});
async function oidc(){const u=new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);u.searchParams.set('audience','shift-production-commissioning');const r=await fetch(u,{headers:{Authorization:'bearer '+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}});assert(r.ok);return(await r.json()).value}
const identity={email:'shiftsometimber+structured-authrender-live-'+Date.now()+'@gmail.com',password:'Sst-'+randomUUID()+'-Aa1!'};
let cookie;
function issued(r){const candidates=r.headers.getSetCookie().filter(x=>/^sst_session=[^;]+/.test(x)&&!/Max-Age=0(?:;|$)/i.test(x));assert(candidates.length);return candidates.at(-1).split(';')[0]}
async function login(){const r=await fetch(api+'/v1/auth/login',{method:'POST',headers:{Origin:site,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':await oidc()},body:JSON.stringify(identity)});assert.equal(r.status,200);cookie=issued(r);}
function timed(path,expected){
const at=new Date().toISOString();
const config='url = "'+site+path+'"\nheader = "Cookie: '+cookie+'"\nheader = "Cache-Control: no-cache"\n';
const raw=execFileSync('curl',['--config','-','--silent','--show-error','--max-time','35','--output','/dev/null','--dump-header','-','--write-out','\nCURL_TIMING %{json}\n'],{input:config,encoding:'utf8',maxBuffer:200000});
const split=raw.lastIndexOf('CURL_TIMING ');assert(split>=0);const timing=JSON.parse(raw.slice(split+'CURL_TIMING '.length).trim()),head=raw.slice(0,split);
const header=name=>head.split(/\r?\n/).filter(x=>x.toLowerCase().startsWith(name.toLowerCase()+':')).at(-1)?.slice(name.length+1).trim()||null;
const entry={at,completedAt:new Date().toISOString(),path,status:timing.http_code,protocol:timing.http_version,ray:header('cf-ray'),serverTiming:header('server-timing'),transport:{dnsMs:timing.time_namelookup*1000,connectMs:timing.time_connect*1000,tlsCompletionMs:timing.time_appconnect*1000,firstByteMs:timing.time_starttransfer*1000,totalMs:timing.time_total*1000,bodyAfterFirstByteMs:(timing.time_total-timing.time_starttransfer)*1000}};
report.requests.push(entry);assert.equal(entry.status,expected);return entry}
try{
const r=await fetch(api+'/v1/auth/register',{method:'POST',headers:{Origin:site,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':await oidc()},body:JSON.stringify({...identity,firstName:'Fictional live reliability',source:'commissioning-premortem'})});assert.equal(r.status,201);
await login();
const me=await fetch(site+'/v1/me',{headers:{Cookie:cookie}});assert.equal(me.status,200);assert.equal((await me.json()).user.email,identity.email);
timed('/v1/member-state',200);
timed('/v1/grub/workspace',200);
const state=await fetch(site+'/v1/grub/workspace',{headers:{Cookie:cookie}});assert.equal(state.status,200);const before=await state.json();
const lo=await fetch(site+'/v1/auth/logout',{method:'POST',headers:{Origin:site,Cookie:cookie,'Content-Type':'application/json'},body:'{}'});assert.equal(lo.status,200);
timed('/v1/grub/workspace',401);
await login();
timed('/v1/grub/workspace',200);
const back=await fetch(site+'/v1/grub/workspace',{headers:{Cookie:cookie}});assert.equal(back.status,200);assert.deepEqual(await back.json(),before);
report.recovery={realLogout200:true,revokedPrivateGET401:true,freshServerLogin:true,privateStateDeepEqual:true,mutationsReplayed:0};
report.livePhaseCapture={available:report.requests.some(x=>x.serverTiming),qualification:'Endpoint client timings include complete server work, not authentication/catalogue/member-state phase isolation. Server-Timing header absence is recorded rather than filling missing phases.'};
report.naturalExpiry={performed:false,reason:'No retained unrevoked previously issued session available. This short-lived job cannot observe 12h deadline; session explicitly logged out, never counted as natural expiry. No clock/lifetime changes or credential export.'};
report.pass=true;
}catch(e){report.error={name:e.name,message:e.message.slice(0,250)}}
finally{if(cookie){const r=await fetch(site+'/v1/auth/logout',{method:'POST',headers:{Origin:site,Cookie:cookie,'Content-Type':'application/json'},body:'{}'}).catch(()=>null);report.cleanupLogoutStatus=r?.status}
writeFileSync('reliability-evidence/current-live.json',JSON.stringify(report,null,2));console.log('CURRENT_LIVE_REPORT '+JSON.stringify(report));if(!report.pass)process.exitCode=1}
