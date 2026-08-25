import test from 'node:test';
import assert from 'node:assert/strict';
import {splitRequestParts} from './ask-timber-v1.js';

test('keeps knee pain and kebab as two explicit request parts',()=>{
  assert.deepEqual(splitRequestParts('my knee is killing me and I want a kebab'),[
    'my knee is killing me',
    'I want a kebab'
  ]);
});

test('does not split a single food phrase',()=>{
  assert.deepEqual(splitRequestParts('Can I have chicken and rice tonight?'),[
    'Can I have chicken and rice tonight?'
  ]);
});

test('preserves up to four practical intents',()=>{
  assert.deepEqual(splitRequestParts("My back hurts but I still need dinner and I have no time"),[
    'My back hurts',
    'I still need dinner',
    'I have no time'
  ]);
});

test('splits deliberately separated requests',()=>{
  assert.deepEqual(splitRequestParts('Help with my knee; suggest a takeaway'),[
    'Help with my knee',
    'suggest a takeaway'
  ]);
});

console.log('ASK TIMBER MULTI-INTENT GATE PASS — knee and kebab both remain in scope.');
