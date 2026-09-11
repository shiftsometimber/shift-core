import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {sqliteAdapter} from '../test-support/db.mjs';
import {SCHEMA,ProgrammeStore} from '../store.mjs';
import {fixture} from '../test-support/fixtures.mjs';
import {programmeRoutes} from '../routes.mjs';
import {authenticateMember} from '../../member-state-fast-v1.js';
import {existingTools} from '../existing-tools.mjs';
async function setup(){
 const db=sqliteAdapter();db.sqlite.exec(SCHEMA+'CREATE TABLE users(id INTEGER PRIMARY KEY,first_name TEXT);CREATE TABLE user_sessions(id INTEGER PRIMARY KEY,user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);CREATE TABLE member_state(user_id INTEGER PRIMARY KEY,preferences TEXT);');
 const store=new ProgrammeStore(db);
 for(const [id,name] of [[1,'Dave'],[2,'Gaz']]){
  db.sqlite.prepare('INSERT INTO users VALUES(?,?)').run(id,name);
  db.sqlite.prepare('INSERT INTO user_sessions(user_id,token_hash,expires_at) VALUES(?,?,?)').run(id,createHash('sha256').update('fictional-'+id).digest('hex'),'2099-01-01');
  db.sqlite.prepare('INSERT INTO member_state VALUES(?,?)').run(id,JSON.stringify({grub:{savedRecipes:[name+' recipe'],weekMeals:[name+' meal']},fitJourney:{entries:{one:{status:'done',note:'Private note not needed here'},two:{status:'skipped'}},sessionReviews:{one:{recordedOn:'2026-09-10',note:'Another private note'}}},unrelated:'DO-NOT-RETURN'}));
  const state=fixture(name);state.entitlement.active=false;await store.create(id,state);
 }
 const env={DB:db,PROGRAMME_DB:db,PROGRAMME_V1_ENABLED:'true'},deps={authenticate:authenticateMember,html:'PRIVATE WORKSPACE',fixtureMode:true};
 const request=(id,method='GET',query='')=>new Request('https://test.invalid/v1/programme/existing-tools'+query,{method,headers:id?{Cookie:'sst_session=fictional-'+id}:{}});
 return {db,store,env,deps,request};
}
test('Existing free records are owner-scoped, read-only and available after Programme service expiry',async()=>{
 const {db,store,env,deps,request}=await setup();
 const before=db.sqlite.prepare('SELECT * FROM member_state ORDER BY user_id').all(),saved=await store.get(1);
 const response=await programmeRoutes(request(1,'GET','?userId=2'),env,deps);assert.equal(response.status,200);
 const body=await response.json();assert.deepEqual(body.grub.savedRecipes,['Dave recipe']);assert.equal(body.fit.completedExerciseEntries,1);assert.equal(body.fit.exerciseEntries,2);assert.equal(body.fit.sessionReviews,1);
 assert.doesNotMatch(JSON.stringify(body),/Gaz|Private note|Another private|DO-NOT-RETURN/);
 assert.deepEqual(db.sqlite.prepare('SELECT * FROM member_state ORDER BY user_id').all(),before);assert.deepEqual(await store.get(1),saved);
 assert.match(response.headers.get('Cache-Control'),/no-store/);
});
test('Signed-out or expired sessions cannot read context; this adapter never accepts a write',async()=>{
 const {db,env,deps,request}=await setup();
 assert.equal((await programmeRoutes(request(null),env,deps)).status,401);
 assert.equal((await programmeRoutes(request(1,'POST'),env,deps)).status,405);
 db.sqlite.prepare('UPDATE user_sessions SET expires_at=? WHERE user_id=1').run('2000-01-01');
 assert.equal((await programmeRoutes(request(1),env,deps)).status,401);
});
test('Missing records are empty; malformed saved JSON reports unavailability without overwriting anything',async()=>{
 const {db,env,deps,request}=await setup();assert.deepEqual((await existingTools(db,999)).grub.savedRecipes,[]);
 db.sqlite.prepare('UPDATE member_state SET preferences=? WHERE user_id=1').run('{broken');
 assert.equal((await programmeRoutes(request(1),env,deps)).status,503);
 assert.equal(db.sqlite.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences,'{broken');
});
test('The pinned dashboard preserves the fixed Programme destination through its existing sign-in handoff',()=>{
 // Contract-check the exact checkpoint source, without altering global auth.
 const pinned=JSON.parse(readFileSync(new URL('../test-support/pinned-dashboard-return.json',import.meta.url)));
 const ctx={URLSearchParams,location:{search:'?returnTo=%2Fmember%2Fprogramme'}};vm.createContext(ctx);vm.runInContext(pinned.returnFunction,ctx);
 assert.equal(vm.runInContext('requestedDestination()',ctx),'/member/programme');
 ctx.location.search='?returnTo=https%3A%2F%2Fevil.invalid';assert.equal(vm.runInContext('requestedDestination()',ctx),'');
});
