import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {completionPinnedRef,validateCompletionComposition,verifyCompletionHistory,COMPLETION_PAYLOAD_PATHS,COMPLETION_MAINTENANCE_PATHS} from '../release/production-completion-scope.mjs';
test('completion source is finite and every previous production step remains intact',()=>{
 const c=JSON.parse(readFileSync('shift-coach/release-manifest.json')).seoFollowThroughComposition.technicalComposition.completionComposition;
 validateCompletionComposition(c);verifyCompletionHistory(c);
 for(const patch of [{proof:'other'},{base:'f'.repeat(40)},{payloadSource:'f'.repeat(40)},{payloadPaths:[...COMPLETION_PAYLOAD_PATHS,'other.mjs']},{maintenancePaths:[...COMPLETION_MAINTENANCE_PATHS,'other.mjs']}])assert.throws(()=>validateCompletionComposition({...c,...patch}));
 for(const p of [...c.payloadPaths,...c.maintenancePaths])assert.equal(execFileSync('git',['rev-parse','HEAD:'+p],{encoding:'utf8'}).trim(),execFileSync('git',['rev-parse',completionPinnedRef(c,p)+':'+p],{encoding:'utf8'}).trim(),'Completion payload drift: '+p);
});
test('recovery is checked before browser setup and is never a generic unknown-runtime adoption',()=>{
 const s=readFileSync('.github/workflows/cloudflare-production-promote.yml','utf8');
 assert(s.indexOf('run: node shift-coach/recover-cancelled-release.mjs')<s.indexOf('name: Prepare and launch verification browsers'));
 assert(s.includes('    timeout-minutes: 25'));assert(s.includes('run: node release/member-details-rollback.mjs'));
 const r=readFileSync('shift-coach/recover-cancelled-release.mjs','utf8');
 assert(r.includes('Runtime moved before exact SEO recovery'));assert(r.includes('Unknown runtime has no exact successful owned-deployment proof; stop without rollback'));
});
