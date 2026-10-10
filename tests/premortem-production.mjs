import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {randomUUID,createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {mkdirSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {commissioningLogin,memberReady,chooseNecessaryCookies} from '../rendered-member-acceptance-support.mjs';
import {grubWorkspaceRoutes} from '../member-experience/grub-routes.mjs';
const site='https://shiftsometimber.co.uk',api='https://api.shiftsometimber.co.uk',out='reliability-evidence';
mkdirSync(out,{recursive:true});
const report={source:process.env.ACCEPTANCE_SOURCE,at:new Date().toISOString(),scope:'New fictional commissioning identity only; no runtime deploy, old checks not repeated',checks:[],database:[],pageErrors:[],timingScope:'Source replay through real production D1 REST is distinct from live Worker execution. Database meta.duration excludes network; REST elapsed is not Worker binding wait.'};
const flush=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
async function check(name,fn){try{await fn();report.checks.push({name,pass:true});console.log('PASS '+name)}catch(e){report.checks.push({name,pass:false,error:e.name+': '+e.message.slice(0,250)});throw e}finally{flush()}}
async function oidc(){const u=new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);u.searchParams.set('audience','shift-production-commissioning');const r=await fetch(u,{headers:{Authorization:'bearer '+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}});assert(r.ok);return(await r.json()).value}
let uid,sessionId,expectedHash;
async function sql(query,params,phase){const start=performance.now(),r=await fetch('https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6/d1/database/88f40aed-cb23-4372-8c94-8a73f48bc847/query',{method:'POST',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({sql:query,params}),signal:AbortSignal.timeout(30000)});
if(r.status===401||r.status===403)throw Error('STOP existing D1 authority unavailable; no escalation');
const j=await r.json();assert(r.ok&&j.success&&j.result?.[0]?.success,'D1 query failed');
const v=j.result[0];report.database.push({phase,elapsedMs:performance.now()-start,executionMs:v.meta?.duration,rowsRead:v.meta?.rows_read,rowsWritten:v.meta?.rows_written,changes:v.meta?.changes,colo:v.meta?.served_by_colo});flush();return v}
const DB={prepare(query){let params=[];const phase=/FROM user_sessions/.test(query)?'authentication.session-select':/last_used_at/.test(query)?'authentication.last-used-update':/structured_content/.test(query)?'catalogue.page-select':'member-state.preferences-select';
const run=async()=>{if(phase==='authentication.session-select')assert.equal(params[0],expectedHash);else if(phase==='authentication.last-used-update')assert.equal(params[1],sessionId);else if(phase==='member-state.preferences-select'){assert.equal(query,'SELECT preferences FROM member_state WHERE user_id=?');assert.equal(params[0],uid)}else assert.match(query,/content_type='recipe' AND status='published'/);const v=await sql(query,params,phase);if(phase==='authentication.session-select'){assert.equal(Number(v.results[0]?.id),uid);sessionId=v.results[0].session_id;}return v};return {bind(...args){params=args;return this},async first(){return(await run()).results[0]||null},async all(){return await run()},async run(){return await run()}}}};
const browser=await chromium.launch();let context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage();
page.on('pageerror',e=>report.pageErrors.push(e.message.slice(0,200)));
const identity={email:'shiftsometimber+structured-authrender-reliability-'+Date.now()+'@gmail.com',password:'Sst-'+randomUUID()+'-Aa1!'};
const call=async(path,method='GET',data)=>{const r=await context.request.fetch(site+path,{method,headers:{Origin:site},...(data?{data}:{})});return{status:r.status(),body:await r.json(),ray:r.headers()['cf-ray']}};
let food,legacy,activity,saves=0;
try{
await check('Fresh authorised commissioning identity, server-issued session and explicit visible health consent',async()=>{
 const r=await fetch(api+'/v1/auth/register',{method:'POST',headers:{Origin:site,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':await oidc()},body:JSON.stringify({...identity,firstName:'Fictional reliability evidence',source:'commissioning-premortem'}),signal:AbortSignal.timeout(30000)});assert.equal(r.status,201);
 await commissioningLogin(page,{site,api,oidc:await oidc(),...identity});await memberReady(page,{site});
 const me=await call('/v1/me');assert.equal(me.body.user.email,identity.email);uid=Number(me.body.user.id);
 const own=await sql('SELECT id,email FROM users WHERE id=?',[uid],'fixture.ownership');assert.equal(own.results[0].email,identity.email);
 await page.waitForFunction(()=>typeof window.SST_HEALTH_CONSENT?.ensure==='function');
 const consent=page.evaluate(()=>window.SST_HEALTH_CONSENT.ensure());const dialog=page.getByRole('dialog');await dialog.getByRole('checkbox').check();await dialog.getByRole('button',{name:'Agree & continue',exact:true}).click();assert.equal(await consent,true);
});
await check('Actual persisted named legacy Fit record and historical completion are retained on API read, UI reload and fresh login',async()=>{
 assert.equal((await sql("SELECT COUNT(*) n FROM shift_plans WHERE user_id=?",[uid],'fixture.empty-account')).results[0].n,0);
 legacy={kind:'fictional_legacy_acceptance',location:'home',minutes_per_day:12,sessions:[{requested_minutes:12,estimated_minutes:12,exercises:[{id:'calf-raise-cool-down-advanced',name:'Calf Raise Cool-Down Advanced',group:'legs'},{id:'glute-bridge-cool-down-beginner',name:'Glute Bridge Cool-Down Beginner',group:'legs'},{id:'push-up-cool-down-standard',name:'Push-Up Cool-Down Standard',group:'upper-body'}]}]};
 const seeded=await sql('INSERT INTO shift_plans(user_id,plan_type,starts_on,status,plan_json) VALUES(?,?,?,?,?)',[uid,'fit','2026-01-01','active',JSON.stringify(legacy)],'fixture.seed-own-legacy');assert.equal(seeded.meta.changes,1);
 const item={status:'done',exerciseId:'calf-raise-cool-down-advanced',group:'legs',sessionDay:1,recordedOn:'2026-01-01',updatedAt:'2026-01-01T12:00:00Z'};
 const saved=await call('/v1/fit/activity','POST',{fitJourney:{entries:{'2026-01-01:day-1:calf-raise-cool-down-advanced':item}}});assert.equal(saved.status,200);
 activity=(await call('/v1/fit/activity')).body;assert.deepEqual(activity.plan,legacy);assert(Object.keys(activity.fitJourney.entries).length===1);
 const verify=async()=>{const r=await call('/v1/fit/activity');assert.equal(r.status,200);assert.deepEqual(r.body,activity);await page.locator('#fitOutput').getByText('This saved session needs replacing',{exact:true}).waitFor();assert.equal(await page.locator('.sf-exercise').count(),0)};
 await page.goto(site+'/member/fit',{waitUntil:'domcontentloaded'});await chooseNecessaryCookies(page);await verify();await page.reload({waitUntil:'domcontentloaded'});await verify();
 assert.equal((await call('/v1/auth/logout','POST',{})).status,200);assert.equal((await call('/v1/fit/activity')).status,401);await context.close();
 context=await browser.newContext({viewport:{width:390,height:900}});page=await context.newPage();await commissioningLogin(page,{site,api,oidc:await oidc(),...identity});await page.goto(site+'/member/fit',{waitUntil:'domcontentloaded'});await chooseNecessaryCookies(page);await verify();
 report.legacy={persisted:true,fictional:true,apiDeepEqual:true,actualReload:true,freshContextLogin:true,inconsistentMovementsWithheld:true,historyEntries:Object.keys(activity.fitJourney.entries).length};await page.screenshot({path:out+'/legacy-return.png'});
});
await check('Current Garage save readback and scoped recovery retain Grub and legacy Fit',async()=>{
 food=(await call('/v1/grub/workspace')).body;const r=await call('/v1/grub/workspace','POST',{action:'shopping-add',revision:food.revision,operationId:randomUUID(),text:'Fictional phase-timing fixture'});assert.equal(r.status,200);food=(await call('/v1/grub/workspace')).body;
 page.on('request',r=>{if(new URL(r.url()).pathname==='/v1/shift/daily-adjust'&&r.method()==='POST')saves++});
 await page.goto(site+'/member/ask-timber',{waitUntil:'domcontentloaded'});await chooseNecessaryCookies(page);const target=page.locator('[data-prompt]').filter({hasText:/garage|petrol/i});assert.equal(await target.count(),1);await target.click();await page.locator('[data-handoff]').click();await page.locator('#confirmYes').click();const pending=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/shift/daily-adjust'&&r.request().method()==='POST');await page.locator('[data-adjust="next_three_hours"]').click();assert.equal((await pending).status(),200);await page.locator('.mt-sheet-wrap').waitFor({state:'detached'});assert.equal(saves,1);
 const read=await call('/v1/grub/workspace');assert.equal(read.status,200);assert.deepEqual(read.body,food);report.liveRead={at:new Date().toISOString(),ray:read.ray};
 await page.route('**/v1/grub/workspace',route=>route.abort('connectionreset'),{times:1});const failed=await page.evaluate(async()=>{try{await fetch('/v1/grub/workspace',{credentials:'include'});return false}catch{return true}});assert.equal(failed,true);await page.unroute('**/v1/grub/workspace');
 const recovered=await page.evaluate(async()=>{const r=await fetch('/v1/grub/workspace',{credentials:'include',cache:'no-store'});return{status:r.status,body:await r.json()}});assert.equal(recovered.status,200);assert.deepEqual(recovered.body,food);assert.equal(saves,1);assert.deepEqual((await call('/v1/fit/activity')).body,activity);
 await page.reload({waitUntil:'domcontentloaded'});assert.deepEqual((await call('/v1/grub/workspace')).body,food);assert.equal((await call('/v1/shift/daily-plan')).body.daily.daily_output.adjustment,'next_three_hours');
 report.recovery={syntheticAbort:true,actualBrowserGETRecovery200:true,mutationReplays:0};
});
await check('Client transport timing and real-D1 exact-source phase replay',async()=>{
 const cookies=await context.cookies(site);const raw=cookies.filter(x=>x.name==='sst_session').map(x=>x.value);assert(raw.length);const cookie=raw.map(x=>'sst_session='+x).join('; ');expectedHash=createHash('sha256').update(raw[0]).digest('hex');
 const expiry=await sql('SELECT expires_at,created_at,revoked_at FROM user_sessions WHERE user_id=? AND token_hash=?',[uid,expectedHash],'issued-session.lifetime');
 report.issuedSession={createdAt:expiry.results[0].created_at,expiresAt:expiry.results[0].expires_at,revoked:!!expiry.results[0].revoked_at,naturallyElapsed:Date.now()>=Date.parse(expiry.results[0].expires_at),retainedCookieExported:false,clockOrLifetimeChanged:false};
 const config='url = "'+site+'/v1/grub/workspace"\nheader = "Cookie: '+cookie+'"\nmax-time = 30\noutput = "/dev/null"\nwrite-out = "%{json}\\n%header{cf-ray}"\n';
 const output=execFileSync('curl',['--silent','--show-error','--config','-'],{input:config,encoding:'utf8'});const [line,ray]=output.split('\n'),c=JSON.parse(line);report.clientTransport={at:new Date().toISOString(),ray,status:c.http_code,protocol:c.http_version,dnsMs:c.time_namelookup*1000,connectMs:c.time_connect*1000,tlsMs:c.time_appconnect*1000,firstByteMs:c.time_starttransfer*1000,totalMs:c.time_total*1000,bodyAfterFirstByteMs:(c.time_total-c.time_starttransfer)*1000};assert.equal(c.http_code,200);
 const start=performance.now(),before=report.database.length;const replay=await grubWorkspaceRoutes(new Request(site+'/v1/grub/workspace',{headers:{Cookie:cookie}}),{DB,MEMBER_EXPERIENCE_V1_ENABLED:'true'});assert.equal(replay.status,200);assert.deepEqual(await replay.json(),food);
 report.phaseReplay={elapsedMs:performance.now()-start,queries:report.database.slice(before),scope:'Same immutable route source and real production D1 data, executed in CI through REST adapter; NOT live Worker binding timings or original request timings'};
});
await check('Final server logout and private-state recovery boundaries',async()=>{assert.equal((await call('/v1/auth/logout','POST',{})).status,200);assert.equal((await call('/v1/grub/workspace')).status,401);assert.equal((await call('/v1/fit/activity')).status,401);await commissioningLogin(page,{site,api,oidc:await oidc(),...identity});assert.deepEqual((await call('/v1/grub/workspace')).body,food);assert.deepEqual((await call('/v1/fit/activity')).body,activity)});
report.pass=true;
}catch(e){report.error={name:e.name,message:e.message.split('Call log:')[0].slice(0,300)};report.pass=false}
finally{try{report.cleanup={healthEraseStatus:(await call('/v1/privacy/health-tracking','DELETE')).status}}catch{}try{report.logoutStatus=(await call('/v1/auth/logout','POST',{})).status}catch{}await context.close();await browser.close();flush();console.log('RELIABILITY_REPORT '+JSON.stringify(report));if(!report.pass)process.exitCode=1}
