import assert from 'node:assert/strict';import fs from 'node:fs';
import {fitEntryNavigation} from '../../member-experience/fit-entry-navigation.mjs';
import {fitEntryPreimage} from './fit-entry-preimage.mjs';
const candidate=fitEntryNavigation(fitEntryPreimage);
function renderer(source){const begin=source.indexOf('  function render(result'),end=source.indexOf('  const allowedLimitations',begin);assert(begin>0&&end>begin);const calls=[],session={scrollIntoView:options=>calls.push({target:'session',options})},effort={scrollIntoView:options=>calls.push({target:'effort',options})},output={innerHTML:'',querySelectorAll:()=>[],querySelector:s=>s==='.sf-session'?session:effort};const render=Function('$','savedFitIssues','sessionCard','applyJourney','refreshSessionCue','document',source.slice(begin,end)+';return render;')(()=>output,()=>[],()=>'<section/>',()=>{},()=>{},{getElementById:()=>null});return {render,calls};}
const plan={sessions:[{estimated_minutes:5}],minutes_per_day:5};const original=renderer(fitEntryPreimage);original.render(plan);assert.equal(original.calls[0].target,'effort');
const fixed=renderer(candidate);fixed.render(plan);assert.equal(fixed.calls.length,0);fixed.render(plan,true);assert.equal(fixed.calls.length,1);assert.equal(fixed.calls[0].target,'session');fixed.render(plan);assert.equal(fixed.calls.length,1);
assert(candidate.includes('if(response.plan?.sessions?.length)render(response.plan);'));assert(candidate.includes('      render(result, true);'));
assert.equal(fitEntryPreimage.slice(fitEntryPreimage.indexOf('  const allowedLimitations')).replace('      render(result);','      render(result, true);'),candidate.slice(candidate.indexOf('  const allowedLimitations')));
assert.throws(()=>fitEntryNavigation('future source without the expected hooks'));
console.log(JSON.stringify({passed:true,originalBugReproduced:true,restoredPlanDoesNotScroll:true,deliberateBuildRevealsSession:true,laterRefreshDoesNotScroll:true,otherHandlersUnchanged:true,unknownSourceRejected:true,scope:'Actual renderer and synthetic DOM, no member writes'}));
