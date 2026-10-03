import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../frontend/member/whole-man-intent-os-v1.js',import.meta.url),'utf8');

test('My Health Plan is a navigator, not a product wall',()=>{
  for(const text of ['MY HEALTH PLAN','Your health, joined up. One useful thing at a time.','What matters now','Previously raised','Ask SHIFT to help me choose'])assert.ok(source.includes(text),text);
  assert.ok(source.includes('This plan is based on what you have explicitly told SHIFT, not a diagnosis.'));
  assert.ok(source.includes('NHS or your GP when that is the right door'));
});

test('members can park and restore concerns without deleting history',()=>{
  assert.ok(source.includes("healthPlanStatus:wholeMan.healthPlanStatus||wholeMan.health_plan_status||{}"));
  assert.ok(source.includes("state:'parked'"));
  assert.ok(source.includes("source:'health_plan'"));
  assert.ok(source.includes("health_plan_item_parked"));
  assert.ok(source.includes("health_plan_item_brought_forward"));
  assert.ok(source.includes("history=Array.isArray(wholeMan.intentSortHistory)?wholeMan.intentSortHistory.slice(-49):[]"));
});

test('Something changed reuses the saved coaching transition route',()=>{
  assert.ok(source.includes("document.querySelector('[data-coach-change-panel]')"));
  assert.ok(source.includes("health_plan_something_changed"));
  assert.ok(source.includes("location.href='/member/ask-timber.html'"));
});

test('human help stays available without pretending it is clinical chat',()=>{
  assert.ok(source.includes("document.querySelector('[data-coach-support]')"));
  assert.ok(source.includes("health_plan_help_choose"));
  assert.ok(source.includes("location.href='/contact?type=Support'"));
});

test('existing did-it-help loop is surfaced in the health plan',()=>{
  assert.ok(source.includes("document.addEventListener('sst:daily-feedback'"));
  for(const outcome of ['It helped','It did not fit','Not tried yet','Skipped for now'])assert.ok(source.includes(outcome));
  assert.ok(source.includes('Your next step should change rather than repeat the same approach.'));
});

test('regulated routes remain gated rather than inferred from symptoms',()=>{
  assert.ok(source.includes("if(card.gate==='pharmacy')return 'Regulated pharmacy route'"));
  assert.ok(source.includes("if(card.gate==='diagnostics')return 'Diagnostics — partner gated'"));
  assert.ok(source.includes("if(card.gate==='clinical')return 'Clinical route — partner gated'"));
  assert.ok(source.includes('do not jump straight to testosterone'));
});
