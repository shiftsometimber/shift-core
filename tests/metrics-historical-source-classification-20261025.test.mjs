import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../release/metrics-connection-scope.mjs',import.meta.url),'utf8');
const start=source.indexOf('export function metricsChangedPath('),end=source.indexOf('\nexport function metricsPreflightPath(',start);
assert(start>=0&&end>start);const body=source.slice(start,end).replace(/^export /,'');
function actual({qualify=()=>true,outer=(status)=>{assert.equal(status,'M','Original outer status rejection');return true;}}={}){
 return Function('assert','METRICS_PATHS','ensure','linkChangedPath',body+'\nreturn metricsChangedPath;')(assert,new Set(['release/book-voice-scope.mjs','release/seo-growth-scope.mjs']),qualify,outer);
}
test('actual classifier authenticates the exact historical added Book verifier before its original current modified assertion',()=>{
 const calls=[],run=actual({qualify:()=>{calls.push('full-source');return true},outer:(status,path)=>{calls.push([status,path]);assert.equal(status,'M');return true}});
 assert.equal(run('A','release/book-voice-scope.mjs'),true);assert.deepEqual(calls,['full-source',['M','release/book-voice-scope.mjs']]);
});
test('unqualified changed source and original outer errors cannot acquire historical acceptance',()=>{
 const sentinel=Error('Actual source changed');assert.throws(()=>actual({qualify:()=>{throw sentinel}})('A','release/book-voice-scope.mjs'),error=>error===sentinel);
 assert.throws(()=>actual({qualify:()=>false})('A','release/book-voice-scope.mjs'),/Original outer status rejection/);
 const outerError=Error('Actual outer source changed');assert.throws(()=>actual({outer:()=>{throw outerError}})('A','release/book-voice-scope.mjs'),error=>error===outerError);
 assert.throws(()=>actual({outer:()=>false})('A','release/book-voice-scope.mjs'),/Exact current modified Book verifier required/);
});
test('deletion rename type changes and other historical additions retain original rejection and callback order',()=>{
 for(const status of['D','R','T']){let qualificationCalls=0;assert.throws(()=>actual({qualify:()=>{qualificationCalls++;return true}})(status,'release/book-voice-scope.mjs'),/Original outer status rejection/);assert.equal(qualificationCalls,0);}
 let qualificationCalls=0;assert.throws(()=>actual({qualify:()=>{qualificationCalls++;return true}})('A','release/seo-growth-scope.mjs'),/Original outer status rejection/);assert.equal(qualificationCalls,0);
 assert.equal(actual({outer:()=>false})('A','unapproved.js'),false);
});
test('historical acceptance invokes the same qualification again and cannot reuse a prior successful source verdict',()=>{
 let unchanged=true,calls=0;const run=actual({qualify:()=>{calls++;return unchanged}});assert.equal(run('A','release/book-voice-scope.mjs'),true);unchanged=false;assert.throws(()=>run('A','release/book-voice-scope.mjs'));assert.equal(calls,2);
});
