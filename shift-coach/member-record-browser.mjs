import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {ordersFixture} from './member-record-fixture.mjs';
import {memberExperienceRoutes} from '../member-experience/entry.mjs';
import {authenticateMember} from '../member-state-fast-v1.js';
import {commerceStripeRoutes} from '../commerce-stripe-v1.js';

const f=ordersFixture(),out=process.env.COACHING_PROOF_DIR||'/tmp/shift-member-record-proof';
mkdirSync(out,{recursive:true});let unavailable=false;
const before=JSON.stringify(f.db.prepare('SELECT * FROM orders ORDER BY id').all());
const server=createServer(async(req,res)=>{
 try{
  const request=new Request('https://shiftsometimber.co.uk'+req.url,{headers:req.headers});
  let response=memberExperienceRoutes(request,{MEMBER_EXPERIENCE_V1_ENABLED:'true'});
  if(req.url==='/v1/me'){
   const auth=await authenticateMember(request,f.env);
   response=auth.response||Response.json({user:{id:auth.user.id}});
  }
  if(!response&&req.url==='/v1/commerce/orders')response=unavailable?Response.json({ok:false},{status:503}):await commerceStripeRoutes(request,f.env,{});
  response||=new Response('Not found',{status:404});
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){res.writeHead(500);res.end('Synthetic fixture failure');console.error(error)}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const require=createRequire(import.meta.url),{chromium}=process.env.PLAYWRIGHT_MODULE?require(process.env.PLAYWRIGHT_MODULE):await import('playwright');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const proof={scope:'Actual Orders HTML, styles, runtime and authenticated API; synthetic SQLite only. No production order, payment or email.',checks:[],widths:[390,1440]};
try{
 for(const width of proof.widths){
  const context=await browser.newContext({viewport:{width,height:900}});await context.addCookies([{name:'sst_session',value:'test-only-member-1',url:origin,httpOnly:true}]);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/member/orders');await page.locator('body[data-member-session="ready"]').waitFor();await page.getByText('Own account item',{exact:false}).waitFor();
  assert(!await page.getByText('Other account item',{exact:false}).count());await page.getByText('Total: Amount unavailable',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:out+`/orders-missing-${width}.png`,fullPage:true});
  for(const total of [0,'0','',false,'bad']){
   f.db.prepare('UPDATE orders SET total_pence=? WHERE id=2').run(total===false?'false':total);
   await page.reload();await page.getByText(total===0||total==='0'?'Total: £0.00':'Total: Amount unavailable',{exact:true}).waitFor();
  }
  f.db.prepare('UPDATE orders SET total_pence=NULL,notes=? WHERE id=2').run(JSON.stringify({carrier:'Royal Mail',trackingReference:'SYNTHETIC-TRACK'}));
  await page.reload();await page.getByText('Tracking reference: SYNTHETIC-TRACK',{exact:true}).waitFor();
  const link=page.getByRole('link',{name:'Track delivery'});assert.match(await link.getAttribute('href'),/^https:/);
  unavailable=true;await page.reload();await page.getByRole('button',{name:'Retry loading orders'}).waitFor();
  unavailable=false;await page.getByRole('button',{name:'Retry loading orders'}).click();await page.getByText('Own account item',{exact:false}).waitFor();
  f.db.prepare('UPDATE orders SET user_id=2 WHERE id=2').run();await page.reload();await page.getByText('You have no SHIFT shop orders yet.',{exact:true}).waitFor();
  f.db.prepare('UPDATE orders SET user_id=1,notes=? WHERE id=2').run('null');
  await context.clearCookies();await page.reload();await page.locator('body[data-member-session="signed-out"]').waitFor();assert.equal(await page.locator('main').isVisible(),false);
  await context.addCookies([{name:'sst_session',value:'test-only-member-1',url:origin,httpOnly:true}]);
  f.db.prepare('UPDATE user_sessions SET revoked_at=? WHERE user_id=1').run(new Date().toISOString());
  await page.reload();await page.locator('body[data-member-session="signed-out"]').waitFor();assert.equal(await page.locator('main').isVisible(),false);
  f.db.prepare('UPDATE user_sessions SET revoked_at=NULL WHERE user_id=1').run();
  assert.deepEqual(errors,[]);await context.close();
  proof.checks.push(`${width}px: owned items with duplicate reference, missing vs actual zero total, HTTPS tracking, unavailable then Retry, empty, signed-out, revoked, no overflow or page errors`);
 }
 assert.equal(JSON.stringify(f.db.prepare('SELECT * FROM orders ORDER BY id').all()),before);
 writeFileSync(out+'/member-record-proof.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));f.close()}
