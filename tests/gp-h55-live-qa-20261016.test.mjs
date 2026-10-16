import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {isPreventedGpBackground,openNormalGpDisclosures,readGpOverflowGeometry} from '../release/gp-directory-live-h55-qa-20261016.mjs';
import {assertQaIdentity,QA_BRANCH,QA_WORKFLOW,TARGET_RUNTIME_SOURCE} from '../release/gp-h55-live-qa-20261016.mjs';
const site='https://shiftsometimber.co.uk',api='https://api.shiftsometimber.co.uk';
test('only exact unrelated PWA/RUM POSTs and attribution DELETE are denied before the original GP guard',()=>{
 for(const url of[site+'/v1/my-timber-pwa/status',api+'/v1/my-timber-pwa/status',site+'/cdn-cgi/rum','https://cloudflareinsights.com/cdn-cgi/rum'])assert.equal(isPreventedGpBackground(url,'POST',{site,api}),true);
 for(const url of[site+'/v1/acquisition-attribution',api+'/v1/acquisition-attribution'])assert.equal(isPreventedGpBackground(url,'DELETE',{site,api}),true);
 for(const [url,method]of[[site+'/v1/acquisition-attribution/','DELETE'],[site+'/v1/acquisition-attribution','POST'],[site+'/v1/acquisition-attribution','GET'],['https://foreign.invalid/v1/acquisition-attribution','DELETE'],[site+'/v1/member/details','DELETE'],[site+'/v1/my-timber-pwa/status','PATCH'],[site+'/v1/my-timber-pwa/status/','POST'],[site+'/v1/my-timber-pwa/status-extra','POST'],['https://foreign.invalid/v1/my-timber-pwa/status','POST'],['https://foreign.invalid/cdn-cgi/rum','POST'],[site+'/v1/member/details','PATCH'],[site+'/v1/member/details/gp-search','GET'],[site+'/v1/consents','POST'],[site+'/cdn-cgi/rum','GET']])assert.equal(isPreventedGpBackground(url,method,{site,api}),false,'Original guard retains '+method+' '+url);
});
test('real verifier identity cannot be relabelled as runtime H or another workflow',()=>{
 const q='a'.repeat(40),run={id:12,run_attempt:2,head_sha:q,head_branch:QA_BRANCH,path:QA_WORKFLOW,event:'push',head_repository:{full_name:'shiftsometimber/shift-core'}};
 assert.equal(assertQaIdentity(run,{source:q,runId:'12',attempt:'2'}),run);
 for(const change of[{head_sha:TARGET_RUNTIME_SOURCE},{head_branch:'main'},{path:'other.yml'},{event:'workflow_dispatch'},{id:13},{run_attempt:1}])assert.throws(()=>assertQaIdentity({...run,...change},{source:q,runId:'12',attempt:'2'}));
});
test('old hidden wait fails; normal summaries open actual outer and inner shape, including no-GP reopen',async()=>{
 const require=createRequire(resolve(process.cwd(),'package.json'));
 const{chromium}=require(process.env.QA_PLAYWRIGHT_MODULE||'playwright');const browser=await chromium.launch({headless:true});
 try{for(const noGp of[false,true]){
  const page=await browser.newPage({viewport:{width:390,height:900}});
  await page.setContent('<!doctype html><html><body><main hidden><details class="app-screen-details app-account-details"><summary>Personal &amp; delivery details</summary><section id="memberDetailsPanel"><form id="memberDetailsForm" data-gp-directory-v2="true"><input id="memberEmail" value="fictional@example.invalid"><details class="app-refine-detail"><summary>Your GP details</summary><div class="md-section"><input id="memberGpPractice" '+(noGp?'hidden':'')+'><input id="memberGpPostcode" '+(noGp?'hidden':'')+'><input id="memberGpAddress" '+(noGp?'hidden':'')+'><select id="memberGpSelectionMode"><option value="manual">Enter manually</option><option value="no_gp" '+(noGp?'selected':'')+'>I do not have a GP</option></select></div></details></form></section></details></main><script>window.summaryClicks=[];document.addEventListener("click",e=>{if(e.target.tagName==="SUMMARY")summaryClicks.push(e.target.textContent)});</script></body></html>');
  await assert.rejects(page.locator('#memberDetailsForm[data-gp-directory-v2="true"]').waitFor({state:'visible',timeout:150}));
  await page.evaluate(()=>setTimeout(()=>document.querySelector('main').hidden=false,80));
  await openNormalGpDisclosures(page);await page.locator('#memberDetailsForm[data-gp-directory-v2="true"]').waitFor({state:'visible',timeout:1000});
  assert.equal(await page.locator('#memberGpSelectionMode').inputValue(),noGp?'no_gp':'manual');
  assert.deepEqual(await page.evaluate(()=>summaryClicks),['Personal & delivery details','Your GP details']);
  assert.equal(await page.locator('#memberGpPractice').isVisible(),!noGp,'The opener never force-unhides conditional GP inputs');await page.close();
 }}finally{await browser.close();}
});

test('geometry observes overflow without leaking fictional private text or changing layout',async()=>{
 const{chromium}=createRequire(resolve(process.cwd(),'package.json'))(process.env.QA_PLAYWRIGHT_MODULE||'playwright');const browser=await chromium.launch({headless:true});
 try{const page=await browser.newPage({viewport:{width:390,height:900}});await page.setContent('<html><body><main style="width:500px"><input value="PRIVATE_MARKER_123"><div id="fixtureOverflow">PRIVATE_MARKER_456</div></main></body></html>');const before=await page.content();const geometry=await readGpOverflowGeometry(page);assert(geometry.root.scrollWidth>geometry.viewport.innerWidth+1);assert(geometry.overflowing.some(e=>e.tag==='MAIN'));assert(!JSON.stringify(geometry).includes('PRIVATE_MARKER'));assert.equal(await page.content(),before);await page.close();}finally{await browser.close();}
});

// Unit contract fixtures only; the live path independently downloads actual terminal artifacts.
test('current Core and unchanged HQ retain separate genuine provenance; wrong source, flags, attempts, bindings or clinical activation are rejected',async()=>{
 const{readFileSync}=await import('node:fs');const{assertCompositeReceipts,assertQaFileInverses}=await import('../release/gp-h55-live-qa-20261016.mjs');
 assertQaFileInverses();const fixtures=JSON.parse(readFileSync(new URL('../release/gp-h55-live-qa-policy-20261016.json',import.meta.url))).receiptContractFixtures;
 const codeRun={id:38980756381,run_attempt:1,head_sha:fixtures.code.source,head_branch:'fix/questionnaire-handover-20261016',path:'.github/workflows/questionnaire-handover-release-20261016.yml',name:'Questionnaire Handover Nonclinical Release',event:'push',head_repository:{full_name:'shiftsometimber/shift-core'},html_url:'https://github.com/shiftsometimber/shift-core/actions/runs/38980756381',status:'completed',conclusion:'success'};
 const activationRun={...codeRun,id:38974318146,head_sha:fixtures.activation.source,head_branch:'release/gp-priority-direct-activation-20261016',path:'.github/workflows/gp-priority-direct-activation-20261016.yml',name:'GP Priority Direct Directory Activation',html_url:'https://github.com/shiftsometimber/shift-core/actions/runs/38974318146'};
 const input={...fixtures,codeRun,activationRun};const result=assertCompositeReceipts(input);assert.notEqual(result.workers.core.source,result.workers.hq.source);
 for(const mutate of[x=>x.code.workers.core.source=x.activation.source,x=>x.code.partnerContractActivated=true,x=>x.code.partnerTestPassed=true,x=>x.code.gpEnabled=false,x=>x.code.workers.core.allBindingsSha256='a'.repeat(64),x=>x.codeRun.conclusion='failure',x=>x.activationRun.run_attempt=2,x=>x.code.anonymousBoundary=x.code.anonymousBoundary.filter(r=>!r.privateDenialVerified),x=>x.activation.workers.hq.gpEnabled=false,x=>x.activation.featureAcceptance=true]){const copy=structuredClone(input);mutate(copy);assert.throws(()=>assertCompositeReceipts(copy));}
});
