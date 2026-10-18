// Native clients and the unchanged navigation helper; fictional localhost responses only.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {treatmentWeekRuntime,treatmentWeekStyles} from '../treatment-week-client.mjs';
import {requireMemberPanel} from '../../rendered-member-acceptance-support.mjs';
const require=createRequire(process.env.TREATMENT_PLAYWRIGHT_PACKAGE||new URL('../../package.json',import.meta.url));
const{chromium}=require('playwright'),out=process.env.TREATMENT_WEEK_PROOF_DIR||'treatment-week-navigation-proof';
mkdirSync(out,{recursive:true});
const source=readFileSync(new URL('../../frontend/member/member-progress-v1.js',import.meta.url),'utf8');
const counters={progress:0,insights:0,module:0},errors=[],blockedExternal=[];
let origin='';
const html='<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body data-member-tools="v1"><main><div id="previewAuth" hidden></div><div id="previewMember" class="is-ready"><button class="mp-tab" data-panel="visualise" onclick="document.getElementById(\'panel-visualise\').classList.add(\'active\');location.hash=\'visualise\'">Progress</button><section id="panel-visualise" class="mp-panel"><div class="member-progress-map"><h2>Progress</h2></div></section></div></main><script>window.SST_API_BASE=location.origin;window.SST_API={getProgressSummary:async()=>{const r=await fetch(\'/v1/progress/summary\');return r.json();}};</script><script src="/member-progress-v1.js"></script></body></html>';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const server=createServer(async(req,res)=>{try{
 const path=new URL(req.url,origin).pathname;let response;
 if(path==='/member/dashboard')response=new Response(html,{headers:{'Content-Type':'text/html'}});
 else if(path==='/member-progress-v1.js')response=new Response(source,{headers:{'Content-Type':'text/javascript'}});
 else if(path==='/assets/member-experience/treatment-week.mjs'){counters.module++;response=new Response(treatmentWeekRuntime,{headers:{'Content-Type':'text/javascript'}});}
 else if(path==='/assets/member-experience/treatment-week.css')response=new Response(treatmentWeekStyles,{headers:{'Content-Type':'text/css'}});
 else if(path==='/v1/progress/summary'){counters.progress++;await delay(25);response=Response.json({progress:{state:'empty',metrics:[],entries:0,units:'kg'}});}
 else if(path==='/v1/member/treatment/insights'){counters.insights++;await delay(250);response=Response.json({weekViewAvailable:true,patterns:{status:'available',observations:[],contextDays:[],doses:[],symptoms:[]}});}
 else response=Response.json({error:'fixture_not_found'},{status:404});
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
}catch(error){errors.push(error.name);res.writeHead(500);res.end('fixture_error');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true});
const receipt={scope:'Actual Progress client and original visible navigation helper with fictional localhost data; no production provider, accounts or clinical feature',sourceSHA256:createHash('sha256').update(source).digest('hex'),checks:[],errors,blockedExternal,status:'running'};
try{
 for(const width of[390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin!==origin){blockedExternal.push({path:new URL(route.request().url()).pathname});return route.abort();}return route.continue();});
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.name));
  await page.goto(origin+'/member/dashboard');
  await page.locator('#shiftProgressStory[aria-busy="false"]').waitFor({timeout:5000});
  await requireMemberPanel(page,'visualise');
  const patterns=page.locator('.shift-pattern-panel');await patterns.waitFor({state:'visible',timeout:3000});
  await patterns.getByLabel('Jabs and symptoms',{exact:true}).check();
  for(const label of['Food notes and protein snapshots','Exercises marked done','Steps and sleep readings'])await patterns.getByLabel(label,{exact:true}).uncheck();
  await patterns.getByRole('button',{name:'Show context',exact:true}).click();
  await page.locator('.shift-treatment-week > summary').waitFor({state:'visible',timeout:2500});
  assert.equal(await patterns.getByLabel('Jabs and symptoms',{exact:true}).isChecked(),true);
  assert.equal(await page.locator('.shift-treatment-week').count(),1);
  receipt.checks.push({width,ordinaryVisibleNavigation:true,immediateOriginalFactualControls:true,weekMountedOnce:true,selectedSourceRetained:true});
  await context.close();
 }
 assert.deepEqual(errors,[]);assert.deepEqual(blockedExternal,[]);receipt.status='pass';
}catch(error){receipt.status='failed';receipt.error=error.message;for(const context of browser.contexts())for(const page of context.pages())receipt.failureState=await page.evaluate(()=>({hash:location.hash,busy:document.querySelector('#shiftProgressStory')?.getAttribute('aria-busy'),patterns:document.querySelectorAll('.shift-pattern-panel').length,week:document.querySelectorAll('.shift-treatment-week').length,selected:[...document.querySelectorAll('.shift-pattern-panel input:checked')].map(e=>e.value)})).catch(()=>null);process.exitCode=1;}
finally{receipt.counters=counters;await browser.close();await new Promise(resolve=>server.close(resolve));writeFileSync(out+'/receipt.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt,null,2));}
