import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {receiveAccountDeletion} from '../../privacy-account-request-v1.js';
import {database,NOW,A,consent,batch} from './fixture.mjs';
import {grant,ingest,state} from '../store.mjs';
async function setup(){
 const DB=database();DB.raw.exec(`CREATE TABLE data_requests(user_id INTEGER,request_type TEXT,status TEXT,received_at TEXT);CREATE TABLE hq_tasks(user_id INTEGER,title TEXT,description TEXT,status TEXT,due_at TEXT,created_at TEXT,updated_at TEXT);`);
 const c=await grant(DB,A,consent(),NOW);await ingest(DB,A,batch(c),NOW);return {DB,c};
}
test('real prepared account deletion receives request, revokes sessions and erases optional imports together',async()=>{
 const {DB}=await setup();assert.deepEqual(await receiveAccountDeletion(DB,1,new Date(NOW).toISOString()),{ok:true,status:'received'});
 assert.equal(DB.raw.prepare('SELECT count(*) n FROM data_requests').get().n,1);assert.equal(DB.raw.prepare('SELECT count(*) n FROM hq_tasks').get().n,1);
 assert.equal(DB.raw.prepare('SELECT count(*) n FROM connected_health_observations').get().n,0);
 assert.ok(DB.raw.prepare("SELECT revoked_at FROM user_sessions WHERE id='session-a'").get().revoked_at);
 assert.equal(DB.raw.prepare("SELECT revoked_at FROM user_sessions WHERE id='session-b'").get().revoked_at,null);
});
test('HQ task failure rolls back optional erasure, request receipt and sign-out',async()=>{
 const {DB}=await setup();DB.failBatchAt=5;await assert.rejects(receiveAccountDeletion(DB,1,new Date(NOW).toISOString()));
 assert.equal((await state(DB,A,NOW)).observations.length,1);assert.equal(DB.raw.prepare('SELECT count(*) n FROM data_requests').get().n,0);assert.equal(DB.raw.prepare("SELECT revoked_at FROM user_sessions WHERE id='session-a'").get().revoked_at,null);
});
test('repeat deletion request does not duplicate HQ or request receipts',async()=>{
 const {DB}=await setup();await receiveAccountDeletion(DB,1,new Date(NOW).toISOString());await receiveAccountDeletion(DB,1,new Date(NOW).toISOString());
 assert.equal(DB.raw.prepare('SELECT count(*) n FROM data_requests').get().n,1);assert.equal(DB.raw.prepare('SELECT count(*) n FROM hq_tasks').get().n,1);
});
test('self-service health erasure joins connected imports into the existing transaction',()=>{
 const source=readFileSync(new URL('../../privacy-health-erasure-route-v1.js',import.meta.url),'utf8');
 assert.match(source,/statements\.push\(\.\.\.await connectedHealthErasureStatements\(env.DB,userId,now\)\);\s*const results=await env.DB.batch\(statements\)/);
});
