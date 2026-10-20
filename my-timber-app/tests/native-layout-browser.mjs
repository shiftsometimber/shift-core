// Real browser geometry checks against the repository's actual member CSS/runtime.
// Synthetic content only; all requests are fulfilled locally. No live account/API.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {memberDesignDocument,memberDesignClient} from '../../member-design.mjs';
import {addMemberChrome,memberChromeStyles,memberChromeClient,memberNavigation} from '../../member-experience/chrome.mjs';
import {appPresentation,appClient} from '../../preview/app-layout/presentation.mjs';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const source=readFileSync(new URL('../shared/native-presentation.js',import.meta.url),'utf8');
const logo=readFileSync(new URL('../../frontend/member/fit-v3-images/sst-header-brand-mark-20261001.png',import.meta.url));
const out=process.env.NATIVE_LAYOUT_EVIDENCE||'/tmp/my-timber-layout6-browser';
mkdirSync(out,{recursive:true});
const report={cases:[],limits:['Synthetic browser layout fixtures; no account writes or live network','Desktop WebKit is not physical iOS keyboard or safe-area acceptance']};
const names=['dashboard','grub','fit','settings','life-back'];
function html(name){
 const base='<!doctype html><html lang="en-GB"><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}main{padding:20px}label{display:block;margin:24px 0}.long-content{height:1800px}footer{padding:40px;background:orange}</style></head><body data-member-page="'+name+'"><header class="site-header">Duplicate website header</header><nav class="sst-member-tabs" aria-label="My Timber">'+memberNavigation()+'</nav><main><h1>My Timber '+name+'</h1><label>First field<input id="firstField"></label><div class="long-content"><p>Controlled layout fixture. No member data.</p></div><label>Last field<input id="lastField"></label><button id="lastAction">Last action</button></main><footer id="sst-footer-c">Public website footer</footer><footer id="legacyFooter">Legacy footer</footer><details class="app-footer-details"><summary>Help and legal</summary><footer>Wrapped website footer</footer></details><details class="app-footer-details" data-app-guide><summary>Help using My Timber</summary><p>Useful member guidance</p></details></body></html>';
 return memberDesignDocument(appPresentation(addMemberChrome(base,name),'/member/'+name)).replace(/<aside id="appPreviewBar">[\s\S]*?<\/aside>/,'');
}
function geometry(page){return page.evaluate(()=>{
 const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,left:r.left,right:r.right}};
 return {header:rect('todayBrand'),nav:rect('appBottomNav'),first:rect('firstField'),last:rect('lastAction'),height:innerHeight,scrollY,overflow:document.documentElement.scrollWidth-innerWidth};
})}
for(const [engineName,engine]of[['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  for(const width of [320,390,440,1024]){
   const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1});
   let current='dashboard';
   await context.route('**/*',async route=>{
    const u=new URL(route.request().url());
    if(route.request().method()!=='GET')throw Error('Unexpected write in layout proof');
    if(u.pathname==='/__app-layout.mjs')return route.fulfill({contentType:'text/javascript',body:appClient+memberDesignClient});
    if(u.pathname==='/assets/member-experience/chrome.css')return route.fulfill({contentType:'text/css',body:memberChromeStyles});
    if(u.pathname==='/assets/member-experience/chrome.mjs')return route.fulfill({contentType:'text/javascript',body:memberChromeClient});
    if(u.pathname.endsWith('.png'))return route.fulfill({contentType:'image/png',body:logo});
    if(u.pathname.startsWith('/member/'))return route.fulfill({contentType:'text/html',body:html(current)});
    return route.fulfill({status:404,body:'Local fixture only'});
   });
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const name of names){
    current=name;
    await page.goto('https://shiftsometimber.co.uk/member/'+name,{waitUntil:'load'});
    if(process.env.NATIVE_LAYOUT_BASELINE!=='true')await page.addScriptTag({content:source});
    await page.waitForTimeout(100);
    let g=await geometry(page);
    assert.equal(Math.round(g.header.top),0,engineName+' '+name+' header anchored');
    assert.equal(Math.round(g.nav.bottom),g.height,engineName+' '+name+' bottom anchored');
    assert.ok(g.first.top>=g.header.bottom,name+' first field below header');
    assert.ok(g.overflow<=1,name+' horizontal overflow');
    await page.evaluate(()=>scrollTo(0,650));
    await page.waitForTimeout(50);g=await geometry(page);
    assert.equal(Math.round(g.header.top),0,name+' header remains after scroll');
    assert.equal(Math.round(g.nav.bottom),g.height,name+' nav remains after scroll');
    await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
    await page.waitForTimeout(50);g=await geometry(page);
    assert.ok(g.last.bottom<=g.nav.top-8,name+' last action clear of navigation');
    const footer=await Promise.all(['sst-footer-c','legacyFooter'].map(id=>page.locator('#'+id).isVisible()));
    assert.deepEqual(footer,[false,false],name+' duplicate website footers hidden');
    assert.equal(await page.locator('[data-app-guide]').isVisible(),true,'member guidance retained');
    await page.locator('#appMore').click();
    await page.waitForTimeout(60);
    const menu=await page.locator('.sst-member-tabs').evaluate(e=>{const r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,visible:getComputedStyle(e).display!=='none'}});
    assert.equal(menu.visible,true,'More opens');
    assert.ok(menu.top>=g.header.bottom-1&&menu.bottom<=g.nav.top+1,'More between fixed bars');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.sst-member-tabs').isVisible(),false,'More closes');
    if(name==='settings'){
     // Different effective safe-area/text sizes must reserve measured heights.
     await page.locator('#appBottomNav').evaluate(e=>e.style.setProperty('padding-bottom','42px','important'));
     await page.locator('#todayBrand').evaluate(e=>e.style.setProperty('min-height','108px','important'));
     await page.waitForTimeout(100);
     await page.evaluate(()=>scrollTo(0,0));g=await geometry(page);
     assert.ok(g.first.top>=g.header.bottom,'resized header reserve');
     await page.setViewportSize({width,height:520});
     await page.locator('#lastField').focus();
     await page.waitForTimeout(100);g=await geometry(page);
     const input=await page.locator('#lastField').boundingBox();
     assert.ok(input.y>=g.header.bottom-1&&input.y+input.height<=g.nav.top+1,'focused field clear after keyboard-size resize');
     await page.screenshot({path:out+'/'+engineName+'-'+width+'-resized.png'});
     await page.locator('#appMore').click();
     await page.locator('.member-nav-more > summary').click();
     await page.locator('[data-member-logout]').scrollIntoViewIfNeeded();
     const logout=await page.locator('[data-member-logout]').boundingBox();
     assert.ok(logout.y>=g.header.bottom-1&&logout.y+logout.height<=g.nav.top+1,'expanded More last control reachable on short viewport');
     await page.keyboard.press('Escape');
     await page.setViewportSize({width,height:844});
    }
    if(name==='dashboard'&&width===390){
     await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+'/'+engineName+'-390-top.png'});
     await page.evaluate(()=>scrollTo(0,650));await page.screenshot({path:out+'/'+engineName+'-390-scroll.png'});
    }
    report.cases.push({engine:engineName,width,page:name,pass:true});
   }
   // No member-shell takeover on public auth pages or embedded tool documents.
   for(const name of ['login','embedded']){
    current='settings';await page.goto('https://shiftsometimber.co.uk/member/settings');
    await page.evaluate(name=>{if(name==='embedded')document.body.dataset.appPanel='1';else history.replaceState(null,'','/member-login')},name);
    await page.addScriptTag({content:source});
    assert.equal(await page.locator('html').getAttribute('data-my-timber-native-shell'),null,name+' untouched');
    report.cases.push({engine:engineName,width,page:name,pass:true});
   }
   assert.deepEqual(errors,[],'browser errors');
   await context.close();
  }
 }finally{await browser.close()}
}
writeFileSync(out+'/receipt.json',JSON.stringify(report,null,2));
console.log('PASS '+report.cases.length+' real browser layout and boundary cases');
