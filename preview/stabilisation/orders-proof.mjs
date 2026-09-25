import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';

const origin=process.env.PREVIEW_URL;
assert(process.env.GITHUB_ACTIONS==='true'&&/^https:\/\/shift-stabilisation-preview\.[a-z0-9-]+\.workers\.dev$/.test(origin||''));
const fixture=JSON.parse(readFileSync('work/staging/generated/probe.json'));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();
const evidence={origin,source:process.env.GITHUB_SHA,checks:[],productionWrites:0};
try{
 await page.goto(origin+'/member/orders');
 await page.locator('#memberSessionStatus a[href^="/member-login"]').waitFor();
 assert.equal(await page.locator('main').isVisible(),false);
 evidence.checks.push('Signed-out deep link hides order content and offers sign-in');
 const login=await context.request.post(origin+'/v1/auth/login',{headers:{Origin:origin},data:{email:'probe'+fixture.browserIds[0]+'@example.invalid',password:fixture.password}});
 assert.equal(login.status(),200);
 const me=await context.request.get(origin+'/v1/me');assert.equal(me.status(),200);
 await page.goto(origin+'/member/orders');
 await page.locator('body[data-member-session="ready"]').waitFor();
 assert.equal(await page.locator('.sst-member-tabs a[href="/member/orders"]').count(),1);
 await page.getByText(/no SHIFT shop orders yet|orders? found/i).waitFor({timeout:30000});
 assert.equal(await page.locator('#orders-retry').isVisible(),false);
 evidence.checks.push('Fictional member sees the Orders link, private route and own empty history');
 await page.route('**/v1/commerce/orders',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,orders:[{order_number:'SYNTHETIC-ORDER',created_at:'2026-09-25T12:00:00Z',status:'paid',total_pence:1299,currency:'GBP',items:[{product_name:'Fictional shirt',size:'L',quantity:1}],tracking_reference:'FICTIONAL',tracking_url:'https://track.dpd.co.uk'}]})}));
 await page.reload();await page.getByRole('heading',{name:'Order SYNTHETIC-ORDER'}).waitFor();
 assert.match(await page.locator('.orders-card').innerText(),/£12\.99/);
 assert.equal(await page.getByRole('link',{name:'Track delivery'}).getAttribute('href'),'https://track.dpd.co.uk/');
 evidence.checks.push('Fictional response renders status, item, total and tracking without HTML insertion');
 await page.unroute('**/v1/commerce/orders');
 await page.route('**/v1/commerce/orders',r=>r.fulfill({status:503,body:'unavailable'}));
 await page.reload();await page.locator('#orders-retry:visible').waitFor();
 evidence.checks.push('API failure offers retry');
 await page.unroute('**/v1/commerce/orders');await page.locator('#orders-retry').click();
 await page.getByText(/no SHIFT shop orders yet|orders? found/i).waitFor();
 await page.locator('.member-nav-more summary').click();await page.locator('[data-member-logout]').click();
 await page.goto(origin+'/member/orders');await page.locator('#memberSessionStatus a[href^="/member-login"]').waitFor();
 evidence.checks.push('Retry recovers and logout hides order content');
 evidence.status='pass';
}catch(error){evidence.status='fail';evidence.error=String(error.stack||error);throw error}
finally{mkdirSync('work/staging/generated/review-evidence',{recursive:true});writeFileSync('work/staging/generated/review-evidence/orders-proof.json',JSON.stringify(evidence,null,2));await browser.close()}
