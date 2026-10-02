import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {COACH_BASE,COACH_ADDITIONS,COACH_BACKEND_PATHS,verifyCoachingRelease} from './release-contract.mjs';
export const base=COACH_BASE;export const additions=COACH_ADDITIONS;
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim(),candidate=process.env.SHIFT_COACH_SOURCE||'HEAD';
git('merge-base','--is-ancestor',base,candidate);
for(const line of git('diff','--name-status',base,candidate).split('\n').filter(Boolean)){
 const [status,path]=line.split('\t');assert(additions.has(path)||COACH_BACKEND_PATHS.has(path),'Unlisted coaching release change: '+path);assert.equal(status,additions.has(path)?'A':'M','Unexpected change status: '+path);
}
for(const path of [...additions,...COACH_BACKEND_PATHS])assert.equal(git('rev-parse',candidate+':'+path),git('rev-parse','HEAD:'+path),'Candidate payload changed in merge: '+path);
assert.equal(readFileSync('wrangler.coaching.jsonc','utf8'),readFileSync('wrangler.jsonc','utf8'));
console.log(JSON.stringify({...verifyCoachingRelease(),listedAdditions:additions.size,listedBackendChanges:COACH_BACKEND_PATHS.size,productionActivated:false}));
