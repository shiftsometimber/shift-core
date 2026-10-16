import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {screenClient} from '../preview/app-layout/screens.mjs';
import {openGpMemberSettingsPanel} from '../release/gp-directory-live-20261015.mjs';
const {chromium}=await import(process.env.GP_TEST_PLAYWRIGHT||'playwright');
const dir='growth-member-live-evidence/navigation-component';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true});const checks=[];
const html=(heading='GP practice (optional)')=>`<!doctype html><body data-member-page="settings"><main><section id="memberDetailsPanel"><form id="memberDetailsForm"><fieldset id="memberDetailsFields"><details><summary>Home address</summary><input name="home" value="unchanged fictional address"></details><details><summary>${heading}</summary><label>Practice name<input id="memberGpPractice" value="fictional local fixture"></label></details></fieldset><details><summary>Delivery address</summary><input value="fictional delivery"></details><details><summary>Change sign-in email</summary><input type="email" value="fictional@example.invalid"></details></form></section></main><script>${screenClient}</script></body>`;
try{for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:900}});await context.route('**/*',route=>route.abort('blockedbyclient'));const page=await context.newPage();
 await page.setContent(html());await page.locator('details:has(#memberDetailsForm)').waitFor();assert.equal(await page.locator('#memberGpPractice').isVisible(),false);
 await openGpMemberSettingsPanel(page);assert.equal(await page.locator('#memberGpPractice').isVisible(),true);assert.equal(await page.locator('#memberGpPractice').inputValue(),'fictional local fixture');
 await openGpMemberSettingsPanel(page);assert.equal(await page.locator('#memberGpPractice').isVisible(),true,'Repeated open must not close either panel');
 assert.equal(await page.locator('details[open]').count(),2,'Unrelated home/delivery/email sections remain closed');await page.screenshot({path:dir+'/'+width+'.png',fullPage:true});
 await page.setContent(html('Unexpected GP heading'));await assert.rejects(()=>openGpMemberSettingsPanel(page),/Exact normal GP disclosure heading/);checks.push({width,nestedNormalNavigation:true,repeatedOpenPreserved:true,unrelatedSectionsClosed:true,unexpectedHeadingRejected:true,realAccount:false,networkRequestsPermitted:false});await context.close();
}}finally{await browser.close();}
writeFileSync(dir+'/result.json',JSON.stringify({status:'pass',scope:'navigation component only; not live or account acceptance',checks},null,2)+'\n');console.log(JSON.stringify({status:'pass',checks}));
