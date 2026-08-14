import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const NUMAN=(process.env.NUMAN_WEIGHT_LOSS_URL||'https://www.numan.com/weight-loss').replace(/\/$/,'');
const OUT=process.env.G5_014_EVIDENCE_DIR||'g5-014-sceptical-customer-evidence';
fs.mkdirSync(OUT,{recursive:true});
const report={proof:'G5_014_SCEPTICAL_CUSTOMER_PRODUCTION_V1',generatedAt:new Date().toISOString(),shiftSite:SITE,competitorUrl:NUMAN,cases:[],credibility:[],competitor:{},scorecard:{},failures:[]};
const fail=(name,detail)=>{report.failures.push({name,detail:String(detail||'')});console.error(`::error title=G5-014::${name} — ${detail}`)};
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const write=()=>fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
const has=(text,re)=>re.test(text);

function snapshot(){
 const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
 const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0&&!e.closest('[hidden]')};
 const body=clean(document.body?.innerText||'');
 const links=[...document.querySelectorAll('a[href]')].filter(visible).map(a=>({text:clean(a.innerText||a.textContent),href:a.href,className:String(a.className||'')}));
 const h1=[...document.querySelectorAll('h1')].filter(visible).map(e=>({text:clean(e.textContent),size:parseFloat(getComputedStyle(e).fontSize)||0}));
 const h2=[...document.querySelectorAll('h2')].filter(visible).map(e=>clean(e.textContent));
 const controls=[...document.querySelectorAll('a,button,input,select')].filter(visible).map(e=>{const r=e.getBoundingClientRect();return{tag:e.tagName,text:clean(e.innerText||e.value||e.getAttribute('aria-label')||e.getAttribute('placeholder')),className:String(e.className||''),role:e.getAttribute('role')||'',w:Math.round(r.width),h:Math.round(r.height)}});
 return{url:location.href,title:document.title,body,links,h1,h2,controls,rootOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,main:document.querySelectorAll('main,[role="main"]').length};
}

const browser=await chromium.launch({headless:true});
try{
 for(const [id,viewport] of Object.entries({desktop:{width:1440,height:900},mobile390:{width:390,height:844}})){
  const row={id,viewport,pageErrors:[],consoleErrors:[]};report.cases.push(row);
  const ctx=await browser.newContext({viewport,reducedMotion:'reduce'});const page=await ctx.newPage();
  page.on('pageerror',e=>row.pageErrors.push(clean(e.message)));page.on('console',m=>{if(m.type()==='error')row.consoleErrors.push(clean(m.text()))});
  try{
   const r=await page.goto(`${SITE}/?g5014=${Date.now()}`,{waitUntil:'domcontentloaded',timeout:30000});row.httpStatus=r?.status()||0;await page.waitForTimeout(700);row.snapshot=await page.evaluate(snapshot);
   const t=row.snapshot.body;
   const criteria={
    audience:has(t,/ordinary blokes|ordinary men/i),
    independent:has(t,/evidence before hype|independent thinking|no profit-led rankings|commercial second/i),
    usefulFree:has(t,/calculators|health mot|treatment finder|comparison|knowledge centre/i),
    maintenance:has(t,/maintenance|keeping the weight off|long-term habits|long-term support/i),
    honestAvailability:has(t,/pre-launch|coming soon|future prescription treatment|clinical assessment/i),
    clinicalBoundary:has(t,/qualified healthcare professionals|clinical assessment|general information and is not medical advice/i),
    promise:has(t,/useful first|shift promise/i)
   };row.criteria=criteria;
   for(const [k,v] of Object.entries(criteria))if(!v)fail(`${id}-${k}`,'required sceptical-customer signal not visible');
   if(row.httpStatus<200||row.httpStatus>=400)fail(`${id}-http`,`HTTP ${row.httpStatus}`);
   if(row.snapshot.rootOverflow>0)fail(`${id}-overflow`,`${row.snapshot.rootOverflow}px`);
   if(!row.snapshot.main)fail(`${id}-main`,'missing main landmark');if(!row.snapshot.h1.length)fail(`${id}-h1`,'missing visible H1');
   if(row.pageErrors.length)fail(`${id}-page-errors`,JSON.stringify(row.pageErrors));if(row.consoleErrors.length)fail(`${id}-console-errors`,JSON.stringify(row.consoleErrors));
   if(id==='mobile390'){
    const actionControls=row.snapshot.controls.filter(x=>x.tag==='BUTTON'||/btn|button|cta|nav/i.test(x.className)||x.role==='button');
    const undersized=actionControls.filter(x=>x.h>0&&x.h<44).slice(0,8);if(undersized.length)fail('mobile-touch-targets',JSON.stringify(undersized));
   }
   await page.screenshot({path:path.join(OUT,`${id}-shift-home.png`),fullPage:true});
  }catch(e){fail(`${id}-exception`,e?.message||e)}finally{await ctx.close()}
 }

 const credibilityTargets=[
  {key:'knowledge',re:/knowledge centre|knowledge/i},
  {key:'trust',re:/trust\s*&?\s*transparency|trust and transparency|editorial standards/i},
  {key:'governance',re:/clinical governance|medical disclaimer/i},
  {key:'tools',re:/calculators\s*&?\s*tools|tools centre|health mot/i}
 ];
 const seed=report.cases[0]?.snapshot?.links||[];const chosen=new Map();
 for(const target of credibilityTargets){const link=seed.find(x=>target.re.test(x.text)&&x.href.startsWith(SITE));if(link&&!chosen.has(target.key))chosen.set(target.key,link)}
 if(chosen.size<3)fail('credibility-links',`only ${chosen.size} required credibility/usefulness destinations discovered`);
 for(const [key,link] of [...chosen].slice(0,4)){
  const ctx=await browser.newContext({viewport:{width:390,height:844}}),page=await ctx.newPage();
  try{const r=await page.goto(link.href,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(350);const s=await page.evaluate(snapshot);const row={key,url:s.url,status:r?.status()||0,title:s.title,h1:s.h1.map(x=>x.text),textLength:s.body.length,rootOverflow:s.rootOverflow};report.credibility.push(row);if(row.status<200||row.status>=400)fail(`credibility-${key}-http`,row.status);if(row.textLength<300)fail(`credibility-${key}-substance`,row.textLength);if(row.rootOverflow>0)fail(`credibility-${key}-overflow`,row.rootOverflow)}catch(e){fail(`credibility-${key}-exception`,e?.message||e)}finally{await ctx.close()}
 }

 const ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage();
 try{
  const r=await page.goto(NUMAN,{waitUntil:'domcontentloaded',timeout:35000});await page.waitForTimeout(900);const s=await page.evaluate(snapshot);const t=s.body;
  report.competitor={status:r?.status()||0,title:s.title,textLength:t.length,signals:{clinician:has(t,/clinician-backed|registered clinician|clinician/i),coach:has(t,/health coach|coaching/i),medication:has(t,/weight loss medication|mounjaro|wegovy/i),longTerm:has(t,/long-term|ongoing support|maintenance/i),regulated:has(t,/regulated|CQC|GPhC|GMC/i)}};
  if(report.competitor.status<200||report.competitor.status>=400)fail('numan-http',report.competitor.status);
  const coreSignals=['clinician','coach','medication','longTerm'];const coreCount=coreSignals.filter(k=>report.competitor.signals[k]).length;if(coreCount<3)fail('numan-core-benchmark',`only ${coreCount}/4 current clinical-service signals visible`);
 }catch(e){fail('numan-exception',e?.message||e)}finally{await ctx.close()}

 const home=report.cases[0]?.snapshot?.body||'';
 const competitorCore=['clinician','coach','medication','longTerm'].filter(k=>report.competitor.signals?.[k]).length>=3;
 report.scorecard={
  evidence:{pass:/evidence before hype|evidence-based|explain the evidence|uncertainty/i.test(home),reason:'Shift visibly leads with evidence and uncertainty rather than miracle claims.'},
  trust:{pass:/useful first|commercial second|no profit-led rankings|qualified healthcare professionals|clinical assessment/i.test(home),reason:'Commercial and clinical boundaries are explicit on the live proposition.'},
  usefulness:{pass:/calculators|health mot|treatment finder|comparison|knowledge centre/i.test(home)&&report.credibility.length>=3,reason:'The proposition links into substantive decision-support and free utility rather than a brochure-only claim.'},
  premiumExecution:{pass:report.cases.every(x=>x.snapshot?.rootOverflow===0&&x.snapshot?.h1?.length&&x.pageErrors?.length===0&&x.consoleErrors?.length===0),reason:'The live public proposition renders cleanly at desktop and 390px under the estate-wide premium constitution.'},
  differentiation:{pass:/ordinary blokes|without the nonsense|useful first|commercial second|no profit-led rankings|maintenance matters/i.test(home),reason:'Shift presents a distinct bloke-readable, evidence-first, long-term decision-support proposition rather than pretending to be a copy of a live prescribing service.'},
  honestyAgainstClinicalCompetitor:{pass:/pre-launch|future prescription treatment|qualified healthcare professionals|clinical assessment/i.test(home)&&competitorCore,reason:'The current clinical competitor benchmark is acknowledged by the test while Shift remains explicit about unavailable clinical capability.'}
 };
 for(const [k,v] of Object.entries(report.scorecard))if(!v.pass)fail(`scorecard-${k}`,v.reason);
}finally{await browser.close();write()}

console.log(JSON.stringify(report,null,2));
if(report.failures.length)throw new Error(`G5-014 sceptical-customer acceptance failed ${report.failures.length}`);
console.log('PASS G5-014 production: a sceptical customer can see why Shift is different through evidence, trust, useful decision-support and premium execution, while the live proposition stays honest that regulated clinical treatment is not yet Shift-delivered.');
