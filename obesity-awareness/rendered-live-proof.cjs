// Read-only acceptance of the released public journey. Fresh unsigned contexts;
// no accounts, member records, health answers, prescribing or deployment calls.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
const origin='https://shiftsometimber.co.uk',dir='male-obesity-rendered-live';
fs.mkdirSync(dir,{recursive:true});
const result={at:new Date().toISOString(),source:process.env.RELEASE_SOURCE,releaseRun:process.env.RELEASE_RUN,proofSource:process.env.GITHUB_SHA,
 classification:'Controlled public QA, not organic growth; mobile-sized Chromium, not a physical phone',checks:[],collector:[],customerRecordsRead:0,memberWrites:0};
const eventNames=['shift_pillar_first_step_opened','shift_pillar_onward_opened','shift_pillar_step_tried','shift_pillar_review_used'];
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const navigate=async(page,path)=>{const r=await page.goto(origin+path,{waitUntil:'domcontentloaded',timeout:30000});assert.equal(r.status(),200,path);await page.locator('h1').waitFor();return r;};
async function necessary(page){if(!await page.getByRole('dialog',{name:'Cookie choices',exact:true}).isVisible())await page.getByRole('button',{name:'Cookie choices',exact:true}).click();await page.getByRole('button',{name:'Necessary only',exact:true}).click();}
function observeCollector(page,records){
 const pending=new WeakMap();
 page.on('request',request=>{
  const u=new URL(request.url());if(!/(^|\.)google-analytics\.com$/.test(u.hostname)||!u.pathname.endsWith('/collect'))return;
  const base=new URLSearchParams(u.search),lines=(request.postData()||'').split('\n');
  for(const line of lines){const p=new URLSearchParams(base);for(const [k,v]of new URLSearchParams(line))p.set(k,v);
   const en=p.get('en');if(!eventNames.includes(en))continue;
   // Keep the event and consent/location receipt. Never retain client/session IDs.
   const unsafe=[...p].some(([k,v])=>/too.?much.?effort|did.?not.?help|pillar.?help|chosen.?step|bmi.?weight|bmi.?height|health.?answer/i.test(k+' '+v));
   const receipt={event:en,stream:p.get('tid'),location:p.get('dl'),title:p.get('dt'),consent:p.get('gcs'),consentDetail:p.get('gcd'),parameterNames:[...p.keys()].filter(k=>!['cid','sid','sct','uid','_p'].includes(k)),unsafeAnswerParameter:unsafe};
   records.push(receipt);pending.set(request,[...(pending.get(request)||[]),receipt]);
  }
 });
 page.on('response',response=>{for(const receipt of pending.get(response.request())||[])receipt.responseStatus=response.status();});
}
(async()=>{
 const browser=await chromium.launch();
 try{
  const {candidate}=await import('./content.mjs');
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),denied=[];
   observeCollector(page,denied);
   try{
    for(const path of ['/male-obesity','/weight-loss-support-for-men','/mental-health/mental-health-and-weight','/articles/weight-loss-plateau-men','/mens-weight-management']){
     const r=await navigate(page,path),html=await r.text();
     if(path==='/male-obesity')assert(html.includes(candidate.body),'Live hub must contain the entire source-approved body');
     assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('.desktop-nav a').count(),5);
     assert.equal(await page.locator('[data-male-obesity-footer]').count(),1);
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
     const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');assert.equal(canonical,origin+path);
     assert(!/noindex/i.test((await page.locator('meta[name="robots"]').getAttribute('content'))||''));
     result.checks.push({path,width,status:200,htmlSha256:hash(html),canonical,checks:['one H1','five primary navigation links','male-obesity footer','no horizontal overflow','indexable canonical']});
    }
    await navigate(page,'/male-obesity');await necessary(page);await page.reload({waitUntil:'domcontentloaded'});
    await page.screenshot({path:dir+'/'+width+'-hub.png'});
    const menu=page.getByRole('button',{name:'Menu',exact:true});await menu.click();
    const links=await page.locator('#site-drawer a').allTextContents(),m=links.indexOf('Male obesity');
    assert(m>0&&links[m-1]==='My Timber'&&links[m+1]==='About');
    assert(await page.getByRole('link',{name:'Male obesity',exact:true}).isVisible());
    await page.screenshot({path:dir+'/'+width+'-menu.png'});await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');
    assert(await menu.evaluate(el=>el===document.activeElement),'Escape returns focus to Menu');
    await page.getByRole('link',{name:'Find one useful step',exact:true}).click();
    await page.locator('summary').filter({hasText:'I get home hungry and have no plan'}).click();
    assert((await page.locator('#first-step').innerText()).includes('my fallback is'));
    await page.screenshot({path:dir+'/'+width+'-first-action.png'});
    await page.getByRole('button',{name:'I tried my step',exact:true}).click();await page.getByRole('button',{name:'Too much effort',exact:true}).click();
    assert((await page.locator('[data-pillar-status]').innerText()).includes('smaller'));
    await page.getByRole('button',{name:'It did not help',exact:true}).click();assert((await page.locator('[data-pillar-status]').innerText()).includes('different approach'));
    await navigate(page,'/male-obesity');assert.equal((await page.locator('[data-pillar-status]').innerText()).trim(),'');
    await page.getByRole('link',{name:'Find one useful step',exact:true}).click();assert(await page.locator('#first-step').isVisible());
    await page.locator('[data-male-obesity-footer]').scrollIntoViewIfNeeded();await page.screenshot({path:dir+'/'+width+'-footer.png'});
    assert.equal(denied.length,0,'No pillar collection when analytics is declined');
    result.checks.push({width,checks:['menu placement and Escape','meal and fallback immediately available','effort and unhelpful alternatives','return still works, answers not persisted','declined consent sends no pillar events'],status:'pass'});
    await page.getByRole('link',{name:'Check your BMI — one useful number, not the whole picture.',exact:true}).click();await page.locator('#bmiForm').waitFor();
    await page.waitForFunction(()=>typeof document.getElementById('bmiForm')?.onsubmit==='function');
    await page.getByRole('button',{name:'Metric',exact:true}).click();await page.locator('#bmiHeightCm').selectOption('175');await page.locator('#bmiWeightKg').selectOption('100');await page.getByRole('button',{name:'Calculate BMI',exact:true}).click();
    await page.waitForFunction(()=>document.getElementById('bmiR')?.textContent.includes('32.7'));
    assert.equal(await page.locator('a[href="/mounjaro"]').count(),0);
    assert.equal(await page.getByRole('link',{name:'Understand obesity and find a next step',exact:true}).count(),1);
    assert((await page.locator('body').innerText()).includes('Screening reference only'));
    await page.screenshot({path:dir+'/'+width+'-bmi.png'});
    await page.getByRole('link',{name:'Understand obesity and find a next step',exact:true}).click();assert.equal(await page.locator('h1').innerText(),'Male obesity: understand what’s happening. Find your next step.');
    const main=await page.locator('main').innerText();assert(main.includes('one useful number, not the whole picture'));assert.equal(await page.locator('a[href="/member/grub"]').count(),1);
    result.checks.push({width,status:'pass',checks:['live hub to existing BMI calculator','fictional 175cm/100kg gives BMI32.7','screening limitation','prescription reading signposts removed','return to useful hub'],analyticsChoiceOnBmi:'Necessary only'});
    await page.getByRole('link',{name:'Explore meal ideas in Grub',exact:true}).click();
    await page.locator('body[data-member-session="signed-out"]').waitFor({timeout:20000});
    const signIn=page.locator('#memberSessionStatus a');assert.equal(await signIn.getAttribute('href'),'/member-login?returnTo=%2Fmember%2Fgrub');
    await signIn.click();await page.locator('#previewAuth:not([hidden])').waitFor({timeout:20000});
    assert(await page.locator('#previewRegister input[name="email"]').isVisible());
    result.checks.push({width,status:'pass',checks:['direct Grub route reaches existing sign-in','private records remain hidden'],accountCreated:false});
    const missing=await page.goto(origin+'/male-obesity/route-does-not-exist',{waitUntil:'domcontentloaded'});assert.equal(missing.status(),404);assert(await page.getByRole('link',{name:'Search Shift',exact:true}).isVisible());
    await navigate(page,'/male-obesity');assert(await page.getByRole('link',{name:'Find one useful step',exact:true}).isVisible());
    result.checks.push({width,status:'pass',checks:['missing page is an honest 404 with recovery','public hub remains usable on return']});
   }finally{await context.close();}
  }
  // One genuine consented public pass, separate from the declined/BMI checks.
  const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage();observeCollector(page,result.collector);
  try{
   await navigate(page,'/male-obesity');if(!await page.getByRole('dialog',{name:'Cookie choices',exact:true}).isVisible())await page.getByRole('button',{name:'Cookie choices',exact:true}).click();await page.getByRole('button',{name:'Accept analytics',exact:true}).click();await page.reload({waitUntil:'domcontentloaded'});
   await page.getByRole('link',{name:'Find one useful step',exact:true}).click();await page.getByRole('button',{name:'I tried my step',exact:true}).click();await page.getByRole('button',{name:'Too much effort',exact:true}).click();
   await page.getByRole('link',{name:'see the free support available through My Timber',exact:true}).click();await page.locator('h1').waitFor();
   const until=Date.now()+15000;while(Date.now()<until&&!eventNames.every(n=>result.collector.some(x=>x.event===n&&[200,204].includes(x.responseStatus))))await page.waitForTimeout(250);
   for(const name of eventNames)assert(result.collector.some(r=>r.event===name&&r.stream==='G-Y7BV5KY6RR'&&[200,204].includes(r.responseStatus)),name+' must be accepted by the real GA4 collector');
   for(const receipt of result.collector){assert(!receipt.unsafeAnswerParameter,'An answer reached public analytics');const u=new URL(receipt.location);assert.equal(u.origin,origin);assert.equal(u.search,'');assert.equal(u.hash,'');assert(!u.pathname.startsWith('/member/'));}
   result.collectorVerified=true;result.collectionReportingVerified=false;result.reportingRequirement='Independently check GA4 Realtime; collector requests are not reporting or growth evidence.';
  }finally{await context.close();}
  result.status='passed';
 }catch(error){result.status='failed';result.error=error.message;throw error;}
 finally{await browser.close();result.finishedAt=new Date().toISOString();fs.writeFileSync(dir+'/receipt.json',JSON.stringify(result,null,2));}
 console.log(JSON.stringify({status:result.status,source:result.source,releaseRun:result.releaseRun,checks:result.checks.length,collectorEvents:result.collector.map(r=>r.event)}));
})().catch(error=>{console.error(error);process.exitCode=1;});
