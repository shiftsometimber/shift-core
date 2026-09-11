import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {emptyState} from '../service.mjs';
import {evaluate,dateAdd} from '../engine.mjs';
const input=readFileSync(new URL('independent-histories.json',import.meta.url));
const cases=JSON.parse(input),expected=JSON.parse(readFileSync(new URL('independent-expected.json',import.meta.url)));
assert.equal(createHash('sha256').update(input).digest('hex'),expected.input_sha256);
const results=[];
for(const c of cases)test(`${c.id}: independently written history remains factual and conservative`,()=>{
 const last=c.weeks.at(-1).start,s=emptyState(dateAdd(last,6));s.name=c.person.name;s.goal=c.person.goal;s.preferences={...c.constraints,equipment:[]};s.setup=true;s.entitlement.active=true;s.cycle=c.weeks.length;
 for(const w of c.weeks)for(const r of w.reports){const offset={mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6}[r.slotKey.split('-')[0]];s.reports.push({...r,date:dateAdd(w.start,offset),period:w.start,shift:w.shift,kind:r.slotKey.endsWith('dinner')?'meal':'move'})}
 for(const start of [last,dateAdd(last,7),dateAdd(last,14)])for(const key of ['mon-dinner','thu-dinner','sun-dinner','tue-walk','thu-walk','sat-walk']){const offset={mon:0,tue:1,thu:3,sat:5,sun:6}[key.split('-')[0]],date=dateAdd(start,offset);s.slots.push({id:date+':'+key,slotKey:key,date,kind:key.endsWith('dinner')?'meal':'move',recipeId:'beanSalad',servings:4,label:'Member-chosen activity',minutes:10})}
 s.requests=c.memberRequests.map(r=>({...r,date:s.clock}));
 const r=evaluate(s,{fixtureMode:true});assert.deepEqual(r.proposals.map(p=>p.slotKey),expected.expected[c.id]);assert.notEqual(r.kind,'same-again');assert(r.proposals.every(p=>p.priority===0&&p.options.length===0));assert.doesNotMatch(r.summary,/log|miss|fail|zero/i);
 results.push({id:c.id,result:'PASS',inputHash:expected.input_sha256,output:r});
 writeFileSync(new URL('../evidence/independent-results.json',import.meta.url),JSON.stringify({method:expected.method,results},null,2));
});
