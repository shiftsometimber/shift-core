import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {validateRecipeImages} from '../release/recipe-image-scope.mjs';
import {currentRuntimePreservationHistoricalView} from '../release/current-runtime-preservation-20261016.mjs';
import {withImmutableHistoryVerification} from '../release/immutable-git-facts.mjs';
const g=(...a)=>execFileSync('git',['--no-replace-objects',...a],{encoding:'utf8',maxBuffer:8e6}).trim();
const content=(ref,p)=>execFileSync('git',['--no-replace-objects','show',ref+':'+p],{encoding:'utf8',maxBuffer:8e6});
const sha=s=>createHash('sha256').update(s).digest('hex'),head=g('rev-parse','HEAD'),ledger=JSON.parse(content(head,'release/approved-runtime-composition.json')).currentRuntimePreservation20261016,leaf=ledger.acceptedGrubPreservation20261017,pin=leaf.recipeImageCompatibility20261017,manifest=JSON.parse(readFileSync(new URL('../release/recipe-image-manifest.json',import.meta.url)));
test('original recipe-image manifest, expected image sources and ancestry remain unchanged',()=>{
 assert.equal(content(head,'release/recipe-image-manifest.json'),content(pin.basisSource,'release/recipe-image-manifest.json'));assert.equal(sha(content(head,'release/recipe-image-manifest.json')),pin.manifestSHA256);assert.equal(manifest.entries.find(v=>v.path==='member-experience/grub-intelligence-client.mjs').sha,'a10809afb25589e9e7b30046be2017ae13991364');
});
test('actual accepted Grub client stays distinct from its authenticated historical recipe-image input',()=>withImmutableHistoryVerification(()=>{
 const frame=currentRuntimePreservationHistoricalView(),path='member-experience/grub-intelligence-client.mjs';assert.equal(frame.rawHead,head);assert.equal(g('rev-parse','HEAD:'+path),'7e6a2013d8aa16120657ccbc5b1433d190eb9ba5');assert.equal(frame.currentContent(head,path),content(head,path));assert.equal(frame.read('HEAD',path),'a10809afb25589e9e7b30046be2017ae13991364');assert.equal(frame.read(head,path),'a10809afb25589e9e7b30046be2017ae13991364');assert.equal(g('rev-parse','HEAD'),head);frame.assertCurrent();
}));
test('all original recipe-image assertions execute and preserve the exact recorded result',()=>assert.deepEqual(validateRecipeImages(),{bindings:manifest.bindings,usable:manifest.usable,complete:manifest.complete}));
test('whole original recipe guard restores and every accepted Grub production/release path remains exact',()=>{
 let value=content(head,pin.path);assert.equal(sha(value),pin.afterSHA256);for(const[a,z]of[...pin.inversePairs].reverse()){assert.equal(value.split(z).length,2);value=value.replace(z,a);}assert.equal(value,content(pin.basisSource,pin.path));assert.equal(sha(value),pin.beforeSHA256);for(const[path,id]of Object.entries(leaf.pathBlobs))assert.equal(g('rev-parse',head+':'+path),id);assert.equal(g('rev-parse','HEAD'),head);
});
