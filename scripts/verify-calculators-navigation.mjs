import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {reconcilePublicDocument} from '../public-shell-contract.mjs';
import {CALCULATORS_MENU_SCRIPT} from '../public-calculators-menu.mjs';

// Read-only verification. Preview uses actual public HTML, the candidate shell
// and the candidate addition to the existing v42 asset. Live mode changes none.
// No sign-in, form submission, customer writes or production configuration changes.
const origin='https://shiftsometimber.co.uk';
const live=process.env.CALCULATORS_MODE==='live';
const out='calculators-navigation-evidence';
const paths=['/','/tools','/programme','/shift-health','/treatment-centre','/articles/mounjaro-cost-uk','/about','/privacy'];
const pages=new Map();
const report={mode:live?'live':'captured-production-preview',source:process.env.GITHUB_SHA||null,startedAt:new Date().toISOString(),pages:[],browsers:[]};
await mkdir(out,{recursive:true});
const slug=path=>path==='/'?'home':path.slice(1).replaceAll('/','-');
const digest=text=>createHash('sha256').update(text).digest('hex');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function dismissCookieNotice(page){
 await page.waitForTimeout(750);
 // Use the real notice controls, never force clicks through an overlay.
 const essential=page.getByRole('button',{name:/reject all|reject optional|essential only|only essential|necessary only/i}).first();
 if(await essential.isVisible().catch(()=>false))await essential.click();
 const acknowledgement=page.locator('.cookie-banner [data-cookie-ack]').first();
 if(await acknowledgement.isVisible().catch(()=>false)){
  await acknowledgement.click();
  await acknowledgement.waitFor({state:'hidden'});
 }
}
async function followToolsLink(page,link){
 // These are ordinary document links, including a reload when already on /tools.
 // Arm the navigation wait before clicking so the next test cannot abort it.
 await Promise.all([
  page.waitForNavigation({waitUntil:'domcontentloaded',timeout:60000}),
  link.click()
 ]);
 assert.equal(new URL(page.url()).pathname,'/tools');
 await page.locator('main').waitFor({state:'visible'});
}
try{
 if(live){
  // The existing gated production workflow runs independently after merge.
  let ready=false;
  for(let attempt=0;attempt<36;attempt++){
   const response=await fetch(origin+'/tools?navigation-verification='+Date.now(),{signal:AbortSignal.timeout(30000)});
   const body=await response.text();
   if(response.ok&&/href="\/tools"(?: aria-current="page")?>Calculators &amp; Tools<\/a>/.test(body)){ready=true;break;}
   await pause(10000);
  }
  assert.ok(ready,'The restored navigation has not reached production; do not mark live.');
 }
 for(const path of paths){
  const response=await fetch(origin+path,{signal:AbortSignal.timeout(45000)});
  assert.equal(response.status,200,path);
  const before=await response.text();
  const html=live?before:reconcilePublicDocument(before,path);
  const drawer=html.match(/<aside\b[^>]*id="site-drawer"[^>]*>[\s\S]*?<\/aside>/i)?.[0];
  const footer=html.match(/<footer\b[^>]*class="site-footer"[^>]*>[\s\S]*?<\/footer>/i)?.[0];
  for(const [name,region] of [['drawer',drawer],['footer',footer]]){
   assert.ok(region,path+' has '+name);
   assert.equal((region.match(/href="\/tools"/g)||[]).length,1,path+' '+name);
   assert.match(region,/Calculators &amp; Tools/);
  }
  pages.set(path,html);
  await writeFile(out+'/'+slug(path)+'.html',html);
  report.pages.push({path,status:response.status,originalSHA256:digest(before),verifiedSHA256:digest(html),worker:response.headers.get('x-shift-build')||response.headers.get('x-shift-source-sha'),pass:true});
 }
 const assetResponse=await fetch(origin+'/assets/v42.js',{signal:AbortSignal.timeout(45000)});
 assert.equal(assetResponse.status,200,'existing shared navigation asset');
 const originalAsset=await assetResponse.text();
 const candidateAsset=live?originalAsset:originalAsset+'\n'+CALCULATORS_MENU_SCRIPT;
 // Bundling can reformat a serialized function. Live acceptance is the actual
 // unmodified script plus successful rendered-menu clicks, not source whitespace.
 if(live)assert.ok(originalAsset.includes('Calculators & Tools'),'Production browser-menu label must be present, not injected by the test.');
 await writeFile(out+'/v42.js',candidateAsset);
 report.navigationAsset={path:'/assets/v42.js',originalSHA256:digest(originalAsset),verifiedSHA256:digest(candidateAsset),candidateApplied:!live};
 for(const [name,engine,viewport] of [['desktop-chromium',chromium,{width:1440,height:1000}],['phone-chromium',chromium,{width:375,height:812}],['phone-webkit',webkit,{width:390,height:844}]]){
  const browser=await engine.launch({headless:true});
  let page;
  try{
   const context=await browser.newContext({viewport});
   // Preview substitutes candidate documents and the candidate navigation asset.
   // Live GETs go directly to production, retaining real response/security headers.
   // Both modes block writes and third-party tracking.
   await context.route('**/*',async route=>{
    const request=route.request();
    const url=new URL(request.url());
    if(!['GET','HEAD'].includes(request.method()))return route.abort();
    if(url.origin!==origin)return route.abort();
    if(!live&&request.isNavigationRequest()&&pages.has(url.pathname))return route.fulfill({status:200,contentType:'text/html',body:pages.get(url.pathname)});
    if(!live&&url.pathname==='/assets/v42.js')return route.fulfill({status:200,contentType:'application/javascript',body:candidateAsset});
    return route.continue();
   });
   page=await context.newPage();
   page.setDefaultTimeout(15000);
   const checks=[];
   for(const path of ['/','/tools','/programme','/shift-health','/articles/mounjaro-cost-uk']){
    console.log('Checking '+name+' '+path);
    await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:60000});
    await dismissCookieNotice(page);
    const footer=page.locator('footer.site-footer a[href="/tools"]');
    assert.equal(await footer.count(),1,name+' '+path+' footer count');
    assert.equal((await footer.textContent()).trim(),'Calculators & Tools');
    await footer.scrollIntoViewIfNeeded();
    assert.ok(await footer.isVisible(),name+' '+path+' footer visible');
    await footer.click({trial:true});
    if(path==='/')await page.screenshot({path:out+'/'+name+'-footer.png'});
    await followToolsLink(page,footer);
    await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:60000});
    await dismissCookieNotice(page);
    await page.locator('button.menu-trigger').click();
    const drawer=page.locator('#site-drawer a[href="/tools"]');
    assert.equal(await drawer.count(),1,name+' '+path+' drawer count');
    assert.equal((await drawer.textContent()).trim(),'Calculators & Tools');
    await drawer.scrollIntoViewIfNeeded();
    assert.ok(await drawer.isVisible(),name+' '+path+' drawer visible');
    if(path==='/')await page.screenshot({path:out+'/'+name+'-drawer.png'});
    await followToolsLink(page,drawer);
    checks.push({path,footerClick:true,drawerClick:true});
   }
   report.browsers.push({name,viewport,checks,pass:true});
   await context.close();
  }catch(error){
   if(page&&!page.isClosed()){
    await page.screenshot({path:out+'/'+name+'-failure.png'}).catch(()=>{});
    await writeFile(out+'/'+name+'-failure.html',await page.content()).catch(()=>{});
   }
   throw error;
  }finally{await browser.close();}
 }
 report.pass=true;
}catch(error){report.pass=false;report.error=error.stack;throw error;}
finally{
 report.finishedAt=new Date().toISOString();
 await writeFile(out+'/report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
}
