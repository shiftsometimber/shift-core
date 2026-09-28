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
 await page.screenshot({path:dir+'/live-'+view+'-'+width+'-inline.png',fullPage:true});
 await page.locator('#appTab-today').click();report.checks.push({view,width,inlineTools:true,draftsRetained:true,history:true,topNavigations:navigations});
 }}
}
