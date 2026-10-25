import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {originalHomeSpeedSource} from '../release/home-banner-scope.mjs';
import {withMemberRecordingQualification} from '../release/member-recording-repair-20261024.mjs';
const path='release/member-details-preservation.mjs';
const read=(ref,file)=>execFileSync('git',['show',ref+':'+file],{encoding:'utf8',maxBuffer:5e6});
const expected=()=>read('e518a5d97b9682afb07ee932057c3414251093ab',path);
test('exact admitted startup maintenance retains original complete homepage equality',()=>withMemberRecordingQualification(()=>{
 assert.equal(originalHomeSpeedSource(path,read('HEAD',path)),expected());
 assert.equal(originalHomeSpeedSource(path,read('200ff3dd4c4e01505f418e31149389da0f81fe80',path)),expected());
}));
test('changed source cannot be hidden by the registered homepage inverse',()=>{
 const actual=read('HEAD',path);const changed=actual.replace('24.3px','24.4px');assert.notEqual(changed,actual);
 for(const value of [changed,actual+'\n// UNAPPROVED_SOURCE_MUTATION\n'])assert.notEqual(originalHomeSpeedSource(path,value),expected());
});
test('other source paths retain exact input',()=>{
 const input='const unchanged=1;\n';assert.equal(originalHomeSpeedSource('unrelated-source.mjs',input),input);
});
