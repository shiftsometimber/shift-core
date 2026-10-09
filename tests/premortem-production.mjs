import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {commissioningLogin,memberReady,memberReload,chooseNecessaryCookies} from '../rendered-member-acceptance-support.mjs';
const site='https://shiftsometimber.co.uk',api='https://api.shiftsometimber.co.uk',out='premortem-evidence';mkdirSync(out,{recursive:true});
async function oidc(){const u=new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);u.searchParams.set('audience','shift-production-commissioning');const r=await fetch(u,{headers:{Authorization:'bearer '+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},signal:AbortSignal.timeout(30000)});assert(r.ok);return (await r.json()).value;}
const report={scope:'Fictional commissioning accounts only. Injected cancellation is synthetic failure proof, not diagnosis of the historic timeout.',source:process.env.ACCEPTANCE_SOURCE,at:new Date().toISOString(),checks:[],requests:[],pageErrors:[],requestFailures:[]};
const write=()=>writeFileSync(out+'/garage-report.json',JSON.stringify(report,null,2));
const fingerprint=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const browser=await chromium.launch();
try{for(const [device,width] of [['mobile',390],['desktop',1440]]){
 const identity={email:'shiftsometimber+structured-authrender-garage-'+Date.now()+'-'+device+'@gmail.com',password:'Sst-'+randomUUID()+'-Aa1!'};
 const reg=await fetch(api+'/v1/auth/register',{method:'POST',headers:{Origin:site,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':await oidc()},body:JSON.stringify({...identity,firstName:'Fictional Garage diagnostic',source:'commissioning-premortem'}),signal:AbortSignal.timeout(30000)});assert.equal(reg.status,201);
 const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(30000);
 page.on('pageerror',e=>report.pageErrors.push({device,name:e.name,message:e.message.slice(0,300)}));
 page.on('requestfailed',r=>report.requestFailures.push({device,path:new URL(r.url()).pathname,error:r.failure()?.errorText}));
 const check=async(label,fn)=>{try{await fn();report.checks.push({device,label,pass:true});console.log('PASS '+device+' '+label);}catch(e){report.checks.push({device,label,pass:false,error:{name:e.name,message:e.message.split('Call log:')[0].slice(0,300)}});console.log('FAIL '+device+' '+label+' '+e.name);await page.screenshot({path:out+'/'+device+'-garage-failure.png'}).catch(()=>{});}write();};
 const read=async(path,transport='harness',origin=site,timeout=30000)=>{
  const start=Date.now(),entry={device,path,transport,origin,startedAt:new Date(start).toISOString(),timeout};report.requests.push(entry);write();
  try{let result;if(transport==='browser')result=await page.evaluate(async({url,timeout})=>{const r=await fetch(url,{credentials:'include',cache:'no-store',signal:AbortSignal.timeout(timeout)});return {status:r.status,ray:r.headers.get('cf-ray'),cache:r.headers.get('cache-control'),body:await r.json()};},{url:origin+path,timeout});else{const r=await context.request.get(origin+path,{headers:{Origin:site},timeout});result={status:r.status(),ray:r.headers()['cf-ray'],cache:r.headers()['cache-control'],body:await r.json()};}Object.assign(entry,{ms:Date.now()-start,status:result.status,ray:result.ray,cache:result.cache,bodyFingerprint:fingerprint(result.body)});write();return result;
  }catch(e){Object.assign(entry,{ms:Date.now()-start,errorName:e.name,errorCategory:/timeout|timed out/i.test(e.message)?'timeout':'transport-error'});write();throw e;}
 };
 let food,fit,saved,saves=0;
 page.on('request',r=>{if(new URL(r.url()).pathname==='/v1/shift/daily-adjust'&&r.method()==='POST')saves++;});
 try{
 await commissioningLogin(page,{site,api,oidc:await oidc(),...identity});await memberReady(page,{site});
 await check('Baseline Grub and Fit read from actual signed-in account',async()=>{const a=await read('/v1/grub/workspace');assert.equal(a.status,200);food=a.body;const b=await read('/v1/fit/activity');assert.equal(b.status,200);fit=b.body;});
 await check('Garage visible handoff saves exactly once and reads the saved daily adjustment',async()=>{
  await page.goto(site+'/member/ask-timber',{waitUntil:'domcontentloaded'});await chooseNecessaryCookies(page);const target=page.locator('[data-prompt]').filter({hasText:/garage|petrol/i});assert.equal(await target.count(),1);await target.click();await page.locator('[data-handoff]').click();await page.locator('#confirmYes').click();const button=page.locator('[data-adjust="next_three_hours"]');await button.waitFor({state:'visible'});assert.equal(saves,0);const pending=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/shift/daily-adjust'&&r.request().method()==='POST');await button.click();const response=await pending;assert.equal(response.status(),200);saved=(await response.json()).daily;await page.locator('.mt-sheet-wrap').waitFor({state:'detached'});assert.equal(saves,1);const persisted=await read('/v1/shift/daily-plan');assert.equal(persisted.status,200);assert.equal(persisted.body.daily.mode,saved.mode);assert.equal(persisted.body.daily.daily_output.adjustment,'next_three_hours');report.savedDaily={device,mode:saved.mode,dailyOutput:saved.daily_output};
 });
 await check('Repeated post-save Grub read-back agrees across harness, browser and API origin',async()=>{
  assert(food&&fit&&saved);for(let round=1;round<=6;round++){for(const [transport,origin] of [['harness',site],['browser',site],['harness',api]]){const r=await read('/v1/grub/workspace',transport,origin);assert.equal(r.status,200);assert.deepEqual(r.body,food);}}assert.deepEqual((await read('/v1/fit/activity')).body,fit);assert.equal(saves,1);
 });
 await check('Actual refresh keeps Garage adjustment without changing Grub or Fit',async()=>{const reload=await memberReload(page,{site});report.reload={device,...reload};const daily=(await read('/v1/shift/daily-plan')).body.daily;assert.equal(daily.mode,saved.mode);assert.equal(daily.daily_output.adjustment,'next_three_hours');assert.deepEqual((await read('/v1/grub/workspace')).body,food);assert.deepEqual((await read('/v1/fit/activity')).body,fit);assert.equal(saves,1);});
 await check('Injected harness read cancellation recovers without replaying the save',async()=>{let cancelled=false;try{await read('/v1/grub/workspace','harness',site,1);}catch{cancelled=true;}assert(cancelled,'Controlled 1ms cancellation must occur');const recovered=await read('/v1/grub/workspace','browser');assert.equal(recovered.status,200);assert.deepEqual(recovered.body,food);assert.equal((await read('/v1/shift/daily-plan')).body.daily.mode,saved.mode);assert.equal(saves,1);});
 await check('Real session revocation refuses stale read and write; fresh login retains Garage, Grub and Fit',async()=>{
  const logout=await context.request.post(site+'/v1/auth/logout',{headers:{Origin:site},data:{}});assert.equal(logout.status(),200);assert.equal((await read('/v1/grub/workspace')).status,401);assert.equal((await read('/v1/shift/daily-plan')).status,401);const rejected=await context.request.post(site+'/v1/shift/daily-adjust',{headers:{Origin:site},data:{scenario:'working_late'}});assert.equal(rejected.status(),401);
  await commissioningLogin(page,{site,api,oidc:await oidc(),...identity});await memberReady(page,{site});const daily=(await read('/v1/shift/daily-plan')).body.daily;assert.equal(daily.mode,saved.mode);assert.equal(daily.daily_output.adjustment,'next_three_hours');assert.deepEqual((await read('/v1/grub/workspace')).body,food);assert.deepEqual((await read('/v1/fit/activity')).body,fit);await page.screenshot({path:out+'/'+device+'-garage-returned.png'});assert.equal(saves,1);
 });
 }finally{const r=await context.request.post(site+'/v1/auth/logout',{headers:{Origin:site},data:{}}).catch(()=>null);report.checks.push({device,label:'Fictional session cleanup',pass:r?.status()===200});await context.close();write();}
 }}catch(e){report.error={name:e.name,message:e.message.split('Call log:')[0].slice(0,300)};}
finally{await browser.close();report.pass=!report.error&&!report.pageErrors.length&&report.checks.length===14&&report.checks.every(x=>x.pass);write();console.log('GARAGE_REPORT '+JSON.stringify(report));if(!report.pass)process.exitCode=1;}
