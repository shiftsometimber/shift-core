import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fixture} from '../test-support/fixtures.mjs';
import {sqliteAdapter} from '../test-support/db.mjs';
import {SCHEMA,ProgrammeStore} from '../store.mjs';
import {evaluate,shopping} from '../engine.mjs';
import {mutate} from '../service.mjs';
import {RECIPES,suitable} from '../content.mjs';
import {programmeRoutes} from '../routes.mjs';
import {authenticateMember} from '../../member-state-fast-v1.js';
const options={fixtureMode:true};
function mixedHistory(){
 const s=fixture('Gaz');s.preferences.allergies=['fish'];
 for(const slot of s.slots)if(slot.slotKey==='thu-dinner'&&slot.date>s.clock)slot.recipeId='tuna';
 for(const report of s.reports)if(['tue-walk','thu-walk','sat-walk'].includes(report.slotKey)){report.status='missed';report.fit='unknown';report.reason='No time';}
 s.requests=[{slotKey:'sun-dinner',date:'2026-09-13',reason:'I want a different Sunday meal'}];
 return s;
}
test('R10 collision: constraints stay outside the cap while member request and recurring difficulties compete',()=>{
 const s=mixedHistory(),before=structuredClone(s),r=evaluate(s,options);
 assert.deepEqual(r.proposals.map(p=>[p.slotKey,p.priority]),[['sun-dinner',0],['sat-walk',2],['thu-walk',2]]);
 assert.deepEqual(r.suppressed.filter(p=>p.rule==='R10').map(p=>p.slotKey),['tue-walk']);
 assert.equal(r.conditions.filter(c=>c.slotKey==='thu-dinner').length,2);
 assert.deepEqual(s,before);
 const reversed=structuredClone(s);reversed.slots.reverse();reversed.reports.reverse();
 assert.deepEqual(evaluate(reversed,options).proposals.map(p=>p.slotKey),r.proposals.map(p=>p.slotKey));
});
test('R8 gates the collision before R10; even the highest-ranked item stays frozen',()=>{
 const s=mixedHistory();s.freezes['sun-dinner']={throughCycle:s.cycle+1,evidenceAt:'2026-09-12'};
 const r=evaluate(s,options);assert.deepEqual(r.proposals.map(p=>p.slotKey),['sat-walk','thu-walk','tue-walk']);
 assert(r.suppressed.some(p=>p.rule==='R8'&&p.slotKey==='sun-dinner'));
});
test('An old member request cannot resurrect after its decline freeze; a genuinely later request can',()=>{
 let s=fixture('Gaz');s.requests=[{slotKey:'sun-dinner',date:s.clock,reason:'Change Sunday'}];s=mutate(s,{type:'review'},options);s.revision++;
 s=mutate(s,{type:'decline',proposalId:s.review.proposals[0].id},options);s.cycle+=2;s.clock='2026-09-27';s=mutate(s,{type:'repeat'},options);
 assert.equal(evaluate(s,options).proposals.length,0);
 s.clock='2026-09-28';s.requests.push({slotKey:'sun-dinner',date:s.clock,reason:'I want to revisit Sunday'});
 assert.equal(evaluate(s,options).proposals[0].evidenceAt,'2026-09-28');
});
test('Post-swap quantity increase preserves 1000g bought and asks for only 500g more',()=>{
 let s=fixture();s=mutate(s,{type:'review'},options);s.revision++;
 s=mutate(s,{type:'accept',proposalId:s.review.proposals[0].id,recipeId:'tuna'},options);
 assert.equal(shopping(s,'2026-09-14','2026-09-20').items.find(i=>i.id==='mince').quantity,1000);
 s=mutate(s,{type:'edit-slot',slotId:'2026-09-14:mon-dinner',recipeId:'chilli',servings:12},options);
 const i=shopping(s,'2026-09-14','2026-09-20').items.find(i=>i.id==='mince');assert.deepEqual([i.quantity,i.acquired,i.remaining],[1500,1000,500]);
});
test('An approved label alone is insufficient without a named reviewer, date and matching recipe version',()=>{
 const recipe={...RECIPES.tuna,reviewStatus:'approved'};
 assert.equal(suitable(recipe,fixture().preferences),false);
 const reviewed={...recipe,reviewDate:'2026-09-11',reviewerId:'fictional-reviewer-for-gate-test',reviewedVersion:recipe.version};
 assert.equal(suitable(reviewed,fixture().preferences),true);
 assert.equal(suitable({...reviewed,reviewedVersion:recipe.version+1},fixture().preferences),false);
 assert.equal(suitable({...reviewed,reviewDate:'not-a-date'},fixture().preferences),false);
});
async function authFixture(){
 const db=sqliteAdapter();db.sqlite.exec(SCHEMA+'CREATE TABLE users(id INTEGER PRIMARY KEY,first_name TEXT);CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);');
 const store=new ProgrammeStore(db);
 for(const [id,name,token] of [[1,'Dave','fictional-a'],[2,'Gaz','fictional-b']]){db.sqlite.prepare('INSERT INTO users VALUES(?,?)').run(id,name);db.sqlite.prepare('INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(?,?,?)').run(id,createHash('sha256').update(token).digest('hex'),'2099-01-01');await store.create(id,fixture(name));}
 const env={DB:db,PROGRAMME_DB:db,PROGRAMME_V1_ENABLED:'true'},deps={authenticate:authenticateMember,html:'PRIVATE-WORKSPACE',fixtureMode:true};
 const request=(token,path='/v1/programme',body)=>new Request('https://test.invalid'+path,{method:body?'POST':'GET',headers:{Cookie:'sst_session='+token,Origin:'https://test.invalid','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 return {db,store,env,deps,request};
}
test('Authenticated reads ignore foreign user IDs and return only the cookie owner’s records',async()=>{
 const {store,env,deps,request}=await authFixture();
 for(const [token,own,foreign] of [['fictional-a','Dave','Gaz'],['fictional-b','Gaz','Dave']]){
  const response=await programmeRoutes(request(token,'/v1/programme?userId='+(own==='Dave'?2:1)),env,deps);
  assert.equal(response.status,200);const data=await response.json();assert.equal(data.name,own);assert.notEqual(data.name,foreign);
 }
 const before=await store.get(2);await programmeRoutes(request('fictional-a','/v1/programme',{type:'review',userId:2,revision:0,operationId:'followup-account-test'}),env,deps);assert.deepEqual(await store.get(2),before);
});
test('A genuinely expired session rejects reads and writes and never renders the private workspace',async()=>{
 const {db,store,env,deps,request}=await authFixture();const before=await store.get(1);
 db.sqlite.prepare('UPDATE user_sessions SET expires_at=? WHERE user_id=1').run('2000-01-01');
 assert.equal((await programmeRoutes(request('fictional-a'),env,deps)).status,401);
 assert.equal((await programmeRoutes(request('fictional-a','/v1/programme',{type:'review',revision:0,operationId:'followup-expired-write'}),env,deps)).status,401);
 const page=await programmeRoutes(request('fictional-a','/member/programme'),env,deps);assert.equal(page.status,303);assert.doesNotMatch(await page.text(),/PRIVATE-WORKSPACE/);
 assert.deepEqual(await store.get(1),before);
});
