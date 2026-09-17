import {chromium,webkit} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const out='safari-ticker-proof';mkdirSync(out,{recursive:true});
const report={commit:process.env.GITHUB_SHA,platform:process.platform,cases:[],limits:['Playwright WebKit on macOS is not Matt’s installed Safari build','Read-only public page checks; no production changes']};
async function sample(page){return page.evaluate(()=>{const s=document.querySelector('#shift-public-news'),t=s?.querySelector('.shift-news-track'),c=t&&getComputedStyle(t);return{version:s?.dataset.shiftNewsTicker,ready:s?.hasAttribute('data-ready'),text:s?.innerText.slice(0,140),transform:c?.transform,animation:c?.animation,play:c?.animationPlayState,hover:s?.querySelector('.shift-news-window')?.matches(':hover'),focus:!!t?.querySelector('a:focus-visible'),reduce:matchMedia('(prefers-reduced-motion:reduce)').matches,width:t?.getBoundingClientRect().width}})}
try{
for(const [name,engine] of Object.entries({webkit,chromium})){
 const browser=await engine.launch();
 const context=await browser.newContext({viewport:{width:1705,height:900},reducedMotion:'no-preference'});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const path of ['/treatment-centre','/shift-health']){
  const row={engine:name,browserVersion:browser.version(),path,errors};report.cases.push(row);
  await page.goto('https://shiftsometimber.co.uk'+path,{waitUntil:'domcontentloaded'});
  await page.mouse.move(1650,850);
  await page.locator('#shift-public-news[data-ready]').waitFor({timeout:20000});
  row.start=await sample(page);await page.waitForTimeout(1500);row.after=await sample(page);row.moved=row.start.transform!==row.after.transform;
  await page.locator('.shift-news-window').hover();row.hover=await sample(page);await page.mouse.move(1650,850);await page.waitForTimeout(100);row.resumeStart=await sample(page);await page.waitForTimeout(1500);row.resumeEnd=await sample(page);row.resumed=row.resumeStart.transform!==row.resumeEnd.transform;
  await page.screenshot({path:out+'/'+name+path.replaceAll('/','-')+'.png'});
 }
 await context.close();await browser.close();
}
}finally{writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))}
if(report.cases.some(x=>!x.moved||!x.resumed))process.exitCode=1;
