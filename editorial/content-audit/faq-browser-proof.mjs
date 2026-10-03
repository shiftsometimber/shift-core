import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
const origin=process.env.FAQ_PREVIEW_URL;assert(/^https:\/\/[a-f0-9]{8}\.projectshift\.pages\.dev$/.test(origin));
const data=JSON.parse(readFileSync('editorial/content-audit/faq-copy.json'));
const guides=JSON.parse(readFileSync('editorial/content-audit/core-guides.json')).articles;
const browser=await chromium.launch({headless:true});mkdirSync('faq-browser-proof',{recursive:true});const reports=[];
try{for(const spec of data.articles){for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:900}});await page.goto(origin+'/faq/'+spec.slug,{waitUntil:'networkidle',timeout:45000});
 assert(new URL(page.url()).origin===origin,'Preview unexpectedly left its own origin');assert.equal(new URL(page.url()).pathname,'/faq/'+spec.slug,'Standalone FAQ unexpectedly redirected');
 const result=await page.evaluate(()=>({h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth,brokenFragments:[...document.querySelectorAll('main a[href^="#"]')].map(a=>a.getAttribute('href').slice(1)).filter(id=>!document.getElementById(id)),text:document.querySelector('main').innerText,articleText:document.querySelector('article').innerText,header:!!document.querySelector('header'),footer:!!document.querySelector('footer'),brokenImages:[...document.images].filter(i=>i.getBoundingClientRect().width>0&&!i.complete||i.complete&&i.naturalWidth===0).map(i=>i.getAttribute('src'))}));
 assert.equal(result.h1,1);assert.equal(result.overflow,false);assert.deepEqual(result.brokenFragments,[]);assert(result.header&&result.footer);
 assert(result.articleText.replace(/\s+/g,' ').includes(spec.intro),'Reviewed FAQ intro missing: '+spec.slug+'; got '+result.articleText.slice(0,220));for(const [heading] of spec.sections)assert(result.articleText.includes(heading));assert(result.text.includes('2 October 2026'));
 for(const forbidden of ['The fuller answer','What should you take from this?','Written and researched by Matt','10 April 2026'])assert(!result.text.includes(forbidden));
 assert(result.articleText.split(/\s+/).length>90,'Reading content unexpectedly short');
 await page.screenshot({path:'faq-browser-proof/'+spec.slug+'-'+width+'.jpg',fullPage:true,type:'jpeg',quality:65});
 reports.push({slug:spec.slug,width,h1:result.h1,overflow:result.overflow,brokenFragments:result.brokenFragments,header:result.header,footer:result.footer,brokenImages:result.brokenImages});await page.close();
}}
 for(const spec of guides)for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});await page.goto(origin+'/guides/'+spec.slug,{waitUntil:'networkidle',timeout:45000});assert.equal(new URL(page.url()).pathname,'/guides/'+spec.slug);
  const r=await page.evaluate(()=>({h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth>innerWidth,text:document.querySelector('main').innerText,article:document.querySelector('article').innerText,brokenFragments:[...document.querySelectorAll('main a[href^="#"]')].map(a=>a.getAttribute('href').slice(1)).filter(id=>!document.getElementById(id))}));assert.equal(r.h1,1);assert.equal(r.overflow,false);assert.deepEqual(r.brokenFragments,[]);assert(r.article.replace(/\s+/g,' ').includes(spec.intro));for(const [heading] of spec.sections)assert(r.article.includes(heading));assert(r.text.includes('3 October 2026'));assert(!r.text.includes('Use recognised health guidance as the framework'));assert(!r.text.includes('Written and researched by Matt'));
  await page.screenshot({path:'faq-browser-proof/'+spec.slug+'-'+width+'.jpg',fullPage:true,type:'jpeg',quality:65});reports.push({slug:spec.slug,width,scope:'core-guide',h1:1,overflow:false,brokenFragments:[],reviewedCopyVisible:true});await page.close();
 }
 await checkMot(browser,origin,reports);
 const response=await fetch(origin+'/assets/fit/shift-fit-batch2.svg');assert(response.ok);assert.match(response.headers.get('content-type'),/^image\/svg/);const svg=await response.text(),sha256=createHash('sha256').update(svg).digest('hex');assert.equal(sha256,'0ae9686743e2b98e6837fbfeab6d1ad06e44e86ebd3d243c341a590c9c3a68bc');for(const fragment of ['bird-dog','goblet-squat','floor-press'])assert(svg.includes('id="'+fragment+'"'));
 writeFileSync('faq-browser-proof/receipt.json',JSON.stringify({at:new Date().toISOString(),sha:process.env.GITHUB_SHA,origin,reports,restoredLegacySprite:{sha256,fragments:['bird-dog','goblet-squat','floor-press'],originalRepositoryAsset:true},syntheticLocalHealthMotFormsSubmitted:true,accountFormsSubmitted:false,customerAccountsAccessed:false,clinicalReviewClaimed:false},null,2));
}finally{await browser.close();}

async function checkMot(browser,origin,reports){
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}}),writes=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!['GET','HEAD','OPTIONS'].includes(r.method()))writes.push({url:r.url(),method:r.method(),body:r.postData()||''});});
  await page.goto(origin+'/health-mot',{waitUntil:'networkidle'});
  await page.locator('#age').selectOption('42');await page.locator('#heightFt').selectOption('6');await page.locator('#heightIn').selectOption('0');await page.locator('#weightSt').selectOption('16');await page.locator('#weightLb').selectOption('0');
  for(let i=0;i<7;i++)await page.locator('.mot-step.active .mot-next').click();
  await page.getByRole('button',{name:'Create my Shift Health Report',exact:true}).click();try{await page.locator('#motReport.visible').waitFor({timeout:10000});}catch(e){writeFileSync('faq-browser-proof/health-mot-error.json',JSON.stringify({width,errors,invalid:await page.locator(':invalid').evaluateAll(xs=>xs.map(x=>({id:x.id,message:x.validationMessage})))},null,2));throw e;}
  const result=await page.evaluate(()=>({score:document.getElementById('motScore').innerText,text:document.querySelector('main').innerText,overflow:document.documentElement.scrollWidth>innerWidth,h1:document.querySelectorAll('h1').length,stored:JSON.parse(localStorage.getItem('sstHealthProfile')||'null')}));
  assert.deepEqual(errors,[],'Health MOT browser errors');assert.equal(result.h1,1);assert.equal(result.overflow,false);assert.match(result.score,/^\d+ higher priority · \d+ worth reviewing$/);assert(!result.text.includes('Your Shift MOT score'));assert(result.text.includes('this tool does not upload them'));assert.equal(result.stored.answers.age,'42');
  assert(!writes.some(x=>/health[_-]?mot|weightSt|weightKg|heightCm|bpSystolic|sstHealthProfile/i.test(x.body)||/\/v1\/(health|progress)/.test(x.url)),'Public Health MOT sent health answers');
  await page.screenshot({path:'faq-browser-proof/health-mot-'+width+'.jpg',fullPage:true,type:'jpeg',quality:65});reports.push({slug:'health-mot',width,scope:'legacy-questionnaire-in-Pages-only; main route remains home-test information',h1:result.h1,overflow:result.overflow,syntheticReportGenerated:true,localAnswersSaved:true,healthAnswersTransmitted:false,clinicalScoreDisplayed:false});
  await page.goto(origin+'/health-mot-methodology',{waitUntil:'networkidle'});assert((await page.locator('main').innerText()).includes('A shared browser can retain sensitive answers'));assert.equal(await page.locator('h1').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);reports.push({slug:'health-mot-methodology',width,h1:1,overflow:false,localStorageCopyChecked:true});await page.close();
 }
}
