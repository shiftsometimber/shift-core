import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire('/Users/shiftsometimberltd/SST/shift-rollout-grub-safety-20261006/package.json'),{chromium}=require('playwright');
const s=JSON.parse(fs.readFileSync('../v6-live-acceptance/synthetic-sessions.json','utf8')),b=await chromium.launch(),c=await b.newContext();
await c.addCookies([{name:'sst_session',value:s.members[1].token,url:'https://shiftsometimber.co.uk',httpOnly:true,secure:true}]);
const p=await c.newPage();await p.route('**/v1/events',r=>r.abort());
for(const url of ['/member/dashboard?timber=support#today','/member/dashboard#journey','/member/ask-timber']){
 await p.goto('https://shiftsometimber.co.uk'+url);await p.waitForFunction(()=>document.body.dataset.memberSession==='ready');await p.waitForTimeout(1500);
 console.log(JSON.stringify({url,body:(await p.locator('body').innerText()).slice(0,6500),ids:await p.locator('[id]').evaluateAll(es=>es.map(e=>e.id)),links:await p.locator('#mtUtility a,#mtSixNav a,#mtSixNav button').evaluateAll(es=>es.map(e=>({text:e.textContent,href:e.getAttribute('href'),data:e.dataset,current:e.getAttribute('aria-current')})))}));
}
await b.close();
