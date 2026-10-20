const fs=require('fs'),assert=require('assert/strict'),{chromium,webkit}=require('/Users/shiftsometimberltd/SST/my-timber-experience-20261016-runtime-intake/node_modules/playwright');
const r=__dirname,mode=process.argv[2]||'candidate',origin='https://shiftsometimber.co.uk',out=r+'/'+mode+'-browser',changes=JSON.parse(fs.readFileSync(r+'/changes.json'));
const routes=['/','/start-here','/male-obesity','/member/dashboard','/medicine-preference','/assessment-walkthrough','/treatment-assessment-terms','/contact'];
const expected=[['Instagram','https://www.instagram.com/shiftsometimber'],['Facebook','https://www.facebook.com/ShiftSomeTimber'],['X','https://x.com/ShiftSomeTimber'],['YouTube','https://www.youtube.com/@ShiftSomeTimber']];
const tag='<script defer src="/assets/footer-social-links-v1.js?v=20261020"></script>';
const v42=changes.find(x=>x.path==='/assets/v42.js');
const loader=fs.readFileSync(r+'/after/'+v42.file,'utf8').slice(fs.readFileSync(r+'/before/'+v42.file,'utf8').length);
fs.mkdirSync(out,{recursive:true});
(async()=>{const cases=[];for(const[engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch({headless:true});try{for(const width of[390,1440])for(const routePath of routes){
 const ctx=await b.newContext({viewport:{width,height:900},serviceWorkers:'block'}),p=await ctx.newPage(),errors=[],socialRequests=[];
 p.on('pageerror',e=>errors.push(e.message));
 p.on('request',req=>{if(expected.some(x=>req.url().startsWith(x[1])))socialRequests.push(req.url())});
 if(mode==='candidate')await ctx.route('**/*',async route=>{
  const u=new URL(route.request().url());if(u.origin!==origin)return route.continue();
  if(u.pathname==='/assets/footer-social-links-v1.js')return route.fulfill({status:200,contentType:'application/javascript',body:fs.readFileSync(r+'/footer-social-links-v1.js')});
  if(u.pathname==='/assets/v42.js'){const res=await route.fetch();return route.fulfill({response:res,body:(await res.text())+loader});}
  if(route.request().isNavigationRequest()&&changes.some(x=>x.path===u.pathname+'.html')){const res=await route.fetch();return route.fulfill({response:res,body:(await res.text()).replace(/<\/head>/i,tag+'</head>')});}
  return route.continue();
 });
 await p.goto(origin+routePath,{waitUntil:'domcontentloaded'});
 const cookie=p.locator('button[data-consent="necessary"]');if(await cookie.count())await cookie.click();
 const nav=p.locator('#sst-footer-c nav[data-shift-footer-social]');await nav.waitFor({state:'attached'});await nav.scrollIntoViewIfNeeded();await nav.waitFor({state:'visible'});
 const data=await nav.evaluate(el=>({title:el.querySelector('strong').textContent,label:el.getAttribute('aria-label'),links:[...el.querySelectorAll('a')].map(a=>[a.textContent,a.getAttribute('href')]),inside:!!el.closest('#sst-footer-c .fc-legal-inner'),count:document.querySelectorAll('[data-shift-footer-social]').length,overflow:el.scrollWidth>el.clientWidth+1,bodyOverflow:document.documentElement.scrollWidth>innerWidth+1,rect:el.getBoundingClientRect().toJSON(),linksSize:[...el.querySelectorAll('a')].map(a=>({height:a.getBoundingClientRect().height,width:a.getBoundingClientRect().width})),colour:getComputedStyle(el.querySelector('a')).color,footerBackground:getComputedStyle(el.closest('.fc-legal')).backgroundColor}));
 assert.equal(data.title,'Follow SHIFT');assert.equal(data.label,'Follow SHIFT');assert.deepEqual(data.links,expected);assert(data.inside);assert.equal(data.count,1);assert(!data.overflow);assert(!data.bodyOverflow);assert(data.linksSize.every(x=>x.height>=44));
 const first=nav.locator('a').first();await first.focus();assert(await first.evaluate(el=>el===document.activeElement));await p.keyboard.press(engine==='webkit'?'Alt+Tab':'Tab');assert.equal(await p.evaluate(()=>document.activeElement.textContent),'Facebook');
 const outline=await nav.locator('a').nth(1).evaluate(el=>({style:getComputedStyle(el).outlineStyle,width:getComputedStyle(el).outlineWidth}));assert.notEqual(outline.style,'none');assert(parseFloat(outline.width)>=2);
 assert.deepEqual(socialRequests,[],'Footer must not contact social platforms before click');
 if(routePath==='/')await nav.screenshot({path:out+'/'+engine+'-'+width+'.png'});
 const newErrors=errors.filter(x=>!(/service.worker|ServiceWorker|register.*worker/i.test(x)));assert.deepEqual(newErrors,[]);
 cases.push({engine,width,path:routePath,...data,keyboard:true,errors,socialRequests});fs.writeFileSync(out+'/partial.json',JSON.stringify(cases,null,2));await ctx.close();
 }}finally{await b.close()}}
 fs.writeFileSync(out+'/receipt.json',JSON.stringify({pass:true,at:new Date().toISOString(),mode,cases},null,2));console.log(JSON.stringify({pass:true,mode,cases:cases.length}));
})().catch(e=>{console.error(e);process.exitCode=1});
