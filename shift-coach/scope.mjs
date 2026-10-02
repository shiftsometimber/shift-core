import {WATCH_REGISTRY_WAVE_PATHS,validateWatchRegistryWave} from '../release/watch-registry-wave-scope.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {COACH_BASE,COACH_ADDITIONS,COACH_BACKEND_PATHS,assertCoachingChangedPath,verifyCoachingRelease} from './release-contract.mjs';
export const base=COACH_BASE;export const additions=COACH_ADDITIONS;
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim(),candidate=process.env.SHIFT_COACH_SOURCE||'HEAD';
git('merge-base','--is-ancestor',base,candidate);
for(const line of git('diff','--name-status',base,candidate).split('\n').filter(Boolean)){
 const [status,path]=line.split('\t');
 if(WATCH_REGISTRY_WAVE_PATHS.includes(path)){assert(['A','M'].includes(status),'Unexpected Watch registry-wave change: '+path);continue;}
 if(!WATCH_REGISTRY_WAVE_PATHS.includes(path))assertCoachingChangedPath(status,path);
}
validateWatchRegistryWave((ref,path)=>git('rev-parse',ref+':'+path));
for(const path of [...additions,...COACH_BACKEND_PATHS])assert.equal(git('rev-parse',candidate+':'+path),git('rev-parse','HEAD:'+path),'Candidate payload changed in merge: '+path);
assert.equal(readFileSync('wrangler.coaching.jsonc','utf8'),readFileSync('wrangler.jsonc','utf8'));
console.log(JSON.stringify({...verifyCoachingRelease(),listedAdditions:additions.size,listedBackendChanges:COACH_BACKEND_PATHS.size,productionActivated:false}));
