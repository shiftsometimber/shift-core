import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
const origin=process.env.FAQ_PREVIEW_URL;assert(/^https:\/\/[a-f0-9]{8}\.projectshift\.pages\.dev$/.test(origin));
const data=JSON.parse(readFileSync('editorial/content-audit/faq-copy.json'));
const browser=await chromium.launch({headless:true});mkdirSync('faq-browser-proof',{recursive:true});const reports=[];
try{for(const spec of data.articles){for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:900}});await page.goto(origin+'/faq/'+spec.slug,{waitUntil:'networkidle',timeout:45000});
 assert(new URL(page.url()).origin===origin,'Preview unexpectedly left its own origin');
 const result=await page.evaluate(()=>({h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth,brokenFragments:[...document.querySelectorAll('main a[href^="#"]')].map(a=>a.getAttribute('href').slice(1)).filter(id=>!document.getElementById(id)),text:document.querySelector('main').innerText,articleText:document.querySelector('article').innerText,header:!!document.querySelector('header'),footer:!!document.querySelector('footer'),brokenImages:[...document.images].filter(i=>i.getBoundingClientRect().width>0&&!i.complete||i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src'))}));
 assert.equal(result.h1,1);assert.equal(result.overflow,false);assert.deepEqual(result.brokenFragments,[]);assert(result.header&&result.footer);
 assert(result.articleText.includes(spec.intro));for(const [heading] of spec.sections)assert(result.articleText.includes(heading));assert(result.text.includes('2 October 2026'));
 for(const forbidden of ['The fuller answer','What should you take from this?','Written and researched by Matt','10 April 2026'])assert(!result.text.includes(forbidden));
 assert(result.articleText.split(/\s+/).length>90,'Reading content unexpectedly short');
 await page.screenshot({path:'faq-browser-proof/'+spec.slug+'-'+width+'.jpg',fullPage:true,type:'jpeg',quality:65});
 reports.push({slug:spec.slug,width,h1:result.h1,overflow:result.overflow,brokenFragments:result.brokenFragments,header:result.header,footer:result.footer,brokenImages:result.brokenImages});await page.close();
}}
 await checkMot(browser,origin,reports);
 writeFileSync('faq-browser-proof/receipt.json',JSON.stringify({at:new Date().toISOString(),sha:process.env.GITHUB_SHA,origin,reports,formsSubmitted:false,customerAccountsAccessed:false,clinicalReviewClaimed:false},null,2));
}finally{await browser.close();}

async function checkMot(browser,origin,reports){
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}}),writes=[];
  page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push({url:r.url(),method:r.method(),body:r.postData()||''});});
  await page.goto(origin+'/health-mot',{waitUntil:'networkidle'});
  await page.locator('#age').selectOption('42');await page.locator('#heightFt').selectOption('6');await page.locator('#heightIn').selectOption('0');await page.locator('#weightSt').selectOption('16');await page.locator('#weightLb').selectOption('0');
  for(let i=0;i<7;i++)await page.locator('.mot-step.active .mot-next').click();
  await page.getByRole('button',{name:'Create my Shift Health Report',exact:true}).click();await page.locator('#motReport.visible').waitFor();
  const result=await page.evaluate(()=>({score:document.getElementById('motScore').innerText,text:document.querySelector('main').innerText,overflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelectorAll('h1').length,stored:JSON.parse(localStorage.getItem('sstHealthProfile')||'null')}));
  assert.equal(result.h1,1);assert.equal(result.overflow,false);assert.match(result.score,/^\d+ higher priority · \d+ worth reviewing$/);assert(!result.text.includes('Your Shift MOT score'));assert(result.text.includes('this tool does not upload them'));assert.equal(result.stored.answers.age,'42');
  assert(!writes.some(x=>/health[_-]?mot|weightSt|weightKg|heightCm|bpSystolic|sstHealthProfile/i.test(x.body)||/\/v1\/(health|progress)/.test(x.url)),'Public Health MOT sent health answers');
  await page.screenshot({path:'faq-browser-proof/health-mot-'+width+'.jpg',fullPage:true,type:'jpeg',quality:65});reports.push({slug:'health-mot',width,h1:result.h1,overflow:result.overflow,syntheticReportGenerated:true,localAnswersSaved:true,healthAnswersTransmitted:false,clinicalScoreDisplayed:false});
  await page.goto(origin+'/health-mot-methodology',{waitUntil:'networkidle'});assert((await page.locator('main').innerText()).includes('A shared browser can retain sensitive answers'));assert.equal(await page.locator('h1').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);reports.push({slug:'health-mot-methodology',width,h1:1,overflow:false,localStorageCopyChecked:true});await page.close();
 }
}
