// Read-only diagnosis. No deployment, database query/export or account mutation.
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {chromium}=await import('/tmp/shift-diag/node_modules/playwright/index.mjs');
assert.equal(process.env.GITHUB_REF,'refs/heads/fix/member-details-20260922');
const out=process.env.DIAG_OUT;assert(out?.startsWith('/tmp/'));
mkdirSync(out+'/public-assets',{recursive:true});
const report={source:process.env.GITHUB_SHA,at:new Date().toISOString(),mode:'read-only; telemetry intercepted; no exports or production writes',assets:[],pages:[],inventory:[],failures:[]};
const hash=x=>createHash('sha256').update(x).digest('hex');
const save=(name,v)=>writeFileSync(out+'/'+name,typeof v==='string'?v:JSON.stringify(v,null,2));
async function read(url){const r=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error(url+' HTTP'+r.status);return r.text();}
// Public scripts are captured unmodified so duplicate tag owners can be identified.
for(const path of ['/programme','/member-login','/analytics-bootstrap-v1.js','/consent-v4a.js']){try{save('raw-'+path.slice(1).replaceAll('/','-')+(path.endsWith('.js')?'':'.html'),await read('https://shiftsometimber.co.uk'+path));}catch(e){report.failures.push(String(e));}}
try{save('published-gtm.js',await read('https://www.googletagmanager.com/gtm.js?id=GTM-PSJVW9XR'));}catch(e){report.failures.push(String(e));}
const browser=await chromium.launch({headless:true});
for(const width of [390,1440])for(const path of ['/programme','/member-login']){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage(),trace={writesBlocked:[],telemetry:[],errors:[]},pending=[];
 await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url());
  if(/google-analytics\.com$|analytics\.google\.com$|doubleclick\.net$/.test(u.hostname)||u.pathname==='/cdn-cgi/rum'||(u.hostname==='cloudflareinsights.com'&&r.method()!=='GET')){trace.telemetry.push({at:Date.now(),url:r.url(),body:r.postData()});return route.fulfill({status:204,body:''});}
  if(!['GET','HEAD','OPTIONS'].includes(r.method())){trace.writesBlocked.push({url:r.url(),method:r.method()});return route.fulfill({status:403,contentType:'application/json',body:'{"error":"read_only_diagnosis"}'});}
  return route.continue();
 });
 page.on('pageerror',e=>trace.errors.push(String(e)));
 page.on('response',r=>{if(!['script','stylesheet'].includes(r.request().resourceType()))return;pending.push((async()=>{try{const u=new URL(r.url());if(!['shiftsometimber.co.uk','www.googletagmanager.com'].includes(u.hostname))return;const bytes=await r.body();if(bytes.length>2000000)return;const file=hash(r.url()).slice(0,20)+(r.request().resourceType()==='script'?'.js':'.css');writeFileSync(out+'/public-assets/'+file,bytes);report.assets.push({url:r.url(),status:r.status(),file,sha256:hash(bytes)});}catch{}})());});
 await page.addInitScript(()=>{
  window.__diag={shifts:[],mutations:[],rects:[]};
  new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__diag.shifts.push({value:e.value,time:e.startTime,sources:(e.sources||[]).map(s=>({html:s.node?.outerHTML?.slice(0,1500),previous:s.previousRect,current:s.currentRect}))});}).observe({type:'layout-shift',buffered:true});
  new MutationObserver(list=>{for(const e of list){if(window.__diag.mutations.length>400)break;if(e.target===document.head||e.type==='attributes')window.__diag.mutations.push({time:performance.now(),type:e.type,attribute:e.attributeName,target:e.target?.outerHTML?.slice(0,300),added:[...e.addedNodes].map(n=>n.outerHTML?.slice(0,500))});}}).observe(document,{childList:true,attributes:true,subtree:true,attributeFilter:['class','style','hidden']});
  let count=0;const frame=()=>{if(++count<300){window.__diag.rects.push({time:performance.now(),rects:[...document.querySelectorAll('header,main,h1,.site-logo img,.auth-wrap,.auth-shell,.shift-public-news')].slice(0,14).map(n=>({tag:n.tagName,id:n.id,cls:n.className,rect:n.getBoundingClientRect().toJSON(),display:getComputedStyle(n).display}))});requestAnimationFrame(frame)}};requestAnimationFrame(frame);
 });
 try{await page.goto('https://shiftsometimber.co.uk'+path,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForTimeout(4500);
 const dom=await page.evaluate(()=>({diag:window.__diag,images:[...document.images].map(x=>({src:x.src,w:x.width,h:x.height,nw:x.naturalWidth,nh:x.naturalHeight})),scripts:[...document.scripts].map(s=>({src:s.src,text:s.src?'':s.text.slice(0,3000)})),styles:[...document.querySelectorAll('style')].map(s=>({id:s.id,text:s.textContent})),h1:[...document.querySelectorAll('h1')].map(n=>({text:n.textContent,display:getComputedStyle(n).display,rect:n.getBoundingClientRect().toJSON()}))}));
 save('layout-'+width+path+'.json',dom);await page.screenshot({path:out+'/layout-'+width+path+'.png',fullPage:false}).catch(()=>{});
 if(path==='/programme'){await page.locator('[data-consent="analytics"]').click();await page.waitForTimeout(5000);await page.evaluate(()=>window.gtag('event','shift_diagnostic_probe',{send_to:'G-Y7BV5KY6RR'}));await page.waitForTimeout(5000);save('analytics-'+width+'.json',{trace,layers:await page.evaluate(()=>(window.dataLayer||[]).map(x=>Object.prototype.toString.call(x)==='[object Arguments]'?[...x]:x))});}
 report.pages.push({width,path,cls:dom.diag.shifts.reduce((s,x)=>s+x.value,0)});
 }catch(e){report.failures.push({path,width,error:String(e)});}finally{await Promise.allSettled(pending);await context.close();}
}
await browser.close();
// Sanitised control-plane inventory; deliberately GET-only. Export can interrupt D1.
const token=process.env.CLOUDFLARE_API_TOKEN,account='9e5386dcf455be34c582d93f8bfc79e6';
function safe(v,key=''){if(v==null)return v;if(['env_vars','vars'].includes(key))return Object.keys(v).map(name=>({name,value:'NOT EXPORTED'}));if(key==='bindings')return v.map(b=>{const c={...b};delete c.text;delete c.value;delete c.secret;return c;});if(/token|secret|password|api_key/i.test(key)&&key!=='type')return '[NOT EXPORTED]';if(Array.isArray(v))return v.map(x=>safe(x));if(typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,safe(x,k)]));return v;}
for(const suffix of ['/workers/scripts/shift-core/deployments','/workers/scripts/shift-core/settings','/pages/projects/projectshift','/pages/projects/projectshift/deployments?per_page=5','/d1/database/88f40aed-cb23-4372-8c94-8a73f48bc847']){
 if(!token){report.inventory.push({path:suffix,status:'credential absent'});continue;}
 try{const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+suffix,{method:'GET',headers:{Authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(25000)});const b=await r.json();const clean=safe(b);save('cloudflare-'+hash(suffix).slice(0,12)+'.json',{path:suffix,http:r.status,body:clean});report.inventory.push({path:suffix,http:r.status,success:b.success===true});}catch(e){report.inventory.push({path:suffix,error:'Read failed: '+e.name});}
}
save('report.json',report);console.log(JSON.stringify({source:report.source,pages:report.pages,assets:report.assets.length,inventory:report.inventory,failures:report.failures}));
