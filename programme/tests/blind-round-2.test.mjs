import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {evaluate,shopping,previewChange,RULE_VERSION} from '../engine.mjs';
import {mutate} from '../service.mjs';
const root=new URL('./blind-round-2/',import.meta.url),raw=readFileSync(new URL('histories.json',root));
const cases=JSON.parse(raw),locked=JSON.parse(readFileSync(new URL('expected-before-run.json',root)));
const catalogue=JSON.parse(readFileSync(new URL('catalogue.json',root)));
assert.equal(createHash('sha256').update(raw).digest('hex'),locked.inputSHA256);
const results=[],options={fixtureMode:true};
// Independent arithmetic oracle from the author's actual catalogue and occurrences.
// It counts cooks, never a second ingredient allocation for a reserved serving.
function oracle(s,start,end){const out={};for(const x of s.slots){if(x.kind!=='meal'||x.date<start||x.date>end)continue;const r=catalogue[x.recipeId];for(const i of r.ingredients){const k=i.id+'|'+i.unit;out[k]=(out[k]||0)+i.quantity*x.servings/r.serves;}}return Object.fromEntries(Object.entries(out).sort());}
function quantities(list){return Object.fromEntries(list.items.filter(i=>i.quantity>0).map(i=>[i.key,i.quantity]).sort());}
const selected=process.env.SHIFT_BLIND_FIRST_SIX==='1'?cases.slice(0,6):cases;
for(const c of selected)test(`Round 2 ${c.id}: full authored slots, reports and catalogue`,()=>{
 const s=structuredClone(c.state),before=structuredClone(s),r=evaluate(s,options),want=locked.expected[c.id];
 assert.deepEqual(r.proposals.map(p=>p.slotKey),want.proposals);
 assert.deepEqual(r.conditions.map(x=>x.slotId),want.conditions);
 assert.equal(r.kind,want.kind);assert.deepEqual(s,before);
 for(const key of want.singleMiss)assert(r.suppressed.some(x=>x.rule==='R3'&&x.slotKey===key));
 assert(!r.proposals.some(p=>p.priority===2)); // These blind inputs contain no two-miss recurrence.
 assert.doesNotMatch(r.summary,/optional logging|logging gap|isn't your shift/i);
 const lists=[['2026-09-14','2026-09-20'],['2026-09-21','2026-09-27']].map(([start,end])=>{
  const list=shopping(s,start,end);assert.deepEqual(quantities(list),oracle(s,start,end));
  for(const item of list.items)assert.equal(item.remaining,Math.max(0,item.quantity-(s.acquired[start+'..'+end]?.[item.key]?.quantity||0)));
  return list;
 });
 let followup={kind:'No automatic change',reason:'A preferred recipe in the fictional follow-up is not a structured accepted change.'};
 if(c.id==='case-08'){
  // The author explicitly supplies the exact date and new headcount. Confirm it
  // through the existing manual-edit action, not an inferred recipe substitution.
  const edited=mutate(s,{type:'edit-slot',slotId:'2026-09-25:fri-dinner',recipeId:'wraps',servings:3},options);
  assert.deepEqual(edited.slots.filter(x=>x.id!=='2026-09-25:fri-dinner'),s.slots.filter(x=>x.id!=='2026-09-25:fri-dinner'));
  const nextList=shopping(edited,'2026-09-21','2026-09-27');assert.deepEqual(quantities(nextList),oracle(edited,'2026-09-21','2026-09-27'));
  assert.equal(nextList.items.find(i=>i.id==='chicken').quantity,225);
  assert.equal(edited.slots.find(x=>x.id==='2026-09-25:fri-dinner').serveNow,3);
  assert.equal(shopping(edited,'2026-09-14','2026-09-20').items.find(i=>i.id==='chicken').acquired,300);
  followup={kind:'Explicit single-date manual portion change',date:'2026-09-25',beforeChicken:450,afterChicken:225,firstWeekBought:300};
 }
 results.push({id:c.id,result:'PASS',output:{...r,inputSnapshot:undefined},lists,followup});
 writeFileSync(new URL(`../evidence/blind-round-2-${selected.length===6?'first-six':'complete'}.json`,import.meta.url),JSON.stringify({inputSHA256:locked.inputSHA256,expectationsSHA256:createHash('sha256').update(readFileSync(new URL('expected-before-run.json',root))).digest('hex'),ruleVersion:RULE_VERSION,method:locked.method,results},null,2)+'\n');
});
test('Targeted extension of an authored plan: two explicit misses allow a previewed swap, preserving successful slots and reserved portions',()=>{
 // Deliberately NOT blind: a reviewer changes one report in case 03 to supply
 // the second explicit miss missing from the independent sample.
 let s=structuredClone(cases[2].state);const report=s.reports.find(x=>x.slotKey==='thu-dinner'&&x.period==='2026-08-31');
 report.status='missed';report.fit='unknown';report.reason='The planned cook did not happen';report.note='Targeted counterfactual, not part of the authored history.';
 const before=structuredClone(s);s=mutate(s,{type:'review'},options);s.revision++;
 assert.deepEqual(s.review.proposals.map(p=>[p.slotKey,p.priority]),[['thu-dinner',2]]);
 const p=s.review.proposals[0];assert(p.options.some(o=>o.recipeId==='tuna'));
 const preview=previewChange(s,s.review,p.id,'tuna',options);assert.deepEqual(s.slots,before.slots);
 assert.equal(preview.dependentLeftovers.length,2);
 const after=mutate(s,{type:'accept',proposalId:p.id,recipeId:'tuna'},options);
 assert.deepEqual(after.slots.filter(x=>!p.targetIds.includes(x.id)),before.slots.filter(x=>!p.targetIds.includes(x.id)));
 assert.deepEqual(after.acquired,before.acquired);assert.deepEqual(after.manualItems,before.manualItems);
 for(const [start,end] of [['2026-09-14','2026-09-20'],['2026-09-21','2026-09-27']])assert.deepEqual(quantities(shopping(after,start,end)),oracle(after,start,end));
 const week=shopping(after,'2026-09-14','2026-09-20');assert.equal(week.items.find(i=>i.id==='tuna').quantity,330);assert(!week.items.some(i=>i.id==='mince'&&i.quantity>0));
 writeFileSync(new URL('../evidence/targeted-authored-plan-swap.json',import.meta.url),JSON.stringify({method:'Targeted one-report counterfactual of blind case 03; not a blind result.',originalInputSHA256:locked.inputSHA256,ruleVersion:RULE_VERSION,review:s.review,preview,afterLists:[week,shopping(after,'2026-09-21','2026-09-27')],result:'PASS'},null,2)+'\n');
});
