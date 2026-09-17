import test from 'node:test';
import assert from 'node:assert/strict';
import {collectorD1} from '../scripts/radar-collector-d1.mjs';
test('Wrangler import progress is accepted without treating console text as JSON',()=>{
 let command;
 const result=collectorD1(['--file','/tmp/snapshots.sql'],(bin,args)=>{command={bin,args};return '├ Checking if file needs uploading\n🌀 Executing import\n[{"success":true}]\n'});
 assert.equal(result,null);assert.equal(command.bin,'npx');assert.ok(command.args.includes('--remote'));assert.deepEqual(command.args.slice(-2),['--file','/tmp/snapshots.sql']);
});
test('import errors still fail; read-back results must be real JSON',()=>{
 assert.throws(()=>collectorD1(['--file','/tmp/snapshots.sql'],()=>{throw Error('D1 import failed')}),/D1 import failed/);
 assert.deepEqual(collectorD1(['--command','SELECT 1'],()=> '[{"results":[{"count":7}]}]'),[{results:[{count:7}]}]);
 assert.throws(()=>collectorD1(['--command','SELECT 1'],()=> 'not JSON'));
});
