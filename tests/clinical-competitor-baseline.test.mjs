import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const pack=read('../clinical-assessment/questionnaire-v3.json'),baseline=read('../clinical-assessment/competitor-minimum-coverage.json');
const fields=new Map(pack.sections.flatMap(s=>s.questions).map(q=>[q.id,q]));
test('every recorded competitor clinical prompt exists and requires an answer',()=>{for(const row of baseline.questionCoverage){assert.ok(fields.has(row.field),row.field);assert.notEqual(fields.get(row.field).optional,true,row.field);}});
test('specific measurement and history details cannot disappear silently',()=>{assert.match(fields.get('kidney').label,/30 mL\/min/);assert.match(fields.get('bariatric').label,/balloon/);assert.match(fields.get('bariatricDetails').label,/12 months/);assert.match(fields.get('thyroidMen2').label,/first-degree/);});
test('incomplete declarations and capability-dependent consent prevent a complete-match claim',()=>{assert.equal(baseline.releaseAccepted,false);assert.ok(baseline.declarations.some(x=>x.topic==='NHS Summary Care Record access'&&x.status==='capability_dependent_not_claimed'));assert.ok(baseline.evidence.some(x=>x.kind==='prescription'&&x.detail));});

test('every declaration collection field exists; service-dependent exceptions are explicit',()=>{for(const id of baseline.declarationFields)assert.ok(fields.has(id),id);assert.equal(baseline.intentionalDifferences.length,2);});
