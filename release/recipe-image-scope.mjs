import {currentRuntimePreservationHistoricalView} from './current-runtime-preservation-20261016.mjs';
import {withImmutableHistoryVerification} from './immutable-git-facts.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:8e6}).trim();
const recipeImageNativeGit=git;
const manifest=JSON.parse(readFileSync(new URL('./recipe-image-manifest.json',import.meta.url)));
const payloads=[...(manifest.priorPayloads||[]),{base:manifest.base,source:manifest.source}];
export const RECIPE_IMAGE_PATHS=new Set([...payloads.flatMap(p=>git('diff','--name-only',p.base,p.source).split('\n').filter(Boolean)),...manifest.entries.map(e=>e.path),'release/recipe-image-manifest.json','release/recipe-image-scope.mjs']);
export function validateRecipeImages(){
 return withImmutableHistoryVerification(()=>{
 const frame=currentRuntimePreservationHistoricalView(),current=JSON.parse(frame.currentContent(frame.rawHead,'release/approved-runtime-composition.json')).currentRuntimePreservation20261016;
 const acceptedGrubPaths=new Set(['member-experience/grub-client.mjs','member-experience/grub-intelligence-client.mjs','release/recipe-image-scope.mjs']);
 const git=(...args)=>{frame.assertCurrentHead();try{
  if(args.length===2&&args[0]==='rev-parse'&&args[1].startsWith('HEAD:')&&acceptedGrubPaths.has(args[1].slice(5)))return frame.read('HEAD',args[1].slice(5));
  return recipeImageNativeGit(...args);
 }finally{frame.assertCurrentHead();}};
 for(const payload of payloads)git('merge-base','--is-ancestor',payload.source,'HEAD');
 git('merge-base','--is-ancestor',manifest.source,'HEAD');
 if(manifest.followupSource)git('merge-base','--is-ancestor',manifest.followupSource,'HEAD');
 for(const entry of manifest.entries){assert.equal(git('rev-parse','HEAD:'+entry.path),entry.sha,'Recipe image source drift: '+entry.path);}
 return {bindings:manifest.bindings,usable:manifest.usable,complete:manifest.complete};
 });
}
