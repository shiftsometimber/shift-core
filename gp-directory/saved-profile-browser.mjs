import {createServer} from 'node:http';
import {readFileSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {gpDirectoryClient} from './client.mjs';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shiftsometimberltd/SST/tools/apple-review-smoke/node_modules/playwright');
const source=readFileSync('frontend/member/treatment-assessment.html','utf8');
const template=source.replace(/<script src="\/treatment-assessment\.js[^>]*><\/script>/,'').replace('<button type="submit">','<button type="submit" disabled>');
const fixture={gpPractice:'Fictional Surgery',gpAddress:'10 Example Road, Example Town',gpPostcode:'SK10 1AA',gpSelectionMode:'manual'};
let scenario='valid',reads=0,external=0;
const server=createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');res.setHeader('Cache-Control','no-store');
 if(u.pathname==='/assessment'){res.setHeader('Content-Type','text/html');return res.end(template);}
 if(u.pathname==='/assets/member-experience/gp-form.mjs'){res.setHeader('Content-Type','text/javascript');return res.end(gpDirectoryClient);}
 if(u.pathname==='/clinical-intake-v1.css'){res.setHeader('Content-Type','text/css');return res.end('body{font:16px Arial;margin:16px}main{max-width:900px;margin:auto}label{display:block;margin:12px 0}input,textarea,select{display:block;width:100%;box-sizing:border-box;font-size:16px;min-width:0}fieldset{min-width:0}button{min-height:44px}');}
 res.setHeader('Content-Type','application/json');
 if(req.method!=='GET'){external++;res.statusCode=405;return res.end('{}');}
 if(u.pathname==='/v1/member/details'){
  reads++;const state=scenario;
  if(state==='late')await new Promise(r=>setTimeout(r,300));
  if(state==='expired'){res.statusCode=401;return res.end(JSON.stringify({ok:false}));}
  let details={...fixture};
  if(state==='no_gp')details={gpSelectionMode:'no_gp'};
  if(state==='malformed')details.gpAddress='invalid\u0000address';
  return res.end(JSON.stringify({ok:true,details}));
 }
 if(u.pathname==='/v1/member/details/gp-search')return res.end(JSON.stringify({practices:[]}));
 res.statusCode=404;res.end('{}');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const receipt={candidateOnly:true,production:false,notificationsSent:0,checks:[],errors:[],externalRequests:0};
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}});
  page.on('pageerror',e=>receipt.errors.push(e.message));
  await page.route('**/*',r=>{if(new URL(r.request().url()).origin===origin)return r.continue();receipt.externalRequests++;return r.abort();});
  async function fresh(state='valid'){
   scenario=state;await page.goto(origin+'/assessment');
   await page.getByRole('button',{name:'Use GP details saved in My Timber',exact:true}).waitFor();
  }
  const load=()=>page.getByRole('button',{name:'Use GP details saved in My Timber',exact:true}).click();
  const use=()=>page.getByRole('button',{name:'Use these GP details',exact:true});
  await fresh();const before=reads;
  assert.equal(await use().isVisible(),false);
  assert.equal(reads,before);
  await load();await use().waitFor();
  assert.equal(reads,before+1);
  assert.equal(await page.inputValue('[name="gpPractice"]'),'');
  assert.equal(await page.locator('[name="gpContactConsent"]').isChecked(),false);
  await use().click();
  assert.equal(await page.inputValue('[name="gpPractice"]'),fixture.gpPractice);
  assert.equal(await page.inputValue('[name="gpAddress"]'),fixture.gpAddress);
  assert.equal(await page.inputValue('[name="gpPostcode"]'),fixture.gpPostcode);
  assert.equal(await page.locator('[name="gpContactConsent"]').isChecked(),false);
  assert.equal(await use().isVisible(),false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  receipt.checks.push({width,case:'explicit request/confirmation; full fill; separate unchecked consent; no overflow'});
  await fresh();await page.fill('[name="gpPractice"]','My typed practice');await load();await use().waitFor();
  assert.equal(await page.inputValue('[name="gpPractice"]'),'My typed practice');
  await page.fill('[name="gpAddress"]','My manual address');
  assert.equal(await use().isVisible(),false);
  assert.equal(await page.inputValue('[name="gpPractice"]'),'My typed practice');
  receipt.checks.push({width,case:'typed details preserved; editing invalidates pending saved choice'});
  for(const state of ['expired','no_gp','malformed']){
   await fresh(state);await page.fill('[name="gpPractice"]','Manual practice');await load();
   await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Use GP details saved in My Timber').disabled);
   assert.equal(await use().isVisible(),false);
   assert.equal(await page.inputValue('[name="gpPractice"]'),'Manual practice');
   assert.equal(await page.locator('[name="gpContactConsent"]').isChecked(),false);
   receipt.checks.push({width,case:state+' preserves manual form and consent'});
  }
  await fresh('late');await load();await page.fill('[name="gpAddress"]','Address edited during fetch');
  await page.waitForTimeout(400);
  assert.equal(await use().isVisible(),false);
  assert.equal(await page.inputValue('[name="gpAddress"]'),'Address edited during fetch');
  receipt.checks.push({width,case:'late response cannot replace manual edits'});
  await fresh();await load();await use().waitFor();await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
  assert.equal(await use().isVisible(),false);
  assert.equal(await page.locator('text=Fictional Surgery').count(),0);
  receipt.checks.push({width,case:'pagehide clears saved personal summary'});
  await page.close();
 }
 assert.equal(external,0);assert.equal(receipt.externalRequests,0);assert.deepEqual(receipt.errors,[]);
 receipt.status='passed';receipt.profileReads=reads;receipt.noAccountWrites=true;receipt.originalAssessmentSHA256=(await import('node:crypto')).createHash('sha256').update(source).digest('hex');
}catch(e){receipt.status='failed';receipt.errors.push(e.stack);throw e;}
finally{
 writeFileSync('gp-directory/saved-profile-browser-receipt.json',JSON.stringify(receipt,null,2));
 await browser.close();await new Promise(r=>server.close(r));console.log(JSON.stringify(receipt,null,2));
}
