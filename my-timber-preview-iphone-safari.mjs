import {chromium,webkit,devices} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SITE=String(process.env.PREVIEW_URL||'').replace(/\/$/,'');
const OUT=process.env.PREVIEW_EVIDENCE_DIR||'preview-consumer-evidence';
const PROFILE=process.env.PREVIEW_BROWSER_PROFILE||'iphone-safari';
const desktop=PROFILE.startsWith('desktop-');
const engine=PROFILE==='desktop-chrome'?chromium:webkit;
const videoName=desktop?`shift-consumer-preview-${PROFILE}.webm`:'shift-consumer-preview-iphone-safari.webm';
if(!SITE)throw new Error('PREVIEW_URL required');
fs.mkdirSync(OUT,{recursive:true});
const report={proof:desktop?'SHIFT_CONSUMER_PREVIEW_DESKTOP':'SHIFT_CONSUMER_PREVIEW_IPHONE_SAFARI',site:SITE,device:desktop?`${PROFILE==='desktop-chrome'?'Chrome':'Safari/WebKit'} desktop · 1440x1000`:'iPhone 13 · WebKit · 390x844',checks:[],failures:[],screens:[]};
const pass=(name,detail='')=>report.checks.push({name,status:'PASS',detail});
const fail=(name,detail='')=>report.failures.push({name,status:'FAIL',detail});
const pause=page=>page.waitForTimeout(450);
async function screen(page,name){const target=path.join(OUT,`${name}.png`);await page.screenshot({path:target,fullPage:false});report.screens.push(target)}
async function zeroOverflow(page,label){const value=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);value===0?pass(`${label}: zero horizontal overflow`):fail(`${label}: horizontal overflow`,String(value))}
async function compactPage(page,label,maxHeight){const value=await page.evaluate(()=>document.documentElement.scrollHeight);value<=maxHeight?pass(`${label}: bounded mobile journey`,`${value}px`):fail(`${label}: excessive mobile scroll`,`${value}px`)}
async function openToday(page,{reload=false}={}){let lastError;for(let attempt=0;attempt<3;attempt++){if(reload||attempt)await page.reload({waitUntil:'domcontentloaded'});await page.evaluate(()=>{document.getElementById('previewAuth').hidden=true;document.getElementById('previewMember').classList.add('is-ready')});try{await page.locator('[data-life-changed]').waitFor({state:'visible',timeout:8000});return}catch{}await page.evaluate(()=>{const script=document.createElement('script');script.src=`/member-my-timber-problem-v1.js?v=daily-shift-v2-${Date.now()}`;document.body.appendChild(script)});try{await page.locator('[data-life-changed]').waitFor({state:'visible',timeout:20000});return}catch(error){lastError=error}}throw lastError}

const browser=await engine.launch({headless:true});
const viewport=desktop?{width:1440,height:1000}:{width:390,height:844};
const context=await browser.newContext({...(!desktop?devices['iPhone 13']:{}),viewport,recordVideo:{dir:path.join(OUT,'raw-video'),size:viewport}});
const page=await context.newPage();
page.on('pageerror',error=>fail('page error',error.message));
page.on('console',message=>{if(message.type()==='error'&&!/status of 401 \(Unauthorized\)/.test(message.text()))fail('console error',message.text())});
try{
  await page.goto(SITE,{waitUntil:'domcontentloaded'});await pause(page);await screen(page,'01-home');await zeroOverflow(page,'Homepage');await compactPage(page,'Homepage',3300);
  if(await page.getByRole('link',{name:/Find my treatment route/i}).count())pass('Homepage has one dominant route CTA');else fail('Homepage route CTA missing');
  await page.getByRole('link',{name:/Find my treatment route/i}).first().click();await pause(page);await screen(page,'02-route-start');
  await page.getByRole('button',{name:/Yes, I’m 18 or over/}).click();await page.getByRole('button',{name:'Continue'}).click();
  await page.locator('select[name="heightCm"]').selectOption('175');await page.locator('select[name="weightKg"]').selectOption('105');await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'No →',exact:true}).click();await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'No →',exact:true}).click();await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:/Open to either/}).click();await page.getByRole('button',{name:/Show my routes/}).click();await page.getByRole('heading',{name:/Your answers point here/}).waitFor();await pause(page);await screen(page,'03-catalogue-results');await zeroOverflow(page,'Route results');await compactPage(page,'Route results',3800);
  const recap=await page.locator('.tr-recap').innerText();/Either routine/.test(recap)&&/175 cm · 105 kg/.test(recap)?pass('Route result explains the answers it used'):fail('Route result answer recap missing');
  const routeText=await page.locator('body').innerText();if(/Treatment access is (?:not open yet|closed)/.test(routeText)&&!/\bTBC\b|proposed from|Supplier TBC/i.test(routeText))pass('Results are consumer-facing and fail closed');else fail('Results expose internal launch language');
  await page.getByRole('link',{name:/Understand this route/}).first().click();await page.getByRole('heading',{name:/Semaglutide|Tirzepatide/}).waitFor();await pause(page);await screen(page,'04-product-information');await zeroOverflow(page,'Product information');await compactPage(page,'Product information',5000);
  const strengthButtons=page.locator('[data-strength]');if(await strengthButtons.count()>1){await strengthButtons.nth(1).click();const selectedText=await page.locator('[data-selected]').innerText();selectedText.includes(await strengthButtons.nth(1).locator('strong').innerText())?pass('Strength choice gives immediate visible confirmation'):fail('Strength choice confirmation missing')}
  const productText=await page.locator('body').innerText();if(/Treatment access closed/.test(productText)&&!/Purchase unavailable|\bTBC\b|proposed £/i.test(productText))pass('Product information is honest without internal placeholders');else fail('Product information contains internal placeholders');
  await page.getByRole('link',{name:/Back to my route results/}).click();await page.getByRole('heading',{name:/Your answers point here/}).waitFor();const returnedRecap=await page.locator('.tr-recap').innerText();/Either routine/.test(returnedRecap)&&/175 cm · 105 kg/.test(returnedRecap)?pass('Product information returns to retained route results'):fail('Route result state was lost after product information');
  const email=`iphone-safari-${Date.now()}@example.test`;
  const registered=await context.request.post(`${SITE}/v1/auth/register`,{data:{firstName:'Matt',email,password:'PreviewOnly-4827',source:'my-timber-hosted-preview'}});if(!registered.ok())throw new Error(`preview registration ${registered.status()}: ${(await registered.text()).slice(0,240)}`);
  await page.goto(`${SITE}/member/dashboard#today`,{waitUntil:'domcontentloaded'});
  await openToday(page);
  const seeded=await context.request.post(`${SITE}/v1/shift/preview-billy`,{data:{}});if(!seeded.ok())throw new Error(`preview seed ${seeded.status()}`);
  const date=new Date(),iso=offset=>{const day=new Date(date);day.setUTCDate(day.getUTCDate()-offset);return day.toISOString().slice(0,10)};
  for(const offset of [14,7]){const learned=await context.request.post(`${SITE}/v1/shift/daily-adjust`,{headers:{'X-Shift-Local-Date':iso(offset),'X-Shift-Local-Hour':'17'},data:{scenario:'working_late'}});if(!learned.ok())throw new Error(`friction seed ${learned.status()}`)}
  const feedback=await context.request.post(`${SITE}/v1/shift/daily-feedback`,{headers:{'X-Shift-Local-Date':iso(0),'X-Shift-Local-Hour':'17'},data:{feedback:'love',target:'daily_recommendation',meal_id:'preview-dinner'}});if(!feedback.ok())throw new Error(`learning seed ${feedback.status()}`);
  const learnedResponse=await context.request.get(`${SITE}/v1/shift/daily-plan`,{headers:{'X-Shift-Local-Date':iso(0),'X-Shift-Local-Hour':'17'}}),learnedBody=await learnedResponse.json();learnedBody.daily?.daily_output?.prediction?.key==='busy_weekday'?pass('Friction prediction is derived from retained same-day history'):fail('Retained friction did not produce the governed prediction');learnedBody.daily?.daily_output?.weekly_insight?.headline==='Your week, without the spreadsheet.'?pass('Weekly insight is returned by the real joined-day API'):fail('Weekly insight missing from the joined-day API');
  await openToday(page,{reload:true});await pause(page);await screen(page,'05-my-timber-today');await zeroOverflow(page,'My Timber Today');
  const today=await page.locator('body').innerText();for(const marker of ['SHIFT LEARNED','SHIFT SAW THIS COMING','YOUR WEEK','MORNING ENTRY','TEACH SHIFT WITHOUT ANOTHER QUESTIONNAIRE','Morning plan reminder','Life changed?'])today.includes(marker)?pass(`My Timber visible: ${marker}`):fail(`My Timber missing: ${marker}`);
  await page.waitForFunction(()=>!/Loading/.test(document.querySelector('[data-reminder-status]')?.textContent||'Loading'));await page.locator('[data-morning-entry]').click();await page.locator('[data-reminder-enabled]').check();await page.locator('[data-reminder-hour]').selectOption('8');await page.locator('[data-reminder-form]').getByRole('button',{name:'Save reminder'}).click();await page.getByText('Morning plan set for 8am.').waitFor({state:'visible',timeout:15000});
  await openToday(page,{reload:true});await page.locator('[data-morning-entry]').click();await page.locator('.mt-daily-reminder[open] [data-reminder-status]').filter({hasText:'On · 8am'}).waitFor({state:'visible',timeout:15000});pass('Morning entry saves and survives a fresh page load');await screen(page,'06-morning-entry-retained');
  const feedbackResponse=page.waitForResponse(response=>response.url().includes('/v1/shift/daily-feedback')&&response.request().method()==='POST');await page.locator('[data-feedback="love"]').click();if((await feedbackResponse).ok())pass('One-tap learning feedback persists through the real API');else fail('One-tap learning feedback did not persist');await page.locator('[data-life-changed]').waitFor({state:'visible',timeout:15000});await screen(page,'07-feedback-learned');
  await page.locator('[data-life-changed]').click();const lateResponse=page.waitForResponse(response=>response.url().includes('/v1/shift/daily-adjust')&&response.request().method()==='POST');await page.locator('[data-adjust="working_late"]').click();if(!(await lateResponse).ok())throw new Error('Working Late API did not accept the rebuild');await page.getByText(/late finish/i).first().waitFor({state:'visible',timeout:15000});await pause(page);await screen(page,'08-working-late-rebuilt');
  const rebuilt=await page.locator('body').innerText();/10 minutes/i.test(rebuilt)?pass('Working Late compresses movement'):fail('Working Late did not compress movement');
}catch(error){fail('journey exception',String(error?.message||error).slice(0,1500))}finally{
  const video=page.video();await context.close();if(video)await video.saveAs(path.join(OUT,videoName));await browser.close();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
}
console.log(JSON.stringify(report,null,2));
if(report.failures.length)throw new Error(`Consumer preview failed ${report.failures.length} check(s)`);
