import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:8e6}).trim();
const manifest=JSON.parse(readFileSync(new URL('./recipe-image-manifest.json',import.meta.url)));
export const RECIPE_IMAGE_PATHS=new Set([...git('diff','--name-only',manifest.base,manifest.source).split('\n'),'release/recipe-image-manifest.json','release/recipe-image-scope.mjs']);
export function validateRecipeImages(){
 git('merge-base','--is-ancestor',manifest.source,'HEAD');
 for(const entry of manifest.entries){assert.equal(git('rev-parse','HEAD:'+entry.path),entry.sha,'Recipe image source drift: '+entry.path);}
 return {bindings:manifest.bindings,usable:manifest.usable,complete:manifest.complete};
}
