import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {patchAskModule,entryModule,routeOwner,metadataFor} from './release-helpers.mjs';
const fixture=body=>[
 'async function askTimberRoutes(request,env){',
 ' if(!allowedOrigin(request))return json56({error:"origin"},403,request);',
 ' const '+body+' = await request.json();',
 ' const message='+body+'.message,requestId="test",wantsJourney='+body+'.useJourney===true;',
 ' if(urgentResponse(message))return json56({mode:"safety"},200,request);',
 ' const reviewedDirect = directReviewedAnswer(message);',
 ' if (reviewedDirect && !wantsJourney) return json56({mode:"old"},200,request);',
 ' return {mode:"model"};',
 '}',
 'async function retrieveForParts(env,message,parts){',
 ' const items = [...reviewedFoodEvidence(message), ...foundationEvidence(message), ...site, ...reviewedSiteEvidence(message), ...merged].slice(0,12);',
 ' return items;',
 '}'
].join('\n');
test('bounded compiled Ask amendment preserves different body bindings, safety and history controls',async()=>{
 for(const body of ['body','body2']){
  const patch=patchAskModule(fixture(body),'canonical-worker.js');assert(patch.patched);
  const context={allowedOrigin:r=>r.allowed!==false,urgentResponse:q=>q==='urgent',directReviewedAnswer:()=>null,json56:(data,status)=>({...data,status}),__shiftHealthAnswer:q=>q==='known'?{answer:'checked'}:null};
  vm.runInNewContext(patch.code.replace(/^import[^\n]+\n/,''),context);
  const req=data=>({json:async()=>data});
  assert.equal((await context.askTimberRoutes(req({message:'known'}),{})).answer,'checked');
  assert.equal((await context.askTimberRoutes(req({message:'known',history:[{}]}),{})).mode,'model');
  assert.equal((await context.askTimberRoutes(req({message:'known',useJourney:true}),{})).mode,'model');
  assert.equal((await context.askTimberRoutes(req({message:'urgent'}),{})).mode,'safety');
  const hostile=req({message:'known'});hostile.allowed=false;assert.equal((await context.askTimberRoutes(hostile,{})).status,403);
 }
});
test('unknown and ambiguous Ask adapters fail closed before a provider upload',()=>{
 assert.equal(patchAskModule('export default {};','wrapper.mjs').patched,false);
 assert.throws(()=>patchAskModule(fixture('body')+fixture('body'),'worker.js'));
 assert.throws(()=>patchAskModule(fixture('body').replace('allowedOrigin(request)','anything(request)'),'worker.js'));
 assert.throws(()=>patchAskModule(fixture('body').replace('directReviewedAnswer(message)','otherAnswer(message)'),'worker.js'));
});
test('serving owner selection handles scheme-specific and more specific path rules',()=>{
 const routes=[{pattern:'shiftsometimber.co.uk/*',script:'core'},{pattern:'shiftsometimber.co.uk/shift-health*',script:'health'},{pattern:'https://shiftsometimber.co.uk/shift-health/blood-tests*',script:'heroes'}];
 assert.equal(routeOwner(routes,'https://shiftsometimber.co.uk/guides/iron').script,'core');
 assert.equal(routeOwner(routes,'https://shiftsometimber.co.uk/shift-health/fertility').script,'health');
 assert.equal(routeOwner(routes,'https://shiftsometimber.co.uk/shift-health/blood-tests/one').script,'heroes');
});
test('new entry retains every named export and provider configuration without exposing secrets',()=>{
 const entry=entryModule('nested/current.mjs');assert(entry.includes('export * from "./nested/current.mjs"'));assert(entry.includes('withHealthKnowledgeWorker(original)'));
 const settings={compatibility_date:'2026-08-09',bindings:[{name:'KEY',type:'secret_text'},{name:'DB',type:'d1',id:'existing'}],observability:{enabled:true},assets:{existing:true}};
 const metadata=metadataFor({},settings,'knowledge-health-entry.mjs','source');
 assert.deepEqual(metadata.bindings,[{name:'KEY',type:'inherit',version_id:'latest'},{name:'DB',type:'d1',id:'existing'}]);assert.equal(metadata.keep_assets,true);assert.deepEqual(metadata.observability,settings.observability);
});
