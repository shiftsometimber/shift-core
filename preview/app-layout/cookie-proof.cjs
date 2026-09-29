const fs=require('fs'),assert=require('assert/strict');
const {chromium,webkit}=require(process.env.APP_TOOLS+'/node_modules/playwright');
const base=process.env.PREVIEW_URL,dir='work/staging/generated/app-layout-evidence';
assert(/^https:\/\/shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(base));
const fixture=JSON.parse(fs.readFileSync('work/staging/generated/probe.json'));
const report={source:process.env.GITHUB_SHA,productionWrites:0,cases:[]};
(async()=>{try{let index=0;for(const [engine,name]of [[chromium,'chromium'],[webkit,'webkit']])for(const width of [390,1440]){
 const browser=await engine.launch();try{for(const view of ['app','web']){
 const ctx=await browser.newContext({viewport:{width,height:900}}),p=await ctx.newPage();const row={engine:name,width,view,checks:[]};report.cases.push(row);
 try{const login=await ctx.request.post(base+'/v1/auth/login',{headers:{Origin:base},data:{email:'probe'+fixture.browserIds[index]+'@example.invalid',password:fixture.password}});assert(login.ok());
 await p.goto(base+'/member/dashboard?view='+view+'#today',{waitUntil:'domcontentloaded'});await p.locator('#appTab-grub').waitFor({timeout:45000});await p.locator('.cookie-banner-v3a').waitFor();
 for(const k of ['grub','fit','life-back']){await p.locator('#appTab-'+k).click();await p.frameLocator('#appTool-'+k+' iframe').locator('body[data-app-panel="1"]').waitFor({timeout:45000});}
 const frames=()=>p.frames().filter(f=>f!==p.mainFrame()&&f.url().includes('app_panel=1'));
 async function state(a,q){for(const f of frames()){await f.waitForFunction(()=>!!window.SSTConsent);assert.equal(await f.locator('.cookie-banner-v3a').count(),0);assert.equal(await f.evaluate(()=>window.sstConsent.analytics),a);assert.equal(await f.evaluate(()=>window.sstConsent.acquisition),q);}}
 await state(false,false);assert.equal(await p.locator('.cookie-banner-v3a').count(),1);assert.equal(await p.evaluate(()=>localStorage.getItem('sstConsentV3')),null);row.checks.push('Fresh session: exactly one notice; all three panels default deny; no invented saved choice');
 await p.locator('#appTab-grub').click();await p.screenshot({path:dir+'/cookie-'+name+'-'+width+'-'+view+'-one-notice.png',fullPage:true});
 for(const [kind,a,q]of [['necessary',false,false],['shift',false,true],['analytics',true,true],['necessary',false,false]]){await p.evaluate(()=>window.SSTConsent.show());await p.locator('[data-consent="'+kind+'"]').click();await state(a,q);assert.equal(await p.locator('.cookie-banner-v3a').count(),0);}
 row.checks.push('Necessary, SHIFT-only, analytics and withdrawal propagate to every loaded panel');
 await frames()[0].evaluate(()=>window.SSTConsent.show());assert.equal(await p.locator('.cookie-banner-v3a').count(),1);await state(false,false);await p.locator('[data-consent="necessary"]').click();
 await p.reload({waitUntil:'domcontentloaded'});await p.frameLocator('#appTool-grub iframe').locator('body[data-app-panel="1"]').waitFor({timeout:45000});await state(false,false);assert.equal(await p.locator('.cookie-banner-v3a').count(),0);row.checks.push('Panel reopen delegates to parent; saved refusal survives refresh');
 await p.screenshot({path:dir+'/cookie-'+name+'-'+width+'-'+view+'-dismissed.png',fullPage:true});row.status='pass';
 }catch(e){row.status='fail';row.error=e.message;await p.screenshot({path:dir+'/cookie-failure-'+name+'-'+width+'-'+view+'.png',fullPage:true}).catch(()=>{});throw e}finally{await ctx.close();}
 }}finally{await browser.close();}index++;}
}finally{fs.writeFileSync(dir+'/cookie-report.json',JSON.stringify(report,null,2));}})().catch(e=>{console.error(e);process.exitCode=1});
