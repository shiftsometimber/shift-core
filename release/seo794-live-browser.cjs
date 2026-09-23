const fs=require('fs'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.SEO_TOOLS+'/node_modules/playwright');
const base='https://shiftsometimber.co.uk';
const manifest=JSON.parse(fs.readFileSync('preview/seo-repairs/generated/render-manifest.json'));
const changes=JSON.parse(fs.readFileSync('preview/seo-repairs/generated/changes.json'));
const primary=['/','/guides/retatrutide-uk-guide','/shift-health','/articles/mounjaro-cost-uk'];
const checks=[];const failures=[];fs.mkdirSync('seo794-release-proof/screenshots',{recursive:true});
function record(name,pass,detail){checks.push({name,pass,detail});if(!pass)failures.push({name,detail});}
(async()=>{
 const snapshots=[];
 for(const [engine,width] of [[chromium,390],[chromium,1440],[webkit,390]]){
  const browser=await engine.launch({headless:true});
  const paths=engine===webkit?primary:manifest.records.map(x=>x.path);
  for(const path of paths){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference'});let errors=[],blocked=[];
   await context.route('**/*',route=>{const r=route.request();if(!['GET','HEAD'].includes(r.method())||/google-analytics\.com|analytics\.google\.com|doubleclick\.net|googleadservices\.com/.test(r.url())){blocked.push({url:r.url(),method:r.method()});return route.abort();}return route.continue();});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));const key=(engine===webkit?'webkit':'chromium')+'-'+width+'-'+path;
   let row={key,path,width,engine:engine===webkit?'webkit':'chromium'};
   try{
    const response=await page.goto(base+path,{waitUntil:'domcontentloaded',timeout:35000});await page.waitForTimeout(1500);
    row.status=response.status();row.headers=await response.allHeaders();
    row.dom=await page.evaluate(()=>{
     const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
     const main=document.querySelector('main');
     const schema=[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>{try{return JSON.parse(x.textContent)}catch(e){return {error:String(e)}}});
     return {title:document.title,canonical:[...document.querySelectorAll('link[rel=canonical]')].map(x=>x.href),h1:[...document.querySelectorAll('h1')].map(x=>({text:x.textContent.trim(),visible:visible(x)})),mainText:main?.innerText,bodyText:document.body.innerText,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,images:[...document.images].filter(visible).map(x=>({src:x.currentSrc,alt:x.getAttribute('alt'),loaded:x.complete&&x.naturalWidth>0,rect:{width:x.getBoundingClientRect().width,height:x.getBoundingClientRect().height},loading:x.loading})),primaryLinks:[...document.querySelectorAll('.desktop-nav a')].map(x=>({href:x.getAttribute('href'),text:x.textContent.trim()})),goodToTalkLinks:[...document.querySelectorAll('a')].filter(x=>x.textContent.trim()==='Good to Talk').map(x=>x.getAttribute('href')),cookieChoices:!!document.querySelector('#sstCookieSettings'),gtmScripts:[...document.scripts].filter(x=>x.src.includes('googletagmanager.com/gtm.js')).map(x=>x.src),schema,ticker:!!document.querySelector('#shift-public-news'),tickerBackground:document.querySelector('#shift-public-news')?getComputedStyle(document.querySelector('#shift-public-news')).backgroundColor:null};
    });
    record(key+' status',row.status===200,row.status);record(key+' live indexable',!/noindex/.test(row.headers['x-robots-tag']||''),row.headers['x-robots-tag']);
    record(key+' canonical',row.dom.canonical.length===1&&row.dom.canonical[0]==='https://shiftsometimber.co.uk'+(path==='/'?'/':path),row.dom.canonical);
    record(key+' one visible H1',row.dom.h1.filter(x=>x.visible).length===1,row.dom.h1);
    record(key+' no horizontal overflow',row.dom.scrollWidth<=row.dom.viewport+1,{width:row.dom.viewport,scroll:row.dom.scrollWidth});
    if(row.dom.ticker)record(key+' ticker contrast background',row.dom.tickerBackground==='rgb(5, 5, 5)',row.dom.tickerBackground);
    record(key+' source JSON valid',row.dom.schema.every(x=>!x.error),row.dom.schema.filter(x=>x.error));
    record(key+' no unfinished copy',!/(\[journal name\]|\{\{[^}]+\}\})/i.test(row.dom.mainText),null);
    record(key+' navigation labels preserved',row.dom.primaryLinks.map(x=>x.text).join('|')==='Start Here|The Programme|SHIFT Health|Treatments|My Timber',row.dom.primaryLinks);
    record(key+' direct Good to Talk',row.dom.goodToTalkLinks.length>0&&row.dom.goodToTalkLinks.every(x=>x==='/mens-mental-health'),row.dom.goodToTalkLinks);
    record(key+' cookie choices preserved',row.dom.cookieChoices,null);record(key+' tags withheld before consent',row.dom.gtmScripts.length===0,row.dom.gtmScripts);
    if(['/','/about','/start-here','/mens-mental-health'].includes(path))record(key+' ticker exclusion',!row.dom.ticker,row.dom.ticker);
    if(path==='/shift-health')record(key+' descriptive Health heading',row.dom.h1.some(x=>x.text==='SHIFT Health: what would you like to sort?'),row.dom.h1);
    if(path==='/medicine-news/glp-1-nutritional-paradox')record(key+' preliminary status visible',/preprint/i.test(row.dom.mainText)&&/not peer reviewed|not a peer-reviewed/i.test(row.dom.mainText),null);
    if(path==='/medicine-news/glp-1-analogs-research-update')record(key+' review named',/Biomedical Journal/.test(row.dom.mainText)&&/not a new clinical trial/.test(row.dom.mainText),null);
    const item=changes.find(x=>'/'+x.slug===path);
    if(item){const content=JSON.parse(item.after.content_package_json);record(key+' corrected headline',row.dom.h1.some(x=>x.text===content.headline),row.dom.h1);const sources=JSON.parse(item.after.source_evidence_json);if(sources.some(x=>x.issue_date))record(key+' distinct source dates',/First published online:/.test(row.dom.mainText)&&/Journal issue:/.test(row.dom.mainText),null);}
    if(primary.includes(path)){
     const trigger=page.locator('.menu-trigger');await trigger.click();record(key+' menu opens',await trigger.getAttribute('aria-expanded')==='true',null);await page.keyboard.press('Escape');record(key+' menu escape',await trigger.getAttribute('aria-expanded')==='false',null);record(key+' menu focus returns',await trigger.evaluate(x=>x===document.activeElement),null);const menuColours=await trigger.evaluate(x=>({bg:getComputedStyle(x).backgroundColor,fg:getComputedStyle(x).webkitTextFillColor}));record(key+' focused menu contrast',menuColours.bg==='rgb(231, 227, 218)'&&menuColours.fg==='rgb(5, 5, 5)',menuColours);
     const image=page.locator('main img').first();if(await image.count()){await image.scrollIntoViewIfNeeded();await page.waitForTimeout(500);record(key+' principal image loaded',await image.evaluate(x=>x.complete&&x.naturalWidth>0),await image.getAttribute('src'));await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(150);}
     const file=(engine===webkit?'webkit':'chromium')+'-'+width+'-'+(path==='/'?'home':path.replace(/\W+/g,'_'))+'.png';await page.screenshot({path:'seo794-release-proof/screenshots/'+file});row.screenshot=file;
    }
    if(width===390&&engine===chromium&&['/medicine-news/glp-1-analogs-research-update','/medicine-news/glp-1-nutritional-paradox','/mens-mental-health'].includes(path)){const file='chromium-390-'+path.replace(/\W+/g,'_')+'.png';await page.screenshot({path:'seo794-release-proof/screenshots/'+file,fullPage:true});row.screenshot=file;}
   }catch(e){row.error=String(e);record(key+' execution',false,String(e));}
   record(key+' no page errors',errors.length===0,errors);row.pageErrors=errors;row.blockedRequests=blocked;snapshots.push(row);await context.close();
  }
  await browser.close();
 }
 for(const path of ['/good-to-talk','/good-to-talk.html','/good-to-talk/']){
  const response=await fetch(base+path+'?from=seo-preview',{redirect:'manual'});const destination=new URL(response.headers.get('location')||base);
  record(path+' permanent direct redirect',response.status===301&&destination.pathname==='/mens-mental-health'&&destination.search==='?from=seo-preview',{status:response.status,location:destination.href});
 }
 const robot=await fetch(base+'/robots.txt');record('Live robots available',robot.status===200,null);
 fs.writeFileSync('seo794-release-proof/browser.json',JSON.stringify({checkedAt:new Date().toISOString(),base,candidateCommit:process.env.CANDIDATE_SHA,scope:'Live read-only public rendering and navigation. Analytics delivery blocked. Production deployment identity is recorded separately. Not authenticated journeys or physical Safari.',checks,snapshots,failures},null,2));
 console.log(JSON.stringify({contexts:snapshots.length,checks:checks.length,failed:failures.length,failures},null,2));
 if(failures.length)process.exitCode=1;
})().catch(e=>{fs.writeFileSync('seo794-release-proof/browser-fatal.txt',String(e.stack||e));console.error(e);process.exitCode=1});
