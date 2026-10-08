import {reconciliationHistoricalRead,reconciliationPath} from '../release/approved-runtime-composition.mjs';
import {RECIPE_IMAGE_PATHS,validateRecipeImages} from '../release/recipe-image-scope.mjs';
import {WATCH_REGISTRY_WAVE_PATHS,validateWatchRegistryWave} from '../release/watch-registry-wave-scope.mjs';
import {FIT300_PATHS,READONLY_ORGANIC_PATHS,validateFit300} from '../release/fit-300-scope.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {COACH_BASE,COACH_ADDITIONS,COACH_BACKEND_PATHS,assertCoachingChangedPath,verifyCoachingRelease} from './release-contract.mjs';
export const base=COACH_BASE;export const additions=COACH_ADDITIONS;
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim(),candidate=process.env.SHIFT_COACH_SOURCE||'HEAD';
git('merge-base','--is-ancestor',base,candidate);
validateRecipeImages();
validateFit300();
for(const line of git('diff','--name-status',base,candidate).split('\n').filter(Boolean)){
 const [status,path]=line.split('\t');
 // This loop compares against the older coaching base, not the composition base.
 // Preserve its real historical A/M status and verify the candidate's exact blob
 // against already-pinned current source before invoking older path classifiers.
 if(reconciliationPath(path)){
  assert(['A','M'].includes(status),'Unexpected approved composition coaching status: '+path);
  const current=git('diff','--name-status',base,'HEAD','--',path).split('\t');
  assert.equal(status,current[0],'Composition candidate history differs: '+path);
  assert.equal(git('rev-parse',candidate+':'+path),git('rev-parse','HEAD:'+path),'Composition candidate bytes changed in merge: '+path);
  continue;
 }

 if(FIT300_PATHS.has(path)||READONLY_ORGANIC_PATHS.has(path)){
  assert(['A','M'].includes(status),'Unexpected independently pinned release change: '+path);
  assert.equal(git('rev-parse',candidate+':'+path),git('rev-parse','HEAD:'+path),'Candidate independently pinned payload changed in merge: '+path);
  continue;
 }
 if(RECIPE_IMAGE_PATHS.has(path))continue;
 if(WATCH_REGISTRY_WAVE_PATHS.includes(path)){assert(['A','M'].includes(status),'Unexpected Watch registry-wave change: '+path);continue;}
 if(!WATCH_REGISTRY_WAVE_PATHS.includes(path))assertCoachingChangedPath(status,path);
}
validateWatchRegistryWave(reconciliationHistoricalRead((ref,path)=>git('rev-parse',ref+':'+path),true));
for(const path of [...additions,...COACH_BACKEND_PATHS])assert.equal(git('rev-parse',candidate+':'+path),git('rev-parse','HEAD:'+path),'Candidate payload changed in merge: '+path);
assert.equal(readFileSync('wrangler.coaching.jsonc','utf8'),readFileSync('wrangler.jsonc','utf8'));
console.log(JSON.stringify({...verifyCoachingRelease(),listedAdditions:additions.size,listedBackendChanges:COACH_BACKEND_PATHS.size,productionActivated:false}));
