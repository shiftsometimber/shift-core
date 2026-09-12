import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from '../test-support/fixtures.mjs';
import {evaluate,shopping,previewChange} from '../engine.mjs';
import {mutate,publicState} from '../service.mjs';
const options={fixtureMode:true};
function crowded(){
 const s=fixture('Gaz');s.preferences.allergies=['fish'];
 for(const slot of s.slots)if(slot.slotKey==='thu-dinner'&&slot.date>s.clock)slot.recipeId='tuna';
 s.requests=['mon-dinner','sun-dinner','sat-walk'].map(slotKey=>({slotKey,date:s.clock,reason:'Please revisit this saved item'}));
 return s;
}
test('Three member requests cannot cap out a saved meal that conflicts with a declared exclusion',()=>{
 const s=crowded(),before=structuredClone(s),r=evaluate(s,options);
 assert.equal(r.proposals.length,3);
 assert.equal(r.conditions?.filter(c=>c.slotKey==='thu-dinner').length,2);
 assert(r.conditions.every(c=>c.reasons.some(r=>r.code==='excluded-allergen')));
 assert(!r.proposals.some(p=>p.slotKey==='thu-dinner'));
 assert(!r.suppressed.some(p=>p.slotKey==='thu-dinner'&&p.rule==='R10'));
 assert.deepEqual(s,before);
});
test('A decline freeze cannot conceal a current constraint condition or change the saved meal',()=>{
 const s=crowded();s.freezes['thu-dinner']={throughCycle:99,evidenceAt:s.clock};
 const r=evaluate(s,options);
 assert.equal(r.conditions?.filter(c=>c.slotKey==='thu-dinner').length,2);
 assert.equal(s.slots.find(x=>x.id==='2026-09-17:thu-dinner').recipeId,'tuna');
});
test('Conditions are fresh on every read, even before a new review or after skipping it',()=>{
 let s=fixture('Gaz');s=mutate(s,{type:'review'},options);s.revision++;
 for(const slot of s.slots)if(slot.slotKey==='thu-dinner'&&slot.date>s.clock)slot.recipeId='tuna';
 s=mutate(s,{type:'preferences',preferences:{...s.preferences,allergies:['fish']}},options);
 assert.equal(publicState(s,options).conditions?.length,2);
 s=mutate(s,{type:'skip'},options);
 assert.equal(publicState(s,options).conditions?.length,2);
 assert.equal(evaluate(s,options).kind,'requires-review');
});
test('Same again cannot propagate a conflicting meal, including when the last saved plan is entirely in the past',()=>{
 const s=crowded();assert.throws(()=>mutate(s,{type:'repeat'},options),/check|restriction|review/i);
 s.slots=s.slots.filter(x=>x.date<=s.clock);
 for(const x of s.slots)if(x.slotKey==='thu-dinner')x.recipeId='tuna';
 assert.throws(()=>mutate(s,{type:'repeat'},options),/check|restriction|review/i);
});
test('Every conflicting occurrence is reported, even with more than three conflicts or different recipes in the same slot',()=>{
 const s=crowded();for(const x of s.slots)if(x.kind==='meal'&&x.date>s.clock)x.recipeId='tuna';
 const r=evaluate(s,options);assert.equal(r.conditions.length,8); // Six cooking occurrences plus their two reserved-leftover occurrences.assert.equal(r.proposals.length,3);
 s.slots.find(x=>x.id==='2026-09-17:thu-dinner').recipeId='ragu';
 assert(evaluate(s,options).conditions.some(c=>c.slotId==='2026-09-24:thu-dinner'));
 assert(!evaluate(s,options).conditions.some(c=>c.slotId==='2026-09-17:thu-dinner'));
});
test('A future leftover also carries its source recipe conflict even when the cooking date is past',()=>{
 const s=crowded();s.slots.push({id:'2026-09-12:sat-dinner',slotKey:'sat-dinner',date:'2026-09-12',kind:'meal',recipeId:'tuna',recipeVersion:1,servings:8,serveNow:4});
 s.slots.push({id:'2026-09-14:mon-leftovers',slotKey:'mon-leftovers',date:'2026-09-14',kind:'leftovers',sourceId:'2026-09-12:sat-dinner',servings:4});
 const c=publicState(s,options).conditions.find(c=>c.slotKey==='mon-leftovers');
 assert.equal(c.sourceId,'2026-09-12:sat-dinner');assert(c.reasons.some(r=>r.code==='excluded-allergen'));
});
test('Unknown preferences and unreviewed production content remain unresolved conditions, not invented allergy claims',()=>{
 const s=fixture('Gaz');s.preferences.allergies='unknown';
 const r=evaluate(s);assert(r.conditions.length>3);assert(r.conditions.every(c=>c.reasons.some(r=>r.code==='content-unreviewed')));
 assert(!r.conditions.some(c=>c.reasons.some(r=>r.code==='excluded-allergen')));
 assert.equal(publicState(s).catalogue.length,0);assert.throws(()=>mutate(s,{type:'repeat'}),/review|check/i);
});
test('An explicit compatible manual edit resolves only its occurrence and keeps bought amounts and frozen decisions',()=>{
 let s=crowded();s.entitlement.active=false;s.freezes['thu-dinner']={throughCycle:99,evidenceAt:s.clock};
 const frozen=structuredClone(s.freezes),past=structuredClone(s.slots.filter(x=>x.date<=s.clock));
 s=mutate(s,{type:'edit-slot',slotId:'2026-09-17:thu-dinner',recipeId:'beanSalad',servings:4},options);
 assert.deepEqual(publicState(s,options).conditions.map(c=>c.slotId),['2026-09-24:thu-dinner']);
 assert.deepEqual(s.freezes,frozen);assert.deepEqual(s.slots.filter(x=>x.date<=s.clock),past);
 assert.equal(shopping(s,'2026-09-14','2026-09-20').items.find(i=>i.id==='tuna'),undefined);
 assert.equal(shopping(s,'2026-09-14','2026-09-20').items.find(i=>i.id==='mince').acquired,1000);
 s=mutate(s,{type:'edit-slot',slotId:'2026-09-24:thu-dinner',recipeId:'beanSalad',servings:4},options);
 assert.equal(publicState(s,options).conditions.length,0);
});
test('Previously generated meal options are rechecked against current restrictions before preview or acceptance',()=>{
 let s=fixture();s=mutate(s,{type:'review'},options);s.revision++;
 const p=s.review.proposals[0];s.preferences.allergies=['fish'];
 assert.throws(()=>previewChange(s,s.review,p.id,'tuna',options),/preferences|review/i);
 assert.throws(()=>mutate(s,{type:'accept',proposalId:p.id,recipeId:'tuna'},options),/preferences|review/i);
});
