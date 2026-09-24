import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {commissioningLogin,memberReady,requireMemberPanel} from './rendered-member-acceptance-support.mjs';
const SITE=(process.env.SHIFT_SITE_BASE||'https://shiftsometimber.co.uk').replace(/\/$/,'');
const API=(process.env.SHIFT_API_BASE||'https://api.shiftsometimber.co.uk').replace(/\/$/,'');
const OIDC=String(process.env.SHIFT_COMMISSIONING_OIDC||'').trim();
const OUT=process.env.MY_TIMBER_FINAL_EVIDENCE_DIR||'my-timber-final-evidence';
if(!OIDC)throw new Error('SHIFT_COMMISSIONING_OIDC required');
const dir=path.join(OUT,'google-play');fs.mkdirSync(dir,{recursive:true});
const email=`shiftsometimber+structured-authrender-store-${Date.now()}@gmail.com`,password=`Sst-${randomUUID()}-Aa1!`;
const reg=await fetch(API+'/v1/auth/register',{method:'POST',headers:{Origin:SITE,'Content-Type':'application/json','X-Shift-Commissioning-OIDC':OIDC},body:JSON.stringify({email,password,firstName:'Billy',source:'commissioning-my-timber-store'})});
if(reg.status!==201)throw new Error('register '+reg.status+' '+await reg.text());
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:693},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
const page=await context.newPage(),screens=[];
async function cookie(){const b=page.getByRole('button',{name:/Necessary only/i});if(await b.count()&&await b.first().isVisible().catch(()=>false))await b.first().click().catch(()=>{});}
async function shot(i,slug,label){await cookie();await page.evaluate(()=>{document.querySelectorAll('#myTimberApp,.my-timber-app-footer,#pwaReminderFirstRun,#pwaReminderSettings').forEach(x=>x.remove());scrollTo(0,0)});await page.waitForTimeout(250);const file=String(i).padStart(2,'0')+'-'+slug+'.png';await page.screenshot({path:path.join(dir,file),fullPage:false});screens.push({file,label,width:780,height:1386});}
async function go(url){await page.goto(SITE+url,{waitUntil:'domcontentloaded',timeout:30000});await page.locator('main').first().waitFor({state:'visible',timeout:30000});await page.waitForTimeout(500);}
try{
 await commissioningLogin(page,{site:SITE,api:API,oidc:OIDC,email,password});
 await memberReady(page,{site:SITE});await page.waitForSelector('#todayActions[data-today-decision-ready="true"]',{state:'visible',timeout:30000});await shot(1,'today','Today — one useful next step');
 await requireMemberPanel(page,'journey');await shot(2,'journey','Journey — programme progress');
 await requireMemberPanel(page,'visualise');await shot(3,'progress','Progress — visualise progress');
 await go('/member/check-in');await shot(4,'check-in','Check-in — quick member check-in');
 await go('/member/grub');await page.waitForFunction(()=>!/Loading your saved food/i.test(document.body.innerText),null,{timeout:15000}).catch(()=>{});await shot(5,'grub','Grub — practical food support');
 await go('/member/fit');await page.waitForFunction(()=>!/Loading your recommendation/i.test(document.body.innerText),null,{timeout:15000}).catch(()=>{});await shot(6,'fit','Fit — practical movement support');
 await go('/member/life-back');await shot(7,'life-back','Life Back — goals and wins');
 await go('/member/settings');await shot(8,'settings','Settings — member details and privacy');
 fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify({proof:'MY_TIMBER_GOOGLE_PLAY_SCREENSHOTS_V1',source:process.env.GITHUB_SHA,capturedAt:new Date().toISOString(),syntheticAccount:true,realMemberData:false,screens},null,2));
 console.log('PASS: captured 8 Google Play screenshots from production My Timber with synthetic member only.');
}finally{await context.close();await browser.close();}
