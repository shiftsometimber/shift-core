import test from 'node:test';
import assert from 'node:assert/strict';
import {applyRebuildAlternative,rebuildDay,myTimberAlternativeKeys,myTimberRebuildModes} from '../my-timber-rebuild-v1.js';

test('working late changes food movement and hydration with one dominant next action',()=>{
  const day=rebuildDay('working_late',{savedMeal:{label:'Chicken balti',minutes:35},savedMove:{label:'20-minute session',minutes:20}});
  assert.equal(day.now.action,'Grab a drink');assert.equal(day.next.domain,'food');assert.equal(day.later.domain,'movement');
  assert.ok(day.removed.includes('Long workout'));assert.match(day.reason,/working late/i);
});
test('rejected meal is not immediately recommended again',()=>assert.notEqual(rebuildDay('working_late',{rejectedMealKeys:['eggs-toast']}).next.action,'Eggs on toast'));
test('rough modes include a governed clinical boundary',()=>{
  const day=rebuildDay('guts_playing_up');assert.equal(day.safety.clinicalBoundary,true);assert.ok(day.safety.urgentIf.length>=3);
});
test('chaos mode returns exactly Now Next Later and removes low-value work',()=>{
  const day=rebuildDay('chaos');assert.ok(day.now&&day.next&&day.later);assert.deepEqual(day.removed,['Everything that can wait']);
});
test('mode list covers the agreed situations including signature takeaway mode',()=>{assert.equal(myTimberRebuildModes.length,11);assert.ok(myTimberRebuildModes.includes('takeaway'))});
test('alternative updates food movement hydration and why together',()=>{
  const original=rebuildDay('working_late'),changed=applyRebuildAlternative(original,'family_friendly');
  assert.equal(changed.next.action,'Chicken fajita tray');assert.equal(changed.later.action,'Ten-minute family walk');assert.equal(changed.now.action,'Drinks on the table');assert.match(changed.reason,/recalculated together/);
});
test('all six agreed alternatives are available and invalid keys are rejected',()=>{assert.deepEqual(myTimberAlternativeKeys,['quickest','cheapest','highest_protein','family_friendly','fakeaway','takeaway']);assert.equal(applyRebuildAlternative(rebuildDay('chaos'),'nonsense'),null)});
test('a genuine not-again preference changes the next rebuilt food action',()=>{
  const first=rebuildDay('working_late'),learned=rebuildDay('working_late',{rejectedActions:[first.next.action]});
  assert.notEqual(learned.next.action,first.next.action);assert.match(learned.learningStatement,/previously ruled out/i);
});
