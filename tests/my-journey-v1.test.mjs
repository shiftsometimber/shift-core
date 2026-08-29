import test from 'node:test';
import assert from 'node:assert/strict';
import {myJourneyInternals} from '../my-journey-v1.js';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../my-journey-v1.js',import.meta.url),'utf8');

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

test('blank setup cannot be promoted to complete',()=>{
  const journey=myJourneyInternals.normalise({setup:{complete:true}});
  assert.equal(journey.setup.complete,false);
});

test('loss and maintenance setup require a real direction',()=>{
  const base={startDate:'2026-01-01',route:'lifestyle',units:'stone_lb'};
  const weights={startKg:120,currentKg:95};
  assert.equal(myJourneyInternals.normalise({setup:{...base,targetMode:'loss'},weight:weights}).setup.complete,false);
  assert.equal(myJourneyInternals.normalise({setup:{...base,targetMode:'loss'},weight:{...weights,targetKg:85}}).setup.complete,true);
  assert.equal(myJourneyInternals.normalise({setup:{...base,targetMode:'maintenance'},weight:{...weights,maintenanceLowKg:93,maintenanceHighKg:97}}).setup.complete,true);
});

test('review preferences and pause state survive normalisation',()=>{
  const journey=myJourneyInternals.normalise({setup:{focus:'energy',reviewCadence:'fortnightly',reviewDay:6,paused:true}});
  assert.equal(journey.setup.focus,'energy');
  assert.equal(journey.setup.reviewCadence,'fortnightly');
  assert.equal(journey.setup.reviewDay,6);
  assert.equal(journey.setup.paused,true);
});

test('legacy complete flag is repaired on read migration',()=>{
  const journey=myJourneyInternals.migrate({myJourney:{setup:{complete:true,targetMode:'loss'},weight:{}}});
  assert.equal(journey.setup.complete,false);
});

test('an inverted maintenance hold band cannot complete setup',()=>{
  const journey=myJourneyInternals.normalise({setup:{startDate:'2026-01-01',targetMode:'maintenance'},weight:{startKg:100,currentKg:95,maintenanceLowKg:98,maintenanceHighKg:92}});
  assert.equal(journey.setup.complete,false);
});

test('Journey deletion is atomic, hard-deletes Journey photos and tolerates lazy tables',()=>{
  assert.match(source,/env\.DB\.batch\(statements\)/);
  assert.match(source,/SELECT name FROM sqlite_master/);
  assert.match(source,/DELETE FROM shift_progress_photos_v2 WHERE user_id=\?/);
  assert.doesNotMatch(source,/UPDATE shift_progress_photos_v2 SET deleted_at/);
});
