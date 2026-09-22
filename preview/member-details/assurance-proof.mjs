// Evidence only: public reads, intercepted telemetry, fictional preview records.
import {chromium,webkit,request as pwRequest} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {bootstrap} from '../../activation-measurement/assets.mjs';
import {consentClient} from '../../acquisition-activation/consent.mjs';
const LIVE='https://shiftsometimber.co.uk',PREVIEW=process.env.PREVIEW_URL;
assert.equal(PREVIEW,'https://shift-stabilisation-preview.matobrien.workers.dev');
const dir='work/staging/generated/review-evidence/assurance';mkdirSync(dir,{recursive:true});
const sha=s=>createHash('sha256').update(s).digest('hex');
const report={at:new Date().toISOString(),source:process.env.PREVIEW_SOURCE_SHA,scope:'Production anonymous reads only; all analytics collection intercepted. Data writes only to fictional preview accounts. Not GA4 receipt, physical-device, capacity certification or full-service restore.',checks:[],performance:[],failures:[]};
function persist(){writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));}
async function check(name,fn){try{const details=await fn();report.checks.push({name,status:'pass',details});}catch(e){const row={name,status:'fail',error:String(e.stack||e)};report.checks.push(row);report.failures.push(row);}persist();}
async function publicRead(path){const r=await fetch(LIVE+path,{redirect:'follow',signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,path);return {body:await r.text(),headers:Object.fromEntries(r.headers),url:r.url};}
await check('Live privacy bootstrap and consent match exact repository authority',async()=>{const out=[];for(const[path,expected]of [['/analytics-bootstrap-v1.js',bootstrap],['/consent-v4a.js',consentClient]]){const r=await publicRead(path);writeFileSync(dir+'/'+path.slice(1),r.body);out.push({path,sha256:sha(r.body),expected:sha(expected),headers:r.headers});assert.equal(r.body,expected,path+' source drift');}return out;});
function tracker(u){return /(?:google-analytics\.com|analytics\.google\.com|doubleclick\.net|cloudflareinsights\.com|facebook\.com)$/.test(u.hostname)||/\/(?:g\/)?collect(?:\/|$)/.test(u.pathname)||u.pathname==='/cdn-cgi/rum';}
async function guarded(browser,viewport,stored=false){
 const context=await browser.newContext({viewport,serviceWorkers:'block'}),trace={gtm:[],telemetry:[],blockedWrites:[],blockedExternal:[]};let phase='before-consent';
 if(stored)await context.addInitScript(()=>localStorage.setItem('sstConsentV3',JSON.stringify({necessary:true,analytics:true,marketing:false,acquisition:false,updatedAt:new Date().toISOString()})));
 await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url());
  if(tracker(u)){trace.telemetry.push({phase,url:r.url(),method:r.method(),body:r.postData()});return route.fulfill({status:204,body:''});}
  if(!['GET','HEAD','OPTIONS'].includes(r.method())){trace.blockedWrites.push({phase,path:u.pathname,method:r.method()});return route.fulfill({status:403,contentType:'application/json',body:'{"error":"read_only_assurance"}'});}
  if(u.hostname==='www.googletagmanager.com'&&['/gtm.js','/gtag/js'].includes(u.pathname)){trace.gtm.push({phase,url:r.url()});return route.continue();}
  if(u.hostname==='shiftsometimber.co.uk'||u.hostname.endsWith('.shiftsometimber.co.uk')||['fonts.googleapis.com','fonts.gstatic.com','static.cloudflareinsights.com'].includes(u.hostname))return route.continue();
  trace.blockedExternal.push({phase,host:u.hostname,path:u.pathname});return route.fulfill({status:204,body:''});
 });return {context,trace,phase:v=>phase=v};
}
async function state(page){return page.evaluate(()=>({choice:window.sstConsent||null,suppressed:window.SST_ANALYTICS_SUPPRESSED,disabled:window['ga-disable-G-Y7BV5KY6RR'],layers:(window.dataLayer||[]).map(x=>{try{return Array.from(x)}catch{return x}}),settings:!!document.getElementById('sstCookieSettings')}));}
const configs=[['chromium-desktop',chromium,{width:1440,height:1000}],['chromium-phone',chromium,{width:390,height:844}],['webkit-desktop',webkit,{width:1440,height:1000}],['webkit-phone',webkit,{width:390,height:844}]];
for(const[name,type,viewport]of configs){const browser=await type.launch({headless:true});
 await check(name+' real cookie-choice journey',async()=>{const g=await guarded(browser,viewport),page=await g.context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));try{
  await page.goto(LIVE+'/programme',{waitUntil:'domcontentloaded',timeout:45000});await page.locator('[data-consent="necessary"]').waitFor({state:'visible'});await page.waitForTimeout(1500);
  const before=await state(page);assert.equal(g.trace.gtm.length,0,'tag manager loaded before consent');assert.equal(g.trace.telemetry.length,0,'analytics attempted before consent');assert.equal(before.disabled,true);assert(before.settings);
  g.phase('necessary');await page.locator('[data-consent="necessary"]').click();await page.waitForTimeout(400);assert.equal(g.trace.gtm.length,0);
  g.phase('shift-only');await page.locator('#sstCookieSettings').click();await page.locator('[data-consent="shift"]').click();await page.waitForTimeout(400);assert.equal(g.trace.gtm.length,0,'SHIFT-only permission loaded Google');
  g.phase('analytics-granted');await page.locator('#sstCookieSettings').click();await page.locator('[data-consent="analytics"]').click();await page.waitForTimeout(3000);const granted=await state(page);assert.equal(granted.disabled,false);assert.equal(g.trace.gtm.filter(x=>new URL(x.url).pathname==='/gtm.js').length,1,'exactly one GTM container request');assert(g.trace.gtm.every(x=>['GTM-PSJVW9XR','G-Y7BV5KY6RR'].includes(new URL(x.url).searchParams.get('id'))),'unapproved tracker identity');
  g.phase('withdrawn');await page.locator('#sstCookieSettings').click();await page.locator('[data-consent="necessary"]').click();await page.waitForTimeout(1000);const withdrawn=await state(page);assert.equal(withdrawn.disabled,true);assert.equal(withdrawn.choice.analytics,false);assert.equal(withdrawn.choice.marketing,false);
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(1000);assert.equal(g.trace.gtm.filter(x=>x.phase==='withdrawn').length,0,'GTM restarted after withdrawal');
  await page.screenshot({path:dir+'/'+name+'-consent.png',fullPage:false});
  const result={before,granted,withdrawn,trace:g.trace,errors,gaReceipt:'not tested: collection intercepted'};writeFileSync(dir+'/'+name+'-consent.json',JSON.stringify(result,null,2));return result;
 }finally{writeFileSync(dir+'/'+name+'-raw-requests.json',JSON.stringify(g.trace,null,2));await g.context.close();}});
 if(name.endsWith('desktop'))for(const path of ['/member-login','/start-here','/shift-health','/programme?token=FICTIONAL_PRIVACY_CANARY','/programme#FICTIONAL_PRIVACY_CANARY'])await check(name+' suppress '+path,async()=>{const g=await guarded(browser,viewport,true),page=await g.context.newPage();try{const r=await page.goto(LIVE+path,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(1000);const s=await state(page);assert.equal(g.trace.gtm.length,0,'private route attempted Google load');assert.equal(g.trace.telemetry.length,0,'private route attempted telemetry');assert.equal(s.suppressed,true);return {url:page.url(),status:r.status(),state:s,trace:g.trace};}finally{await g.context.close();}});
 // Bounded lab samples, not Core Web Vitals or a production load test.
 if(name.startsWith('chromium'))for(const path of ['/','/programme','/shift-health','/shift-newsroom','/about','/member-login'])await check(name+' performance '+path,async()=>{const g=await guarded(browser,viewport),page=await g.context.newPage();try{
  await page.addInitScript(()=>{window.__shiftLab={lcp:null,cls:0};try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__shiftLab.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__shiftLab.cls+=e.value}).observe({type:'layout-shift',buffered:true});}catch{}});
  const r=await page.goto(LIVE+path,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(2000);const metrics=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {url:location.href,title:document.title,h1:document.querySelectorAll('h1').length,viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,ttfbMs:n.responseStart-n.startTime,domContentLoadedMs:n.domContentLoadedEventEnd,lcpMs:window.__shiftLab.lcp,cls:window.__shiftLab.cls,transferBytes:n.transferSize,resourceCount:performance.getEntriesByType('resource').length};});metrics.name=name;metrics.status=r.status();report.performance.push(metrics);assert.equal(r.status(),200);return metrics;
 }finally{await g.context.close();}});
 await browser.close();
}
await check('Real preview data lifecycle, account isolation, health erasure and bounded reads',async()=>{
 const a=await pwRequest.newContext({baseURL:PREVIEW,extraHTTPHeaders:{Origin:PREVIEW}}),b=await pwRequest.newContext({baseURL:PREVIEW,extraHTTPHeaders:{Origin:PREVIEW}}),events=[];
 async function api(c,path,method='GET',data,status=200){assert(path.startsWith('/'));const r=await c.fetch(path,{method,...(data===undefined?{}:{data}),timeout:20000});const body=await r.json().catch(()=>({}));assert.equal(r.status(),status,path+' '+JSON.stringify(body));return {body,headers:r.headers()};}
 try{const meta=(await api(a,'/__preview/meta')).body;assert.equal(meta.source,process.env.PREVIEW_SOURCE_SHA);assert.equal(meta.productionBindings,false);
  for(const c of [a,b]){const r=await c.post('/__preview/start',{maxRedirects:0});assert.equal(r.status(),303,'create fictional reviewer');}
  const original=(await api(a,'/v1/member/details')).body;const {email,...details}=original.details;Object.assign(details,{firstName:'Fictional assurance',address1:'12 FICTIONAL ASSURANCE ROAD',town:'Exampleton',postcode:'SK10 1AA',phone:'07700 900123'});
  await api(a,'/v1/member/details','PATCH',{details,revision:original.revision,operationId:randomUUID()});
  const ex=await api(a,'/v1/privacy/export','POST',{});assert.equal(ex.body.memberAccountDetails.address1,details.address1);assert(/no-store/.test(ex.headers['cache-control']));assert(!JSON.stringify(ex.body).match(/password_hash|token_hash|session_token/));events.push('Real routed export contains own current address and excludes credential fields');
  const other=(await api(b,'/v1/privacy/export','POST',{})).body;assert(!JSON.stringify(other).includes(details.address1));events.push('Second account export cannot see the first account address');
  await api(a,'/v1/consents','POST',{type:'my_shift_health_tracking',granted:true},201);
  await api(a,'/v1/check-ins','POST',{mood:'OK',note:'FICTIONAL_HEALTH_ERASURE_CANARY'},201);
  const pre=(await api(a,'/v1/privacy/export','POST',{})).body;assert(JSON.stringify(pre).includes('FICTIONAL_HEALTH_ERASURE_CANARY'));
  await api(a,'/v1/privacy/health-tracking','DELETE');
  const post=(await api(a,'/v1/privacy/export','POST',{})).body;assert(!JSON.stringify(post).includes('FICTIONAL_HEALTH_ERASURE_CANARY'));assert.equal(post.memberAccountDetails.address1,details.address1);assert.equal(post.user.email,email);events.push('Health erasure removes fictional check-in from full export but retains home address and account');
  await api(a,'/v1/check-ins','POST',{mood:'OK',note:'not accepted after withdrawal'},409);events.push('Withdrawn health consent blocks later health saves');
  const times=[];for(let batch=0;batch<3;batch++)await Promise.all(Array.from({length:4},async()=>{const start=performance.now(),r=await api(a,'/v1/member/details');assert.equal(r.body.details.address1,details.address1);times.push(performance.now()-start);}));events.push('12 preview reads, maximum concurrency 4, all retain exact saved address');
  await api(a,'/v1/privacy/account','DELETE',undefined,202);await api(a,'/v1/member/details','GET',undefined,401);await api(a,'/v1/privacy/export','POST',{},401);events.push('Deletion request acknowledges receipt (not full erasure) and revokes access to details/export');
  return {events,boundedReadLatencyMs:times,fullAccountErasure:'not claimed: human fulfilment remains separate',storesTested:'D1 only, not KV/R2/external processors'};
 }finally{await a.dispose();await b.dispose();}
});
persist();console.log(JSON.stringify({source:report.source,checks:report.checks.map(({name,status,error})=>({name,status,error})),performance:report.performance,failures:report.failures},null,2));if(report.failures.length)process.exitCode=1;
