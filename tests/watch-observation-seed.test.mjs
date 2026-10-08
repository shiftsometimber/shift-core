import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {sources} from '../medicines-watch/data.mjs';
import {observationInsert} from '../medicines-watch/observations.mjs';
import {observationStatements,observationBatches,seedObservationsOnline} from '../release/watch-observation-seed.mjs';
const schema=readFileSync(new URL('../medicines-watch/migration.sql',import.meta.url),'utf8');
function rows(n=2){return sources.slice(0,n).map(s=>({source_id:s.id,source_url:s.url,check_url:s.checkUrl||s.url,last_attempt_at:null,last_success_at:null,last_failure_at:null,attempt_status:'never',next_check_at:null,last_http_status:null,last_error:"Quoted ' words; still one observation\nnext line",last_fingerprint:null,last_withdrawn:0}));}
const sql=n=>rows(n).map(observationInsert).join('\n')+'\n';
test('literal quotes, semicolons and newlines preserve every exact observation',()=>{const actual=observationStatements(sql());assert.deepEqual(actual,rows().map(observationInsert));});
test('the exact online CLI transport never starts a file import',()=>{
 const calls=[],report=seedObservationsOnline(sql(),{run:(bin,args)=>{calls.push(args);assert(!args.includes('--file'));assert(args.some(a=>a.startsWith('--command=')));return '[{"success":true,"meta":{"changes":0}}]';}});
 assert.equal(report.bulkImport,false);assert.equal(report.changes,0);assert.equal(calls.length,1);
});
test('online seed preserves previously successful scheduler observations',()=>{
 const db=new DatabaseSync(':memory:');db.exec(schema);const first=rows()[0];db.exec(observationInsert({...first,attempt_status:'ok',last_success_at:'2026-10-08T21:00:00Z',last_error:null,last_fingerprint:'retained'}));db.exec(sql());const retained=db.prepare('SELECT * FROM medicines_watch_checks WHERE source_id=?').get(first.source_id);assert.equal(retained.last_fingerprint,'retained');assert.equal(retained.attempt_status,'ok');assert.equal(retained.last_error,null);db.close();
});
test('batches retain all statements, bound count/bytes, and make no calls for an empty seed',()=>{
 const actual=observationStatements(sql(41)),batches=observationBatches(actual);assert.equal(batches.length,3);assert.equal(batches.join('\n'),actual.join('\n'));assert.equal(seedObservationsOnline('',{run:()=>{throw Error('No-op must not query')}}).batches,0);assert.throws(()=>observationBatches(['a'.repeat(80000)]),/budget/);
});
test('foreign SQL, unknown sources, duplicate rows and scheduler overwrites are rejected before production',()=>{
 const valid=rows()[0];for(const bad of ["DELETE FROM users;",sql()+"SELECT 1;",observationInsert({...valid,source_id:'unknown'}),observationInsert({...valid,source_url:'https://invalid.example'}),observationInsert(valid)+observationInsert(valid),observationInsert(valid).replace(' WHERE medicines_watch_checks.source_url<>excluded.source_url OR medicines_watch_checks.check_url<>excluded.check_url','')])assert.throws(()=>seedObservationsOnline(bad,{run:()=>{throw Error('Production must not be entered')}}));
});
test('a failed online batch stops and is never automatically replayed',()=>{
 let calls=0;assert.throws(()=>seedObservationsOnline(sql(41),{run:()=>{calls++;return '[{"success":false}]';}}),/failed/);assert.equal(calls,1);
});
