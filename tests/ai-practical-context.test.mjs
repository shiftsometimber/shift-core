import test from 'node:test';
import assert from 'node:assert/strict';
import {compactJourney,contextPilotEnabled} from '../member-experience/ai-practical-context.mjs';
test('pilot cannot activate through truthy values or absent configuration',()=>{
 for(const value of [undefined,false,true,'false','1',1])assert.equal(contextPilotEnabled({SHIFT_AI_PRACTICAL_CONTEXT:value}),false);
 assert.equal(contextPilotEnabled({SHIFT_AI_PRACTICAL_CONTEXT:'true'}),true);
});
test('compact context bounds repetition without losing exclusions, feedback, dates or dislikes',()=>{
 const input={status:'available',date:'2026-09-26',weeklyCheckIns:Array.from({length:8},(_,i)=>({week_ending:String(8-i)})),grub:{options:{exclude:'nuts'},dislikedRecipeIds:['avoid'],likedRecipeIds:Array(30).fill('liked')},lifeBack:{dailyAverages:Array.from({length:30},(_,i)=>({day:i})),comparison:{change:3},latest:{at:'2026-09-20'}},next:{title:'Choose a smaller step',detail:'That step did not fit.'}};
 const before=JSON.stringify(input),out=compactJourney(input);
 assert.equal(out.weeklyCheckIns.length,4);assert.equal(out.weeklyCheckIns[0].week_ending,'8');
 assert.equal(out.lifeBack.dailyAverages.length,7);assert.equal(out.lifeBack.dailyAverages[0].day,23);
 assert.equal(out.grub.options.exclude,'nuts');assert.deepEqual(out.grub.dislikedRecipeIds,['avoid']);
 assert.deepEqual(out.next,input.next);assert.deepEqual(out.lifeBack.latest,input.lifeBack.latest);
 assert.equal(JSON.stringify(input),before);assert.equal(out.contextWindow.historyMayBeOmitted,true);
 assert(JSON.stringify(out).length<before.length);
});
test('unavailable context cannot carry stale private data',()=>{
 assert.deepEqual(compactJourney({status:'tracking_off',grub:{secret:'old'}}),{status:'tracking_off'});
});
