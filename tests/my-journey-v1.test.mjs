import test from 'node:test';
import assert from 'node:assert/strict';
import {myJourneyInternals} from '../my-journey-v1.js';

test('legacy Life Back is retained inside My Journey',()=>{
  const journey=myJourneyInternals.migrate({lifeBack:{monthlyWin:'Old jeans fit again',entries:[{date:'2026-08-01'}]}});
  assert.equal(journey.lifeBack.monthlyWin,'Old jeans fit again');
  assert.equal(journey.lifeBack.entries.length,1);
});

test('journey input is bounded and clothing evidence is retained',()=>{
  const journey=myJourneyInternals.normalise({setup:{heightCm:178,route:'injection',units:'stone_lb',complete:true},weight:{startKg:120,currentKg:95,targetKg:85},waist:{startCm:120,currentCm:101},clothes:{startTop:'XXL',currentTop:'L',startTrouserWaist:'42',currentTrouserWaist:'36'},wellbeing:{baseline:30,latest:75},lifeBack:{observed:['sleep improved'],intended:['play football']}});
  assert.equal(journey.weight.currentKg,95);
  assert.equal(journey.clothes.currentTop,'L');
  assert.deepEqual(journey.lifeBack.observed,['sleep improved']);
  assert.deepEqual(journey.lifeBack.intended,['play football']);
});

test('invalid clinical and measurement values fail closed to null',()=>{
  const journey=myJourneyInternals.normalise({setup:{heightCm:999,route:'unknown'},weight:{currentKg:-1},wellbeing:{latest:200}});
  assert.equal(journey.setup.heightCm,null);
  assert.equal(journey.weight.currentKg,null);
  assert.equal(journey.wellbeing.latest,null);
  assert.equal(journey.setup.route,'lifestyle');
});
