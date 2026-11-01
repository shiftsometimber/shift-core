// Real HTTP documents/assets with browser caching enabled. Only API calls are
// replaced inside this isolated test browser; no production API writes occur.
import{evaluateBudget,rollbackAfterFailure,percentile}from'./performance-budget.mjs';
import{readFileSync,writeFileSync,existsSync,readdirSync}from'node:fs';import{createRequire}from'node:module';import assert from'node:assert/strict';
import{lifeBackRoutes}from'./scoped-source/member-experience/life-back-routes.mjs';
import{fixture}from'./scoped-source/health-passport/fixture.mjs';
import{wrapJourneyShopService}from'./scoped-source/member-experience/journey-shop-release.mjs';
const require=createRequire(import.meta.url),engines=require('/Users/shiftsometimberltd/SST/tools/apple-review-smoke/node_modules/playwright');
const phase=process.argv[2]||'baseline',engine=process.env.MY_TIMBER_BROWSER_ENGINE||'chromium',profile=process.env.MY_TIMBER_PROFILE||'good',kind=process.env.MY_TIMBER_SAMPLE_KIND||'both',selected=(process.env.MY_TIMBER_SAMPLE_SCREENS||'today,journey,shop,grub,fit,support,more').split(','),samples=20,variant=process.env.MY_TIMBER_VARIANT||'cache';
const origin='https://shiftsometimber.co.uk',paths={today:'/member/dashboard?view=app#today',journey:'/member/life-back/journey',shop:'/member/life-back/shop',grub:'/member/grub',fit:'/member/fit',support:'/member/dashboard?timber=support#today',more:'/member/dashboard?timber=stuff#today'},state=JSON.parse(readFileSync('performance-release-state.json')),f=fixture({seed:false}),rows=[],errors=[],network=[];
f.db.exec('ALTER TABLE progress_entries ADD COLUMN notes TEXT');f.db.exec('UPDATE consents SET granted=1');
const service=wrapJourneyShopService({fetch:async()=>new Response('retained',{status:404})}),native=['native-presentation.js','ios-store-presentation.js'].map(n=>readFileSync('/Users/shiftsometimberltd/SST/builds/apple-completion-20261024/MyTimber-1.0.0-8-unsigned.xcarchive/Products/Applications/MyTimber.app/'+n,'utf8'));
const file='performance-distribution-'+phase+'-'+engine+'-'+profile+'-'+variant+'-'+kind+'-'+selected.join('-')+'.json';
const prior=existsSync(file)?JSON.parse(readFileSync(file)):null;if(prior?.fixtureRevision===2&&(phase==='baseline'&&prior?.servingVersions?.join()===state.owners.map(o=>o.previousVersion).join()||prior?.source===state.source)&&prior.phase===phase&&prior.variant===variant)rows.push(...prior.rows.filter(r=>r.visit==='fresh'||r.visit==='warm'));
const result={servingVersions:state.owners.map(o=>phase==='baseline'?o.previousVersion:o.versionId),fixtureRevision:2,source:state.source,phase,engine,profile,variant,samplesPerScreen:samples,conditions:{viewport:'390x844 CSS px; DPR 2; touch; desktop browser mobile emulation',hardware:'SST Mac; hardware receipt performance-device.json',network:profile==='slow4g'?{downBps:200000,upBps:93750,addedLatencyMs:150,cpuRate:4}:{downBps:12500000,upBps:2500000,addedLatencyMs:20,cpuRate:1},webkit:'WebKit uses the unthrottled SST Mac connection; CDP throttling applies only to Chromium',api:'Normal application fetch/XHR paths are intercepted in the isolated browser; fictional identity and data, fixed 150ms API delay on good connection and 300ms on Slow 4G; no production API calls',cache:'Real browser HTTP cache enabled; no Playwright network routing',native:'Actual bundled build-8 native presentation scripts, unchanged; not a physical phone'},rows,errors,productionApiRequests:0,productionWrites:0,verified:false};
const checkedGroups=new Set(),beforeRows=phase==='live'?readdirSync('.').filter(n=>n.startsWith('performance-distribution-baseline-')&&n.endsWith('.json')).flatMap(n=>{const r=JSON.parse(readFileSync(n));return r.fixtureRevision===2&&r.verified&&r.variant==='cache'?r.rows:[]}):[];
const save=()=>{writeFileSync(file,JSON.stringify(result,null,2)+'\n');if(phase!=='live')return;for(const screen of selected)for(const visit of ['fresh','warm']){const key=screen+'/'+visit;if(checkedGroups.has(key))continue;const after=rows.filter(r=>r.screen===screen&&r.visit===visit);if(after.length<20)continue;const before=beforeRows.filter(r=>r.engine===engine&&r.profile===profile&&r.screen===screen&&r.visit===visit);checkedGroups.add(key);const b=percentile(before.map(r=>r.usableMs),.95),a=percentile(after.map(r=>r.usableMs),.95);result.liveGroupChecks??=[];result.liveGroupChecks.push({screen,visit,n:after.length,beforeP95Ms:b,liveP95Ms:a,passed:before.length>=20&&a<=b});writeFileSync(file,JSON.stringify(result,null,2)+'\n');if(before.length<20||a>b){const reason='Live n20 p95 '+screen+'/'+visit+': '+b+' -> '+a;rollbackAfterFailure(reason);throw Error(reason);}}};
const browser=await engines[engine].launch({headless:true});let context;
try{
 context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
 if(phase!=='live'){await context.setExtraHTTPHeaders({'Cloudflare-Workers-Version-Overrides':state.owners.map(o=>o.name+'="'+(phase==='baseline'?o.previousVersion:o.versionId)+'"').join(', '),...(phase==='candidate'?{'X-My-Timber-Performance-Stage':variant}:{})});}
 await context.exposeBinding('__mtFixtureAPI',async(_,{url,method,body})=>{
  await new Promise(r=>setTimeout(r,profile==='slow4g'?300:150));const u=new URL(url);
  if(u.pathname==='/v1/me')return{status:200,body:{user:{id:1,first_name:'Synthetic',email:'performance-fixture@example.invalid'}}};
  if(u.pathname==='/v1/life-back/journey'||u.pathname==='/v1/life-back'&&method==='POST'){const r=await service.fetch(new Request(url,{method,headers:{Cookie:'sst_session=test-only-member-1',Origin:origin,'Content-Type':'application/json'},...(method==='POST'?{body}:{})}),f.env,{});return{status:r.status,body:JSON.parse(await r.text())};}
  if(u.pathname==='/v1/life-back'){const r=await lifeBackRoutes(new Request(url,{headers:{Cookie:'sst_session=test-only-member-1'}}),f.env);return{status:r.status,body:JSON.parse(await r.text())};}
  if(u.pathname==='/v1/commerce/active-checkout')return{status:200,body:{ok:true,accountReference:'a'.repeat(64),attempts:[]}};
  if(u.pathname==='/v1/commerce/basket-quote')return{status:200,body:{ok:true,accountReference:'a'.repeat(64),quote:{items:[],subtotalPence:0,totalPence:0,deliveries:[]},recommendations:[],products:[]}};
  return{status:200,body:{ok:true,user:{id:1,first_name:'Synthetic'},memory:null,journey:{records:[]},progress:{entries:[],count:0},entries:[],orders:[],consents:[],units:{weight:'kg'},support:{},profile:{first_name:'Synthetic'},state:{},preferences:{}}};
 });
 await context.addInitScript(({native})=>{
  window.__MT_PERF_TEST__=true;window.__profilePending=0;window.__profileRequests=[];window.__profileSamples=[];
  try{localStorage.setItem('sstConsentV3',JSON.stringify({necessary:true,analytics:false,marketing:false,acquisition:false,updatedAt:new Date().toISOString()}));}catch{}
  const original=window.fetch.bind(window);
  window.fetch=async(input,init)=>{
   const u=new URL(input instanceof Request?input.url:input,location.href),method=(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase(),isAPI=u.pathname.startsWith('/v1/');
   if(!isAPI){if(!['GET','HEAD'].includes(method))throw Error('External write blocked by performance fixture');return original(input,init);}
   const at=Date.now();if(method==='GET')window.__profilePending++;
   try{let body=init?.body;if(body===undefined&&input instanceof Request&&method!=='GET')body=await input.clone().text();const data=await window.__mtFixtureAPI({url:u.href,method,body});window.__profileRequests.push({path:u.pathname,method,startAt:at,endAt:Date.now(),ms:Date.now()-at,status:data.status});return new Response(JSON.stringify(data.body),{status:data.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}
   finally{if(method==='GET')window.__profilePending--;}
  };
  const beacon=navigator.sendBeacon?.bind(navigator);navigator.sendBeacon=(url,data)=>{const u=new URL(url,location.href);if(u.pathname.startsWith('/v1/'))return true;return false;};
  const open=XMLHttpRequest.prototype.open,send=XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open=function(method,url,...args){this.__fixtureBlocked=new URL(url,location.href).pathname.startsWith('/v1/')||!['GET','HEAD'].includes(String(method).toUpperCase());return open.call(this,method,url,...args);};
  XMLHttpRequest.prototype.send=function(...args){if(this.__fixtureBlocked)throw Error('Unstubbed XHR blocked by performance fixture');return send.apply(this,args);};
  document.addEventListener('DOMContentLoaded',()=>{for(const script of native){const e=document.createElement('script');e.textContent=script;document.head.append(e);}}, {once:true});
  if(parent!==window)return;
  const visible=(e,w)=>{if(!e)return false;const s=w.getComputedStyle(e),r=e.getBoundingClientRect();return s.visibility!=='hidden'&&s.display!=='none'&&r.width>0&&r.height>0;};
  const usable=tab=>{try{const w=window.MT_PERFORMANCE?.current()||window,d=w.document,b=d.body;if(b?.dataset.memberSession!=='ready'||!b.hasAttribute('data-mt-shop-navigation')||w.__profilePending>0||(b.dataset.memberPage==='dashboard'&&!d.querySelector('#previewMember.is-ready:not([hidden])'))||!visible(d.querySelector('main'),w)||[...d.querySelectorAll('main [aria-busy=true]')].some(e=>visible(e,w)))return false;
   if(tab==='journey')return visible(d.querySelector('[data-tj-add=win],[data-tj-record-form],[data-tj-snapshot-text]'),w);
   if(tab==='shop')return visible(d.querySelector('.mt-shop-category'),w);
   if(tab==='support')return visible(d.querySelector('#mtUtility'),w)&&/999/.test(d.querySelector('#mtUtility').textContent);
   if(tab==='more')return visible(d.querySelector('#mtUtility a[href="/member/settings"]'),w);
   if(tab==='grub')return b.dataset.memberPage==='grub'&&!!d.querySelector('#grubSearchGo,#grubSearch');
   if(tab==='fit')return b.dataset.memberPage==='fit'&&[...d.querySelectorAll('main button')].some(e=>visible(e,w));
   return visible(d.querySelector('#todayActions'),w)&&[...d.querySelectorAll('#todayActions button')].some(e=>visible(e,w));
  }catch{return false}};
  window.__benchmarkUsable=usable;let stable=0,ack=null;
  document.addEventListener('click',e=>{const a=e.target.closest?.('[data-mt-shop-tab]');if(a){sessionStorage.setItem('__mt_benchmark_tap',JSON.stringify({tab:a.dataset.mtShopTab,at:Date.now()}));stable=0;ack=null;}},true);
  const tick=()=>{let tap;try{tap=JSON.parse(sessionStorage.getItem('__mt_benchmark_tap'))}catch{}
   if(tap){if(ack===null&&document.querySelector('#mtShopChrome[aria-busy=true],#mtShopPending'))ack=Date.now()-tap.at;if(usable(tap.tab)){if(++stable>=2){window.__profileSamples.push({...tap,usableMs:Date.now()-tap.at,ackMs:ack});sessionStorage.removeItem('__mt_benchmark_tap');stable=0;ack=null;}}else stable=0;}requestAnimationFrame(tick);
  };requestAnimationFrame(tick);
 },{native});
 const page=await context.newPage();page.on('pageerror',e=>errors.push({at:Date.now(),message:e.message,stack:e.stack}));context.on('request',r=>{if(r.url().includes('/v1/')){result.productionApiRequests++;throw Error('Production API escaped the synthetic fixture');}if(!['GET','HEAD'].includes(r.method())){result.productionWrites++;throw Error('Production write escaped the synthetic fixture');}network.push({at:Date.now(),url:r.url(),type:r.resourceType()});});
 let cdp;if(engine==='chromium'){cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:profile==='slow4g'?150:20,downloadThroughput:profile==='slow4g'?200000:12500000,uploadThroughput:profile==='slow4g'?93750:2500000,connectionType:profile==='slow4g'?'cellular4g':'wifi'});await cdp.send('Emulation.setCPUThrottlingRate',{rate:profile==='slow4g'?4:1});await cdp.send('Performance.enable');}
 const wait=tab=>page.waitForFunction(tab=>window.__benchmarkUsable?.(tab),tab,{timeout:60000});
 const open=async tab=>{await page.goto(origin+paths[tab],{waitUntil:'domcontentloaded',timeout:60000});await wait(tab);};
 async function tap(tab,visit,sample){
  const beforeRequests=network.length;await page.locator('#mtShopChrome [data-mt-shop-tab='+tab+']').click({timeout:30000});
  await page.waitForFunction(tab=>!sessionStorage.getItem('__mt_benchmark_tap')&&window.__profileSamples?.at(-1)?.tab===tab,tab,{timeout:60000});
  const data=await page.evaluate(()=>{
   const row=window.__profileSamples.at(-1),w=window.MT_PERFORMANCE?.current()||window,n=w.performance.getEntriesByType('navigation')[0],resources=w.performance.getEntriesByType('resource').filter(r=>w.performance.timeOrigin+r.startTime>=row.at),scripts=resources.filter(r=>r.initiatorType==='script'),requests=(w===window?window.__profileRequests:[...window.__profileRequests,...w.__profileRequests]).filter(r=>r.startAt>=row.at),identity=requests.filter(r=>r.path==='/v1/me'),loads=requests.filter(r=>r.path!=='/v1/me'&&r.method==='GET');
   return {...row,scriptResources:scripts.map(r=>({name:r.name.replace(location.origin,''),transferBytes:r.transferSize,encodedBytes:r.encodedBodySize,durationMs:Math.round(r.duration)})),ttfbMs:n&&w.performance.timeOrigin+n.requestStart>=row.at?Math.round(n.responseStart-n.requestStart):0,documentTransferBytes:n&&w.performance.timeOrigin+n.requestStart>=row.at?n.transferSize:0,externalJsTransferredBytes:scripts.reduce((v,r)=>v+r.transferSize,0),externalJsEncodedBytes:scripts.reduce((v,r)=>v+r.encodedBodySize,0),scriptRequests:scripts.length,identityRequests:identity.length,accountMs:identity.length?Math.max(...identity.map(r=>r.endAt))-Math.min(...identity.map(r=>r.startAt)):0,dataMs:loads.length?Math.max(...loads.map(r=>r.endAt))-Math.min(...loads.map(r=>r.startAt)):0,apiTimeline:requests,serverTiming:n?.serverTiming?.map(x=>({name:x.name,duration:x.duration}))||[],memberPage:w.document.body.dataset.memberPage,hasStableFrame:!!window.MT_PERFORMANCE};
  });
  if(cdp){const m=await cdp.send('Performance.getMetrics');data.chromiumCounters=Object.fromEntries(m.metrics.filter(x=>['ScriptDuration','TaskDuration','LayoutDuration','RecalcStyleDuration'].includes(x.name)).map(x=>[x.name,x.value]));}
  const row={phase,engine,profile,variant,screen:tab,visit,sample,...data,documentRequests:network.slice(beforeRequests).filter(r=>r.type==='document').length,pass:true};rows.push(row);save();
  if(phase!=='baseline'&&variant==='cache'&&visit==='warm')assert.equal(row.documentRequests,0,'A warm screen must retain its document');
 }
 if(kind==='fresh'||kind==='both')for(const tab of selected){for(let i=0;i<samples;i++){if(rows.some(r=>r.screen===tab&&r.visit==='fresh'&&r.sample===i))continue;await open(tab==='shop'?'journey':'shop');await tap(tab,'fresh',i);}console.log('DISTRIBUTION_FRESH',phase,engine,profile,variant,tab,'n',samples);save();}
 if(kind==='warm'||kind==='both'){
  await open('today');for(const tab of Object.keys(paths)){if(tab==='today')continue;await tap(tab,'prime',-1);}rows.splice(0,rows.length,...rows.filter(r=>r.visit!=='prime'));save();
  for(let i=0;i<samples;i++)for(const tab of selected){if(rows.some(r=>r.screen===tab&&r.visit==='warm'&&r.sample===i))continue;if(selected.length===1){await page.locator('#mtShopChrome [data-mt-shop-tab='+(tab==='today'?'shop':'today')+']').click();await wait(tab==='today'?'shop':'today');}await tap(tab,'warm',i);}
 }
 result.verified=selected.every(tab=>(kind==='warm'||rows.filter(r=>r.screen===tab&&r.visit==='fresh').length>=20)&&(kind==='fresh'||rows.filter(r=>r.screen===tab&&r.visit==='warm').length>=20));assert(result.verified);assert.equal(result.productionWrites,0);assert.equal(result.productionApiRequests,0);
 await page.screenshot({path:file.replace('.json','.png'),fullPage:false});save();if(phase==='live'){const budget=evaluateBudget('live',{requireCoverage:false});if(!budget.passed){rollbackAfterFailure(budget.failures);throw Error('Live p95 or privacy gate failed');}}console.log('DISTRIBUTION_COMPLETE',file,rows.length);
}catch(e){result.failure={message:e.message,at:new Date().toISOString()};save();if(phase==='live')rollbackAfterFailure('Browser verification: '+e.message);throw e;}finally{await context?.close();await browser.close();f.close();}
