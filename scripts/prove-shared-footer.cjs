const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {applySharedFooter,approvedFooter}=await import('../shared-footer.mjs');
 const {appPresentation,appClient}=await import('../preview/app-layout/presentation.mjs');
 const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE);
 fs.mkdirSync('footer-proof',{recursive:true});const results=[];
 const samples=[];
 for(const path of ['/','/programme','/shift-health','/treatment-centre','/help','/contact','/privacy','/member-login','/member/dashboard','/member/grub','/member/fit']){
  const r=await fetch('https://shiftsometimber.co.uk'+path,{redirect:'follow'});assert(r.ok,path+' HTTP '+r.status);const before=await r.text(),html=applySharedFooter(before);assert.equal(html.split(approvedFooter).length-1,1,path);assert.equal(applySharedFooter(html),html);
  assert.equal(before.match(/<main\b[\s\S]*?<\/main>/i)?.[0],html.match(/<main\b[\s\S]*?<\/main>/i)?.[0],path+' main content changed');samples.push({name:path.replaceAll('/','-')||'home',html});
 }
 const shell='<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}main{padding:24px}</style></head><body data-member-chrome="v1" data-member-page="dashboard"><main><h1>Footer review</h1><p>Presentation fixture; no account data.</p></main></body></html>';
 for(const name of ['web','pwa','native','embedded']){
  let html=name==='web'?shell:appPresentation(shell,'/member/dashboard',name==='embedded');html=applySharedFooter(html);
  if(name!=='web')html=html.replace('</body>','<script>'+appClient+'</script></body>');
  if(name==='native')html=html.replace('</head>','<style>#myTimberApp,.my-timber-app-footer,#pwaReminderFirstRun,#pwaReminderSettings{display:none!important}</style></head>');
  samples.push({name:'member-'+name,html});
 }
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch();try{for(const width of [320,390,768,1440])for(const sample of samples){
   const page=await browser.newPage({viewport:{width,height:1000}});
   await page.route('**/*',async route=>{const u=new URL(route.request().url());if(route.request().method()!=='GET'||/^\/(?:v1|api)\//.test(u.pathname))return route.fulfill({status:403,body:'Read-only preview'});if(u.pathname==='/__proof')return route.fulfill({status:200,contentType:'text/html',body:sample.html});try{const r=await fetch('https://shiftsometimber.co.uk'+u.pathname+u.search);return route.fulfill({status:r.status,headers:{'content-type':r.headers.get('content-type')||'application/octet-stream'},body:Buffer.from(await r.arrayBuffer())});}catch{return route.abort();}});
   await page.goto('https://footer-proof.invalid/__proof',{waitUntil:'domcontentloaded'});await page.locator('#sst-footer-c').waitFor({state:'visible'});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   assert.equal(await page.locator('#sst-footer-c').count(),1);assert.equal(await page.locator('details.app-footer-details #sst-footer-c').count(),0);
   const state=await page.locator('#sst-footer-c').evaluate(el=>({background:getComputedStyle(el).backgroundColor,brand:getComputedStyle(el.querySelector('.footer-brand')).backgroundColor,legal:getComputedStyle(el.querySelector('.fc-legal')).backgroundColor,overflow:el.scrollWidth>el.clientWidth+1,sections:el.querySelectorAll('.fc-main>section').length,links:[...el.querySelectorAll('a')].map(a=>a.getAttribute('href'))}));
   assert.equal(state.background,'rgb(231, 227, 218)');assert.equal(state.brand,'rgb(5, 5, 5)');assert.equal(state.legal,'rgb(112, 119, 98)');assert(!state.overflow,sample.name+' overflow '+width);assert.equal(state.sections,6);
   if(width===390||width===1440)await page.locator('#sst-footer-c').screenshot({path:'footer-proof/'+engine+'-'+sample.name+'-'+width+'.png'});results.push({engine,width,name:sample.name,...state});await page.close();
  }}finally{await browser.close();}
 }
 fs.writeFileSync('footer-proof/results.json',JSON.stringify(results,null,2));console.log('PASS '+results.length+' rendered footer checks; source forms and main content preserved');
})().catch(e=>{console.error(e);process.exitCode=1});

