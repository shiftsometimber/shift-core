import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base='https://shift-ask-timber-preview.matobrien.workers.dev',dir='preview/ask-timber/generated/evidence';mkdirSync(dir,{recursive:true});
const question='I need to loose weight fast. Help me',report={at:new Date().toISOString(),commit:process.env.GITHUB_SHA,cases:[]};
const identity=await(await fetch(base+'/__identity')).json();assert.equal(identity.commit,process.env.GITHUB_SHA);
const liveAsset=await(await fetch(base+'/assets/ask-timber-v1.js')).text();assert.equal(createHash('sha256').update(liveAsset).digest('hex'),createHash('sha256').update(readFileSync('frontend/member/assets/ask-timber-v1.js')).digest('hex'));
try{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]])for(const [layout,viewport]of [['desktop',{width:1440,height:1000}],['phone',{width:390,height:844}]]){
  const browser=await engine.launch(),context=await browser.newContext({viewport,serviceWorkers:'block'});
  if(layout==='phone')await context.addCookies([{name:'sst_session',value:'expired-evidence-only',domain:new URL(base).hostname,path:'/'}]);
  const page=await context.newPage(),prefix=name+'-'+layout,row={name:prefix,checks:[],requests:[]};report.cases.push(row);
  page.on('request',req=>{if(new URL(req.url()).pathname==='/v1/ai/chat')row.requests.push(req.postDataJSON())});
  try{
   await page.goto(base+'/ask-timber',{waitUntil:'networkidle'});
   if(await page.getByRole('button',{name:'Necessary only',exact:true}).isVisible())await page.getByRole('button',{name:'Necessary only',exact:true}).click();
   const field=page.getByRole('textbox'),button=page.getByRole('button',{name:'Ask Timber',exact:true});
   async function ask(message){await field.fill(message);const pending=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/ai/chat',{timeout:75000});await button.click();const response=await pending;const data=await response.json();await page.locator('#timberResponse .at-copy, #timberResponse .at-error').waitFor({timeout:5000});assert.equal(await button.isEnabled(),true);return{status:response.status(),data}}
   const answer=await ask(question);row.answer=answer;assert.equal(answer.status,200);assert.equal(answer.data.ok,true);assert.match(answer.data.answer,/one manageable change today/);assert.equal(answer.data.sources[0].url,'https://www.nhs.uk/live-well/healthy-weight/managing-your-weight/tips-to-help-you-lose-weight/');assert.doesNotMatch(answer.data.answer,/psychiatric morbidity|mental.health survey/i);assert(row.requests.every(r=>r.useJourney===false));
   row.checks.push('reported question public payload and relevant answer');
   await page.screenshot({path:dir+'/'+prefix+'-answer.png',fullPage:true});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);assert.equal(overflow,false);row.checks.push('no horizontal overflow');
   for(const [fault,pattern]of [['503',/temporarily unavailable/],['network',/Check your connection/]]){
    const route='**/v1/ai/chat';await page.route(route,r=>fault==='503'?r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'service_unavailable',message:'PRIVATE_INTERNAL_DETAIL'})}):r.abort('failed'));
    await field.fill(question);await button.click();await page.locator('.at-error').waitFor();const text=await page.locator('.at-error').innerText();assert.match(text,pattern);assert.doesNotMatch(text,/PRIVATE_INTERNAL|Shift Core|401/);assert.equal(await field.inputValue(),question);assert.equal(await button.isEnabled(),true);await page.unroute(route);
    const retry=await ask('I have severe chest pain and cannot breathe');assert.equal(retry.status,200);assert.equal(retry.data.mode,'safety');assert.match(retry.data.answer,/999/);row.checks.push(fault+' input retained and successful safety retry');
   }
   const second=await ask('I have eggy burps after Mounjaro');assert.equal(second.status,200);assert.equal(second.data.mode,'reviewed_direct');assert(second.data.sources.length);assert.match(second.data.sources[0].url,/glp1-side-effects/);row.checks.push('second ordinary question and reviewed source');
   assert(row.requests.every(r=>r.useJourney===false));row.pass=true;
   for(const path of ['/member-login','/member/dashboard']){
    await page.goto('https://shiftsometimber.co.uk'+path,{waitUntil:'networkidle'});
    const previous=page.getByRole('button',{name:'Forgotten your password?',exact:true});await previous.waitFor({state:'visible'});
    const previousPaint=await previous.evaluate(el=>{const s=getComputedStyle(el),panel=getComputedStyle(el.closest('.preview-auth'));return{color:s.color,background:s.backgroundColor,panel:panel.backgroundColor}});
    row.productionRecoveryPaint??={};row.productionRecoveryPaint[path]=previousPaint;
    await page.screenshot({path:dir+'/'+prefix+'-before-'+(path.includes('dashboard')?'dashboard':'login')+'.png',fullPage:true});
    await page.goto(base+path,{waitUntil:'networkidle'});
    const forgot=page.getByRole('button',{name:'Forgotten your password?',exact:true});await forgot.waitFor({state:'visible'});
    const paint=await forgot.evaluate(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return{color:s.color,background:s.backgroundColor,height:r.height}});
    assert.equal(paint.color,'rgb(5, 5, 5)');assert.equal(paint.background,'rgb(231, 227, 218)');assert(paint.height>=44);
    await page.screenshot({path:dir+'/'+prefix+'-'+(path.includes('dashboard')?'dashboard':'login')+'.png',fullPage:true});
    await page.locator('#previewRegister input[name=email]').fill('fictional-recovery@example.invalid');
    await forgot.click();await page.locator('#previewReset').waitFor({state:'visible'});assert.equal(await page.locator('#previewReset input[name=email]').inputValue(),'fictional-recovery@example.invalid');
    await page.getByRole('button',{name:'Back to sign in',exact:true}).click();await forgot.waitFor({state:'visible'});
    await forgot.click();await page.getByRole('button',{name:'Send reset link',exact:true}).click();await page.getByText('Preview check complete. No reset email has been sent.',{exact:true}).waitFor();
    row.checks.push(path+' visible recovery button, reveal, email carry-over, back and synthetic request');
   }
  }catch(error){row.pass=false;row.error=error.stack;await page.screenshot({path:dir+'/'+prefix+'-failure.png',fullPage:true});throw error}finally{console.log(JSON.stringify(row));await browser.close();writeFileSync(dir+'/browser-report.json',JSON.stringify(report,null,2))}
 }
}finally{writeFileSync(dir+'/browser-report.json',JSON.stringify(report,null,2))}
console.log(JSON.stringify(report.cases.map(({name,pass,checks})=>({name,pass,checks})),null,2));
