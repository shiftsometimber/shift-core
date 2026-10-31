import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {assertLaunchDecisions} from '../shift-coach/release-contract.mjs';

export const DISCOVERY_SOURCE='578982aa05c000b2f3ae4d01aea53172e67972fd';
export const DISCOVERY_PATHS=Object.freeze([
  'babylove/dynamic-public.mjs',
  'babylove/dynamic-public.test.mjs'
]);
export const RELEASE_TAIL=Object.freeze([
  {status:'M',path:'.github/workflows/cloudflare-production-promote.yml'},
  {status:'A',path:'release/bounded-discovery-release-gate-20261031.mjs'}
]);

const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:64*1024*1024}).trim();

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
  assert.deepEqual(changes,[...RELEASE_TAIL].sort((a,b)=>a.path.localeCompare(b.path)),'Only the bounded release-gate repair may follow the reviewed discovery source');
  for(const path of DISCOVERY_PATHS)assert.equal(git('rev-parse','HEAD:'+path),git('rev-parse',DISCOVERY_SOURCE+':'+path),'Reviewed discovery source changed after approval');
  const manifest=JSON.parse(readFileSync(new URL('../shift-coach/release-manifest.json',import.meta.url),'utf8'));
  assertLaunchDecisions(manifest);
  return {head,discoverySource:DISCOVERY_SOURCE,paths:DISCOVERY_PATHS,releaseTail:changes,launchApproved:true};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(verifyBoundedDiscoveryRelease()));
