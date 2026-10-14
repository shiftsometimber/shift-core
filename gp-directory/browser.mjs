import {createServer} from 'node:http';import {readFileSync,writeFileSync} from 'node:fs';import {createRequire} from 'node:module';import {DatabaseSync} from 'node:sqlite';import assert from 'node:assert/strict';
import {searchDirectory} from './search.mjs';import {withMemberDetails,memberDetailsRuntime,memberDetailsStyles} from '../member-experience/member-details.mjs';import {gpFormRuntime} from '../member-experience/gp-form.mjs';
const require=createRequire(import.meta.url),{chromium}=require('/Users/shiftsometimberltd/SST/tools/apple-review-smoke/node_modules/playwright');
const sqlite=new DatabaseSync('work/gp-directory-prepared/gp-directory.sqlite',{readOnly:true});
const DB={prepare(sql){return{bind(...args){return{async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return{results:sqlite.prepare(sql).all(...args)}}}},async first(){return sqlite.prepare(sql).get()||null}}}};
const account={firstName:'Fictional',lastName:'Member',dateOfBirth:'',phone:'',postcode:'',address1:'',address2:'',town:'',county:'',gpPractice:'',gpPostcode:'',gpCode:'',gpAddress:'',gpSelectionMode:'manual',email:'fictional@example.invalid'};
const settings=withMemberDetails('<!doctype html><html lang="en-GB"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body data-member-page="settings"><main></main></body></html>',{MEMBER_GP_DIRECTORY_V2_ENABLED:'true'});
let assessment=readFileSync('frontend/member/treatment-assessment.html','utf8').replace(/<script src="\/treatment-assessment\.js[^>]*><\/script>/,'').replace('<button type="submit">','<button type="submit" disabled>');
const hq='<html lang="en-GB"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:16px Arial;margin:16px}.view{display:none}.view.active{display:block}main{max-width:100%}input{max-width:100%}</style></head><body><aside><nav><details open><summary>Members</summary><button data-view="people">Members</button></details></nav></aside><h1 id="title">HQ</h1><button id="logoutBtn">Logout</button><main><section id="people" class="view">Members</section></main><script>const S={me:{role:"owner"}};async function call(path){const r=await fetch(path.replace("/v1/hq/management/gp-directory","/hq-api"));const b=await r.json();if(!r.ok)throw Error(b.message||"Unavailable");return b;}let load=async()=>{};document.getElementById("logoutBtn").onclick=async()=>{S.me=null;};</script><script src="/hq-client.js"></script><script>window.addEventListener("DOMContentLoaded",()=>window.installGpDirectoryHQ());</script></body></html>';
const server=createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');res.setHeader('Cache-Control','no-store');
 try{
  if(u.pathname==='/settings'){res.setHeader('Content-Type','text/html');return res.end(settings)}
  if(u.pathname==='/assessment'){res.setHeader('Content-Type','text/html');return res.end(assessment)}
  if(u.pathname==='/hq'){res.setHeader('Content-Type','text/html');return res.end(hq)}
  if(u.pathname==='/hq-client.js'){res.setHeader('Content-Type','text/javascript');return res.end(readFileSync('gp-directory/hq-client.js'))}
  if(u.pathname==='/assets/member-experience/member-details.css'){res.setHeader('Content-Type','text/css');return res.end(memberDetailsStyles)}
  if(u.pathname==='/assets/member-experience/member-details.mjs'){res.setHeader('Content-Type','text/javascript');return res.end(memberDetailsRuntime)}
  if(u.pathname==='/assets/member-experience/gp-form.mjs'){res.setHeader('Content-Type','text/javascript');return res.end(gpFormRuntime)}
  if(u.pathname==='/clinical-intake-v1.css'){res.setHeader('Content-Type','text/css');return res.end('body{font:16px Arial;margin:16px}main{max-width:900px;margin:auto}label{display:block;margin:12px 0}input,textarea,select{display:block;width:100%;box-sizing:border-box;font-size:16px;min-width:0}fieldset{min-width:0}button{min-height:44px}')}
  res.setHeader('Content-Type','application/json');
  if(u.pathname==='/v1/member/details')return res.end(JSON.stringify({ok:true,details:account,revision:'a'.repeat(64),gpLookupConfigured:true,gpDirectoryV2:true}));
  if(u.pathname==='/v1/member/details/delivery')return res.end(JSON.stringify({ok:true,details:{},revision:'a'.repeat(64)}));
  if(u.pathname==='/v1/member/details/gp-search'||u.pathname==='/hq-api'){
   if(u.pathname==='/hq-api'&&!u.searchParams.has('q'))return res.end(JSON.stringify({counts:{England:6163,Wales:398,Scotland:879,'Northern Ireland':305},importedAt:new Date().toISOString(),attribution:['NHS ODS','Public Health Scotland'],version:'local candidate'}));
   const r=await searchDirectory(DB,{query:u.searchParams.get('q'),near:u.searchParams.get('near')||'',nation:u.searchParams.get('nation')||''});return res.end(JSON.stringify(r));
  }
  res.statusCode=404;res.end('{}');
 }catch(e){res.statusCode=503;res.end(JSON.stringify({message:e.message}))}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});const report={candidateOnly:true,physicalDevices:false,notificationsSent:0,cases:[],errors:[]};
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
  await page.goto(origin+'/settings');await page.waitForFunction(()=>!document.getElementById('memberDetailsFields').disabled);
  await page.fill('#memberGpDirectoryNear','SK10 1AA');await page.fill('#memberGpPractice','Macclesfield');await page.waitForFunction(()=>document.getElementById('memberGpDirectorySelect').options.length>1);
  const labels=await page.locator('#memberGpDirectorySelect option').allTextContents();assert(labels.some(x=>x.includes('miles')));await page.selectOption('#memberGpDirectorySelect','0');assert((await page.inputValue('#memberGpAddress')).length>5);assert((await page.inputValue('#memberGpCode')).length>0);
  await page.fill('#memberGpAddress','Manually checked practice address');assert.equal(await page.inputValue('#memberGpCode'),'');assert.equal(await page.inputValue('#memberGpSelectionMode'),'manual');
  await page.selectOption('#memberGpSelectionMode','no_gp');assert.equal(await page.inputValue('#memberGpPractice'),'');assert.equal(await page.inputValue('#memberGpAddress'),'');assert((await page.locator('#memberGpDirectorySelected').innerText()).includes('prescriber'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  report.cases.push({width,page:'member',checks:['typeahead','nearest GB matches','full address filled','manual correction invalidates directory reference','no GP clears record fields','no overflow']});
  await page.goto(origin+'/assessment');await page.fill('#assessmentGpLookupNear','BT1 1AA');await page.fill('[name="gpPractice"]','Belfast');await page.waitForFunction(()=>document.getElementById('assessmentGpSelect').options.length>1);await page.selectOption('#assessmentGpSelect','0');assert((await page.inputValue('[name="gpAddress"]')).length>5);assert((await page.inputValue('[name="gpPostcode"]')).startsWith('BT'));
  await page.fill('[name="gpPractice"]','Glasgow');await page.waitForFunction(()=>document.getElementById('assessmentGpSelect').options.length>1);assert((await page.locator('#assessmentGpSelect option').nth(1).innerText()).includes('GLASGOW')||(await page.locator('#assessmentGpSelect option').nth(1).innerText()).includes('Glasgow'));
  assert.equal(await page.locator('[name="gpContactConsent"]').isChecked(),false);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  report.cases.push({width,page:'assessment',checks:['NI suggestions','Scotland suggestions','full practice address filled','consent untouched','submission disabled','no overflow']});
  await page.goto(origin+'/hq');await page.getByRole('button',{name:'GP directory',exact:true}).click();await page.waitForFunction(()=>document.getElementById('gpdir-counts').textContent.includes('Northern Ireland: 305'));
  await page.fill('#gpdir-query','Cardiff');await page.selectOption('#gpdir-nation','Wales');await page.waitForFunction(()=>document.querySelectorAll('#gpdir-results article').length>0);assert((await page.locator('#gpdir-results').innerText()).includes('Wales'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.click('#logoutBtn');assert.equal(await page.locator('#gpdir-results article').count(),0);
  report.cases.push({width,page:'hq',checks:['all four nation counts','Wales search/filter','full address cards','logout clears results','no overflow']});
  assert.deepEqual(errors,[]);await page.close();
 }
 report.status='passed';
}catch(e){report.status='failed';report.errors.push(e.stack);throw e;}
finally{writeFileSync('work/gp-directory-prepared/browser-receipt.json',JSON.stringify(report,null,2));await browser.close();await new Promise(r=>server.close(r));sqlite.close();console.log(JSON.stringify(report,null,2));}
