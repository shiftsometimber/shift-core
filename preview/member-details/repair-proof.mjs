// Actual published tags, intercepted collection, candidate-only response replay.
// No production deployment, data writes, real login, email, payment or GA receipt.
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {singleDispatchHtmlAsset,legacyHelperSha256} from '../../activation-measurement/single-dispatch.mjs';
import {stabilisePublicHtml} from '../../public-startup-stability.mjs';
const {chromium,webkit}=await import('playwright');
const LIVE='https://shiftsometimber.co.uk',OUT='/tmp/shift-repair-proof';mkdirSync(OUT,{recursive:true});
const report={at:new Date().toISOString(),source:process.env.PREVIEW_SOURCE_SHA||process.env.GITHUB_SHA,mode:'Live anonymous reads with candidate HTML/asset replay. Telemetry intercepted. Session timing controlled equally for comparison. Not physical devices, field CWV, GA receipt or a production release.',checks:[],failures:[]};
const save=(name,v)=>writeFileSync(OUT+'/'+name,typeof v==='string'?v:JSON.stringify(v,null,2));
const hash=s=>createHash('sha256').update(s).digest('hex');
async function check(name,fn){try{const result=await fn();report.checks.push({name,status:'pass',result});}catch(e){const r={name,status:'fail',error:String(e.stack||e)};report.checks.push(r);report.failures.push(r);}save('report.json',report);}
async function context(browser,width,candidate,{stored=false,slowSession=false}={}){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'reduce'}),trace={collection:[],gtm:[],assets:[],blocked:[],errors:[]};
 if(stored)await context.addInitScript(()=>localStorage.setItem('sstConsentV3',JSON.stringify({necessary:true,analytics:true,acquisition:false,marketing:false})));
 await context.addInitScript(()=>{window.__repair={shifts:[],withdrawalAt:null,clsSupported:!!PerformanceObserver.supportedEntryTypes?.includes('layout-shift')};try{if(window.__repair.clsSupported)new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__repair.shifts.push({value:e.value,time:e.startTime,nodes:(e.sources||[]).map(s=>({id:s.node?.id,cls:s.node?.className,previous:s.previousRect,current:s.currentRect}))});}).observe({type:'layout-shift',buffered:true});}catch{}window.addEventListener('sst:analytics-consent',e=>{if(e.detail?.analytics===false)window.__repair.withdrawalAt=Date.now()});});
 await context.route('**/*',async route=>{const request=route.request(),u=new URL(request.url());
  if(u.pathname==='/cdn-cgi/rum'||/(^|\.)(google-analytics\.com|analytics\.google\.com|doubleclick\.net)$/.test(u.hostname)||(u.hostname==='cloudflareinsights.com'&&request.method()!=='GET')){trace.collection.push({at:Date.now(),url:request.url(),method:request.method(),body:request.postData()});return route.fulfill({status:204,body:''});}
  if(!['GET','HEAD','OPTIONS'].includes(request.method())){trace.blocked.push({path:u.pathname,method:request.method()});return route.fulfill({status:403,contentType:'application/json',body:'{"error":"read_only_proof"}'});}
  if(u.hostname==='www.googletagmanager.com')trace.gtm.push({url:request.url(),at:Date.now()});
  if(slowSession&&u.pathname==='/v1/me'){await new Promise(r=>setTimeout(r,900));return route.fulfill({status:401,contentType:'application/json',body:'{"error":"unauthenticated"}'});}
  if(candidate&&u.hostname==='shiftsometimber.co.uk'&&u.pathname==='/analytics-events-v31b.js'){
   const r=await route.fetch(),before=await r.text(),patched=await singleDispatchHtmlAsset(new Request(request.url()),new Response(before,{status:r.status(),headers:r.headers()}));
   trace.assets.push({path:u.pathname,before:hash(before),authority:patched.headers.get('X-Shift-Analytics-Dispatch')});
   return route.fulfill({status:patched.status,headers:Object.fromEntries(patched.headers),body:await patched.text()});
  }
  if(candidate&&request.isNavigationRequest()&&u.hostname==='shiftsometimber.co.uk'&&['/programme','/member-login'].includes(u.pathname)){
   const r=await route.fetch(),before=await r.text(),after=stabilisePublicHtml(u.pathname,before),headers=r.headers();delete headers['content-length'];delete headers.etag;delete headers['content-encoding'];trace.assets.push({path:u.pathname,before:hash(before),after:hash(after),changed:before!==after});return route.fulfill({status:r.status(),headers,body:after});
  }
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',e=>trace.errors.push(String(e)));
 return {context,page,trace};
}
function counts(trace){const out={};for(const r of trace.collection){const u=new URL(r.url);if(!u.hostname.endsWith('google-analytics.com'))continue;const lines=[u.search.slice(1),...(r.body||'').split(/\r?\n/)];for(const line of lines){const name=new URLSearchParams(line).get('en');if(name)out[name]=(out[name]||0)+1;}}return out;}
assert.deepEqual(counts({collection:[{url:'https://www.google-analytics.com/g/collect?en=page_view',body:''},{url:'https://www.google-analytics.com/g/collect?v=2',body:'en=shift_action\nen=shift_action'}]}),{page_view:1,shift_action:2},'saved request parser contract');
async function snapshot(page){return page.evaluate(()=>({cls:window.__repair.clsSupported?window.__repair.shifts.reduce((s,x)=>s+x.value,0):null,mainText:document.querySelector('main')?.innerText.replace(/\s+/g,' ').trim(),shifts:window.__repair.shifts,viewport:innerWidth,width:document.documentElement.scrollWidth,rects:[...document.querySelectorAll('header.site-header,main,.sst-service-bridge,#previewAuth')].map(n=>({selector:n.tagName+'#'+n.id+'.'+n.className,rect:n.getBoundingClientRect().toJSON(),display:getComputedStyle(n).display})),controls:[...document.querySelectorAll('#previewAuth input,#previewAuth button')].map(n=>({tag:n.tagName,name:n.name,type:n.type,text:n.tagName==='BUTTON'?n.textContent:null,hidden:n.hidden})),privateVisible:!!document.querySelector('#previewMember')&&getComputedStyle(document.querySelector('#previewMember')).display!=='none'}));}
for(const[typeName,type]of [['chromium',chromium],['webkit',webkit]]){const browser=await type.launch({headless:true});try{for(const width of [390,1440]){
 const name=typeName+'-'+width;
 for(const path of ['/programme','/member-login'])await check(name+' stable startup '+path,async()=>{
  const data={};for(const candidate of [false,true]){const label=candidate?'candidate':'baseline',g=await context(browser,width,candidate,{slowSession:true});try{
   await g.page.goto(LIVE+path,{waitUntil:'domcontentloaded',timeout:45000});
   if(candidate&&path==='/member-login'){const p=await g.page.evaluate(()=>({state:document.body.dataset.memberSession,privateHidden:getComputedStyle(document.querySelector('#previewMember')).display==='none',layout:document.body.dataset.loginLayout}));assert.equal(p.layout,'stable-v1');assert(p.privateHidden,'private content must never be exposed during session check');}
   await g.page.waitForTimeout(3000);await g.page.evaluate(()=>document.fonts.ready);data[label]=await snapshot(g.page);data[label].trace=g.trace;
   assert.equal(data[label].width,width);assert.equal(g.trace.errors.length,0);
   await g.page.screenshot({path:OUT+'/'+name+'-'+path.slice(1)+'-'+label+'.png',fullPage:true});
   if(candidate){assert(g.trace.assets.find(x=>x.path===path)?.changed,'candidate wrapper did not recognise page');if(path==='/programme')assert.equal(await g.page.locator('.sst-service-bridge').count(),1);else{assert.equal(await g.page.locator('#previewAuth').isVisible(),true);assert.equal(data[label].privateVisible,false);await g.page.locator('[data-forgot-password]').click();assert.equal(await g.page.locator('#previewReset').isVisible(),true);await g.page.locator('[data-reset-cancel]').click();assert.equal(await g.page.locator('#previewRegister').isVisible(),true);}}
  }finally{await g.context.close();}}
  save(name+'-'+path.slice(1)+'-layout.json',data);
  assert.equal(data.candidate.mainText,data.baseline.mainText,'settled page content changed');assert.deepEqual(data.candidate.controls,data.baseline.controls,'settled auth controls changed');assert.equal(data.candidate.rects.length,data.baseline.rects.length);for(let i=0;i<data.baseline.rects.length;i++)for(const dim of ['x','y','width','height'])assert(Math.abs(data.candidate.rects[i].rect[dim]-data.baseline.rects[i].rect[dim])<1,'settled '+dim+' changed: '+JSON.stringify({before:data.baseline.rects[i],after:data.candidate.rects[i]}));
  if(typeName==='chromium'){assert(data.candidate.cls<0.1,'candidate initial CLS remains elevated');assert(data.candidate.cls<data.baseline.cls,'no improvement in controlled baseline comparison');}
  return {baselineCLS:data.baseline.cls,candidateCLS:data.candidate.cls,settledGeometry:'unchanged within 1px',authHandlers:path==='/member-login'?'reset open/back works; private content remains hidden':'not applicable'};
 });
 await check(name+' single analytics dispatch and withdrawal',async()=>{
  const result={};for(const candidate of [false,true]){const label=candidate?'candidate':'baseline',g=await context(browser,width,candidate);try{
   await g.page.goto(LIVE+'/programme',{waitUntil:'domcontentloaded',timeout:45000});await g.page.waitForTimeout(1500);assert.equal(g.trace.gtm.length,0);assert.equal(Object.keys(counts(g.trace)).length,0);
   await g.page.locator('[data-consent="analytics"]').click();await g.page.waitForTimeout(4000);
   await g.page.evaluate(()=>{window.SSTAnalytics.track('shift_action',{shift_event_version:'v42m',shift_path:'/programme',shift_action_id:'closeout_probe_one',shift_destination:'programme'});window.SSTAnalytics.track('shift_action',{shift_event_version:'v42m',shift_path:'/programme',shift_action_id:'closeout_probe_two',shift_destination:'programme'});});await g.page.waitForTimeout(4000);
   const logical=await g.page.evaluate(()=>{const out={};for(const v of window.dataLayer||[])if(v?.event&&!v.event.startsWith('gtm.'))out[v.event]=(out[v.event]||0)+1;return out;}),outgoing=counts(g.trace);assert(logical.analytics_consent_granted===1);assert(logical.shift_action>=2);save(name+'-'+label+'-pre-withdrawal.json',{logical,outgoing,trace:g.trace});if(candidate){assert.equal(outgoing.analytics_consent_granted,logical.analytics_consent_granted);assert.equal(outgoing.shift_action,logical.shift_action);assert(g.trace.assets.some(x=>x.authority==='data-layer-only-v1'&&x.before===legacyHelperSha256));}else{assert.equal(outgoing.analytics_consent_granted,2*logical.analytics_consent_granted);}
   await g.page.locator('#sstCookieSettings').click();await g.page.locator('[data-consent="necessary"]').click();const withdrawn=await g.page.evaluate(()=>({at:window.__repair.withdrawalAt,disabled:window['ga-disable-G-Y7BV5KY6RR'],count:(window.dataLayer||[]).filter(x=>x?.event==='shift_action').length}));assert(withdrawn.at);assert.equal(withdrawn.disabled,true);await g.page.evaluate(()=>window.SSTAnalytics.track('shift_action',{shift_event_version:'v42m',shift_action_id:'must_not_send'}));await g.page.waitForTimeout(4000);assert.equal(await g.page.evaluate(()=>(window.dataLayer||[]).filter(x=>x?.event==='shift_action').length),withdrawn.count);
   const afterCutoff=g.trace.collection.filter(x=>x.at>withdrawn.at&&new URL(x.url).hostname.endsWith('google-analytics.com'));const beforeReload=g.trace.gtm.length;await g.page.reload({waitUntil:'domcontentloaded'});await g.page.waitForTimeout(1000);assert.equal(g.trace.gtm.length,beforeReload,'tag reloaded after withdrawal');
   result[label]={logical,outgoing,withdrawn,afterWithdrawalCollection:afterCutoff.length,trace:g.trace};save(name+'-'+label+'-events.json',result[label]);
  }finally{await g.context.close();}}
  return {baseline:result.baseline.outgoing,candidate:result.candidate.outgoing,logical:result.candidate.logical,afterWithdrawalCollection:result.candidate.afterWithdrawalCollection};
 });
 await check(name+' existing sensitive exclusions survive',async()=>{const results=[];for(const path of ['/member-login','/programme?token=FICTIONAL_REPAIR_CANARY','/programme#FICTIONAL_REPAIR_CANARY']){const g=await context(browser,width,true,{stored:true});try{await g.page.goto(LIVE+path,{waitUntil:'domcontentloaded',timeout:45000});await g.page.waitForTimeout(1000);assert.equal(g.trace.gtm.length,0);assert.equal(Object.keys(counts(g.trace)).length,0);assert.equal(await g.page.evaluate(()=>window.SST_ANALYTICS_SUPPRESSED),true);results.push(path);}finally{await g.context.close();}}return results;});
 await check(name+' actual deployed preview public routes',async()=>{
  const preview=process.env.PREVIEW_URL;assert.equal(preview,'https://shift-stabilisation-preview.matobrien.workers.dev');
  const g=await context(browser,width,false);try{
   const meta=await (await g.context.request.get(preview+'/__preview/meta')).json();assert.equal(meta.source,report.source);assert.equal(meta.productionBindings,false);
   const observations=[];for(const path of ['/programme','/member-login']){
    const response=await g.page.goto(preview+path,{waitUntil:'domcontentloaded',timeout:45000});assert.equal(response.status(),200);assert.equal(response.headers()['x-shift-startup-layout'],'stable-v1');await g.page.waitForTimeout(1600);
    const html=await g.page.content();if(path==='/programme'){assert(html.includes('data-programme-layout="stable-v1"'));assert.equal(await g.page.locator('.sst-service-bridge').count(),1);}else{assert(html.includes('data-login-layout="stable-v1"'));assert.equal(await g.page.locator('#previewAuth').isVisible(),true);assert.equal(await g.page.locator('#previewMember').isVisible(),false);}
    const view=await snapshot(g.page);assert.equal(view.width,width);observations.push({path,layoutHeader:response.headers()['x-shift-startup-layout'],width:view.width,cls:view.cls});await g.page.screenshot({path:OUT+'/'+name+'-hosted-'+path.slice(1)+'.png',fullPage:true});
   }
   const helper=await g.context.request.get(preview+'/analytics-events-v31b.js?v=52');assert.equal(helper.status(),200);assert.equal(helper.headers()['x-shift-analytics-dispatch'],'data-layer-only-v1');const script=await helper.text();assert(!script.includes("window.gtag('event',name"));assert.equal(helper.headers()['cache-control'],'no-store');assert.equal(g.trace.errors.length,0);
   return {source:meta.source,productionBindings:meta.productionBindings,observations,helperSha256:hash(script),browserErrors:g.trace.errors};
  }finally{await g.context.close();}
 });
}}finally{await browser.close();}}
console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
