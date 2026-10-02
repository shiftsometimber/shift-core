const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
const assert=require('node:assert/strict'),fs=require('node:fs');
const origin='https://shift-eligibility-centre-a9c990.matobrien.workers.dev';
(async()=>{const browser=await chromium.launch({headless:true});fs.mkdirSync('treatment-guidance-proof',{recursive:true});const checks=[];
try{for(const width of [390,1440]){const p=await browser.newPage({viewport:{width,height:1000}});
 await p.goto(origin+'/treatment-order?medicine=mounjaro&view=spec',{waitUntil:'networkidle'});
 assert.equal(await p.locator('h1').first().innerText(),'Understand the treatment options.');
 assert.equal(await p.locator('[data-insulin-use]').inputValue(),'');
 await p.locator('[data-bmi-unit="metric"]').click();await p.locator('[data-bmi-cm]').fill('180');await p.locator('[data-bmi-kg]').fill('100');
 const next=p.locator('[data-op-next]').first();assert.equal(await next.isDisabled(),true);
 await p.locator('[data-insulin-use]').selectOption('yes');assert.equal(await next.isDisabled(),true);assert.equal(await p.locator('[data-insulin-excluded]').isVisible(),true);
 assert.equal(await p.locator('[data-insulin-excluded] a').getAttribute('href'),'/shift-health');assert.equal(await p.locator('[data-ready-priorities]').innerText(),'Service unavailable');
 await p.locator('[data-insulin-gate]').scrollIntoViewIfNeeded();await p.screenshot({path:`treatment-guidance-proof/${width}-insulin-stopped.png`});
 await p.locator('[data-insulin-use]').selectOption('no');assert.equal(await next.isDisabled(),false);
 await p.locator('input[name="treatment-stage"][value="continuing"]').check();await p.locator('[data-bmi-kg]').fill('65');assert.equal(await next.isDisabled(),true,'Continuing must not waive criteria');assert.equal(await p.locator('[data-alternative-route]').isVisible(),true);
 assert.equal(await p.locator('[data-alternative-route] a').first().getAttribute('href'),'/shift-health');assert.equal(await p.locator('[data-alternative-route] a').first().innerText(),'Explore SHIFT Health');
 await p.locator('[data-bmi-result]').scrollIntoViewIfNeeded();await p.screenshot({path:`treatment-guidance-proof/${width}-bmi-stopped.png`});
 assert.equal(await p.locator('.op-positive-outlook').isVisible(),false);assert.equal(await p.locator('.op-product-art').isVisible(),false);assert.equal(await p.locator('[data-op-pay]').isDisabled(),true);
 await p.locator('[data-switch-medicine="wegovy-tablets"]').click();assert.equal(await p.locator('[data-insulin-gate]').isVisible(),false);
 await p.locator('[data-switch-medicine="mounjaro"]').click();assert.equal(await p.locator('[data-insulin-use]').inputValue(),'','Current answer resets on treatment change');
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Order page overflow '+width);
 checks.push({width,page:'treatment information',insulinYes:'stopped',insulinMissing:'stopped',eligibleNo:'assessment only',lowBmiContinuing:'stopped',ordering:'closed',ok:true});
 await p.goto(origin+'/articles/glp1-side-effects',{waitUntil:'networkidle'});assert.equal(await p.locator('[data-shift-hydration-guidance]').count(),1);assert.match(await p.locator('[data-shift-hydration-guidance]').innerText(),/no general requirement/);await p.locator('[data-shift-hydration-guidance]').scrollIntoViewIfNeeded();await p.screenshot({path:`treatment-guidance-proof/${width}-hydration.png`});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Article overflow '+width);checks.push({width,page:'side effects',hydration:'verified source links and urgent advice',ok:true});
 const centre=await p.goto(origin+'/treatment-centre',{waitUntil:'networkidle'}),html=await centre.text();
 const {CENTRE_GUIDANCE_REPLACEMENTS,CENTRE_GUIDANCE_COUNTS}=await import('../../public-treatment-guidance.mjs');
 for(const [index,[before,after]]of CENTRE_GUIDANCE_REPLACEMENTS.entries()){assert.equal(html.includes(before),false,'No old Centre notice remains');assert.equal(html.split(after).length-1,CENTRE_GUIDANCE_COUNTS[index],'Exact Centre notices corrected');}
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Centre overflow '+width);await p.screenshot({path:`treatment-guidance-proof/${width}-centre.png`});checks.push({width,page:'treatment centre',serviceNotices:'all exact copies corrected',ok:true});await p.close();}
fs.writeFileSync('treatment-guidance-proof/checks.json',JSON.stringify(checks,null,2));}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1)});
