import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {authenticateMember} from '../member-state-fast-v1.js';
import {fitRuntime} from '../member-experience/fit-approved-runtime.mjs';
const report={source:process.env.ACCEPTANCE_SOURCE,scope:'Additional reliability fixtures only; no completed acceptance repeated, no production record mutation',checks:[],timings:[]};mkdirSync('premortem-evidence',{recursive:true});
const check=async(label,fn)=>{await fn();report.checks.push({label,pass:true});console.log('PASS '+label)};
let expires=Date.now()+2500,touches=0;
const DB={prepare(sql){return{bind(){return this},async first(){const start=performance.now();try{return {id:42,session_id:7,expires_at:new Date(expires).toISOString(),revoked_at:null}}finally{report.timings.push({phase:'authentication.session-select',ms:performance.now()-start,database:'Synthetic in-memory adapter, NOT production D1'})}},async run(){touches++;return {success:true}}}}};
const request=()=>new Request('https://shiftsometimber.co.uk/v1/grub/workspace',{headers:{Cookie:'sst_session=fictional-retained-token'}});
await check('Real clock naturally crosses fixture expiry; exact served authentication rejects retained cookie',async()=>{assert.equal((await authenticateMember(request(),{DB})).userId,42);const before=touches;const expiry=expires;await new Promise(r=>setTimeout(r,Math.max(0,expiry-Date.now()+100)));const rejected=await authenticateMember(request(),{DB});assert.equal(rejected.response.status,401);assert.equal((await rejected.response.json()).error,'session_expired');assert.equal(touches,before);assert.equal(rejected.response.headers.get('set-cookie'),null);report.fixtureExpiry={expiresAt:new Date(expiry).toISOString(),observedAt:new Date().toISOString(),productionLifetimeChanged:false,clockMocked:false,limitation:'Short-lived synthetic database row; NOT an issued 12-hour/90-day production session'}});
await check('New fixture session works; no saved fixture information changes on expiry',async()=>{expires=Date.now()+60000;assert.equal((await authenticateMember(request(),{DB})).userId,42)});
const legacy={location:'home',minutes_per_day:12,sessions:[{requested_minutes:12,estimated_minutes:12,exercises:[{id:'calf-raise-cool-down-advanced',name:'Calf Raise Cool-Down Advanced',group:'legs'},{id:'glute-bridge-cool-down-beginner',name:'Glute Bridge Cool-Down Beginner',group:'legs'},{id:'push-up-cool-down-standard',name:'Push-Up Cool-Down Standard',group:'upper-body'}]}]};
const valid={location:'home',minutes_per_day:20,sessions:[{requested_minutes:20,estimated_minutes:22,exercises:[{id:'squat',name:'Synthetic legitimate retained squat',group:'legs',selection_reason:'Included within your selected 20-minute home session.',sets:2,reps:10,how:['Use the fictional test instructions.']},{id:'stretch-cool-down',name:'Synthetic retained cool-down',group:'cool-down',minutes:2}]}]};
const browser=await chromium.launch();
try{for(const [device,width]of [['mobile',390],['desktop',1440]]){const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const [label,plan]of [['historical named contradictory records',legacy],['legitimate retained requested/estimated distinction',valid]]){
const retained={plan,fitJourney:{entries:{'2026-01-01:day-1:squat':{status:'done',exerciseId:'squat',updatedAt:'2026-01-01T12:00:00Z'}}}},before=JSON.stringify(retained);
await check(device+' '+label+' read-only renderer reload and return',async()=>{
for(let round=0;round<3;round++){await page.goto('about:blank');await page.setContent('<button id="fitGenerate">Build</button><div id="fitLimitations"></div><div id="fitStatus"></div><div id="fitOutput"></div>');await page.evaluate(data=>{window.fixture=data;window.mutations=0;window.SST_API={getFitActivity:async()=>structuredClone(window.fixture),saveFitActivity:async()=>{window.mutations++;throw Error('Unexpected save')},generateFit:async()=>{window.mutations++;throw Error('Unexpected build')}}},retained);await page.addScriptTag({content:fitRuntime});await page.evaluate(()=>window.dispatchEvent(new Event('load')));await page.waitForFunction(()=>document.querySelector('#fitOutput').textContent.length>0);
if(plan===legacy){assert.match(await page.locator('#fitOutput').innerText(),/This saved session needs replacing/);assert.equal(await page.locator('.sf-exercise').count(),0);assert.equal(await page.locator('[data-sf-complete]').count(),0)}else{assert.equal(await page.locator('.sf-exercise').count(),2);assert.equal(await page.locator('.sf-session').getAttribute('data-requested-minutes'),'20');assert.equal(await page.locator('.sf-session').getAttribute('data-session-minutes'),'22')}
assert.equal(await page.evaluate(()=>window.mutations),0);assert.equal(await page.evaluate(()=>JSON.stringify(window.fixture)),before);}
assert.equal(errors.length,0);});
}await context.close();}}finally{await browser.close()}
report.pass=true;report.legacyScope='Real Chromium exact served-source renderer, synthetic preserved input and activity history; three fresh page loads per case. Not actual authenticated production refresh/login or historical customer record inspection.';
writeFileSync('premortem-evidence/reliability-fixtures.json',JSON.stringify(report,null,2));console.log('RELIABILITY_REPORT '+JSON.stringify(report));
