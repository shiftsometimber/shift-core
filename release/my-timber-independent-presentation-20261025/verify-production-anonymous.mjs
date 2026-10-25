import fs from'node:fs';import assert from'node:assert/strict';import{createRequire}from'node:module';const require=createRequire('/Users/shiftsometimberltd/SST/shift-rollout-grub-safety-20261006/package.json');const{chromium,webkit}=require('playwright');
const out='/Users/shiftsometimberltd/SST/my-timber-independent-presentation-20261025';const rows=[];
for(const[name,type]of[['chromium',chromium],['webkit',webkit]]){
 const browser=await type.launch({headless:true});try{
 const page=await browser.newPage({serviceWorkers:'block',viewport:{width:390,height:900}});page.setDefaultTimeout(15000);const denies=[];
 await page.route('**/*',route=>{const r=route.request(),u=new URL(r.url());if(!['GET','HEAD'].includes(r.method())||u.hostname!=='shiftsometimber.co.uk')return route.abort();return route.continue();});
 page.on('response',r=>{if(new URL(r.url()).pathname==='/v1/me')denies.push(r.status());});
 await page.goto('https://shiftsometimber.co.uk/member/dashboard?view=app',{waitUntil:'domcontentloaded'});
 await page.locator('#mtWelcome').waitFor();await page.waitForTimeout(1200);
 assert(!await page.locator('#previewMember').isVisible());assert.equal(await page.locator('body').getAttribute('data-member-experience-ui'),null);
 assert(denies.includes(401)||denies.includes(403),'Actual anonymous session denial required');
 await page.screenshot({path:out+'/production-anonymous-'+name+'-390.png'});
 rows.push({engine:name,actualProductionAnonymousNoIdentityFixture:true,sessionStatuses:denies,coverVisible:true,privateUIHidden:true,privateMemberAccess:false,requestsSent:'GET/HEAD only; all writes blocked'});
 console.log(name,'ACTUAL_ANONYMOUS_PASS');
 }finally{await browser.close();}
}
fs.writeFileSync(out+'/production-anonymous-verification.json',JSON.stringify({at:new Date().toISOString(),rows},null,2));
