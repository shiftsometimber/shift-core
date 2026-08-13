import {chromium} from 'playwright';
import fs from 'node:fs';import path from 'node:path';
const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const OUT=process.env.PROGRESS_UNIT_EVIDENCE_DIR||'progress-unit-evidence';
if(!OIDC)throw new Error('SHIFT_COMMISSIONING_OIDC required');fs.mkdirSync(OUT,{recursive:true});
const password='Shift-Progress-Units-2026!';
const report={proof:'G2_012_PROGRESS_UNITS_RENDERED_PRODUCTION_V2',cases:[],failures:[]};
const fail=(name,detail)=>{report.failures.push({name,detail});console.error(`::error title=G2-012 Progress units::${name} — ${detail}`)};
const write=()=>fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
async function register(email){const r=await fetch(`${API}/v1/auth/register`,{method:'POST',headers:{Origin:SITE,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':OIDC},body:JSON.stringify({email,password,firstName:'ProgressUnits',source:'commissioning-rendered-progress-units'})});if(r.status!==201)throw new Error(`register ${r.status} ${await r.text()}`)}
async function login(page,email){await page.goto(`${SITE}/member-login`,{waitUntil:'domcontentloaded',timeout:30000});const result=await page.evaluate(async({api,email,password})=>{const r=await fetch(`${api}/v1/auth/login`,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});let body={};try{body=await r.json()}catch{}return{ok:r.ok,status:r.status,error:body.error||null}}, {api:API,email,password});if(!result.ok)throw new Error(`login ${result.status} ${result.error||''}`)}
async function openVisual(page){
 await page.goto(`${SITE}/member/dashboard`,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForSelector('#photoWeightUnit',{state:'attached',timeout:20000});
 const candidates=[
  page.getByRole('tab',{name:/^Progress Picture$/i}).first(),
  page.locator('.mp-tab').filter({hasText:/^Progress Picture$/i}).first(),
  page.getByRole('button',{name:/^Progress Picture$/i}).first(),
  page.getByRole('link',{name:/^Progress Picture$/i}).first(),
  page.getByText(/^Progress Picture$/i).first(),
  page.getByRole('button',{name:/^Shift Progress$/i}).first(),
  page.getByRole('link',{name:/^Shift Progress$/i}).first()
 ];
 for(const x of candidates){
  if(!await x.count()||!await x.isVisible().catch(()=>false))continue;
  await x.click({timeout:8000}).catch(()=>{});await page.waitForTimeout(700);
  if(await page.locator('#photoWeightUnit').isVisible().catch(()=>false))break;
 }
 await page.waitForSelector('#photoWeightUnit',{state:'visible',timeout:5000});
 await page.waitForSelector('#photoWaistUnit',{state:'visible',timeout:5000});
 await page.waitForSelector('#savedPhotos',{state:'attached',timeout:10000});
}
const tinyPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z3p8AAAAASUVORK5CYII=','base64');
const browser=await chromium.launch({headless:true});
try{
 for(const [id,viewport] of Object.entries({desktop:{width:1440,height:900},mobile390:{width:390,height:844}})){
  const email=`shiftsometimber+structured-authrender-progressunits-${Date.now()}-${id}@gmail.com`;
  const row={id,viewport,firstSave:null,afterReturn:null};report.cases.push(row);
  try{
   await register(email);const context=await browser.newContext({viewport,reducedMotion:'reduce'});const page=await context.newPage();
   await login(page,email);await openVisual(page);
   await page.selectOption('#photoWeightUnit','stone');await page.selectOption('#photoWeightStone','14');await page.selectOption('#photoWeightPounds','13.5');
   await page.selectOption('#photoWaistUnit','in');await page.selectOption('#photoWaist','50.0');
   await page.setInputFiles('#photoInput',{name:'progress-unit.png',mimeType:'image/png',buffer:tinyPng});
   await page.check('#savePhotoConsent');await page.click('#saveOriginal');
   await page.waitForFunction(()=>/Original progress photo saved to My Shift/i.test(document.querySelector('#visualStatus')?.textContent||''),null,{timeout:30000});
   await page.waitForFunction(()=>/15 st 0 lb/.test(document.querySelector('#savedPhotos')?.textContent||'')&&/50\.0 in waist/.test(document.querySelector('#savedPhotos')?.textContent||''),null,{timeout:20000});
   const first=clean(await page.locator('#savedPhotos').innerText());row.firstSave=first;
   if(/\bst 14 lb\b/i.test(first))fail(`${id}-stone-carry`,'impossible 14 lb remainder still rendered');
   if(!/15 st 0 lb/.test(first))fail(`${id}-stone-rounded-total`,`expected 15 st 0 lb; got ${first.slice(0,500)}`);
   if(!/50\.0 in waist/.test(first))fail(`${id}-waist-inches`,`expected 50.0 in waist; got ${first.slice(0,500)}`);
   await page.screenshot({path:path.join(OUT,`${id}-first-save.png`),fullPage:true});
   await page.evaluate(()=>window.SST_API?.logout());await page.goto(`${SITE}/member-login`,{waitUntil:'domcontentloaded',timeout:30000});await login(page,email);await openVisual(page);
   await page.waitForFunction(()=>/15 st 0 lb/.test(document.querySelector('#savedPhotos')?.textContent||'')&&/50\.0 in waist/.test(document.querySelector('#savedPhotos')?.textContent||''),null,{timeout:20000});
   const returned=clean(await page.locator('#savedPhotos').innerText());row.afterReturn=returned;
   if(/\bst 14 lb\b/i.test(returned))fail(`${id}-return-stone-carry`,'impossible 14 lb remainder returned after logout/login');
   if(!/15 st 0 lb/.test(returned)||!/50\.0 in waist/.test(returned))fail(`${id}-return-units`,`unit preference/readback lost after logout/login: ${returned.slice(0,500)}`);
   const geom=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));row.rootOverflow=geom.scroll-geom.client;if(row.rootOverflow>0)fail(`${id}-overflow`,`root overflow ${row.rootOverflow}px`);
   await page.screenshot({path:path.join(OUT,`${id}-after-return.png`),fullPage:true});
   const del=page.locator('[data-photo-delete]').first();if(await del.count())await del.click().catch(()=>{});
   await context.close();
  }catch(e){fail(`${id}-exception`,clean(e?.message||e).slice(0,1000))}finally{write()}
 }
}finally{await browser.close();write()}
console.log(JSON.stringify(report,null,2));if(report.failures.length)throw new Error(`G2-012 rendered production proof failed ${report.failures.length}`);console.log('PASS G2-012 Progress units on desktop + 390px with save -> logout -> return retention.');
