import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {parseCalendar,firstResponseDeadline,demographicAggregates,scenarioProjection,supportMetadata,memberDemographics,memberDemographicSources,staffMfaMetadata,learningCatalogue} from '../../hq-v3-business.mjs';
import {hqV3Route} from '../../hq-v3-api.mjs';
const calendar={version:'TEST-CALENDAR-1',approval_ref:'TEST-OWNER-FIXTURE',timezone:'Europe/London',valid_from:'2026-01-01',valid_until:'2026-12-31',holidays:[]};
class D1{constructor(){this.db=new DatabaseSync(':memory:')}prepare(sql){const db=this.db;return {bind(...values){return {async all(){return {results:db.prepare(sql).all(...values)}},async first(){return db.prepare(sql).get(...values)||null}}},async all(){return {results:db.prepare(sql).all()}},async first(){return db.prepare(sql).get()||null}}}}
test('Support first response follows business hours, original creation, holidays and DST; no calendar is a blocker',()=>{
 for(const [created,due] of [['2026-11-06T16:00:00Z','2026-11-09T16:00:00.000Z'],['2026-11-07T12:00:00Z','2026-11-09T17:00:00.000Z'],['2026-10-23T15:00:00Z','2026-10-26T16:00:00.000Z'],['2026-11-06T17:00:00Z','2026-11-09T17:00:00.000Z']])assert.equal(firstResponseDeadline(created,calendar).due_at,due);
 assert.equal(firstResponseDeadline('2026-11-06T16:00:00Z',{...calendar,holidays:['2026-11-09']}).due_at,'2026-11-10T16:00:00.000Z');
 for(const broken of [null,{}, {...calendar,approval_ref:null},{...calendar,holidays:['2026-02-30']},{...calendar,timezone:'UTC'},{...calendar,valid_until:'2026-11-06'}])assert.equal(firstResponseDeadline('2026-11-06T16:00:00Z',broken).status,'unavailable');
 assert.equal(parseCalendar('{bad'),null);
});
test('Demographic bands retain unknowns and suppress entire tiny-cell families including coverage',()=>{
 const policy={asOf:new Date('2026-11-06T12:00:00Z'),minimumCellSize:5,policyReference:'TEST-PRIVACY'};
 const rows=[...Array(5).fill({date_of_birth:'2005-01-01'}),...Array(5).fill({date_of_birth:'1990-01-01'}),...Array(5).fill({date_of_birth:null})];
 const r=demographicAggregates(rows,policy);assert.equal(r.status,'available');assert.equal(r.total,15);assert.equal(r.coverage,10/15);assert.equal(r.age_bands.find(x=>x.label==='18–24').count,5);assert.equal(r.age_bands.find(x=>x.label==='Unavailable').count,5);
 const tiny=demographicAggregates([...rows,{date_of_birth:'1960-05-01'}],policy);assert.equal(tiny.status,'suppressed');assert.equal(tiny.total,null);assert.equal(tiny.coverage,null);assert.ok(tiny.age_bands.every(x=>x.count===null));
 for(const bad of [{},{...policy,minimumCellSize:1},{...policy,policyReference:null},{...policy,complete:false}])assert.equal(demographicAggregates(rows,bad).status,'unavailable');
 assert.ok(!JSON.stringify(r).includes('2005-01-01'));assert.ok(!JSON.stringify(r).includes('1990-01-01'));
});
test('Forecast uses explicit integer assumptions, keeps missing costs unknown and refuses income/clinical extensions',()=>{
 const base={version:'TEST-BASE-1',orders:10,unit_price_pence:1000,currency:'GBP'};
 let result=scenarioProjection(base);assert.equal(result.assumed_sales_pence,10000);assert.equal(result.assumed_contribution.value,null);assert.equal(result.execution_permitted,false);
 result=scenarioProjection({...base,unit_cost_pence:400,fixed_cost_pence:1000});assert.equal(result.assumed_contribution.value,5000);assert.equal(result.status,'hypothetical');
 for(const bad of [{...base,orders:-1},{...base,unit_price_pence:1.5},{...base,unit_cost_pence:'0'},{...base,currency:'USD'},{...base,saas_income:1000},{...base,clinical_body:'PRIVATE'},{...base,version:'live'}])assert.throws(()=>scenarioProjection(bad),/invalid_scenario/);
});
test('Canonical support/members/staff queries exclude live records, clinical bodies and staff from member aggregates',async()=>{
 const DB=new D1();try{
 DB.db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,date_of_birth TEXT);CREATE TABLE hq_users(id INTEGER PRIMARY KEY,email TEXT,name TEXT,status TEXT,mfa_enabled INTEGER);CREATE TABLE support_tickets(id INTEGER PRIMARY KEY,reference TEXT,status TEXT,priority TEXT,created_at TEXT,updated_at TEXT,user_id INTEGER,assigned_hq_user_id INTEGER,body TEXT);
 INSERT INTO users VALUES(1,'test-member@example.invalid','2005-01-01'),(2,'live-member@deliverable.test','1990-01-01'),(3,'staff@example.invalid','1960-01-01');
 INSERT INTO hq_users VALUES(1,'staff@example.invalid','Fictional support owner','active',0),(2,'another@example.invalid','Fictional enrolled owner','active',1),(3,'live@deliverable.test','Excluded live staff','active',0);
 INSERT INTO support_tickets VALUES(1,'TEST-S19','open','urgent','2026-11-06T16:00:00Z','2026-11-10T09:00:00Z',1,1,'PRIVATE CLINICAL BODY'),(2,'LIVE-S20','open','urgent','2026-11-06T16:00:00Z','2026-11-10T09:00:00Z',2,3,'PRIVATE'),(3,'TEST-LOOKALIKE','open','urgent','2026-11-06T16:00:00Z','2026-11-10T09:00:00Z',2,3,'PRIVATE');`);
 let support=await supportMetadata(DB,calendar,new Date('2026-11-10T12:00:00Z'));assert.equal(support.records.length,1);assert.equal(support.records[0].deadline.due_at,'2026-11-09T16:00:00.000Z');assert.equal(support.records[0].deadline_elapsed,true);assert.equal(support.records[0].first_human_response.status,'unavailable');assert.ok(!JSON.stringify(support).includes('PRIVATE'));
 DB.db.exec("UPDATE hq_users SET status='disabled' WHERE id=1");support=await supportMetadata(DB,calendar);assert.equal(support.records[0].owner,null);assert.equal(support.records[0].owner_required,true);
 const staff=await staffMfaMetadata(DB);assert.equal(staff.active,1);assert.equal(staff.enrolled,1);assert.equal(staff.waive_permitted,false);
 const demo=await memberDemographics(DB,{approval_ref:'TEST-PRIVACY',minimum_cell_size:5},new Date('2026-11-06T12:00:00Z'));assert.equal(demo.status,'suppressed');assert.ok(!JSON.stringify(demo).includes('example.invalid'));assert.ok(!JSON.stringify(demo).includes('1960-01-01'));
 }finally{DB.db.close()}
});
test('All added read models retain production/role/partition guards and learning never claims connected training',async()=>{
 const noRead={prepare(){throw Error('Database access forbidden')}};const owner=async()=>Response.json({user:{id:1,role:'owner'}});
 for(const suffix of ['dictionary','demographics','support','access','health','learning','scenario','purchases/TEST-ORDER']){
  const request=new Request('https://test.invalid/v1/hq/management/v3/'+suffix);
  assert.equal((await hqV3Route(request,{DB:noRead},{},owner)).status,503);
  assert.equal((await hqV3Route(request,{DB:noRead,HQ_V3_TEST_MODE:'true',DEPLOYMENT_ENVIRONMENT:'test'},{},async()=>Response.json({user:{role:'support'}}))).status,403);
 }
 const env={DB:noRead,HQ_V3_TEST_MODE:'true',DEPLOYMENT_ENVIRONMENT:'test'};
 let r=await hqV3Route(new Request('https://test.invalid/v1/hq/management/v3/demographics?member_id=1'),env,{},owner);assert.equal(r.status,400);
 r=await hqV3Route(new Request('https://test.invalid/v1/hq/management/v3/dictionary'),env,{},owner);assert.equal(r.status,200);assert.ok((await r.json()).metrics.every(m=>m.definition_version&&m.owner&&m.denominator&&m.freshness));
 const learning=learningCatalogue(null);assert.ok(learning.catalogue.every(x=>x.status==='excluded'&&x.training_rows===null));assert.equal(learning.clinical_bodies_permitted,false);
});

test('Actual native TEST member domains are included; source maps prove fields without exposing profiles or inventing regions',async()=>{
 const DB=new D1();try{
  DB.db.exec('CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,date_of_birth TEXT,postcode TEXT);CREATE TABLE hq_users(id INTEGER PRIMARY KEY,email TEXT);');
  const insert=DB.db.prepare('INSERT INTO users VALUES(?,?,?,?)');
  for(let i=1;i<=15;i++)insert.run(i,'native-'+i+(i<=10?'@example.test':'@example.invalid'),i<=5?'1990-01-01':i<=10?'1980-01-01':null,'TEST PROFILE ONLY');
  insert.run(16,'staff@example.test','1990-01-01','TEST STAFF');DB.db.prepare('INSERT INTO hq_users VALUES(?,?)').run(1,'staff@example.test');insert.run(17,'excluded@deliverable.test','1990-01-01','NOT IN TEST PARTITION');
  const d=await memberDemographics(DB,{approval_ref:'TEST-PRIVACY',minimum_cell_size:5},new Date('2026-11-06T12:00:00Z'));assert.equal(d.total,15);assert.equal(d.coverage,10/15);
  const source=await memberDemographicSources(DB,d);assert.equal(source.fields.find(x=>x.column==='date_of_birth').present,true);assert.equal(source.fields.find(x=>x.column==='postcode').present,true);assert.equal(source.fields.find(x=>x.column==='region').present,false);assert.equal(source.region_mapping.status,'unavailable');assert.equal(source.region_mapping.value,null);assert.equal(source.clinical_bodies_read,false);
  assert.ok(!JSON.stringify(source).includes('1990-01-01'));assert.ok(!JSON.stringify(source).includes('TEST PROFILE ONLY'));assert.ok(!JSON.stringify(source).includes('native-1@'));
 }finally{DB.db.close();}
});
