const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE);
const dir='contact-presentation-preview-evidence',staged=JSON.parse(fs.readFileSync(dir+'/staged.json'));
const fields=[['INPUT','ct-name','name','text',true],['INPUT','ct-email','email','email',true],['SELECT','ct-subject','subject','select-one',true],['TEXTAREA','ct-message','message','textarea',true],['INPUT','','privacy','checkbox',true],['BUTTON','','','submit',false]];
const options=['','Stock update','General question','My account','My order','The Shift Programme','Partnership','Press','Technology','Investment','Website or technical help','Something else','complaint'];
const timer=setTimeout(()=>{console.error('Contact browser deadline');process.exit(1)},240000);
const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
(async()=>{
 const results=[];
 for(const[name,type]of Object.entries({chromium,webkit})){
  const browser=await type.launch();
  for(const width of[390,1440]){
   const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
   await context.route('**/*',route=>['GET','HEAD'].includes(route.request().method())?route.continue():route.fulfill({status:204,body:''}));
   const page=await context.newPage();page.setDefaultTimeout(15000);
   const response=await page.goto(staged.url,{waitUntil:'domcontentloaded',timeout:45000});assert.equal(response.status(),200);
   await page.locator('main.ctp h1').waitFor();
   const consent=page.getByRole('button',{name:'Necessary only',exact:true});if(await consent.count()&&await consent.isVisible()){await consent.click();await page.getByRole('dialog',{name:'Cookie choices',exact:true}).waitFor({state:'hidden'});}
   await page.waitForFunction(()=>{const image=document.querySelector('header img');return image?.complete&&image.naturalWidth>0;});
   assert.equal(await page.locator('main').getAttribute('data-contact-preview'),'20261022-contact-presentation-v1');
   assert.deepEqual(await page.locator('#shiftContactForm').evaluate(form=>Array.from(form.elements).map(e=>[e.tagName,e.id,e.name,e.type,Boolean(e.required)])),fields);
   assert.deepEqual(await page.locator('#ct-subject option').evaluateAll(rows=>rows.map(e=>e.value)),options);
   assert(await page.locator('.ct-submit').isDisabled());
   for(const id of['ct-name','ct-email','ct-message'])assert.equal(await page.locator('#'+id).inputValue(),'');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow');
   const heading=await page.locator('.ct-details-head h2').evaluate(e=>({height:e.getBoundingClientRect().height,line:parseFloat(getComputedStyle(e).lineHeight)}));assert(heading.height<=heading.line*2.1,'Side heading squeezed across more than two lines');
   const colours=await page.locator('.ct-form-card h2,.ct-field label,.ct-check span,.ct-submit,.ct-details-head h2,.ct-contact>a,.ct-contact>span,.ct-note').evaluateAll(elements=>elements.map(e=>{const s=getComputedStyle(e);let p=e,background;while(p){const b=getComputedStyle(p).backgroundColor;if(b!=='rgba(0, 0, 0, 0)'&&b!=='transparent'){background=b;break;}p=p.parentElement;}return{text:e.textContent.trim(),foreground:s.webkitTextFillColor||s.color,background};}));
   for(const row of colours){const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number),a=luminance(rgb(row.foreground)),b=luminance(rgb(row.background)),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert(ratio>=4.5,'Low contrast: '+JSON.stringify({...row,ratio}));}
   await page.screenshot({path:dir+'/'+name+'-'+width+'.png',fullPage:true});
   for(const subject of['Partnership','Technology','Investment']){await page.goto(staged.url+'?type='+subject+'#contact-form',{waitUntil:'domcontentloaded'});await page.waitForFunction(value=>document.querySelector('#ct-subject')?.value===value,subject);assert.equal(await page.locator('#ct-subject').inputValue(),subject);assert(await page.locator('.ct-submit').isDisabled());}
   results.push({browser:name,width,passed:true,formFieldsRetained:true,categoryOptionsRetained:true,threeEnquiryRoutesPrefilled:true,sideHeadingFits:true,noOverflow:true,contrastChecks:colours.length,sendingDisabled:true});
   await context.close();
  }
  await browser.close();
 }
 const browser=await chromium.launch(),page=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:1000}});await page.goto(staged.url,{waitUntil:'domcontentloaded'});assert.equal(await page.locator('form').count(),1);assert(await page.locator('.ct-submit').isDisabled());await browser.close();
 fs.writeFileSync(dir+'/accepted.json',JSON.stringify({previewOnly:true,production:false,url:staged.url,commit:staged.commit,results,noJavaScriptFormVisible:true,existingFormAndCopyPreserved:true,productionRoutesOwned:0,messagesSent:0},null,2));clearTimeout(timer);console.log('CONTACT_PREVIEW_FOUR_BROWSER_CHECKS_PASSED_WITH_NO_MESSAGES_SENT');
})().catch(error=>{console.error(error);process.exit(1)});
