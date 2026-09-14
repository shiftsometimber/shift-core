import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {applySessionVisuals} from './session-visuals.mjs';
import {exercisePurpose} from './exercise-purpose.mjs';
import {FIT_CANONICAL_GUIDANCE} from '../../fit-canonical-guidance-v1.mjs';
const pack=JSON.parse(fs.readFileSync('preview/fit-grub/v3/approval.json'));
function helpers(){
 let source=applySessionVisuals(fs.readFileSync('frontend/member/member-fit-programme-v1.js','utf8'),pack);
 source=source.replace("if(document.readyState==='loading')",'globalThis.helpers={exercise,fallbackFitPlan,visual,exercisePurposeCopy,fitAsset};if(document.readyState===\'loading\')');
 const context={location:{pathname:'/member/fit',hash:''},document:{readyState:'loading',addEventListener(){}},console};vm.createContext(context);vm.runInContext(source,context);return context.helpers;
}
test('actual Easy walk card contains the approved image, purpose, source links and existing instructions',()=>{
 const h=helpers(),plan=h.fallbackFitPlan({minutes:10,location:'outside',limitations:'none',notes:''}),x=plan.sessions[0].exercises[0],html=h.exercise(x,false);
 assert.match(html,/<img[^>]+src="\/fit-v3-images\/walk.png"/);assert.match(html,/Why this option/);assert.match(html,/not a personalised workout/);assert.match(html,/Everyday activity and stamina/);assert.match(html,/nhs.uk/);
 assert.ok(html.indexOf('<h3>Easy walk')<html.indexOf('<img'));
 assert.ok(html.indexOf('<img')<html.indexOf('Show me how'));
 for(const s of x.how)assert.ok(html.includes(s));
});
test('all 2688 known variant IDs resolve without name/group guessing, including replacement-card rendering',()=>{
 const h=helpers();let images=0,holds=0;
 for(const r of pack.records)for(const v of r.variants){const html=h.exercise({id:v.id,name:v.name});if(r.status==='approved'){assert.ok(html.includes(r.image));images++;}else{assert.doesNotMatch(html,/<img/);holds++;}}
 assert.equal(images,2476);assert.equal(holds,212);
 assert.equal(h.visual({id:'unknown',name:'Walk',group:'walk',visual:{asset_ref:'stale.png'}}),'');
 assert.equal(h.visual({id:'wall-push-up',visual:{asset_ref:'stale.png'}}),'');
 const original={id:'fallback-easy-walk',name:'Easy walk'};const replacement={id:'sit-to-stand',name:'Sit to stand'};
 assert.match(h.exercise(original),/walk.png/);assert.match(h.exercise(replacement),/sit-to-stand.png/);assert.doesNotMatch(h.exercise(replacement),/walk.png/);
});
test('all 26 current programme movements explain their role; personalised selection reasons are never fabricated',()=>{
 const h=helpers();for(const id of Object.keys(FIT_CANONICAL_GUIDANCE)){assert.ok(exercisePurpose[id]);const html=h.exercise({id,name:id});assert.match(html,/How it supports your goals/);assert.doesNotMatch(html,/Why this option/);}
 const html=h.exercisePurposeCopy({id:'squat',selection_reason:'Planner supplied: fits available kit <script>'});assert.match(html,/Why this option/);assert.match(html,/&lt;script&gt;/);
 for(const id of ['short-range-curl-up','cross-body-crunch','reverse-crunch'])assert.match(h.exercisePurposeCopy({id}),/does not selectively remove belly fat/);
 assert.match(exercisePurpose['hamstring-mobility'].weightLoss,/rather than provide a large calorie burn/);
});
