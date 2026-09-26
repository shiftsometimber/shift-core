import {createServer} from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {fixture,getPrefs,putPrefs,consent} from '../../tests/helpers/ai-member-fixture.mjs';
import {ukDate} from '../../member-experience/journey-context.mjs';
import {seedCatalogue} from './seed-catalogue.mjs';
import {askTimberRoutes} from '../../ask-timber-v1.js';
import {privacyHealthErasureRoute} from '../../privacy-health-erasure-route-v1.js';
import {authenticateMember} from '../../member-state-fast-v1.js';
const closers=[],f=fixture({after:fn=>closers.push(fn)}),{env,DB}=f;
env.SHIFT_AI_PRACTICAL_CONTEXT='true';env.SHIFT_AI_CONVERSATION_MEMORY='true';
const recipe=await seedCatalogue(DB),prefs=getPrefs(DB);
prefs.grubV2.today={date:ukDate(new Date()),recipeId:recipe.id,name:recipe.name,minutes:recipe.minutes,chosenAt:new Date().toISOString(),kcal:recipe.kcal,protein_g:recipe.protein_g};putPrefs(DB,prefs);
DB.sqlite.exec('ALTER TABLE member_state ADD COLUMN updated_at TEXT; ALTER TABLE consents ADD COLUMN consent_version TEXT; ALTER TABLE consents ADD COLUMN granted_at TEXT; ALTER TABLE consents ADD COLUMN withdrawn_at TEXT; CREATE TABLE progress_entries(id INTEGER PRIMARY KEY,user_id INTEGER);');
env.AI={run:async(model,input)=>{const r=await fetch(process.env.SHIFT_EVAL_URL+'/run',{method:'POST',headers:{Authorization:'Bearer '+process.env.SHIFT_EVAL_KEY,'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error('Inference HTTP '+r.status);return r.json()}};
const htmlResponse=await fetch('https://shiftsometimber.co.uk/ask-timber');assert(htmlResponse.ok);
const html=await htmlResponse.text();
const assets={'/assets/ask-timber-v1.js':'frontend/member/assets/ask-timber-v1.js','/assets/ask-timber-v1.css':'frontend/member/assets/ask-timber-v1.css','/assets/ask-timber-intent-v2.js':'frontend/member/assets/ask-timber-intent-v2.js','/api-adapter-v33d.js':'frontend/member/api-adapter-v33d.js'};
const assetHashes=Object.fromEntries(Object.entries(assets).map(([url,file])=>[url,createHash('sha256').update(readFileSync(file)).digest('hex')]));
let origin;const server=createServer(async(req,res)=>{
 try{
 const url=new URL(req.url,origin),path=url.pathname;let response;
 if(path==='/ask-timber'||path==='/')response=new Response(html,{headers:{'Content-Type':'text/html'}});
 else if(assets[path])response=new Response(readFileSync(assets[path]),{headers:{'Content-Type':path.endsWith('.css')?'text/css':'text/javascript'}});
 else if(path.startsWith('/v1/')){
  const chunks=[];for await(const c of req)chunks.push(c);const body=Buffer.concat(chunks);
  const request=new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body})});
  response=await askTimberRoutes(request,env);
  if(!response&&path==='/v1/privacy/health-tracking')response=await privacyHealthErasureRoute(request,env,{},async()=>{const a=await authenticateMember(request,env);return a.response||Response.json({user:{id:a.userId}})});
  response??=Response.json({ok:false,error:'preview_route_not_enabled'},{status:404});
 }else if(req.method==='GET')response=await fetch('https://shiftsometimber.co.uk'+url.pathname+url.search);
 else response=new Response('Not available',{status:404});
 const headers=new Headers(response.headers);for(const key of ['content-encoding','content-length','transfer-encoding'])headers.delete(key);res.writeHead(response.status,Object.fromEntries(headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch(e){res.writeHead(500);res.end('Preview failure');console.error('preview_request_failed',e.message)}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
const out='evidence/shift-ai-real-probe';mkdirSync(out,{recursive:true});
const report={commit:process.env.SHIFT_AI_SOURCE_SHA,at:new Date().toISOString(),scope:'Unchanged public HTML and repo chat assets; local authenticated synthetic SQL; real hosted AI; no production writes',htmlSha256:createHash('sha256').update(html).digest('hex'),assetHashes,recipe:{id:recipe.id,name:recipe.name},cases:[],screenshots:[]};
let browser;
try{
 for(const [engine,name,width,height] of [[chromium,'chromium-desktop',1440,1000],[webkit,'webkit-phone',390,844]]){
  browser=await engine.launch({headless:true});const context=await browser.newContext({viewport:{width,height}});
  await context.addInitScript(()=>{window.SST_API_BASE=location.origin});
  await context.addCookies([{name:'sst_session',value:'synthetic-1',url:origin,httpOnly:true,sameSite:'Lax'}]);
  await context.route('**/*',route=>{const r=route.request(),u=new URL(r.url());if(u.hostname==='api.shiftsometimber.co.uk'||(u.origin!==origin&&!['GET','HEAD'].includes(r.method())))return route.abort();return route.continue()});
  const page=await context.newPage();await page.goto(origin+'/ask-timber',{waitUntil:'networkidle'});
  // Any external API request would invalidate this isolated proof.
  await page.route('https://api.shiftsometimber.co.uk/**',route=>route.abort());
  async function ask(message){
   const start=Date.now();await page.locator('#timberQuestion').fill(message);
   const response=page.waitForResponse(r=>new URL(r.url()).pathname==='/v1/ai/chat');
   await page.locator('#timberSubmit').click();const r=await response,data=await r.json();
   assert.equal(r.status(),200);assert.equal(data.mode,'grounded');assert.equal(data.journeyUsed,true);
   await page.waitForFunction(answer=>document.querySelector('#timberResponse')?.textContent.includes(answer.slice(0,35)),data.answer);
   const rendered=await page.locator('#timberResponse .at-copy').innerText();assert.equal(rendered.replace(/\s+/g,' ').trim(),data.answer.replace(/\s+/g,' ').trim());
   const row={browser:name,message,elapsedMs:Date.now()-start,answer:data.answer};report.cases.push(row);return data;
  }
  if(name==='chromium-desktop'){
   await ask('Remember that my late shift ends at midnight and I prefer meals I can assemble.');
   await page.reload({waitUntil:'networkidle'});
   const recall=await ask('What did I tell you about when my shift finishes?');assert.match(recall.answer,/midnight|12\s*(?:am|a.m|at night)/i);
   await ask('Correction: my shift now finishes at ten in the evening, not midnight. Please keep that correction.');
   await page.reload({waitUntil:'networkidle'});
   const corrected=await ask('What time does my shift finish now?');assert.match(corrected.answer,/ten|10/i);
   const detail=await ask('What are the first two ingredients in my chosen recipe, with their quantities?');
   for(const ingredient of recipe.ingredients.slice(0,2))assert(detail.answer.toLowerCase().includes(ingredient.item.toLowerCase()),'Actual governed ingredient missing');
   await page.screenshot({path:out+'/'+name+'.png',fullPage:true});report.screenshots.push(name+'.png');
   const other=await browser.newContext();await other.addCookies([{name:'sst_session',value:'synthetic-2',url:origin}]);
   const privateReply=await other.request.post(origin+'/v1/ai/chat',{data:{message:'What time did I say my late shift finishes?',useJourney:false}});const privateData=await privateReply.json();assert.doesNotMatch(privateData.answer,/midnight|ten in the evening|10\s*p/i);await other.close();
  }else{
   await ask('What is my personal Life Back goal?');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
   await page.screenshot({path:out+'/'+name+'.png',fullPage:true});report.screenshots.push(name+'.png');
  }
  await context.close();await browser.close();browser=null;
 }
 // Exercise actual existing erasure route, then consent re-enable and fresh request.
 const erased=await fetch(origin+'/v1/privacy/health-tracking',{method:'DELETE',headers:{Cookie:'sst_session=synthetic-1'}});assert.equal(erased.status,200);
 assert.equal(DB.sqlite.prepare('SELECT COUNT(*) n FROM shift_ai_conversations WHERE user_id=1').get().n,0);
 consent(DB,1,true);
 const after=await fetch(origin+'/v1/ai/chat',{method:'POST',headers:{Cookie:'sst_session=synthetic-1','Content-Type':'application/json'},body:JSON.stringify({message:'What time did I previously say my shifts finish?',useJourney:false})});
 const data=await after.json();assert.doesNotMatch(data.answer,/midnight|ten in the evening|10\s*p/i);
 report.erasure={status:'pass',answer:data.answer};report.status='pass';
}finally{
 if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));for(const fn of closers)fn();
 writeFileSync(out+'/browser-memory-proof.json',JSON.stringify(report,null,2));console.log('SHIFT_AI_BROWSER_REPORT '+JSON.stringify(report));
}
