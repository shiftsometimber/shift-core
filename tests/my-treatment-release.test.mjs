import test from 'node:test';import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {treatmentSQL,assertTreatmentSchema,assertTreatmentAddition} from '../release/my-treatment-schema.mjs';
import {withoutTreatmentFlag,TREATMENT_FLAG,withoutTreatmentSteps,TREATMENT_SCHEMA_STEP,TREATMENT_LIVE_STEP,TREATMENT_TEST_STEP} from '../release/my-treatment-config.mjs';
test('treatment migration preserves existing rows and unrelated schema and is repeatable',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE users(id INTEGER PRIMARY KEY);INSERT INTO users VALUES(7);CREATE TABLE unrelated(id TEXT);INSERT INTO unrelated VALUES("keep");'.replace('"keep"',"'keep'"));
 const rows=()=>db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all().map(x=>({...x}));const before=rows();assertTreatmentSchema(before);db.exec(treatmentSQL);assertTreatmentAddition(before,rows());const after=rows();db.exec(treatmentSQL);assert.deepEqual(rows(),after);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get().n,1);assert.equal(db.prepare('SELECT id FROM unrelated').get().id,'keep');db.close();
});
test('migration refuses incompatible stores, triggers and missing objects',()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE users(id INTEGER PRIMARY KEY);'+treatmentSQL);const rows=()=>db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type,name").all().map(x=>({...x}));assertTreatmentSchema(rows(),{complete:true});
 const bad=rows();bad.find(x=>x.name==='member_treatment_records').sql+=' drift';assert.throws(()=>assertTreatmentSchema(bad),/differs/);
 assert.throws(()=>assertTreatmentSchema(rows().filter(x=>x.name!=='member_treatment_events'),{complete:true}),/missing/);
 db.exec('CREATE TRIGGER unreviewed AFTER INSERT ON member_treatment_records BEGIN SELECT 1; END;');assert.throws(()=>assertTreatmentSchema(rows()),/Unreviewed/);db.close();
});
test('release normalisation removes only the exact treatment flag and added gates',()=>{
 assert.equal(withoutTreatmentFlag('before\n'+TREATMENT_FLAG+'after'),'before\nafter');assert.equal(withoutTreatmentFlag('"MY_TREATMENT_ENABLED": "false"'),'"MY_TREATMENT_ENABLED": "false"');
 assert.equal(withoutTreatmentSteps('gates\n'+TREATMENT_SCHEMA_STEP+TREATMENT_LIVE_STEP+TREATMENT_TEST_STEP+'rollback'),'gates\nrollback');assert.equal(withoutTreatmentSteps('unrelated'),'unrelated');
});
