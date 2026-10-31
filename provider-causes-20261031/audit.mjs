import fs from 'node:fs';
const selected={'/about':'about','/contact':'contact','/shift-newsroom':'newsroom','/clinic-gone-quiet':'continuity','/life-back':'life-back','/weight-loss-support-for-men':'support','/partner-with-us':'partner','/male-obesity':'obesity','/compare-weight-loss-treatments':'comparison','/provider-switch':'provider','/our-causes-partners':'causes'};
export async function auditMobile(browser,{headers,dir,label}){
 const paths=JSON.parse(fs.readFileSync('provider-causes-20261031/audit-paths.json','utf8')),results=[];
 const context=await browser.newContext({viewport:{width:390,height:844},extraHTTPHeaders:headers,serviceWorkers:'block',reducedMotion:'reduce'});
 await context.addInitScript(()=>localStorage.setItem('sstConsentV3',JSON.stringify({necessary:true,analytics:false,marketing:false,acquisition:false,updatedAt:new Date().toISOString()})));
 await context.route('**/*',route=>['POST','PUT','PATCH','DELETE'].includes(route.request().method())?route.abort():route.continue());
 try{for(const path of paths)for(const query of [false,true]){
  const page=await context.newPage();let result={path,query};
  try{const r=await page.goto('https://shiftsometimber.co.uk'+path+(query?'?mobile-release-check=1':''),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForLoadState('load',{timeout:30000});await page.evaluate(()=>document.fonts.ready);
   result={...result,status:r.status(),url:page.url(),...await page.evaluate(()=>{
    const main=document.querySelector('main'),h=main?.querySelector('h1');return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,heading:h?.textContent.trim().replace(/\s+/g,' '),headingVisible:!!h&&h.getClientRects().length>0&&getComputedStyle(h).visibility!=='hidden'&&Number(getComputedStyle(h).opacity)>0,mainAttributes:main?Object.fromEntries([...main.attributes].map(a=>[a.name,a.value])):{},hero:main?.querySelector('[data-next-hero]')?.getAttribute('data-next-hero'),selected:main?.getAttribute('data-approved-pages'),markers:[...document.querySelectorAll('[data-approved-release],[data-tools-ct3],[data-work-w2]')].map(e=>e.getAttribute('data-approved-release')||e.getAttribute('data-tools-ct3')||e.getAttribute('data-work-w2')),brokenImages:[...main?.querySelectorAll('.nhh-hero img,.sp-hero img')||[]].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src'))};
   })};
   const expected=selected[path];result.presentationPresent=expected?result.selected===expected:!!result.hero||JSON.stringify(result.mainAttributes).includes('tools-ct3')||JSON.stringify(result.mainAttributes).includes('work-w2');
   if(['/tools','/shift-for-work'].includes(path))result.presentationPresent=(await page.content()).includes(path==='/tools'?'tools-ct3-20261031-v1':'work-w2-20261030-v1');
   result.issues=[...(result.status!==200?['HTTP '+result.status]:[]),...(!result.headingVisible?['Heading not visible']:[]),...(result.scrollWidth>390?['Horizontal overflow '+result.scrollWidth]:[]),...(!result.presentationPresent?['Approved presentation marker absent']:[]),...(result.brokenImages?.length?['Hero image failed']:[])];
   await page.screenshot({path:dir+'/'+label+'-audit-'+path.replaceAll('/','_').slice(1)+(query?'-query':'')+'.png',fullPage:false});
  }catch(error){result.issues=[error.message.slice(0,200)];}finally{await page.close();}
  results.push(result);
 }}finally{await context.close();}
 const report={checkedAt:new Date().toISOString(),viewport:{width:390,height:844},pages:paths.length,checks:results.length,failures:results.filter(x=>x.issues.length),results};fs.writeFileSync(dir+'/'+label+'-mobile-audit.json',JSON.stringify(report,null,2));console.log('APPROVED_MOBILE_AUDIT '+JSON.stringify({pages:paths.length,checks:results.length,failures:report.failures}));return report;
}
