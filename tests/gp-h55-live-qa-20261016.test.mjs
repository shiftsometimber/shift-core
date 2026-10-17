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
