import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {commissioningLogin,memberReady,requireMemberPanel} from './rendered-member-acceptance-support.mjs';

const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const OUT=process.env.MY_TIMBER_APPLE_SCREENSHOT_DIR||'my-timber-apple-screenshots';
if(!OIDC)throw new Error('SHIFT_COMMISSIONING_OIDC required');
fs.mkdirSync(OUT,{recursive:true});

const email=`shiftsometimber+apple-store-${Date.now()}@gmail.com`;
const password=`Sst-${randomUUID()}-Aa1!`;
const report={proof:'MY_TIMBER_APPLE_STORE_SCREENSHOTS_V1',capturedAt:new Date().toISOString(),source:process.env.GITHUB_SHA||'',account:'synthetic commissioning member; no real member data',sets:[]};

async function register(){
 const r=await fetch(`${API}/v1/auth/register`,{method:'POST',headers:{Origin:SITE,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':OIDC},body:JSON.stringify({email,password,firstName:'Billy',source:'commissioning-apple-store-screenshots'})});
 if(r.status!==201)throw new Error(`register ${r.status} ${await r.text()}`);
}
async function dismissCookie(page){
 const b=page.getByRole('button',{name:/Necessary only/i});
 if(await b.count()&&await b.first().isVisible().catch(()=>false))await b.first().click().catch(()=>{});
}
async function open(page,url){
 await page.goto(SITE+url,{waitUntil:'domcontentloaded',timeout:30000});
 await page.locator('main').first().waitFor({state:'visible',timeout:30000});
 await dismissCookie(page);await page.waitForTimeout(650);
}
async function captureSet(browser,spec){
 const dir=path.join(OUT,spec.slug);fs.mkdirSync(dir,{recursive:true});
 const context=await browser.newContext({viewport:spec.viewport,deviceScaleFactor:spec.dpr,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await context.newPage();
 await commissioningLogin(page,{site:SITE,api:API,oidc:OIDC,email,password});
 const headers={Origin:SITE,'X-Shift-Local-Date':new Date().toISOString().slice(0,10),'X-Shift-Local-Hour':'18'};
 // Seed useful fictional content once; repeated calls are safe for this synthetic account.
 const grub=await context.request.post(`${API}/v1/grub/plan`,{headers,data:{days:7,calories:2000,protein_g:120,preferences:'UK family food, healthy fakeaways, no mushrooms',max_minutes:45,household_size:2}});
 assert(grub.ok(),`Grub seed HTTP ${grub.status()}`);
 const fit=await context.request.post(`${API}/v1/fit/plan`,{headers,data:{days:3,minutes_per_day:30,location:'home',equipment:['bodyweight','dumbbells'],preferences:'fat loss, build confidence',limitations:'no acute injuries'}});
 assert(fit.ok(),`Fit seed HTTP ${fit.status()}`);

 const shots=[];
 async function shot(index,slug,label){
  await dismissCookie(page);await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(350);
  const file=`${String(index).padStart(2,'0')}-${slug}.png`,full=path.join(dir,file);
  await page.screenshot({path:full,fullPage:false});
  const png=fs.readFileSync(full),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  assert.equal(width,spec.output.width,file+' width');assert.equal(height,spec.output.height,file+' height');
  shots.push({index,file,label,width,height,bytes:png.length});
 }
 await memberReady(page,{site:SITE});await page.waitForSelector('#todayActions',{state:'visible',timeout:30000});await shot(1,'today','Today — one useful next step');
 await requireMemberPanel(page,'journey');await shot(2,'journey','Journey — programme progress');
 await requireMemberPanel(page,'visualise');await shot(3,'progress','Progress — see what is changing');
 await open(page,'/member/check-in');await shot(4,'check-in','Check-in — quick member check-in');
 await open(page,'/member/grub');await shot(5,'grub','Grub — practical food support');
 await open(page,'/member/fit');await shot(6,'fit','Fit — practical movement support');
 await open(page,'/member/life-back');await shot(7,'life-back','Life Back — goals and wins');
 await open(page,'/member/settings');await page.waitForFunction(()=>!document.querySelector('#memberDetailsFields')?.disabled,null,{timeout:30000}).catch(()=>{});await shot(8,'settings','Settings — member details and privacy');
 report.sets.push({device:spec.name,display:spec.display,output:spec.output,shots});
 await context.close();
}
await register();
const browser=await chromium.launch({headless:true});
try{
 await captureSet(browser,{slug:'iphone-6.5',name:'iPhone',display:'6.5-inch App Store set',viewport:{width:414,height:896},dpr:3,output:{width:1242,height:2688}});
 await captureSet(browser,{slug:'ipad-13',name:'iPad',display:'13-inch App Store set',viewport:{width:1024,height:1366},dpr:2,output:{width:2048,height:2732}});
}finally{await browser.close()}
fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
console.log('PASS: 8 iPhone + 8 iPad production My Timber screenshots captured at Apple-accepted portrait sizes.');
