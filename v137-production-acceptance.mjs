import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SITE='https://shiftsometimber.co.uk';
const OUT=process.env.SHIFT_ACCEPTANCE_OUT||'v137-production-acceptance';
const widths=[1440,1024,768,390,360];
const routes=['/','/tools/bmi','/tools/walking','/articles/stopping-glp1','/mens-mental-health','/programme','/start-here'];
const report={generatedAt:new Date().toISOString(),site:SITE,widths,routes,cases:[],sitewide:{},failures:[]};
const fail=(gate,detail)=>report.failures.push({gate,detail:String(detail).slice(0,1200)});
const safeName=route=>route==='/'?'home':route.slice(1).replaceAll('/','--');
await mkdir(OUT,{recursive:true});

async function dismissCookie(page){
  for(const name of [/necessary/i,/reject/i,/decline/i]){
    const button=page.getByRole('button',{name}).first();
    if(await button.count()&&await button.isVisible().catch(()=>false)){await button.click().catch(()=>{});break}
  }
}

const browser=await chromium.launch({headless:true});
try{
  for(const width of widths){
    const context=await browser.newContext({viewport:{width,height:Math.max(844,Math.round(width*.7))},reducedMotion:'reduce'});
    for(const route of routes){
      const row={width,route,status:null,overflow:null,h1:null,deadCtas:[],pageErrors:[],consoleErrors:[],cookieDismissed:false};
      report.cases.push(row);
      const page=await context.newPage();
      page.on('pageerror',e=>row.pageErrors.push(String(e?.message||e).slice(0,500)));
      page.on('console',m=>{if(m.type()==='error'&&!/favicon|Failed to load resource/i.test(m.text()))row.consoleErrors.push(m.text().slice(0,500))});
      try{
        const response=await page.goto(SITE+route+'?acceptance='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
        row.status=response?.status()||0;
        await dismissCookie(page);
        row.cookieDismissed=!(await page.locator('#cookie-banner,.cookie-banner,[data-cookie-banner]').filter({visible:true}).count().catch(()=>0));
        if(route==='/tools/bmi'){
          await page.selectOption('#bmiHeightFt','5');
          await page.selectOption('#bmiHeightIn','8');
          await page.selectOption('#bmiWeightSt','15');
          await page.selectOption('#bmiWeightLb','0');
          const calculate=page.getByRole('button',{name:/calculate/i}).first();
          if(await calculate.count())await calculate.click();
          await page.waitForTimeout(250);
        }
        const state=await page.evaluate(()=>({
          overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
          h1:[...document.querySelectorAll('h1')].find(x=>x.offsetParent!==null)?.textContent?.trim()||'',
          ticker:document.querySelectorAll('.medicine-ticker-v138,[data-shift-ai-full-wire],marquee').length,
          deadCtas:[...document.querySelectorAll('a.button,a.btn,.actions a,.nextlinks a')].filter(a=>!a.getAttribute('href')||a.getAttribute('href')==='#').map(a=>(a.textContent||'').trim()),
          bmi:location.pathname==='/tools/bmi'?{text:document.querySelector('#bmiResult,.result,[data-result]')?.textContent?.trim()||'',links:[...document.querySelectorAll('#bmiResult a,.result a,[data-result] a')].map(a=>a.getAttribute('href'))}:null
        }));
        Object.assign(row,state);
        if(row.status!==200)fail(`${width}:${route}:status`,row.status);
        if(row.overflow>1)fail(`${width}:${route}:overflow`,row.overflow);
        if(!row.h1)fail(`${width}:${route}:h1`,'missing');
        if(row.deadCtas.length)fail(`${width}:${route}:dead-cta`,JSON.stringify(row.deadCtas));
        if(route==='/'&&row.ticker)fail(`${width}:homepage-ticker`,row.ticker);
        if(route==='/tools/bmi'&&(!row.bmi?.text||row.bmi.links.some(x=>!x||x==='#')))fail(`${width}:bmi-result`,JSON.stringify(row.bmi));
        if(row.pageErrors.length)fail(`${width}:${route}:page-errors`,JSON.stringify(row.pageErrors));
        await page.screenshot({path:path.join(OUT,`${width}--${safeName(route)}.png`),fullPage:true});
      }catch(error){fail(`${width}:${route}:exception`,error?.stack||error)}
      finally{await page.close()}
    }
    await context.close();
  }
}finally{await browser.close()}

const sitemap=await fetch(SITE+'/sitemap.xml?acceptance='+Date.now()).then(r=>r.text());
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
report.sitewide.urls=urls.length;
const findings=[];
let cursor=0;
async function scan(){
  while(cursor<urls.length){
    const url=urls[cursor++];
    try{
      const response=await fetch(url,{headers:{'user-agent':'SHIFT-V137-Acceptance/1.0'}});
      const html=await response.text();
      const bad=[];
      if(response.status!==200)bad.push(`HTTP ${response.status}`);
      if(/of moderate activity|by the Shift Some Timber|Editorial image · exact supplied item confirmed when stocked/i.test(html))bad.push('locked copy residue');
      for(const block of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
        if(/of moderate activity|by the Shift Some Timber/i.test(block[1]))bad.push('JSON-LD copy residue');
        try{JSON.parse(block[1])}catch{bad.push('invalid JSON-LD')}
      }
      if(bad.length)findings.push({url,bad});
    }catch(error){findings.push({url,bad:[String(error)]})}
  }
}
await Promise.all(Array.from({length:12},scan));
report.sitewide.findings=findings;
for(const finding of findings)fail('sitewide',JSON.stringify(finding));
report.status=report.failures.length?'FAIL':'PASS';
await writeFile(path.join(OUT,'acceptance.json'),JSON.stringify(report,null,2));
await writeFile(path.join(OUT,'SUMMARY.md'),`# V1.37 production acceptance\n\n**${report.status}** · ${report.cases.length} rendered cases · ${urls.length} sitemap URLs scanned.\n\nFailures: ${report.failures.length}\n`);
console.log(JSON.stringify({status:report.status,renderedCases:report.cases.length,sitewideUrls:urls.length,failures:report.failures},null,2));
if(report.failures.length)process.exitCode=1;
