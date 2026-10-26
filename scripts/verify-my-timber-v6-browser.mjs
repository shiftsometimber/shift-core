// Finite acceptance against the actual live member interface. No API replacement.
// All authenticated contexts are restricted to the two reserved synthetic users.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(process.env.TIMBER_BROWSER_PACKAGE||'/Users/shiftsometimberltd/SST/shift-rollout-grub-safety-20261006/package.json');
const {chromium,webkit}=require('playwright');
const root=path.resolve(import.meta.dirname,'../..','v6-live-acceptance');
const sessions=JSON.parse(fs.readFileSync(path.join(root,'synthetic-sessions.json'),'utf8'));
const base='https://shiftsometimber.co.uk';
if(sessions.tag!=='my_timber_release_test_v6'||sessions.members.length!==2||sessions.members.some(u=>!/^my-timber-v6-(dan|lee)@example\.invalid$/.test(u.email)))throw Error('Reserved synthetic accounts required');
fs.mkdirSync(path.join(root,'screens'),{recursive:true});
const receipt={at:new Date().toISOString(),source:process.env.TIMBER_SOURCE||'uncommitted-candidate',target:base,engines:[],cases:[],realMemberDataRead:false,externalCommunicationsSent:0,physicalPhoneTested:false};
const record=(id,status,evidence)=>{receipt.cases.push({id,status,...evidence});fs.writeFileSync(path.join(root,'browser-receipt.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({id,status,...evidence}));};
const assert=(v,message)=>{if(!v)throw Error(message);};
async function context(browser,account,width=390){
 const ctx=await browser.newContext({baseURL:base,viewport:{width,height:844},isMobile:true,hasTouch:true,acceptDownloads:true});
 await ctx.route('**/v1/events',r=>r.abort()); // Test visits must not inflate member metrics.
 if(account){await ctx.addCookies([{name:account.role?'sst_hq_session':'sst_session',value:account.token,url:base,httpOnly:true,secure:true,sameSite:'Lax'}]);}
 return ctx;
}
async function identity(ctx,account){
 const r=await ctx.request.get('/v1/profile');assert(r.ok(),'Synthetic profile is not accessible');const d=await r.json();
 assert(Number(d.profile?.id)===account.id&&d.profile.email===account.email&&d.profile.source===sessions.tag,'Account guard failed');
}
const settle=async page=>{await page.waitForLoadState('domcontentloaded');await page.waitForFunction(()=>document.body.dataset.memberSession==='ready'||document.body.innerText.includes('Sign in'),{timeout:15000}).catch(()=>{});};
async function screenshot(page,name){const file=path.join(root,'screens',name+'.png');await page.screenshot({path:file,fullPage:true});return file;}
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
 const browser=await engine.launch({headless:true});receipt.engines.push(name);
 try{
  const anonymous=await context(browser);const first=await anonymous.newPage();
  await first.goto('/member/get-started/try');const start=Date.now();await first.locator('[data-try-choice="late"]').click();
  await first.locator('#supportTryResult').waitFor({state:'visible'});const text=await first.locator('#supportTryResult').innerText();
  assert(/fictional/i.test(text)&&/fallback/i.test(text)&&/you.ll need/i.test(text),'Try flow must give labelled ingredients and fallback');
  record('C1-'+name,'PASS',{elapsedMs:Date.now()-start,screenshot:await screenshot(first,name+'-C1-first-minute'),registrationDelivery:'Synthetic accounts prepared without email; real registration not exercised'});
  await anonymous.close();
  const member=sessions.members[0],ctx=await context(browser,member);await identity(ctx,member);
  const page=await ctx.newPage();await page.goto('/member/life-back/support');await settle(page);
  await page.locator('#supportPlanMain').waitFor();
  record('member-interface-'+name,'OBSERVED',{title:await page.title(),body:(await page.locator('body').innerText()).slice(0,4000),screenshot:await screenshot(page,name+'-support-start')});
  // Full width sweep: actual page rendering and navigational controls.
  for(const width of [320,360,390,430]){
   await page.setViewportSize({width,height:844});
   for(const [tab,url] of [['support-plan','/member/life-back/support'],['today','/member/dashboard#today'],['journey','/member/dashboard#journey'],['grub','/member/grub'],['fit','/member/fit'],['support','/member/dashboard?timber=support#today'],['stuff','/member/dashboard?timber=stuff#today']]){
    await page.goto(url);await settle(page);await page.waitForTimeout(350);
    const overflow=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
    assert(overflow.document<=width+1&&overflow.body<=width+1,tab+' overflows '+width+'px');
    record(name+'-'+tab+'-'+width,'PASS',{overflow,screenshot:await screenshot(page,name+'-'+tab+'-'+width)});
   }
  }
  const asset=await ctx.request.get('/assets/member-experience/programme-support-plan.mjs');
  receipt.clientSHA256=createHash('sha256').update(await asset.body()).digest('hex');
  await ctx.close();
 }catch(error){record(name,'FAIL',{error:String(error.message).slice(0,1200)});}
 finally{await browser.close();}
}
receipt.finishedAt=new Date().toISOString();receipt.state=receipt.cases.some(x=>x.status==='FAIL')?'FAILED':'WIDTH_SMOKE_COMPLETE_FULL_JOURNEY_PENDING';
fs.writeFileSync(path.join(root,'browser-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
process.exitCode=receipt.state==='FAILED'?1:0;
