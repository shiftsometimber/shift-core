import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {savedFitIssues,savedFitReviewRuntime} from '../fit-saved-review.mjs';
import {fitRuntime} from '../fit-approved-runtime.mjs';
test('contradictory retained session is detected without changing its records',()=>{
 const plan={location:'home',minutes_per_day:20,sessions:[{requested_minutes:20,estimated_minutes:22,exercises:[{id:'hotel-push-up',name:'Hotel push-up',group:'push',selection_reason:'Included within your selected 30-minute home session.'},{id:'squat-cool-down',group:'legs'}]}]};
 const before=JSON.stringify(plan),issues=savedFitIssues(plan);
 assert.deepEqual(issues.map(i=>i.reason),['setting','context','phase']);assert.equal(JSON.stringify(plan),before);
 const browser=vm.runInNewContext(savedFitReviewRuntime+';savedFitIssues');assert.equal(JSON.stringify(browser(plan)),JSON.stringify(issues));
});
test('legitimate requested/estimated distinction and a correctly placed cooldown are allowed',()=>{
 assert.deepEqual(savedFitIssues({location:'home',minutes_per_day:20,sessions:[{requested_minutes:20,estimated_minutes:22,exercises:[{id:'squat',group:'legs',selection_reason:'Included within your selected 20-minute home session.'},{id:'stretch-cool-down',group:'cool-down'}]}]}),[]);
});
test('served renderer stops before inconsistent exercises and still parses',()=>{
 new vm.Script(fitRuntime);
 const guard=fitRuntime.indexOf('if (savedFitIssues(plan).length)');
 assert(guard>0);assert(guard<fitRuntime.indexOf('output.innerHTML = `<div class="sf-week"'));
 assert.match(fitRuntime,/This saved session needs replacing/);
});
