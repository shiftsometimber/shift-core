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
