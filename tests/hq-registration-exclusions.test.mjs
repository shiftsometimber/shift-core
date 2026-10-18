import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {managementReport} from '../hq-management-api.mjs';
function fixture({audit=true}={}){
 const db=new DatabaseSync(':memory:');
 db.exec("CREATE TABLE users(id INTEGER PRIMARY KEY,email TEXT,created_at TEXT);CREATE TABLE hq_users(email TEXT);"+(audit?"CREATE TABLE audit_log(user_id INTEGER,action TEXT);":""));
 const identities=['member@gmail.com','person+gym@gmail.com','lindalobrien@hotmail.co.uk','matobrien@hotmail.co.uk','obriens38@hotmail.com','shiftsometimber@gmail.com','appletest@shiftsometimber.co.uk','google-review@shiftsometimber.co.uk','shiftsometimber+ordinary-acceptance-123@gmail.com','shiftsometimber+structured-newcase@gmail.com','fixture@example.invalid','fixture@example.test','marked@customer.example'];
 identities.forEach((email,i)=>db.prepare('INSERT INTO users VALUES(?,?,?)').run(i+1,email,'2026-10-18T11:00:00Z'));
 for(const email of ['matobrien@hotmail.co.uk','obriens38@hotmail.com','shiftsometimber@gmail.com'])db.prepare('INSERT INTO hq_users VALUES(?)').run(email);
 if(audit)db.exec("INSERT INTO audit_log VALUES(13,'auth.commissioning_identity_verified')");
 const DB={prepare(sql){return {bind(...params){return {async first(){return db.prepare(sql).get(...params)||null}}},async all(){return {results:db.prepare(sql).all()}}}}};
 return {db,DB};
}
for(const kind of ['management','members','growth'])test(kind+' excludes confirmed fixtures, reviewers and HQ accounts without excluding ordinary plus-addresses',async()=>{
 const {db,DB}=fixture();try{
 const before=db.prepare('SELECT count(*) n FROM users').get().n;
 const report=await managementReport(DB,{kind,start:'2026-10-18',end:'2026-10-18',permissions:['crm_read']});
 const metric=report.metrics.find(x=>x.key==='registrations');
 assert.equal(metric.status,'available');assert.equal(metric.value,3);
 assert.equal(db.prepare('SELECT count(*) n FROM users').get().n,before);
 }finally{db.close()}
});
test('unavailable classification evidence is not reported as zero registrations',async()=>{
 const {db,DB}=fixture({audit:false});try{
 const report=await managementReport(DB,{kind:'growth',start:'2026-10-18',end:'2026-10-18',permissions:['crm_read']});
 const m=report.metrics.find(x=>x.key==='registrations');assert.equal(m.status,'unavailable');assert.equal(m.value,null);
 }finally{db.close()}
});
test('role without CRM read cannot obtain registration count',async()=>{
 const {db,DB}=fixture();try{
 const report=await managementReport(DB,{kind:'growth',start:'2026-10-18',end:'2026-10-18',permissions:[]});
 const m=report.metrics.find(x=>x.key==='registrations');assert.equal(m.status,'unavailable');assert.equal(m.value,null);
 }finally{db.close()}
});
test('London date boundaries are preserved and do not backfill another reporting day',async()=>{
 const {db,DB}=fixture();try{
 db.prepare('UPDATE users SET created_at=? WHERE id=1').run('2026-10-17T22:59:59Z');
 db.prepare('UPDATE users SET created_at=? WHERE id=2').run('2026-10-17T23:00:00Z');
 db.prepare('UPDATE users SET created_at=? WHERE id=3').run('2026-10-18T23:00:00Z');
 const report=await managementReport(DB,{kind:'growth',start:'2026-10-18',end:'2026-10-18',permissions:['crm_read']});
 assert.equal(report.metrics.find(x=>x.key==='registrations').value,1);
 assert.equal(report.period.since,'2026-10-17T23:00:00.000Z');assert.equal(report.period.until,'2026-10-18T23:00:00.000Z');
 assert.equal(JSON.stringify(report).includes('member@gmail.com'),false);
 }finally{db.close()}
});
