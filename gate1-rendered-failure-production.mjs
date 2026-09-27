import {chromium,firefox,webkit} from 'playwright';
import fs from 'node:fs';import path from 'node:path';
const BASE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const OUT=process.env.FAILURE_RENDER_EVIDENCE_DIR||'failure-render-evidence';fs.mkdirSync(OUT,{recursive:true});
const report={proof:'G1_007_RENDERED_FAILURE_STATES',cases:[],failures:[]};
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const fail=(name,detail)=>{report.failures.push({name,detail});console.error(`::error title=G1-007 rendered failure state::${name} — ${detail}`)};
const browsers={chromium,firefox,webkit},viewports={desktop:{width:1440,height:900},mobile390:{width:390,height:844}};
for(const [browserName,type] of Object.entries(browsers)){
 const browser=await type.launch({headless:true});try{
  for(const [viewportName,viewport] of Object.entries(viewports)){
   const context=await browser.newContext({viewport,reducedMotion:'reduce'});const page=await context.newPage();
   const name=`${browserName}-${viewportName}-not-found`;const response=await page.goto(`${BASE}/commissioning-definitely-not-a-real-page-${Date.now()}`,{waitUntil:'networkidle',timeout:45000});
   const text=clean(await page.locator('body').innerText().catch(()=>''));const title=clean(await page.title());
   if(!response)fail(name,'no HTTP response');
   if(text.length<80)fail(name,`near-blank failure page (${text.length} chars)`);
   if(/stack trace|sqlite|sql error|internal server error|application error|cloudflare ray id/i.test(text))fail(name,'internal diagnostics exposed');
   if(!/not found|page|home|back|sorry|find|doesn.t exist|does not exist|404/i.test(`${title} ${text}`))fail(name,'failure page lacks intelligible recovery/navigation guidance');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);if(overflow>8)fail(name,`horizontal overflow ${overflow}px`);
   const screenshot=path.join(OUT,`${name}.png`);await page.screenshot({path:screenshot,fullPage:true});
   report.cases.push({name,status:response?.status(),url:page.url(),title,textChars:text.length,horizontalOverflowPx:Math.max(0,overflow),screenshot});await context.close();
  }
 }finally{await browser.close()}
}
fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
if(report.failures.length)throw new Error(`G1-007 rendered failure-state matrix failed ${report.failures.length} assertion(s)`);
console.log(`PASS G1-007 rendered failure-state matrix: ${report.cases.length} cross-browser/device not-found journeys rendered intelligible recovery without blank pages or diagnostic leakage.`);
