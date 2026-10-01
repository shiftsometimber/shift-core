const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {applySharedFooter,approvedFooter,legacyInstallStrip}=await import('../shared-footer.mjs');
 const {appPresentation,appClient}=await import('../preview/app-layout/presentation.mjs');
 const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE);
 fs.mkdirSync('footer-proof',{recursive:true});const results=[];
 const samples=[];
 for(const path of ['/','/start-here','/programme','/shift-health','/treatment-centre','/help','/contact','/privacy','/member-login','/member/dashboard','/member/grub','/member/fit']){
  const r=await fetch('https://shiftsometimber.co.uk'+path,{redirect:'follow',signal:AbortSignal.timeout(20000)});assert(r.ok,path+' HTTP '+r.status);const before=await r.text(),html=applySharedFooter(before);assert.equal(html.split(approvedFooter).length-1,1,path);assert.equal(applySharedFooter(html),html);
  assert.equal(before.split(legacyInstallStrip).join('').match(/<main\b[\s\S]*?<\/main>/i)?.[0],html.match(/<main\b[\s\S]*?<\/main>/i)?.[0],path+' main content changed');
  // Render the actual public HTML/CSS and footer client without starting unrelated
  // account, analytics or catalogue clients. Full response preservation is above;
  // actual member/app layout clients are exercised in the dedicated fixtures below.
  const rendered=html.replace(/<script\b(?![^>]*data-shift-shared-footer)[^>]*>[\s\S]*?<\/script>/gi,'');
  samples.push({name:path.replaceAll('/','-')||'home',html:rendered});
 }
 const shell='<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}main{padding:24px}</style></head><body data-member-chrome="v1" data-member-page="dashboard"><main><h1>Footer review</h1><p>Presentation fixture; no account data.</p></main></body></html>';
 for(const name of ['web','pwa','native','embedded']){
  let html=name==='web'?shell:appPresentation(shell,'/member/dashboard',name==='embedded');html=applySharedFooter(html);
  if(name!=='web')html=html.replace('</body>','<script>'+appClient+'</script></body>');
  if(name==='native')html=html.replace('</head>','<style id="my-timber-native-style">#myTimberApp,.my-timber-app-footer,#pwaReminderFirstRun,#pwaReminderSettings{display:none!important}</style></head>');
  samples.push({name:'member-'+name,html});
 }
 const assetCache=new Map();
 const asset=key=>{if(!assetCache.has(key))assetCache.set(key,(async()=>{const r=await fetch('https://shiftsometimber.co.uk'+key,{signal:AbortSignal.timeout(15000)});return {status:r.status,headers:{'content-type':r.headers.get('content-type')||'application/octet-stream'},body:Buffer.from(await r.arrayBuffer())};})());return assetCache.get(key);};
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch();try{for(const width of [320,390,768,1440])for(const sample of samples){
   const page=await browser.newPage({viewport:{width,height:1000}});
   await page.route('**/*',async route=>{const u=new URL(route.request().url());if(route.request().method()!=='GET'||/^\/(?:v1|api)\//.test(u.pathname))return route.fulfill({status:403,body:'Read-only preview'});if(u.pathname==='/__proof')return route.fulfill({status:200,contentType:'text/html',body:sample.html});if(!['footer-proof.invalid','shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(u.hostname))return route.abort();try{return route.fulfill(await asset(u.pathname+u.search));}catch{return route.abort();}});
   await page.goto('https://footer-proof.invalid/__proof',{waitUntil:'domcontentloaded'});await page.locator('#sst-footer-c').waitFor({state:'visible'});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   assert.equal(await page.locator('#sst-footer-c').count(),1);assert.equal(await page.locator('details.app-footer-details #sst-footer-c').count(),0);
   const state=await page.locator('#sst-footer-c').evaluate(el=>({background:getComputedStyle(el).backgroundColor,brand:getComputedStyle(el.querySelector('.footer-brand')).backgroundColor,legal:getComputedStyle(el.querySelector('.fc-legal')).backgroundColor,overflow:el.scrollWidth>el.clientWidth+1,sections:el.querySelectorAll('.fc-main>section').length,links:[...el.querySelectorAll('a')].map(a=>a.getAttribute('href'))}));
   assert.equal(state.background,'rgb(231, 227, 218)');assert.equal(state.brand,'rgb(5, 5, 5)');assert.equal(state.legal,'rgb(112, 119, 98)');assert(!state.overflow,sample.name+' overflow '+width);assert.equal(state.sections,6);
   if(sample.name==='member-native')assert.equal(await page.locator('.my-timber-app-footer').isVisible(),false,'Native app must retain existing installation-prompt suppression');
   if(width===390||width===1440)await page.locator('#sst-footer-c').screenshot({path:'footer-proof/'+engine+'-'+sample.name+'-'+width+'.png'});results.push({engine,width,name:sample.name,...state});fs.writeFileSync('footer-proof/results.json',JSON.stringify(results,null,2));console.log('PASS '+engine+' '+width+' '+sample.name);await page.close();
  }}finally{await browser.close();}
 }
 fs.writeFileSync('footer-proof/results.json',JSON.stringify(results,null,2));console.log('PASS '+results.length+' rendered footer checks; source forms and main content preserved');
})().catch(e=>{console.error(e);process.exitCode=1});
