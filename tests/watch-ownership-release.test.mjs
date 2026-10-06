import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {WATCH_OWNERSHIP_BASE,WATCH_OWNERSHIP_SOURCE,WATCH_OWNERSHIP_PATHS,WATCH_DEADLINE_SOURCE,WATCH_DEADLINE_PATHS,watchWaveRef,originalWatchOwnershipEntry,validateWatchRegistryWave} from '../release/watch-registry-wave-scope.mjs';
const read=(ref,path)=>execFileSync('git',['show',ref+':'+path],{encoding:'utf8'});
test('historical entry comparison removes only the exact reviewed scheduler ownership change',()=>{
 const current=read(WATCH_OWNERSHIP_SOURCE,'worker-entry-v6.js');assert.equal(originalWatchOwnershipEntry(current),read(WATCH_OWNERSHIP_BASE,'worker-entry-v6.js'));
 assert.notEqual(originalWatchOwnershipEntry(current.replace('allowSourceReplacement: false','allowSourceReplacement: false /* unrelated */')),read(WATCH_OWNERSHIP_BASE,'worker-entry-v6.js'));
 assert.throws(()=>originalWatchOwnershipEntry(current+'// extra entry change\n'),/Unreviewed Watch scheduler entry/);
});
test('ownership and finite timeout repair files retain exact references and fail on drift',()=>{
 for(const path of WATCH_OWNERSHIP_PATHS){assert.equal(watchWaveRef(path),WATCH_DEADLINE_PATHS.includes(path)?WATCH_DEADLINE_SOURCE:WATCH_OWNERSHIP_SOURCE);assert.throws(()=>validateWatchRegistryWave((ref,p)=>ref==='HEAD'&&p===path?'drift':read(watchWaveRef(p),p)),/Watch registry-wave source drift/)}
});

import {readFileSync} from 'node:fs';
import {validateWatchSourceComposition,WATCH_RECONCILIATION_PATHS,ZENAGAMTIDE_PATHS} from '../release/fit-300-scope.mjs';
test('merged AMBIENCE source reconciliation is finite and cannot authorise unrelated changes',()=>{
 const manifest=JSON.parse(readFileSync('shift-coach/release-manifest.json')),c=manifest.watchSourceComposition;validateWatchSourceComposition(c,manifest.seoFollowThroughComposition?.integrationComposition?.inlineToolComposition);
 assert.equal(WATCH_RECONCILIATION_PATHS.length,4);assert.equal(ZENAGAMTIDE_PATHS.length,7);
 assert.throws(()=>validateWatchSourceComposition({...c,proof:'any'}));assert.throws(()=>validateWatchSourceComposition({...c,paths:[...c.paths,'unrelated']}));assert.throws(()=>validateWatchSourceComposition({...c,base:'4460ea56f931da4003ace68d5d404831c47e08f7'}));
});

import {WATCH_MERGED_UPDATE_PATHS,validateWatchMergedUpdate} from '../release/watch-registry-wave-scope.mjs';
test('already-merged Watch update retains an exact seven-file source receipt',()=>{assert.equal(WATCH_MERGED_UPDATE_PATHS.length,7);validateWatchMergedUpdate();});
