import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const origin=process.env.WORK_STAGING_URL;
if(process.env.GITHUB_ACTIONS!=='true'||!/^https:\/\/shift-core-work-staging\.[a-z0-9-]+\.workers\.dev$/.test(origin||''))throw Error('Use isolated staging only');
const fixture=JSON.parse(readFileSync('work/staging/generated/probe.json'));
const out='work/staging/generated/member-chrome-proof';mkdirSync(out,{recursive:true});
const report={commit:process.env.GITHUB_SHA,cases:[],limits:['Fictional accounts only','Chromium desktop and phone viewport; not a physical iPhone']};
const browser=await chromium.launch();
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});
  const login=await context.request.post(origin+'/v1/auth/login',{headers:{Origin:origin},data:{email:'probe'+fixture.browserIds[0]+'@example.invalid',password:fixture.password}});
  assert.equal(login.status(),200);
  const page=await context.newPage();
  for(const [name,path]of [
   ['today','/member/dashboard#today'],['journey','/member/dashboard#journey'],['plans','/member/dashboard#plans'],['photos','/member/dashboard#visualise'],
   ['saved','/staging/member/saved'],['grub','/staging/member-connected/grub'],['fit','/staging/member-connected/fit'],['check-in','/staging/member-connected/check-in'],['settings','/staging/member-connected/settings'],['life-back','/staging/member-connected/life-back']
  ]){
   await page.goto(origin+path,{waitUntil:'domcontentloaded'});
   if(path.includes('/member/dashboard#'))await page.waitForFunction(panel=>document.querySelector('#panel-'+panel)?.classList.contains('active')&&(panel!=='today'||document.querySelector('#todayActions')?.dataset.todayDecisionReady==='true'),path.split('#')[1],{timeout:30000});
   await page.waitForFunction(()=>[...document.querySelectorAll('[data-member-hero="v1"]')].some(e=>e.getBoundingClientRect().height>0),null,{timeout:30000});
   const row=await page.evaluate(()=>{
    const hero=[...document.querySelectorAll('[data-member-hero="v1"]')].find(e=>e.getBoundingClientRect().height>0);
    const nav=document.querySelector('nav.sst-member-tabs');
    return {title:hero.querySelector('h1,h2')?.textContent.trim(),heroWidth:hero.getBoundingClientRect().width,image:getComputedStyle(hero,'::after').backgroundImage,imageVisible:getComputedStyle(hero,'::after').display,navs:document.querySelectorAll('nav.sst-member-tabs').length,labels:[...nav.querySelectorAll('.member-nav-tools a')].map(a=>a.textContent),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,forms:document.querySelectorAll('form').length};
   });
   assert.ok(row.title,name+' heading');assert.equal(row.navs,1,name+' shared navigation');assert.deepEqual(row.labels,['Today','Journey','Grub','Fit','Check-in','Life Back']);
   assert.ok(row.image.includes('home-hero-men-v32o.jpg'),name+' existing approved image');assert.notEqual(row.imageVisible,'none');
   assert.ok(row.overflow<=1,name+' horizontal overflow: '+row.overflow);
   if(name==='plans'){
    await page.locator('.member-nav-more summary').click();
    const colors=await page.locator('.member-nav-more a[data-panel="plans"]').evaluate(e=>({color:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor,paint:getComputedStyle(e).webkitTextFillColor}));
    assert.notEqual(colors.color,colors.background);assert.notEqual(colors.paint,colors.background);row.menuColors=colors;
   }
   await page.screenshot({path:out+'/'+name+'-'+width+'.png',fullPage:false});
   report.cases.push({name,width,...row});
  }
  await context.close();
 }
}finally{await browser.close();writeFileSync(out+'/report.json',JSON.stringify(report,null,2));}
console.log('PASS: '+report.cases.length+' member header/banner checks, existing images and no horizontal overflow.');
