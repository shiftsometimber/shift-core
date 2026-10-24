import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {verifyCurrentMainSafetyChecks} from '../release/app-scope.mjs';

test('merged source-check additions require their exact Git objects',()=>{
 const paths=verifyCurrentMainSafetyChecks();
 assert.equal(paths.length,4);
 for(const path of paths)assert.throws(()=>verifyCurrentMainSafetyChecks(p=>p===path?'0'.repeat(40):verify(p)),/Merged safety-check source drift/);
});
function verify(path){return execFileSync('git',['hash-object',path],{encoding:'utf8'}).trim();}
test('coaching uses the existing production configuration with its public-fetch safeguard',()=>{
 const production=readFileSync('wrangler.jsonc','utf8'),coaching=readFileSync('wrangler.coaching.jsonc','utf8');
 assert.equal(coaching,production);
 assert.match(coaching,/global_fetch_strictly_public/);
 assert.match(coaching,/"DAILY_EDITORIAL_NOTIFY_ENABLED": "false"/);
 assert.equal((coaching.match(/"main"\s*:/g)||[]).length,1);
});
