import {webkit,devices} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const SITE=String(process.env.PREVIEW_URL||'').replace(/\/$/,'');
const OUT=process.env.PREVIEW_EVIDENCE_DIR||'preview-consumer-evidence';
if(!SITE)throw new Error('PREVIEW_URL required');
fs.mkdirSync(OUT,{recursive:true});
const report={proof:'SHIFT_CONSUMER_PREVIEW_IPHONE_SAFARI',site:SITE,device:'iPhone 13 · WebKit · 390x844',checks:[],failures:[],screens:[]};
const pass=(name,detail='')=>report.checks.push({name,status:'PASS',detail});
const fail=(name,detail='')=>report.failures.push({name,status:'FAIL',detail});
const pause=page=>page.waitForTimeout(450);
async function screen(page,name){const target=path.join(OUT,`${name}.png`);await page.screenshot({path:target,fullPage:false});report.screens.push(target)}
async function zeroOverflow(page,label){const value=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);value===0?pass(`${label}: zero horizontal overflow`):fail(`${label}: horizontal overflow`,String(value))}

const browser=await webkit.launch({headless:true});
const context=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},recordVideo:{dir:path.join(OUT,'raw-video'),size:{width:390,height:844}}});
const page=await context.newPage();
page.on('pageerror',error=>fail('page error',error.message));
page.on('console',message=>{if(message.type()==='error')fail('console error',message.text())});
try{
  await page.goto(SITE,{waitUntil:'domcontentloaded'});await pause(page);await screen(page,'01-home');await zeroOverflow(page,'Homepage');
  if(await page.getByRole('link',{name:/Find my treatment route/i}).count())pass('Homepage has one dominant route CTA');else fail('Homepage route CTA missing');
  await page.getByRole('link',{name:/Find my treatment route/i}).click();await pause(page);await screen(page,'02-route-start');
  await page.getByRole('button',{name:/Yes, I’m 18 or over/}).click();await page.getByRole('button',{name:'Continue'}).click();
  await page.getByLabel('Height (cm)').fill('175');await page.getByLabel('Weight (kg)').fill('105');await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'No →',exact:true}).click();await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:'No →',exact:true}).click();await page.getByRole('button',{name:'Continue'}).click();
  await page.getByRole('button',{name:/Open to either/}).click();await page.getByRole('button',{name:/Show my routes/}).click();await page.getByRole('heading',{name:/These routes fit your preference/}).waitFor();await pause(page);await screen(page,'03-catalogue-results');await zeroOverflow(page,'Route results');
  const routeText=await page.locator('body').innerText();if(/Treatment access is not open yet/.test(routeText)&&!/\bTBC\b|proposed from|Supplier TBC/i.test(routeText))pass('Results are consumer-facing and fail closed');else fail('Results expose internal launch language');
  await page.getByRole('link',{name:/Understand this route/}).first().click();await page.getByRole('heading',{name:/Semaglutide|Tirzepatide/}).waitFor();await pause(page);await screen(page,'04-product-information');await zeroOverflow(page,'Product information');
  const productText=await page.locator('body').innerText();if(/Treatment access closed/.test(productText)&&!/Purchase unavailable|\bTBC\b|proposed £/i.test(productText))pass('Product information is honest without internal placeholders');else fail('Product information contains internal placeholders');
  await page.goto(`${SITE}/member/dashboard#today`,{waitUntil:'domcontentloaded'});const email=`iphone-safari-${Date.now()}@example.test`;
  await page.getByLabel('First name').fill('Matt');await page.getByLabel('Email').fill(email);await page.getByLabel('Password').fill('PreviewOnly-4827');await page.getByRole('button',{name:'Create preview account'}).click();
  await page.locator('[data-life-changed]').waitFor({state:'visible',timeout:20000});
  const seeded=await context.request.post(`${SITE}/v1/shift/preview-billy`,{data:{}});if(!seeded.ok())throw new Error(`preview seed ${seeded.status()}`);
  const date=new Date(),iso=offset=>{const day=new Date(date);day.setUTCDate(day.getUTCDate()-offset);return day.toISOString().slice(0,10)};
  for(const offset of [14,7]){const learned=await context.request.post(`${SITE}/v1/shift/daily-adjust`,{headers:{'X-Shift-Local-Date':iso(offset),'X-Shift-Local-Hour':'17'},data:{scenario:'working_late'}});if(!learned.ok())throw new Error(`friction seed ${learned.status()}`)}
  const feedback=await context.request.post(`${SITE}/v1/shift/daily-feedback`,{headers:{'X-Shift-Local-Date':iso(0),'X-Shift-Local-Hour':'17'},data:{feedback:'love',target:'daily_recommendation',meal_id:'preview-dinner'}});if(!feedback.ok())throw new Error(`learning seed ${feedback.status()}`);
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-life-changed]').waitFor({state:'visible',timeout:20000});await pause(page);await screen(page,'05-my-timber-today');await zeroOverflow(page,'My Timber Today');
  const today=await page.locator('body').innerText();for(const marker of ['SHIFT REMEMBERED','SHIFT SAW THIS COMING','TEACH SHIFT WITHOUT ANOTHER QUESTIONNAIRE','Your week, without the spreadsheet.','Morning plan reminder','Life changed?'])today.includes(marker)?pass(`My Timber visible: ${marker}`):fail(`My Timber missing: ${marker}`);
  await page.locator('[data-life-changed]').click();await page.locator('[data-adjust="working_late"]').click();await page.locator('.mt-rebuilt').waitFor({state:'visible',timeout:15000});await pause(page);await screen(page,'06-working-late-rebuilt');
  const rebuilt=await page.locator('body').innerText();/10 minutes/i.test(rebuilt)?pass('Working Late compresses movement'):fail('Working Late did not compress movement');
}catch(error){fail('journey exception',String(error?.message||error).slice(0,1500))}finally{
  const video=page.video();await context.close();if(video)await video.saveAs(path.join(OUT,'shift-consumer-preview-iphone-safari.webm'));await browser.close();fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
}
console.log(JSON.stringify(report,null,2));
if(report.failures.length)throw new Error(`Consumer preview failed ${report.failures.length} check(s)`);
