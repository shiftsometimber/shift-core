// Called only with the existing labelled synthetic commissioning account.
import assert from 'node:assert/strict';
export async function verifyLiveTools(page,site,dir,report){
 for(const width of [390,1440]){await page.setViewportSize({width,height:900});for(const view of ['app','web']){
 await page.goto(site+'/member/dashboard?view='+view+'#today',{waitUntil:'domcontentloaded'});await page.locator('#appTab-grub').waitFor({timeout:45000});
 let navigations=0;const count=r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())navigations++};page.on('request',count);
 await page.locator('#appTab-grub').click();const grub=page.frameLocator('#appTool-grub iframe');await grub.locator('#grubSearch').waitFor({timeout:45000});await grub.locator('#grubSearch').fill('Synthetic unsaved meal search');
 await page.locator('#appTab-fit').click();const fit=page.frameLocator('#appTool-fit iframe');await fit.locator('#fitPrefs').waitFor({timeout:45000});await fit.locator('#fitPrefs').fill('Synthetic unsaved session note');
 await page.locator('#appTab-life-back').click();const life=page.frameLocator('#appTool-life-back iframe');await life.locator('#journeyView:not([hidden])').waitFor({timeout:45000});await life.locator('.area-card').first().click();assert(await life.locator('dialog[open]').isVisible());await life.locator('dialog[open] [data-close]').first().click();
 await page.locator('#appTab-grub').click();assert.equal(await grub.locator('#grubSearch').inputValue(),'Synthetic unsaved meal search');await page.goBack();assert.equal(await page.locator('#appTab-life-back').getAttribute('aria-selected'),'true');await page.goForward();assert.equal(await page.locator('#appTab-grub').getAttribute('aria-selected'),'true');assert.equal(navigations,0);page.off('request',count);
 assert.equal(await page.locator('[data-app-layout]').count(),view==='app'?1:0);assert.equal(await page.locator('#appPreviewBar').count(),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 const toolFrames=page.frames().filter(f=>f!==page.mainFrame()&&f.url().includes('app_panel=1'));
 const consentFrames=[];
 for(const f of toolFrames){
  const state=await f.evaluate(()=>({controller:!!window.SSTConsent,path:location.pathname,analytics:window.sstConsent?.analytics,acquisition:window.sstConsent?.acquisition,trackers:performance.getEntriesByType('resource').map(x=>x.name).filter(x=>/google-analytics|googletagmanager|analytics-bootstrap|acquisition-client/i.test(x))}));
  report.checks.push({view,width,panelConsentState:state});
  assert.equal(await f.locator('.cookie-banner-v3a').count(),0,'No duplicate consent inside tool');
  if(state.controller)consentFrames.push(f);
  else {assert.equal(state.path,'/member/life-back','Only the consent-free Life Back page may omit the controller');assert.deepEqual(state.trackers,[]);assert.notEqual(state.analytics,true);assert.notEqual(state.acquisition,true);}
 }
 assert.equal(consentFrames.length,2,'Grub and Fit must use the parent consent choice');
 assert.equal(toolFrames.length,3);
 await consentFrames[0].evaluate(()=>window.SSTConsent.show());assert.equal(await page.locator('.cookie-banner-v3a').count(),1,'One containing consent dialog');
 await page.screenshot({path:dir+'/live-'+view+'-'+width+'-single-consent.png',fullPage:true});
 await page.locator('[data-consent="necessary"]').click();
 for(const f of consentFrames){assert.equal(await f.locator('.cookie-banner-v3a').count(),0);assert.equal(await f.evaluate(()=>window.sstConsent.analytics),false);assert.equal(await f.evaluate(()=>window.sstConsent.acquisition),false);}
 assert.equal(await page.locator('.cookie-banner-v3a').count(),0);report.checks.push({view,width,singleConsentOwner:true,consentClientsFollowRefusal:true,consentFreeLifeBackHasNoTrackers:true,panelReopenDelegates:true});
 await page.screenshot({path:dir+'/live-'+view+'-'+width+'-inline.png',fullPage:true});
 await page.locator('#appTab-today').click();report.checks.push({view,width,inlineTools:true,draftsRetained:true,history:true,topNavigations:navigations});
 }}
}
