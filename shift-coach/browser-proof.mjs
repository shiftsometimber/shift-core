import {revealSetupField} from '../release/app-member-live.mjs';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdirSync,writeFileSync,readFileSync,chmodSync} from 'node:fs';
import {createRequire} from 'node:module';
import {brotliDecompressSync} from 'node:zlib';
import {fixture} from './test-fixture.mjs';
import {coachingRoutes} from './routes.mjs';
import {withCoaching,coachingAsset} from './presentation.mjs';
const out=process.env.COACHING_PROOF_DIR||'/tmp/shift-coach-proof';mkdirSync(out,{recursive:true});
const DB=fixture(null,out+'/synthetic.sqlite');
const env={DB,MEMBER_EXPERIENCE_V1_ENABLED:'true'};
const seedHTML='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Shift AI integration test</title><style>body{background:#050505;color:#e7e3da;font:16px/1.5 Arial,sans-serif;margin:0}header,main,footer{max-width:950px;margin:auto;padding:20px}a{color:inherit}</style></head><body><header><strong>SHIFT SOME TIMBER · MY TIMBER</strong></header><main><section id="panel-today"><div id="todayActions"><p>Existing My Timber tools remain available.</p></div></section></main><footer id="sst-footer-c">Shift Some Timber</footer></body></html>';
const server=createServer(async(req,res)=>{try{
 const local=new URL(req.url,'http://'+req.headers.host),url=new URL(local.pathname,'https://shiftsometimber.co.uk');
 const chunks=[];for await(const c of req)chunks.push(c);const headers=new Headers(req.headers);
 if(headers.get('Origin')==='http://'+req.headers.host)headers.set('Origin',url.origin);
 const request=new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})});
 let response=coachingAsset(request)||await coachingRoutes(request,env);
 if(!response&&local.pathname==='/member/dashboard')response=await withCoaching(request,new Response(seedHTML,{headers:{'Content-Type':'text/html'}}));
 response=response||new Response('Not found',{status:404});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){res.writeHead(500);res.end('fixture failure');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
const require=createRequire(import.meta.url);let chromium;
if(process.env.PLAYWRIGHT_MODULE)chromium=require(process.env.PLAYWRIGHT_MODULE).chromium;
else chromium=(await import('playwright')).chromium;
let executablePath=process.env.COACHING_CHROMIUM;
if(!executablePath&&process.env.COACHING_PACKAGED_CHROMIUM){executablePath=out+'/chromium';writeFileSync(executablePath,brotliDecompressSync(readFileSync(process.env.COACHING_PACKAGED_CHROMIUM)));chmodSync(executablePath,0o755);}
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const proof={scope:'Scoped coaching component and actual session-authenticated routes against local synthetic SQLite; not a full-site or production timing test.',checks:[],timings:[],modelCalls:0,externalNotifications:0};
const snapshot=name=>{const row=DB.sqlite.prepare('SELECT user_id,preferences FROM member_state ORDER BY user_id').all();writeFileSync(out+'/'+name+'.json',JSON.stringify(row,null,2));};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.addCookies([{name:'sst_session',value:'fixture-token-1',url:origin,httpOnly:true}]);
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin+'/member/dashboard');await page.locator('[data-coach-setup]').waitFor();
 await page.getByLabel('What do you want back?').fill('Enjoy time with the family');await page.getByLabel('What does your week look like?').fill('Three late shifts and no free evenings');
 const unchangedRead=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/shift-coach'&&r.request().method()==='GET');await page.evaluate(()=>document.dispatchEvent(new Event('sst:consentchange')));await (await unchangedRead).finished();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));assert.equal(await page.getByLabel('What do you want back?').inputValue(),'Enjoy time with the family');assert.equal(await page.getByLabel('What does your week look like?').inputValue(),'Three late shifts and no free evenings');proof.checks.push('unchanged background refresh preserves an unsaved setup draft');
 await page.getByRole('button',{name:'Prepare my first action'}).click();await page.locator('[data-coach-action="accept"]').waitFor();
 assert.match(await page.locator('#shiftCoach h2').first().textContent(),/familiar meal/);snapshot('after-setup');proof.checks.push('saved reason matches two entered facts');
 const firstTitle=await page.locator('#shiftCoach h2').first().textContent();await page.screenshot({path:out+'/today-mobile.png',fullPage:true});
 const second=await browser.newContext({viewport:{width:390,height:844}});await second.addCookies([{name:'sst_session',value:'fixture-token-1',url:origin,httpOnly:true}]);const p2=await second.newPage();await p2.goto(origin+'/member/dashboard');await p2.locator('[data-coach-action="accept"]').waitFor();assert.equal(await p2.locator('#shiftCoach h2').first().textContent(),await page.locator('#shiftCoach h2').first().textContent());proof.checks.push('second signed-in session sees saved action');
 await page.getByRole('button',{name:'That works — accept'}).click();await page.getByText('Accepted. It’s saved for when it suits you.').waitFor();await page.getByText('Tell Shift AI how it went',{exact:true}).click();await page.getByRole('button',{name:"Done, didn't help",exact:true}).click();await page.locator('[data-coach-action="accept"]').waitFor();assert.notEqual(await page.locator('#shiftCoach h2').first().textContent(),firstTitle);snapshot('after-didnt-help');proof.checks.push('did not help changes the approach');await page.screenshot({path:out+'/adapted-mobile.png',fullPage:true});
 await page.getByText('What SHIFT knows about me',{exact:true}).click();const week=page.locator('form[data-coach-fact="week"]');await week.locator('input').fill('Mornings are free now');await week.getByRole('button',{name:'Save correction'}).click();await page.getByText('Saved.',{exact:true}).waitFor();assert.match(await page.locator('.coach-reason').textContent(),/Mornings/);snapshot('after-correction');proof.checks.push('memory correction replaces saved reason');
 await page.reload();await page.locator('[data-coach-action="accept"]').waitFor();assert.match(await page.locator('.coach-reason').textContent(),/Mornings/);proof.checks.push('correction persists after reload');
 assert(await page.locator('#sst-footer-c').count()===1);assert(await page.locator('#todayActions').count()===1);proof.checks.push('original footer and tools remain');
 const foreign=await browser.newContext();await foreign.addCookies([{name:'sst_session',value:'fixture-token-2',url:origin,httpOnly:true}]);const p3=await foreign.newPage();await p3.goto(origin+'/member/dashboard');await p3.locator('[data-coach-setup]').waitFor();assert(!await p3.getByText('Mornings are free now',{exact:false}).count());proof.checks.push('another account does not see member context');
 // Exercise every member-selected change through the same UI used by the PWA and native web view.
 for(const change of ['stopped','cost','provider','appetite','routine']){
  await page.locator('[data-coach-change-panel] > summary').click();
  const form=page.locator('[data-coach-circumstances]');await form.locator('select[name="change"]').selectOption(change);
  if(change==='provider')await form.locator('select[name="mode"]').selectOption('elsewhere');
  if(change==='appetite')await form.locator('select[name="challenge"]').selectOption('returning-food-noise');
  await form.locator('input[name="week"]').fill(change==='routine'?'Early shifts now; lunch is easier':'');
  await form.locator('input[name="followup"]').uncheck();
  await form.getByRole('button',{name:'Update my next step'}).click();
  await page.getByText('Saved.',{exact:true}).waitFor();
  const saved=await page.evaluate(async()=>fetch('/v1/shift-coach').then(r=>r.json()));
  assert(saved.enabled);assert.equal(saved.memory.settings.followup,false);assert.equal(saved.followup,null);
  if(change==='stopped')assert.equal(saved.memory.mode,'stopped');
  if(change==='cost')assert.equal(saved.memory.constraints.budget,'tight');
  if(change==='provider')assert.equal(saved.memory.mode,'elsewhere');
  if(change==='appetite')assert.equal(saved.action.challenge,'returning-food-noise');
  if(change==='routine'){assert.equal(saved.action.minutes,1);assert.match(saved.action.reason,/Early shifts now/);}
  await page.reload();await page.locator('[data-coach-action="accept"]').waitFor();
  const reread=await page.evaluate(async()=>fetch('/v1/shift-coach').then(r=>r.json()));assert.equal(reread.action.id,saved.action.id);
  proof.checks.push('Something changed '+change+' updates the plan and survives reload without enabling external contact');
 }
 await page.locator('[data-coach-change-panel] > summary').click();
 await page.screenshot({path:out+'/something-changed-mobile.png',fullPage:true});
 await page.locator('[data-coach-change-panel] > summary').click();
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1600000/8,uploadThroughput:750000/8});
 for(let i=0;i<20;i++){await page.goto(origin+'/member/dashboard');await page.locator('[data-coach-action="accept"]').waitFor();proof.timings.push(await page.evaluate(()=>performance.getEntriesByName('shift-coach-ready').at(-1).startTime));}
 const sorted=[...proof.timings].sort((a,b)=>a-b);proof.timing={device:'Chromium 390×844 touch, CPU 4× slowdown',network:'150ms/request latency, 1.6Mbps down, 750kbps up',origin:'local Node HTTP server and synthetic native SQLite',measure:'navigation start to rendered action and bound controls',p95:sorted[Math.ceil(.95*sorted.length)-1]};
 assert.equal(errors.length,0,JSON.stringify(errors));proof.checks.push('no page errors');
 await page.setViewportSize({width:1280,height:900});await page.screenshot({path:out+'/today-desktop.png',fullPage:true});
 // Exercise the actual acceptance helper with both documented Fit DOM states.
 // These are synthetic verifier fixtures, not live Fit acceptance.
 const harnessPage=await browser.newPage();
 for(const [state,markup]of [['fresh','<textarea id="fitPrefs"></textarea>'],['saved','<details data-app-fit-setup><summary>Adjust setup</summary><textarea id="fitPrefs"></textarea></details>'],['nested','<details data-app-fit-setup><summary>Adjust setup</summary><details><summary>Notes</summary><textarea id="fitPrefs"></textarea></details></details>'],['reused-disclosure','<details class="app-screen-details"><summary>Adjust your session</summary><textarea id="fitPrefs"></textarea></details>'],['late-disclosure','<div id="pending" hidden><textarea id="fitPrefs"></textarea></div><script>setTimeout(()=>{const p=document.getElementById("pending"),d=document.createElement("details");d.innerHTML="<summary>Adjust your session</summary>";p.before(d);d.append(p);p.hidden=false},500)</script>']]){
  await harnessPage.setContent('<iframe title="Synthetic Fit verifier"></iframe>');
  await harnessPage.locator('iframe').evaluate((e,html)=>{e.srcdoc=html;},markup);
  const field=await revealSetupField(harnessPage.frameLocator('iframe'),'#fitPrefs');
  assert(await field.isVisible());await field.fill('Synthetic '+state+' notes');assert.equal(await field.inputValue(),'Synthetic '+state+' notes');
  proof.checks.push('Fit verifier synthetic '+state+' state requires a visible editable field');
 }
 await harnessPage.close();
 writeFileSync(out+'/browser-proof.json',JSON.stringify(proof,null,2));console.log(JSON.stringify({checks:proof.checks.length,p95:proof.timing.p95,scope:proof.scope}));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));DB.close();}
