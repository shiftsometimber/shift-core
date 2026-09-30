import test from 'node:test';
import assert from 'node:assert/strict';
import {firstWeekView} from './first-week.mjs';
const connected={date:'2026-09-29'};
test('new member gets an immediate meal action without claiming completion',()=>{const v=firstWeekView({connected});assert.equal(v.state,'start');assert.equal(v.target,'meal');assert.match(v.detail,/before filling in/)});
test('choice is distinguished from eating and survives reconstructing the view',()=>{const input={connected,workspace:{today:{date:connected.date,recipeId:'real-recipe'}}};const a=firstWeekView(input);assert.equal(a.state,'chosen');assert.match(a.detail,/does not log it as eaten/);assert.deepEqual(firstWeekView(JSON.parse(JSON.stringify(input))),a)});
test('past choice welcomes member back without calling it today’s meal or resetting them',()=>{const v=firstWeekView({connected,workspace:{today:{date:'2026-09-20',recipeId:'real-recipe'}}});assert.equal(v.state,'returning');assert.equal(v.target,'meal');assert.match(v.intro,/No need to start again/)});
test('a genuine saved step offers review; missing feedback never invents it',()=>{assert.equal(firstWeekView({connected,feedback:{id:'saved',active:true}}).target,'feedback');assert.notEqual(firstWeekView({connected,feedback:{active:false}}).target,'feedback');for(const outcome of ['helped','not-fit','not-tried','skip'])assert.equal(firstWeekView({connected,feedback:{feedback:outcome}}).target,'next')});
