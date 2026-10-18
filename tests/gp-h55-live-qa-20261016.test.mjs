
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {readGpOverflowGeometry} from '../release/gp-directory-live-h55-qa-20261016.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertQaFileInverses,assertQaIdentity,assertFreshWindow,inverseLiteral,QA_BRANCH,QA_WORKFLOW,TARGET_RUNTIME_SOURCE,isPreventedWeekBackground} from '../release/gp-h55-live-qa-20261016.mjs';
test('all original W runner/helper/workflow commands and assertions restore byte exactly',()=>assert.equal(assertQaFileInverses().originalAssertionsAndCommandsRetained,true));
test('actual verifier identity cannot be relabelled as runtime or a different job',()=>{
 const source='a'.repeat(40),run={id:12,run_attempt:1,head_sha:source,head_branch:QA_BRANCH,path:QA_WORKFLOW,event:'push',head_repository:{full_name:'shiftsometimber/shift-core'}},args={source,runId:12,attempt:1};
 assert.equal(assertQaIdentity(run,args),run);
 for(const change of [{head_sha:TARGET_RUNTIME_SOURCE},{head_branch:'main'},{path:'x.yml'},{event:'workflow_dispatch'},{id:13},{run_attempt:2},{head_repository:{full_name:'other/repo'}}])assert.throws(()=>assertQaIdentity({...run,...change},args));
});
test('original fifteen minute freshness deadline rejects stale future and invalid observations',()=>{
 const now=Date.now();for(const age of [0,1,899999,900000])assert.equal(assertFreshWindow(new Date(now-age).toISOString(),now),now-age);
 for(const at of [new Date(now-900001).toISOString(),new Date(now+1).toISOString(),'invalid'])assert.throws(()=>assertFreshWindow(at,now));
});
test('whole inverses reject missing duplicated or extra diagnostics instead of tolerating source differences',()=>{
 assert.equal(inverseLiteral('AnewZ',[['old','new',1]]),'AoldZ');
 for(const body of ['AZ','AnewnewZ'])assert.throws(()=>inverseLiteral(body,[['old','new',1]]));
 assert.throws(()=>inverseLiteral('Axextra',[['','x','suffix']]));
});
test('original factual UI locator, timeout and private cleanup remain unchanged',()=>{
 const body=readFileSync(new URL('../release/gp-directory-live-h55-qa-20261016.mjs',import.meta.url),'utf8');
 assert(body.includes("await week.locator('summary').first().click();await week.getByLabel('Choose a recorded week').waitFor({timeout:30000});"));assert(!body.includes('force:true'));assert(!body.includes('waitForTimeout('));assert(body.includes('finally'));
});
test('separate runtime source is explicit and neither environment nor native HEAD is forged',()=>{
 const body=readFileSync(new URL('../release/gp-h55-live-qa-20261016.mjs',import.meta.url),'utf8');
 assert(!/process\.env\.GITHUB_SHA\s*=/.test(body));assert(!body.includes('process.chdir('));
 assert(body.includes("assert.equal(native(process.cwd(),'rev-parse','HEAD'),TARGET_RUNTIME_SOURCE)"));
 assert(body.includes("verifiedOwnedRuntime(core.deployment,run,job,r)"));
});
test('original clinical and communication boundaries remain explicit',()=>{
 const body=readFileSync(new URL('../release/gp-h55-live-qa-20261016.mjs',import.meta.url),'utf8');
 for(const text of ["realCustomerWrites:0","notificationsSent:0","gpFeatureAcceptance:false","blocked_contract_inactive","Original authorised fictional registration must succeed without fallback"])assert(body.includes(text));
});

test('only held same-origin/API analytics POST is additionally prevented before original strict guard',()=>{
 const f=isPreventedWeekBackground;
 for(const origin of ['https://shiftsometimber.co.uk','https://api.shiftsometimber.co.uk'])assert.equal(f(origin+'/v1/events','POST',{site:origin,api:'https://api.shiftsometimber.co.uk'}),true);
 for(const [url,method]of [['https://foreign.invalid/v1/events','POST'],['https://shiftsometimber.co.uk/v1/events/','POST'],['https://shiftsometimber.co.uk/v1/events','GET'],['https://shiftsometimber.co.uk/v1/member/treatment/events','POST'],['https://shiftsometimber.co.uk/v1/consents','POST'],['https://shiftsometimber.co.uk/v1/contact','POST']])assert.equal(f(url,method,{site:'https://shiftsometimber.co.uk',api:'https://api.shiftsometimber.co.uk'}),false);
});

test('first-failure all-DOM diagnostics include pre-transform wide boxes and in-bounds generated pseudos without private attributes or text',async()=>{
 const{chromium}=createRequire(resolve(process.cwd(),'package.json'))(process.env.QA_PLAYWRIGHT_MODULE||'playwright');
 const browser=await chromium.launch({headless:true});
 try{const page=await browser.newPage({viewport:{width:390,height:900}});
  await page.setContent('<!doctype html><html><head><style>html,body{margin:0;width:390px}html::after{content:"";position:absolute;left:1000px;top:0;width:32px;height:1px}body{overflow-x:hidden}.scaled[data-private="PRIVATE_MARKER_ATTRIBUTE"]{position:absolute;left:-10px;top:0;width:1032px;height:1px;transform:scale(.25);transform-origin:top left}.pseudo::before{content:"PRIVATE_MARKER_PSEUDO";position:absolute;left:0;top:0;width:1px;height:1px}</style></head><body><div class="scaled" data-private="PRIVATE_MARKER_ATTRIBUTE"></div><span class="pseudo"></span><input value="PRIVATE_MARKER_INPUT"></body></html>');
  const before=await page.content(),observed=await readGpOverflowGeometry(page);
  assert.equal(observed.assertion.noHorizontalOverflow,false);assert.equal(observed.assertion.scrollWidth,1032);
  const target=observed.failureOnly.allDomWideBoxes.find(e=>e.tag==='DIV'&&e.offsetWidth===1032);
  assert(target);assert(target.rect.right<390);assert(target.rect.left<0);assert.equal(target.clientWidth,target.scrollWidth);assert.notEqual(target.layout.transform,'none');
  assert(!observed.overflowing.some(e=>e.tag==='DIV'),'The old rect-right/internal-overflow filter misses this box');
  assert(observed.failureOnly.allDomGeneratedPseudos.some(e=>e.tag==='SPAN'&&e.pseudo==='::before'),'Generated pseudos on otherwise in-bounds nodes are retained');
  assert(observed.failureOnly.allDomMatchedLayoutRules.some(r=>/^[a-f0-9]{64}$/.test(r.selectorSha256||'')));
  assert(!JSON.stringify(observed).includes('PRIVATE_MARKER'));assert.equal(await page.content(),before,'No observation changes the DOM or layout');
  assert.equal(observed.failureOnly.allDomElementCount,await page.locator('*').count());await page.close();
 }finally{await browser.close();}
});

test('failure CDP geometry retains closed-shadow SVG and anonymous layout while original assertion precedes screenshot and CDP',async()=>{
 const{chromium}=createRequire(resolve(process.cwd(),'package.json'))(process.env.QA_PLAYWRIGHT_MODULE||'playwright');
 const{assertGpNoOverflow}=await import('../release/gp-directory-live-h55-qa-20261016.mjs'),{mkdtempSync}=await import('node:fs'),{tmpdir}=await import('node:os');
 const browser=await chromium.launch({headless:true});
 try{const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage();const requests=[];await page.route('**/*',route=>{requests.push('unexpected');return route.abort();});
  await page.setContent('<!doctype html><html><head><style>html,body{margin:0;width:390px}html::after{content:"";position:absolute;left:1000px;top:0;width:32px;height:1px}body{overflow-x:hidden}</style></head><body><section></section><svg xmlns="http://www.w3.org/2000/svg" width="32" height="2" style="position:absolute;left:1000px;top:0"><rect width="32" height="2"/></svg><input value="PRIVATE_CDP_INPUT"></body></html>');
  await page.evaluate(()=>{const shadow=document.querySelector('section').attachShadow({mode:'closed'}),box=document.createElement('div');box.setAttribute('data-private','PRIVATE_CDP_ATTRIBUTE');box.style.cssText='position:absolute;left:0;top:0;width:1032px;height:2px;white-space:nowrap;font:100px monospace';box.textContent='PRIVATE_CDP_TEXT';shadow.append(box);});
  const before=await page.content(),events=[],row={},screenshot=page.screenshot.bind(page),newSession=context.newCDPSession.bind(context);
  let beforeCdp;page.screenshot=async options=>{assert.equal(row.layoutDiagnostics[0].assertion.noHorizontalOverflow,false);events.push('original-screenshot');const result=await screenshot(options);beforeCdp=await page.content();return result;};
  context.newCDPSession=async target=>{events.push('failure-cdp');return newSession(target);};
  await assert.rejects(assertGpNoOverflow(page,{row,width:390,dir:mkdtempSync(tmpdir()+'/gp-layout-cdp-')}));
  assert.deepEqual(events,['original-screenshot','failure-cdp']);
  const original=row.layoutDiagnostics[0],cdp=original.failureOnly.cdpLayout;assert(cdp);assert(cdp.layoutNodeCount>0);assert(cdp.outliers.some(e=>e.tag.toLowerCase()==='svg'||e.tag.toLowerCase()==='rect'));assert(cdp.outliers.some(e=>e.ancestors.some(a=>a.shadowRootType==='closed')));assert(cdp.outliers.some(e=>e.tag==='#text'));
  assert(!JSON.stringify(cdp).includes('PRIVATE_CDP'));const{createHash}=await import('node:crypto');assert.equal(original.failureOnly.documentHtml.sha256,createHash('sha256').update(before).digest('hex'),'Atomic DOM evidence is captured before the original screenshot');assert.equal(await page.content(),beforeCdp,'Added CDP observation preserves the exact post-screenshot DOM');assert.equal(requests.length,0,'CDP observations make no network request');
  assert.equal(original.assertion.noHorizontalOverflow,false);assert(original.assertion.scrollWidth>original.assertion.innerWidth+1);await context.close();
 }finally{await browser.close();}
});
