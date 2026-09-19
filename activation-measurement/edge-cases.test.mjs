import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import vm from 'node:vm';
import {activationScorecard} from './scorecard.mjs';
import {bootstrap} from './assets.mjs';
function fixture(t){const db=new DatabaseSync(':memory:');t.after(()=>db.close());db.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,created_at TEXT);CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER,email_verified_at TEXT);CREATE TABLE audit_log(user_id INTEGER,action TEXT,created_at TEXT);INSERT INTO users VALUES(1,'person@real.example','2026-09-01');INSERT INTO user_auth VALUES(1,1,'2026-09-01');");return {db,DB:{prepare(sql){let args=[];return{bind(...a){args=a;return this},async first(){return db.prepare(sql).get(...args)||null},async all(){return{results:db.prepare(sql).all(...args)}}}}}}}
test('a stale pre-login save cannot hide a later valid saved activation',async t=>{const f=fixture(t);f.db.exec("INSERT INTO audit_log VALUES(1,'passport.add','2026-09-02'),(1,'auth.login','2026-09-03'),(1,'my_journey.update','2026-09-04')");const r=await activationScorecard(f.DB,{now:'2026-09-19',days:30});assert.deepEqual(r.stages.map(s=>s.members),[1,1,1,1])});
test('a save without a preceding observed verified login is not a completed funnel',async t=>{const f=fixture(t);f.db.exec("INSERT INTO audit_log VALUES(1,'passport.add','2026-09-02')");const r=await activationScorecard(f.DB,{now:'2026-09-19',days:30});assert.deepEqual(r.stages.map(s=>s.members),[1,1,0,0])});
function injections(path){const seen=[],window={dataLayer:[],addEventListener(){}},document={createElement(){return{}},head:{appendChild(x){seen.push(x)}}};vm.runInNewContext(bootstrap,{window,document,location:new URL('https://shiftsometimber.co.uk'+path),URLSearchParams,localStorage:{getItem(){return '{"analytics":true}'}},Date});window.shiftUpdateGoogleConsent(true);return seen}
test('interactive health-questionnaire routes never initialise the tag manager',()=>{for(const p of ['/start-here','/treatment-finder','/how-are-you-feeling'])assert.equal(injections(p).length,0)});
test('unrecognised encoded or free-form paths fail closed',()=>{for(const p of ['/people/alex@example.com','/%6dember-login'])assert.equal(injections(p).length,0)});
