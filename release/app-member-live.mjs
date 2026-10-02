// Called only with the existing labelled synthetic commissioning account.
import assert from 'node:assert/strict';
export async function revealSetupField(frame,selector){
 const field=frame.locator(selector);await field.waitFor({state:'attached',timeout:45000});
 // The saved-session wrapper can arrive after the field or reuse an existing
 // disclosure without the setup marker. Follow its actual visible controls.
 const deadline=Date.now()+45000;
 while(Date.now()<deadline){
  const closed=field.locator('xpath=ancestor::details[not(@open)]');
  let opened=false;
  for(let i=0;i<await closed.count();i++){
   const control=closed.nth(i).locator(':scope > summary');
   if(await control.isVisible()){await control.click();opened=true;break;}
  }
  if(opened)continue;
  try{await field.waitFor({state:'visible',timeout:Math.min(250,Math.max(1,deadline-Date.now()))});return field;}
  catch(error){if(error.name!=='TimeoutError')throw error;}
 }
 await field.waitFor({state:'visible',timeout:1});return field;
}
export async function verifyLiveTools(page,site,dir,report){
 for(const width of [390,1440]){await page.setViewportSize({width,height:900});for(const view of ['app','web']){console.log('START live tools '+view+' '+width);
 await page.goto(site+'/member/dashboard?view='+view+'#today',{waitUntil:'domcontentloaded'});await page.locator('#appTab-grub').waitFor({timeout:45000});
 let navigations=0;const count=r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())navigations++};page.on('request',count);
 await page.locator('#appTab-grub').click();const grub=page.frameLocator('#appTool-grub iframe');await grub.locator('#grubSearch').waitFor({timeout:45000});await grub.locator('#grubSearch').fill('Synthetic unsaved meal search');
 await page.locator('#appTab-fit').click();const fit=page.frameLocator('#appTool-fit iframe');const fitNote=await revealSetupField(fit,'#fitPrefs');await fitNote.fill('Synthetic unsaved session note');
 await page.locator('#appTab-life-back').click();const life=page.frameLocator('#appTool-life-back iframe');await life.locator('#journeyView:not([hidden])').waitFor({timeout:45000});await life.locator('.area-card').first().click();assert(await life.locator('dialog[open]').isVisible());await life.locator('dialog[open] [data-close]').first().click();
 await page.locator('#appTab-grub').click();assert.equal(await grub.locator('#grubSearch').inputValue(),'Synthetic unsaved meal search');await page.locator('#appTab-fit').click();assert.equal(await fit.locator('#fitPrefs').inputValue(),'Synthetic unsaved session note','Fit notes must survive leaving and reopening the panel');await page.locator('#appTab-life-back').click();await page.locator('#appTab-grub').click();await page.goBack();assert.equal(await page.locator('#appTab-life-back').getAttribute('aria-selected'),'true');await page.goForward();assert.equal(await page.locator('#appTab-grub').getAttribute('aria-selected'),'true');assert.equal(navigations,0);page.off('request',count);
 assert.equal(await page.locator('[data-app-layout]').count(),1);assert.equal(await page.locator('#appPreviewBar').count(),0);assert.equal(await page.locator('#todayBrand .member-design-mark').count(),1);assert.equal(await page.locator('#appBottomNav>*').count(),5);assert(!(await page.locator('#todayActions>.mtm-hero').isVisible()));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 const toolFrames=page.frames().filter(f=>f!==page.mainFrame()&&f.url().includes('app_panel=1'));
 for(const f of toolFrames){await f.waitForFunction(()=>!!window.SSTConsent);assert.equal(await f.locator('.cookie-banner-v3a').count(),0,'No duplicate consent inside tool');assert(!(await f.locator('#appBottomNav').isVisible()),'Containing page owns tool navigation');assert(!(await f.locator('#sst-footer-c').isVisible()),'Containing page owns the canonical footer');}assert.equal(await page.locator('#sst-footer-c').count(),1);assert(await page.locator('#appBottomNav').isVisible());
 assert.equal(toolFrames.length,3);console.log('PASS visible draft/history/footer controls '+view+' '+width);
 await toolFrames[0].evaluate(()=>window.SSTConsent.show());assert.equal(await page.locator('.cookie-banner-v3a').count(),1,'One containing consent dialog');
 await page.screenshot({path:dir+'/live-'+view+'-'+width+'-single-consent.png',fullPage:false,timeout:15000});
 await page.locator('[data-consent="necessary"]').click();
 for(const f of toolFrames){assert.equal(await f.locator('.cookie-banner-v3a').count(),0);assert.equal(await f.evaluate(()=>window.sstConsent.analytics),false);assert.equal(await f.evaluate(()=>window.sstConsent.acquisition),false);}
 assert.equal(await page.locator('.cookie-banner-v3a').count(),0);report.checks.push({view,width,singleConsentOwner:true,threePanelsFollowRefusal:true,panelReopenDelegates:true});
 await page.screenshot({path:dir+'/live-'+view+'-'+width+'-inline.png',fullPage:false,timeout:15000});
 console.log('PASS single consent owner '+view+' '+width);await page.locator('#appTab-today').click();report.checks.push({view,width,inlineTools:true,oneNavigationOwner:true,oneFooterOwner:true,draftsRetained:true,history:true,topNavigations:navigations});
 }}
}
