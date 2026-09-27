import test from 'node:test';
import assert from 'node:assert/strict';
import {buildJourneyObservation, journeyExport, journeySignals, repeatedTreatmentTiming, validateObservation} from '../my-journey-observation-v1.js';

const weeks = [
  {date:'2026-08-01',confirmed:true,weightKg:100,waistCm:110,clothesFit:'same',mealConsistency:2,movementMinutes:20,lifeBackWins:[]},
  {date:'2026-08-08',confirmed:true,weightKg:99.9,waistCm:109,clothesFit:'looser',mealConsistency:3,movementMinutes:30,lifeBackWins:['stairs']},
  {date:'2026-08-15',confirmed:true,weightKg:100.1,waistCm:108.5,clothesFit:'same',mealConsistency:3,movementMinutes:25,lifeBackWins:[]},
  {date:'2026-08-22',confirmed:true,weightKg:100,waistCm:108,clothesFit:'fits_again',mealConsistency:4,movementMinutes:35,lifeBackWins:['football']}
];

test('zero or one record stays silent; two or three compare without claiming a trend', () => {
  assert.equal(buildJourneyObservation(weeks.slice(0, 1)), null);
  const comparison = buildJourneyObservation(weeks.slice(0, 3));
  assert.equal(comparison.evidence.reading, 'comparison');
  assert.equal(comparison.evidence.enoughForTrend, false);
});

test('steady scale does not erase waist, clothes or Life Back progress', () => {
  const signals = journeySignals(weeks);
  assert.equal(signals.weightBroadlySteady, true);
  assert.equal(signals.nonScaleProgress, true);
  const result = buildJourneyObservation(weeks);
  assert.equal(result.evidence.reading, 'trend');
  assert.match(result.what_happened.join(' '), /Waist was down/);
  assert.match(result.what_happened.join(' '), /clothing milestone/);
  assert.match(result.next_move, /waist, clothes and Life Back/);
  assert.match(result.cannot_conclude.join(' '), /not cause/);
  assert.deepEqual(result.evidence.recordIds, weeks.map(row => `date:${row.date}`));
});

test('treatment timing requires three repeat cycles within a one-day range', () => {
  const symptomWeeks = [1,2,2].map((day, index) => ({date:`2026-07-${String(5 + index * 7).padStart(2,'0')}`,confirmed:true,symptoms:{nausea:{severity:2,daysAfterTreatment:day}}}));
  assert.equal(repeatedTreatmentTiming(symptomWeeks.slice(0, 2), 'nausea'), null);
  assert.equal(repeatedTreatmentTiming(symptomWeeks, 'nausea').cycles, 3);
  assert.equal(repeatedTreatmentTiming([...symptomWeeks.slice(0,2), {...symptomWeeks[2], symptoms:{nausea:{severity:2,daysAfterTreatment:5}}}], 'nausea'), null);
});

test('the five-part contract rejects clinical or causal verdict language', () => {
  assert.equal(validateObservation({what_happened:[],changed_alongside:[],might_have_contributed:['x'],cannot_conclude:['x'],next_move:'x'}), null);
  assert.throws(() => validateObservation({what_happened:['Treatment is working.'],changed_alongside:[],might_have_contributed:['Unknown.'],cannot_conclude:['Not proof.'],next_move:'Carry on.'}), /Unsafe/);
  assert.throws(() => validateObservation({what_happened:['Weight changed.'],changed_alongside:[],might_have_contributed:['It was caused by food.'],cannot_conclude:['Not proof.'],next_move:'Carry on.'}), /Unsafe/);
});

test('maintenance export uses a hold band and contains no analytics identity', () => {
  const output = journeyExport(weeks, {weeks:12,mode:'maintenance',holdBandKg:[98,102]});
  assert.deepEqual(output.holdBandKg,[98,102]);
  assert.equal(output.analyticsIdentifiers,false);
  assert.equal(output.private,true);
  assert.match(output.observation.next_move,/hold band/);
  assert.doesNotMatch(JSON.stringify(output),/left to lose/i);
});
