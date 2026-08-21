import test from 'node:test';
import assert from 'node:assert/strict';
import {buildAdaptiveActions} from '../member-daily-v3.js';

test('always returns one balanced Eat, Move and Life Back action',()=>{
  const actions=buildAdaptiveActions({baseActions:[{domain:'grub',title:'Your planned lunch',detail:'12 mins'},{domain:'fit',title:'Walk',detail:'10 mins'}],setup:{values:{life_priority:'confidence'}},history:{}});
  assert.deepEqual(actions.map(x=>x.domain),['eat','move','life']);
  assert.equal(actions.length,3);
  assert.match(actions[2].title,/confidence/i);
  assert.ok(actions.every(x=>x.why.medical_advice===false));
});

test('explains how recent behaviour changed a suggestion',()=>{
  const actions=buildAdaptiveActions({setup:{values:{}},history:{skippedDomains:['move'],completedDomains:['eat']}});
  assert.match(actions.find(x=>x.domain==='move').why.learned,/skipped/i);
  assert.match(actions.find(x=>x.domain==='eat').why.learned,/completed/i);
});

test('does not expose more than the three daily domains when upstream is noisy',()=>{
  const actions=buildAdaptiveActions({baseActions:[{domain:'hydration',title:'Drink'},{domain:'progress',title:'Log weight'},{domain:'today',title:'Outside'},{domain:'grub',title:'Dinner'}]});
  assert.deepEqual(actions.map(x=>x.domain),['eat','move','life']);
});
