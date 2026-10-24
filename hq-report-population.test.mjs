import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {excludedMemberSql,commercePopulationSql} from './hq-report-population.mjs';
test('one exclusion policy covers audit identities, review accounts, aliases and all staff statuses',()=>{
 const db=new DatabaseSync(':memory:');db.exec(`CREATE TABLE users(id INTEGER,email TEXT);CREATE TABLE audit_log(user_id INTEGER,action TEXT);CREATE TABLE hq_users(email TEXT);INSERT INTO users VALUES(1,'real@example.com'),(2,'shiftsometimber+new-test@gmail.com'),(3,'appletest@shiftsometimber.co.uk'),(4,'staff@example.com'),(5,'audited@example.com'),(6,'sample@example.invalid'),(7,'google-review@shiftsometimber.co.uk'),(8,'oldreview@example.com');INSERT INTO hq_users VALUES('STAFF@example.com');INSERT INTO audit_log VALUES(5,'auth.commissioning_identity_verified'),(8,'auth.apple_review_fixture');`);
 const tables=new Set(['users','audit_log','hq_users']);assert.deepEqual(db.prepare('SELECT id FROM users u WHERE NOT '+excludedMemberSql(tables)).all().map(r=>r.id),[1]);
 db.exec(`CREATE TABLE orders(id INTEGER,user_id INTEGER,customer_email TEXT);INSERT INTO orders VALUES(1,1,'real@example.com'),(2,5,NULL),(3,NULL,'staff@example.com'),(4,NULL,'appletest@shiftsometimber.co.uk'),(5,NULL,NULL),(6,1,'shiftsometimber+ad-hoc@gmail.com');`);
 assert.deepEqual(db.prepare('SELECT id FROM orders o WHERE '+commercePopulationSql(tables,'o','customer_email')).all().map(r=>r.id),[1,5]);
 // Unknown identities remain unknown; this predicate does not label them real.
 assert.throws(()=>excludedMemberSql(tables,'u;DROP TABLE users'));assert.equal(db.prepare('SELECT COUNT(*) n FROM orders').get().n,6);
});
