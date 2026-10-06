const fs=require('fs'),assert=require('assert/strict');
const {chromium,webkit}=require(process.env.BROWSER_TOOLS+'/node_modules/playwright');
const base=process.env.PREVIEW_URL,results=[];
fs.mkdirSync('home-banner-proof/screenshots',{recursive:true});
(async()=>{
for(const [engine,name] of [[chromium,'chromium'],[webkit,'webkit']]){
 const browser=await engine.launch();
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}});
  await page.route('**/*',r=>!['GET','HEAD'].includes(r.request().method())||/google-analytics|googletagmanager|doubleclick/.test(r.request().url())?r.abort():r.continue());
  const response=await page.goto(base,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  const consent=page.getByRole('button',{name:'Necessary only',exact:true});if(await consent.isVisible())await consent.click();
  await page.evaluate(()=>document.fonts.ready);
  const state=await page.locator('.sst-free-designed').evaluate(el=>{
   const features=[...el.querySelectorAll('.sst-free-feature')],promise=el.querySelector('.sst-free-promise');
   const bottom=Math.max(...features.map(x=>x.getBoundingClientRect().bottom));
   return {texts:features.map(x=>x.innerText),links:features.map(x=>x.getAttribute('href')),gap:promise.getBoundingClientRect().top-bottom,fontSize:getComputedStyle(promise).fontSize,overflow:document.documentElement.scrollWidth>innerWidth+1};
  });
  assert(state.texts[0].includes('Over 2,500 recipes.'));assert(state.texts[1].includes('Over 2,500 exercise'));
  assert.deepEqual(state.links,['/member/grub','/member/fit','/member/check-in','/member/dashboard#visualise']);
  assert(state.gap>=20,JSON.stringify(state));assert(!state.overflow,JSON.stringify(state));
  await page.locator('.sst-free-designed').screenshot({path:`home-banner-proof/screenshots/${name}-${width}-banner.png`});
  results.push({engine:name,width,...state});await page.close();
 }
 await browser.close();
}
assert.equal((await fetch(base,{method:'POST'})).status,405);
fs.writeFileSync('home-banner-proof/browser.json',JSON.stringify(results,null,2));console.log('PASS: eight desktop/mobile combinations; counts, links, gap, no overflow and read-only preview');
})().catch(e=>{console.error(e);process.exit(1)});
