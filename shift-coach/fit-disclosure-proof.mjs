import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
const originalBytes=execFileSync('git',['show','88da89158e2967a07bd6f40ebc9aa4c1a63360bb:member-experience/app-experience.mjs']);
assert.equal(createHash('sha1').update(Buffer.concat([Buffer.from('blob '+originalBytes.length+'\0'),originalBytes])).digest('hex'),'d1650a0d4d6772009dbdde393e89e926bf558186');
const {appExperienceClient:original}=await import('data:text/javascript;base64,'+originalBytes.toString('base64'));
import {appExperienceClient as corrected} from '../member-experience/app-experience.mjs';
import {screenClient} from '../preview/app-layout/screens.mjs';
import {fitActiveEditAsset} from './fit-active-edit.mjs';
const rows=[];
const body=content=>'<base href="https://synthetic.example.invalid/"><body data-member-design="20261001" data-member-page="fit"><main>'+content+'</main></body>';
for(const engine of [chromium,webkit])for(const width of [390,1440]){
 const browser=await engine.launch({headless:true,timeout:15000});
 try{
  const context=await browser.newContext({viewport:{width,height:900},...(engine===webkit?{isMobile:true,hasTouch:true}:{})});
  await context.route('**/*',route=>route.abort());const page=await context.newPage();page.setDefaultTimeout(30000);
  for(const [label,script,expected]of [['original',original,false],['corrected',corrected,true]]){
   await page.setContent(body('<details class="app-screen-details" data-app-fit-setup><summary>Adjust your session</summary><div class="sf-builder"><button id="fitGenerate">Build session</button></div></details>'));
   assert.equal(await page.locator('details').evaluate(n=>n.open),false);
   // Actual UI initialisation arrives after the normal disclosure state was read.
   await page.addScriptTag({content:script});
   await page.locator('details>summary').click();
   const visible=await page.locator('#fitGenerate').isVisible();
   assert.equal(visible,expected,label+' must retain the observed late-initialisation outcome');
   rows.push({engine:engine.name(),width,case:label+' late initialisation',generateVisible:visible,expected});
  }
  await page.locator('details>summary').click();assert.equal(await page.locator('#fitGenerate').isVisible(),false);
  await page.evaluate(()=>document.dispatchEvent(new Event('sst:today-rendered')));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(await page.locator('details').evaluate(n=>n.open),false);
  rows.push({engine:engine.name(),width,case:'explicit closed choice survives refresh',pass:true});
  await page.setContent(body('<div class="sf-builder"><textarea id="fitPrefs">Synthetic active draft</textarea><button id="fitGenerate">Build session</button></div><div id="fitOutput"></div>'));
  await page.locator('#fitPrefs').focus();await page.locator('#fitPrefs').evaluate(n=>n.setSelectionRange(4,8));
  await page.addScriptTag({content:fitActiveEditAsset(screenClient)});
  await page.addScriptTag({content:corrected});
  await page.evaluate(()=>{const n=document.createElement('section');n.className='sf-session';document.querySelector('#fitOutput').append(n)});
  await page.locator('.app-screen-details').waitFor();
  assert.equal(await page.locator('.app-screen-details').evaluate(n=>n.open),true);
  assert.deepEqual(await page.locator('#fitPrefs').evaluate(n=>({value:n.value,start:n.selectionStart,end:n.selectionEnd,focused:n===document.activeElement})),{value:'Synthetic active draft',start:4,end:8,focused:true});
  rows.push({engine:engine.name(),width,case:'existing active editor, focus and selection retained',pass:true});
  await context.close();
 }finally{await browser.close()}
}
const result={source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),at:new Date().toISOString(),passed:true,checks:rows.length,rows,synthetic:true,productionWrites:0,originalFailureReproducedInBothEngines:true,originalBrowserAssertionsChanged:false};writeFileSync(process.env.FIT_DISCLOSURE_PROOF_OUT||'/tmp/shift-fit-disclosure-proof.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
