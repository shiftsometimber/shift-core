import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {reconcilePublicDocument} from '../public-shell-contract.mjs';

// Read-only verification. Preview uses actual public HTML and the candidate shell.
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
 for(const [name,engine,viewport] of [['desktop-chromium',chromium,{width:1440,height:1000}],['phone-chromium',chromium,{width:375,height:812}],['phone-webkit',webkit,{width:390,height:844}]]){
  const browser=await engine.launch({headless:true});
  let page;
  try{
   const context=await browser.newContext({viewport});
   // Serve the captured candidate only for public document GETs; other resources
   // retain their production origin. Block writes and third-party tracking.
   await context.route('**/*',async route=>{
    const request=route.request();
    const url=new URL(request.url());
    if(!['GET','HEAD'].includes(request.method()))return route.abort();
    if(url.origin!==origin)return route.abort();
    if(request.isNavigationRequest()&&pages.has(url.pathname))return route.fulfill({status:200,contentType:'text/html',body:pages.get(url.pathname)});
    return route.continue();
   });
   page=await context.newPage();
   page.setDefaultTimeout(15000);
   const checks=[];
   for(const path of ['/','/tools','/programme','/shift-health','/articles/mounjaro-cost-uk']){
    await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:60000});
    await dismissCookieNotice(page);
    const footer=page.locator('footer.site-footer a[href="/tools"]');
    assert.equal(await footer.count(),1,name+' '+path+' footer count');
    assert.equal((await footer.textContent()).trim(),'Calculators & Tools');
    await footer.scrollIntoViewIfNeeded();
    assert.ok(await footer.isVisible(),name+' '+path+' footer visible');
    await footer.click({trial:true});
    if(path==='/')await page.screenshot({path:out+'/'+name+'-footer.png'});
    await footer.click();
    await page.waitForURL(origin+'/tools');
    await page.locator('main').waitFor({state:'visible'});
    await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:60000});
    await dismissCookieNotice(page);
    await page.locator('button.menu-trigger').click();
    const drawer=page.locator('#site-drawer a[href="/tools"]');
    assert.equal(await drawer.count(),1,name+' '+path+' drawer count');
    await drawer.scrollIntoViewIfNeeded();
    assert.ok(await drawer.isVisible(),name+' '+path+' drawer visible');
    if(path==='/')await page.screenshot({path:out+'/'+name+'-drawer.png'});
    await drawer.click();
    await page.waitForURL(origin+'/tools');
    await page.locator('main').waitFor({state:'visible'});
    checks.push({path,footerClick:true,drawerClick:true});
   }
   report.browsers.push({name,viewport,checks,pass:true});
   await context.close();
  }catch(error){
   if(page&&!page.isClosed())await page.screenshot({path:out+'/'+name+'-failure.png'}).catch(()=>{});
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
