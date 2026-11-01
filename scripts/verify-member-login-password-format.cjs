const {chromium,firefox,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{
 if(process.argv[2]==='--live'){
  const checks=[];
  for(const [name,type]of Object.entries({chromium,webkit})){
   const browser=await type.launch({headless:true});
   try{
    const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.route('**/v1/me',r=>r.fulfill({status:401,contentType:'application/json',body:'{"ok":false,"error":"unauthorised"}'}));
    await context.route('**/v1/auth/login',r=>r.fulfill({status:401,contentType:'application/json',body:'{"ok":false,"error":"invalid_credentials","message":"Synthetic login check"}'}));
    await context.addInitScript(()=>{window.__loginFormatSubmits=0;document.addEventListener('submit',e=>{if(e.target.id==='previewRegister')window.__loginFormatSubmits++},true)});
    const page=await context.newPage();await page.goto('https://shiftsometimber.co.uk/member-login.html',{waitUntil:'domcontentloaded',timeout:45000});
    const form=page.locator('#previewRegister'),email=form.locator('[name=email]'),password=form.locator('[name=password]');
    await email.waitFor({state:'visible',timeout:30000});await email.fill('login-check@example.invalid');await password.fill('legacy8!');
    assert.equal(await password.getAttribute('pattern'),null);assert.equal(await password.getAttribute('minlength'),null);
    assert.equal(await form.evaluate(el=>el.checkValidity()),true);
    await page.getByRole('button',{name:'Sign in',exact:true}).click();
    await page.waitForFunction(()=>window.__loginFormatSubmits===1,null,{timeout:10000});
    await page.getByRole('tab',{name:'Create account'}).click();
    await form.locator('[name=firstName]').fill('Fixture');await password.fill('lowercasepassword');
    assert.equal(await password.evaluate(el=>el.checkValidity()),false);
    await password.fill('ValidPassword!42');assert.equal(await password.evaluate(el=>el.checkValidity()),true);
    await page.getByRole('tab',{name:'Sign in'}).click();
    assert.equal(await password.getAttribute('pattern'),null);assert.equal(await password.getAttribute('minlength'),null);
    await password.fill('');assert.equal(await password.evaluate(el=>el.checkValidity()),false);
    checks.push({browser:name,live:true,legacyPasswordReachedSubmit:true,registrationPolicyPreserved:true,modeSwitching:true,realAccountUsed:false});
    await context.close();
   }finally{await browser.close()}
  }
  const report={ok:true,mode:'live',checks};fs.mkdirSync('evidence/member-login-format',{recursive:true});fs.writeFileSync('evidence/member-login-format/live-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));return;
 }

 const before=fs.readFileSync(process.argv[2],'utf8');const {withSessionState}=await import('../member-experience/session-state.mjs');const after=withSessionState(before);
 const stub='<script>window.SST_MEMBER_SESSION={check:async()=>{document.body.dataset.memberSession="signed-out"},ready:()=>{}};window.testAuth={loginCalls:0,registerCalls:0};window.SST_API={getMe:async()=>{throw Error("Signed out")},login:async()=>{testAuth.loginCalls++;throw Error("Synthetic credential response")},register:async()=>{testAuth.registerCalls++;return {verificationRequired:true,message:"Synthetic verification response"}}};window.fetch=async()=>({ok:false,status:401});</script>';
 const results=[];
 for(const [name,type]of Object.entries({chromium,webkit})){
  const browser=await type.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:390,height:844}});
   let source=before;
   await context.route('**/*',async route=>{
    if(route.request().isNavigationRequest())await route.fulfill({status:200,contentType:'text/html',body:source.replace(/<script\b[^>]*\bsrc=[^>]*>[\s\S]*?<\/script>/gi,'').replace('<head>','<head>'+stub)});
    else await route.abort();
   });
   const page=await context.newPage();
   const load=async()=>{
    await page.goto('http://login-fixture.test/member-login.html');
    await page.locator('#previewAuth').evaluate(el=>el.hidden=false);
    await page.locator('#previewRegister [name=email]').fill('login-check@example.invalid');
   };
   const password=()=>page.locator('#previewRegister [name=password]');
   const state=()=>password().evaluate(el=>({pattern:el.getAttribute('pattern'),minlength:el.getAttribute('minlength'),valid:el.checkValidity(),patternMismatch:el.validity.patternMismatch}));
   await load();await password().fill('ExistingPass!42');
   assert.equal((await state()).patternMismatch,true);
   await page.getByRole('button',{name:'Sign in',exact:true}).click();
   assert.equal(await page.evaluate(()=>testAuth.loginCalls),0);
   results.push({browser:name,case:'original blocks non-empty sign-in before API',pass:true});
   source=after;await load();
   for(const value of ['ExistingPass!42','legacy8!','with spaces','é🙂']){
    await password().fill(value);const s=await state();
    assert.equal(s.pattern,null);assert.equal(s.minlength,null);assert.equal(s.valid,true);
    const calls=await page.evaluate(()=>testAuth.loginCalls);
    await page.getByRole('button',{name:'Sign in',exact:true}).click();
    assert.equal(await page.evaluate(()=>testAuth.loginCalls),calls+1);
    results.push({browser:name,case:'existing-password submission '+value.length+' characters',pass:true});
   }
   await password().fill('');assert.equal((await state()).valid,false);
   await password().fill('ExistingPass!42');await page.locator('#previewRegister [name=email]').fill('invalid-email');
   assert.equal(await page.locator('#previewRegister').evaluate(el=>el.checkValidity()),false);
   await page.locator('#previewRegister [name=email]').fill('login-check@example.invalid');
   await page.getByRole('tab',{name:'Create account'}).click();
   await page.locator('#previewRegister [name=firstName]').fill('Fixture');
   for(const value of ['lowercasepassword','CapitalOnlyPassword','Short!']){
    await password().fill(value);assert.equal((await state()).valid,false);
   }
   await password().fill('ValidPassword!42');assert.equal((await state()).valid,true);
   assert.equal((await state()).minlength,'10');
   await page.getByRole('tab',{name:'Sign in'}).click();
   await password().fill('legacy8!');assert.equal((await state()).valid,true);
   assert.equal((await state()).pattern,null);assert.equal((await state()).minlength,null);
   results.push({browser:name,case:'registration rules, required fields and register-to-login transition',pass:true});
   await page.getByRole('tab',{name:'Create account'}).click();
   await password().fill('ValidPassword!42');
   await page.getByRole('button',{name:'Create account',exact:true}).click();
   assert.equal(await page.evaluate(()=>testAuth.registerCalls),1);
   assert.equal((await state()).pattern,null);
   results.push({browser:name,case:'post-registration login removes creation constraints',pass:true});
   await context.close();
  }finally{await browser.close()}
 }
 console.log(JSON.stringify({ok:true,checks:results.length,results},null,2));
})().catch(error=>{console.error(error);process.exitCode=1});

