import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const DISCOVERY_SOURCE='6d878002af6cd68fe5f30edcd3c973cebc378b7a';
export const DISCOVERY_PATHS=Object.freeze([
  'babylove/dynamic-public.mjs',
  'babylove/dynamic-public.test.mjs'
]);
// The 31 October approved public-discovery merge is now the exact baseline.
// The sole subsequent runtime delta is the reviewed, three-file sitemap repair.
// Pin every byte of those three files to the already tested candidate commit;
// no unrelated source, content or workflow modification is admitted.
export const APPROVED_SITEMAP_REPAIR='20de801233fa45a34a3a30cfee8bbd245bd27e95';
export const SITEMAP_REPAIR_PATHS=Object.freeze([
  'public-seo-technical.mjs',
  'scripts/verify-seo-closeout-live.mjs',
  'tests/public-seo-technical.test.mjs'
]);
export const RELEASE_TAIL=Object.freeze([
  {status:'M',path:'public-seo-technical.mjs'},
  {status:'M',path:'release/bounded-discovery-release-gate-20261031.mjs'},
  {status:'M',path:'scripts/verify-seo-closeout-live.mjs'},
  {status:'M',path:'tests/public-seo-technical.test.mjs'}
]);

const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64*1024*1024}).trim();

export function assertLaunchDecisions(manifest){
  const receipt=(key)=>{
    const decision=manifest.decisions?.[key];
    assert.equal(decision?.approved,true,'Launch decision not approved: '+key);
    for(const field of ['decidedBy','decidedAt','evidence'])assert.equal(typeof decision[field]==='string'&&Boolean(decision[field].trim()),true,'Decision evidence absent: '+key+'.'+field);
    return decision;
  };
  for(const key of ['boundedScope','privacyAssessment','intendedPurpose','productionLaunch'])receipt(key);
  if(manifest.decisions?.independentAcceptance?.approved===true)receipt('independentAcceptance');
  else{
    const owner=receipt('ownerAcceptance');
    assert.equal(owner.engineeringVerified,true,'Owner acceptance needs engineering verification');
    assert.equal(owner.independentReviewCompleted,false,'Do not present owner acceptance as independent review');
    assert.match(owner.applicationCommit||'',/^[a-f0-9]{40}$/,'Owner acceptance source required');
    assert.equal(owner.applicationCommit,manifest.applicationCommit,'Owner acceptance does not cover this payload');
    assert.equal(typeof owner.verificationEvidence==='string'&&Boolean(owner.verificationEvidence.trim()),true,'Owner verification evidence absent');
  }
  assert.equal(manifest.completeV2,false,'This contract covers the bounded in-app coach; full v2 needs its own evidence');
  return true;
}

export function verifyBoundedDiscoveryRelease(){
  const head=git('rev-parse','HEAD');
  assert.match(head,/^[a-f0-9]{40}$/);
  if(process.env.GITHUB_SHA)assert.equal(process.env.GITHUB_SHA,head,'Workflow source is not the checked-out commit');
  git('merge-base','--is-ancestor',DISCOVERY_SOURCE,head);
  if(process.env.GITHUB_REF==='refs/heads/main'){
    git('fetch','--no-tags','origin','main');
    assert.equal(git('rev-parse','origin/main'),head,'Current main moved after release selection');
  }
  const changes=git('diff','--no-renames','--name-status',DISCOVERY_SOURCE,head).split('\n').filter(Boolean).map(line=>{
    const [status,path,...extra]=line.split('\t');
    assert.equal(extra.length,0,'Renamed or malformed release path');
    assert(['A','M'].includes(status),'Deletion or unsupported release change rejected');
    return {status,path};
  }).sort((a,b)=>a.path.localeCompare(b.path));
  assert.deepEqual(changes,[...RELEASE_TAIL].sort((a,b)=>a.path.localeCompare(b.path)),'Only the approved sitemap repair and its exact release qualification may follow the reviewed 31 October source');
  git('merge-base','--is-ancestor',DISCOVERY_SOURCE,APPROVED_SITEMAP_REPAIR);
  git('merge-base','--is-ancestor',APPROVED_SITEMAP_REPAIR,head);
  for(const path of SITEMAP_REPAIR_PATHS)
    assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',APPROVED_SITEMAP_REPAIR+':'+path),'Reviewed sitemap repair changed after validation: '+path);
  for(const path of DISCOVERY_PATHS)assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',DISCOVERY_SOURCE+':'+path),'Reviewed discovery source changed after approval');
  const manifest=JSON.parse(readFileSync(new URL('../shift-coach/release-manifest.json',import.meta.url),'utf8'));
  assertLaunchDecisions(manifest);
  return {head,discoverySource:DISCOVERY_SOURCE,paths:DISCOVERY_PATHS,releaseTail:changes,launchApproved:true};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(verifyBoundedDiscoveryRelease()));
