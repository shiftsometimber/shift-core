// Called only with the existing labelled synthetic commissioning account.
import assert from 'node:assert/strict';

export async function openMemberTool(page,key){
 assert(['today','grub','fit','life-back'].includes(key),'Known member tool required');
 const legacy=page.locator('#appTab-'+key);
 await legacy.waitFor({state:'attached',timeout:45000});
 if(await page.locator('body').getAttribute('data-member-experience-ui')!=='20261015'){await legacy.click();return;}
 const nav=page.locator('#appBottomNav');
 if(key==='life-back'){
  const more=page.locator('#memberMoreDialog');
  if(!await more.isVisible())await nav.locator('#appMore[aria-controls="memberMoreDialog"]').click();
  await more.getByRole('link',{name:'Life Back · goals & wins',exact:true}).click();
  await more.waitFor({state:'hidden',timeout:10000});
 }else await nav.getByRole('link',{name:{today:'Today',grub:'Grub',fit:'Fit'}[key],exact:true}).click();
}
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
  // A late composer can collapse an inactive field after a visibility check.
  // Start through its ordinary visible click before returning it for typing.
  try{await field.click({timeout:Math.min(250,Math.max(1,deadline-Date.now()))});assert(await field.isVisible(),'Fit control must remain visible after its ordinary click');return field;}
  catch(error){if(error.name!=='TimeoutError')throw error;}
 }
 await field.waitFor({state:'visible',timeout:1});return field;
}
export async function verifyLiveTools(page,site,dir,report){
 for(const width of [390,1440]){await page.setViewportSize({width,height:900});for(const view of ['app','web']){console.log('START live tools '+view+' '+width);
 await page.goto(site+'/member/dashboard?view='+view+'#today',{waitUntil:'domcontentloaded'});await page.locator('#appTab-grub').waitFor({state:'attached',timeout:45000});await page.waitForFunction(()=>document.body.dataset.memberExperienceUi==='20261015',null,{timeout:45000});
 let navigations=0;const count=r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())navigations++};page.on('request',count);
 await openMemberTool(page,'grub');const grub=page.frameLocator('#appTool-grub iframe');await grub.locator('#grubSearch').waitFor({timeout:45000});await grub.locator('#grubSearch').fill('Synthetic unsaved meal search');
 await openMemberTool(page,'fit');const fit=page.frameLocator('#appTool-fit iframe');
 const fitNote=await revealSetupField(fit,'#fitPrefs');
 await fitNote.evaluate(field=>{
  const describe=()=>({at:performance.now(),readyState:document.readyState,visible:!!field.getClientRects().length,disclosures:[...document.querySelectorAll('details')].filter(d=>d.contains(field)).map(d=>({open:d.open,marker:d.hasAttribute('data-app-fit-setup'),summary:d.querySelector(':scope > summary')?.textContent?.trim()}))});
  window.__fitAcceptanceTrace=[{event:'before-fill',...describe()}];
  new MutationObserver(records=>{if(window.__fitAcceptanceTrace.length<100)window.__fitAcceptanceTrace.push({event:'mutation',changes:records.map(r=>({kind:r.type,attribute:r.attributeName})),...describe()})}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','hidden','style','class']});
 });
 try{await fitNote.fill('Synthetic unsaved session note');}finally{
  const trace=await fitNote.evaluate(()=>window.__fitAcceptanceTrace).catch(()=>[]);
  report.checks.push({view,width,fitDisclosureTrace:trace});console.log('FIT DISCLOSURE TRACE '+JSON.stringify({view,width,trace}));
 }
 await openMemberTool(page,'life-back');const life=page.frameLocator('#appTool-life-back iframe');await life.locator('#journeyView:not([hidden])').waitFor({timeout:45000});await life.locator('.area-card').first().click();assert(await life.locator('dialog[open]').isVisible());await life.locator('dialog[open] [data-close]').first().click();
 await openMemberTool(page,'grub');assert.equal(await grub.locator('#grubSearch').inputValue(),'Synthetic unsaved meal search');await openMemberTool(page,'fit');assert.equal(await fit.locator('#fitPrefs').inputValue(),'Synthetic unsaved session note','Fit notes must survive leaving and reopening the panel');await openMemberTool(page,'life-back');await openMemberTool(page,'grub');await page.goBack();assert.equal(await page.locator('#appTab-life-back').getAttribute('aria-selected'),'true');await page.locator('#appBottomNav a[href$="#journey"][aria-current="page"]').waitFor({state:'visible',timeout:10000});await page.goForward();assert.equal(await page.locator('#appTab-grub').getAttribute('aria-selected'),'true');await page.locator('#appBottomNav a[href^="/member/grub"][aria-current="page"]').waitFor({state:'visible',timeout:10000});assert.equal(navigations,0);page.off('request',count);
 assert.equal(await page.locator('[data-app-layout]').count(),1);assert.equal(await page.locator('#appPreviewBar').count(),0);assert.equal(await page.locator('#todayBrand .member-design-mark').count(),1);assert.equal(await page.locator('#appBottomNav>*').count(),5);assert(!(await page.locator('#todayActions>.mtm-hero').isVisible()));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 const toolFrames=page.frames().filter(f=>f!==page.mainFrame()&&f.url().includes('app_panel=1'));
 for(const f of toolFrames){await f.waitForFunction(()=>!!window.SSTConsent);assert.equal(await f.locator('.cookie-banner-v3a').count(),0,'No duplicate consent inside tool');assert(!(await f.locator('#appBottomNav').isVisible()),'Containing page owns tool navigation');assert(!(await f.locator('#sst-footer-c').isVisible()),'Containing page owns the canonical footer');}assert.equal(await page.locator('#sst-footer-c').count(),1);assert(!(await page.locator('#sst-footer-c').isVisible()),'The member workspace has no visible public website footer');assert(await page.locator('#appBottomNav').isVisible());
 assert.equal(toolFrames.length,3);console.log('PASS visible draft/history/footer controls '+view+' '+width);
 await toolFrames[0].evaluate(()=>window.SSTConsent.show());assert.equal(await page.locator('.cookie-banner-v3a').count(),1,'One containing consent dialog');
 await page.screenshot({path:dir+'/live-'+view+'-'+width+'-single-consent.png',fullPage:false,timeout:15000});
 await page.locator('[data-consent="necessary"]').click();
 for(const f of toolFrames){assert.equal(await f.locator('.cookie-banner-v3a').count(),0);assert.equal(await f.evaluate(()=>window.sstConsent.analytics),false);assert.equal(await f.evaluate(()=>window.sstConsent.acquisition),false);}
 assert.equal(await page.locator('.cookie-banner-v3a').count(),0);report.checks.push({view,width,singleConsentOwner:true,threePanelsFollowRefusal:true,panelReopenDelegates:true});
 await page.screenshot({path:dir+'/live-'+view+'-'+width+'-inline.png',fullPage:false,timeout:15000});
 console.log('PASS single consent owner '+view+' '+width);await openMemberTool(page,'today');report.checks.push({view,width,inlineTools:true,oneNavigationOwner:true,oneFooterOwner:true,draftsRetained:true,history:true,topNavigations:navigations});
 }}
}
