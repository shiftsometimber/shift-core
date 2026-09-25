import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
export function database() {
 const raw=new DatabaseSync(':memory:');raw.exec(`PRAGMA foreign_keys=ON;CREATE TABLE users(id INTEGER PRIMARY KEY);CREATE TABLE user_sessions(id TEXT PRIMARY KEY,user_id INTEGER,expires_at TEXT,revoked_at TEXT);INSERT INTO users VALUES(1),(2);INSERT INTO user_sessions VALUES('session-a',1,'2035-01-01T00:00:00Z',NULL),('session-b',2,'2035-01-01T00:00:00Z',NULL),('session-a2',1,'2035-01-01T00:00:00Z',NULL);`);
 raw.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));
 const db={
   raw, beforeBatch:null, failBatchAt:null,
   prepare(sql) {
     return {bind(...args) {
       const statement=raw.prepare(sql);
       return {
         sql,args,
         async first(){return statement.get(...args)??null},
         async all(){return {results:statement.all(...args)}},
         async run(){const result=statement.run(...args);return {meta:{changes:Number(result.changes)}}}
       };
     }};
   },
   async batch(statements) {
     if(db.beforeBatch){const f=db.beforeBatch;db.beforeBatch=null;await f()}
     raw.exec('BEGIN IMMEDIATE');
     try {
       const out=[];
       for(let i=0;i<statements.length;i++) {
         if(db.failBatchAt===i)throw new Error('fixture_db_failure');
         out.push(await statements[i].run());
       }
       raw.exec('COMMIT');return out;
     }catch(e){raw.exec('ROLLBACK');throw e}
   }
 };return db;
}
export const NOW=Date.parse('2026-09-24T12:00:00Z');
export const A={userId:1,sessionId:'session-a'},B={userId:2,sessionId:'session-b'};
export const weight=(value=90,id='weight-1')=>({metric:'weight',externalId:id,value,unit:'kg',startAt:'2026-09-23T12:00:00.000Z',endAt:'2026-09-23T12:00:00.000Z',sources:['test.scale'],basis:'sample',timeZone:null});
export const consent=(p='apple_health',selected=['weight','height','steps','sleep'])=>({expectedAccountId:1,provider:p,expectedRevision:0,consentVersion:'connected-health/2026-09-24-v1',consent:true,scopes:selected});
export const batch=(c,records=[weight()],extra={})=>({expectedAccountId:1,provider:c.provider,connectionId:c.connectionId,revision:c.revision,syncRevision:c.syncRevision,batchId:'batch-1',records,deleted:[],...extra});
