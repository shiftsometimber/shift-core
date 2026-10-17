import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {candidate} from '../obesity-awareness/content.mjs';
import {renderContinuityDocument} from '../public-continuity.mjs';
import {amendSupportingDocument} from '../obesity-awareness/candidate.mjs';
import {nutritionSignposting,preserveNutritionSignposting,FOOD_NOISE_PATH,FOOD_NOISE_OPENING,FOOD_NOISE_PRACTICAL,NUTRITION_NOTE} from '../public-nutrition-mytimber.mjs';
const shell='<html><head><title>Shell</title></head><body><header>Retained</header><main></main><footer>Retained</footer></body></html>';
const addition='<p>Need an example to get started? <a href="/male-obesity">See our public meal and fallback examples</a>, then choose food that suits your needs and the facilities you have. You can make your note on paper; no account or purchase is needed.</p>';
test('only support addition changes; accepted hub and every other candidate field remain identical',()=>{
 const prior=execFileSync('git',['show','7da4c5406a59bcd929240bd72cb5c7a7b96c8b60:obesity-awareness/content.mjs'],{encoding:'utf8'});const original=JSON.parse(prior.slice(prior.indexOf('{'),prior.lastIndexOf('}')+1));
 assert.deepEqual({...candidate,supportAddition:original.supportAddition},original);
 assert.equal(candidate.supportAddition.replace(addition+'\n',''),original.supportAddition);
 const page=amendSupportingDocument('/weight-loss-support-for-men',renderContinuityDocument(shell,'/weight-loss-support-for-men'));
 assert.equal(page.split(addition).length-1,1);assert(page.indexOf('My meal is')<page.indexOf(addition));assert(page.indexOf(addition)<page.indexOf('If you want help finding a meal'));
 assert.equal(amendSupportingDocument('/weight-loss-support-for-men',page),page);
});
test('real food-noise document answers first, signposts once later and preserves every original byte',()=>{
 const before=renderContinuityDocument(shell,FOOD_NOISE_PATH),after=nutritionSignposting(before,FOOD_NOISE_PATH);
 assert(after.includes('</h1>'+FOOD_NOISE_OPENING));assert(after.includes(FOOD_NOISE_PRACTICAL+NUTRITION_NOTE));
 assert.equal(after.split(NUTRITION_NOTE).length-1,1);assert.equal(nutritionSignposting(after,FOOD_NOISE_PATH),after);
 assert.equal(preserveNutritionSignposting(FOOD_NOISE_PATH,Buffer.from(after)).toString(),before);
 for(const route of ['/','/about','/member/grub','/provider-switch'])assert.equal(nutritionSignposting(before,route),before);
});
test('missing or duplicated placement anchors fail rather than silently move the account prompt',()=>{
 const before=renderContinuityDocument(shell,FOOD_NOISE_PATH);
 for(const broken of [before.replace(FOOD_NOISE_PRACTICAL,''),before.replace(FOOD_NOISE_PRACTICAL,FOOD_NOISE_PRACTICAL+FOOD_NOISE_PRACTICAL),before.replace('</h1>',''),before.replace('</h1>','</h1><h1>Duplicate</h1>')])assert.throws(()=>nutritionSignposting(broken,FOOD_NOISE_PATH),/source_drift/);
});
